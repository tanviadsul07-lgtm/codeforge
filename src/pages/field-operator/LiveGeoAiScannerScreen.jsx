import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { HazardMap } from '../../components/maps/HazardMap';
import { apiClient } from '../../services/apiClient';
import { cloudinaryService } from '../../services/cloudinaryService';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  Camera,
  Video,
  Play,
  Square,
  RefreshCw,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  FileCheck,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Info,
  Copy,
  ExternalLink,
  Zap,
  Eye
} from 'lucide-react';

export const LiveGeoAiScannerScreen = () => {
  const { user } = useAuth();
  const { addComplaint } = useApp();
  const navigate = useNavigate();
  usePageTitle();

  // Mode Selection: 'local' (DroidCam / USB Webcam) vs 'webrtc' (Wireless Mobile WebRTC)
  const [sourceMode, setSourceMode] = useState('local');
  const [displayMode, setDisplayMode] = useState('overlay'); // 'overlay' | 'raw'

  // Media Devices & Local Camera States
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isCameraConnected, setIsCameraConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // WebRTC Mobile Receiver States
  const [webrtcSessionId, setWebrtcSessionId] = useState(`SCAN-MOB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [webrtcStatus, setWebrtcStatus] = useState('Disconnected');
  const [copiedLink, setCopiedLink] = useState(false);

  // Camera Telemetry & Diagnostic Info
  const [streamStats, setStreamStats] = useState({
    label: '',
    width: 0,
    height: 0,
    frameRate: 0,
    tier: 'None'
  });

  // Scan Session & Live Telemetry States
  const [scanSessionId, setScanSessionId] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [processedFrames, setProcessedFrames] = useState(0);
  const [rawDetectionsCount, setRawDetectionsCount] = useState(0);
  const [liveDetections, setLiveDetections] = useState([]);
  const [liveLocation, setLiveLocation] = useState({ lat: 28.6139, lng: 77.2090, hasGps: false, source: 'Initial' });
  const [locationSourceLabel, setLocationSourceLabel] = useState('Browser Geolocation');

  // Final Summary & Complaint States
  const [isScanFinalized, setIsScanFinalized] = useState(false);
  const [finalSessionSummary, setFinalSessionSummary] = useState(null);
  const [creatingComplaint, setCreatingComplaint] = useState(false);
  const [generatedComplaint, setGeneratedComplaint] = useState(null);
  const [complaintError, setComplaintError] = useState('');
  const [latestMobileFrameUrl, setLatestMobileFrameUrl] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  // DOM & WebRTC Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mobileFramePollRef = useRef(null);
  const geoWatchRef = useRef(null);
  const liveDetectionsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // WebRTC Host Refs
  const peerRef = useRef(null);
  const webrtcSignalIntervalRef = useRef(null);
  const processedSignalIdsRef = useRef(new Set());

  // Sync detections to ref for continuous drawing
  useEffect(() => {
    liveDetectionsRef.current = liveDetections;
  }, [liveDetections]);

  // Ensure DOM Video element binds to stream on state updates
  useEffect(() => {
    if (isCameraConnected && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => console.warn('[Video Bind Effect Play Exception]', e.message));
      }
    }
  }, [isCameraConnected]);

  // 1. Discover Available Video Inputs (Cameras & USB Webcam Interfaces)
  const refreshDevices = async () => {
    try {
      setCameraError('');
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter(d => d.kind === 'videoinput');

      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('[Camera Enumeration Warning]', err.message);
      setCameraError('Unable to enumerate camera devices. Please check browser permissions.');
    }
  };

  useEffect(() => {
    refreshDevices();

    // Start Watching Browser Geolocation
    if ('geolocation' in navigator) {
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            hasGps: true,
            source: 'Live GPS (Geolocation API)'
          });
          setLocationSourceLabel('Live Mobile GPS (High Precision)');
        },
        (err) => {
          console.warn('[GPS Watch Warning]', err.message);
          setLocationSourceLabel('GPS Unavailable (Manual Selection Enabled)');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    return () => {
      stopCameraStream();
      stopWebRtcHost();
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, []);

  // 2. Connect Local USB / DroidCam Camera Stream with Native Device Constraints
  const connectCamera = async (overrideDeviceId = null) => {
    setCameraError('');
    stopWebRtcHost();

    const targetDeviceId = overrideDeviceId !== null ? overrideDeviceId : selectedDeviceId;

    try {
      if (streamRef.current) {
        stopCameraStream();
      }

      let stream = null;
      let acquiredTier = 'Native Mobile Stream';

      // Tier 1: Native Unconstrained Device ID (Preserves DroidCam mobile video format without GPU YUV scaling artifacts)
      const tier1Constraints = {
        video: targetDeviceId ? { deviceId: targetDeviceId } : true
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(tier1Constraints);
      } catch (t1Err) {
        console.warn('[Camera Engine] Tier 1 failed, trying Tier 2 (Exact deviceId)...', t1Err.message);

        // Tier 2: Exact Device ID
        const tier2Constraints = {
          video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(tier2Constraints);
          acquiredTier = 'Exact Device ID';
        } catch (t2Err) {
          console.warn('[Camera Engine] Tier 2 failed, fallback to generic video...', t2Err.message);

          // Tier 3: Basic Video Fallback
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          acquiredTier = 'Generic Video Fallback';
        }
      }

      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('No active video tracks available in acquired media stream.');
      }

      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};

      setStreamStats({
        label: videoTrack.label || 'USB Mobile Camera Stream',
        width: settings.width || 0,
        height: settings.height || 0,
        frameRate: settings.frameRate || 30,
        tier: acquiredTier
      });

      // Bind Stream to Video Element immediately if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setStreamStats(prev => ({
              ...prev,
              width: videoRef.current.videoWidth || prev.width,
              height: videoRef.current.videoHeight || prev.height
            }));
          } catch (e) {
            console.warn('[Video Play Metadata Exception]', e.message);
          }
        };

        try {
          await videoRef.current.play();
        } catch (e) {}
      }

      setIsCameraConnected(true);
      console.log(`[Camera Engine] Stream successfully connected (${acquiredTier}). Active track: "${videoTrack.label}"`);
    } catch (err) {
      console.error('[Camera Access Error]', err);
      let msg = 'Failed to connect camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Selected USB camera device not found. Verify USB cable connection and driver.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application or DroidCam server. Ensure DroidCam client is active.';
      }
      setCameraError(msg);
      setIsCameraConnected(false);
    }
  };

  // 3. Wireless WebRTC Mobile Stream Receiver (Host Mode)
  const startWebRtcHost = async () => {
    stopCameraStream();
    setCameraError('');
    setWebrtcStatus('Listening for Mobile WebRTC Stream Signal...');
    processedSignalIdsRef.current.clear();

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerRef.current = pc;

      // Handle Remote Mobile Stream Track
      pc.ontrack = (event) => {
        console.log('[WebRTC Host] Remote stream track received:', event.streams);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          streamRef.current = remoteStream;

          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.warn('[WebRTC Video Play Error]', e));
          }

          setStreamStats({
            label: 'Wireless Mobile WebRTC Stream',
            width: 1280,
            height: 720,
            frameRate: 30,
            tier: 'Wireless Peer Connection'
          });

          setIsCameraConnected(true);
          setWebrtcStatus('Mobile Camera Stream Connected & Playing Live');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          apiClient.request('/webrtc/signal', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: webrtcSessionId,
              type: 'candidate',
              candidate: event.candidate,
              sender: 'host-peer'
            })
          }).catch(e => console.warn('[Host ICE Send Error]', e));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[Host WebRTC Connection State]', pc.connectionState);
        setWebrtcStatus(`WebRTC State: ${pc.connectionState}`);
      };

      // Poll for Mobile Live Frame & Telemetry over HTTP (100% Reliable Frame Sync)
      mobileFramePollRef.current = setInterval(async () => {
        try {
          const res = await apiClient.request(`/scan-sessions/${webrtcSessionId}/latest-frame`);
          if (res.success && res.latestFrame) {
            setIsCameraConnected(true);
            if (res.latestFrame.imageBase64 || res.latestFrame.evidenceUrl) {
              setLatestMobileFrameUrl(res.latestFrame.imageBase64 || res.latestFrame.evidenceUrl);
            }
            setStreamStats({
              label: 'Wireless Mobile Stream (Live Frame Sync)',
              width: 640,
              height: 360,
              frameRate: 30,
              tier: 'Mobile Stream Sync'
            });

            if (res.latestFrame.hasGps && res.latestFrame.latitude) {
              setLiveLocation({
                lat: res.latestFrame.latitude,
                lng: res.latestFrame.longitude,
                hasGps: true,
                source: 'Synchronized Mobile GPS'
              });
            }

            if (res.detections && res.detections.length > 0) {
              setLiveDetections(res.detections);
              setRawDetectionsCount(prev => prev + res.detections.length);
            }
            if (res.totalFramesProcessed) {
              setProcessedFrames(res.totalFramesProcessed);
            }
            setWebrtcStatus('Mobile Camera Stream Active & Synchronized');
          }
        } catch (e) {
          console.warn('[Mobile Frame Poll Warning]', e.message);
        }
      }, 300);

      // Poll for Mobile SDP Offer
      webrtcSignalIntervalRef.current = setInterval(async () => {
        try {
          const res = await apiClient.request(`/webrtc/signals/${webrtcSessionId}`);
          if (res.success && res.signals) {
            for (const sig of res.signals) {
              if (processedSignalIdsRef.current.has(sig.id)) continue;
              processedSignalIdsRef.current.add(sig.id);

              if (sig.sender === 'mobile-peer') {
                if (sig.type === 'offer' && pc.signalingState === 'stable') {
                  setWebrtcStatus('Mobile SDP Offer Received. Creating SDP Answer...');
                  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sig.sdp }));

                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);

                  await apiClient.request('/webrtc/signal', {
                    method: 'POST',
                    body: JSON.stringify({
                      sessionId: webrtcSessionId,
                      type: 'answer',
                      sdp: answer.sdp,
                      sender: 'host-peer'
                    })
                  });
                  setWebrtcStatus('SDP Answer Sent to Mobile. Establishing Media Flow...');
                } else if (sig.type === 'candidate' && sig.candidate) {
                  await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
                }
              }
            }
          }
        } catch (pollErr) {
          console.warn('[Host Signal Poll Error]', pollErr);
        }
      }, 1000);

    } catch (err) {
      console.error('[WebRTC Host Start Error]', err);
      setCameraError('Failed to initialize WebRTC Host Receiver: ' + err.message);
      setWebrtcStatus('Failed');
    }
  };

  const stopWebRtcHost = () => {
    if (webrtcSignalIntervalRef.current) clearInterval(webrtcSignalIntervalRef.current);
    if (mobileFramePollRef.current) clearInterval(mobileFramePollRef.current);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setWebrtcStatus('Disconnected');
  };

  // 4. Stop Camera Stream
  const stopCameraStream = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraConnected(false);
    setIsScanning(false);
  };

  // 5. Start Live AI Road Hazard Scan
  const startLiveScan = async () => {
    if (!isCameraConnected) {
      if (sourceMode === 'local') {
        await connectCamera();
      } else {
        await startWebRtcHost();
      }
    }

    setCameraError('');
    setIsScanFinalized(false);
    setFinalSessionSummary(null);
    setGeneratedComplaint(null);
    setLiveDetections([]);
    setProcessedFrames(0);
    setRawDetectionsCount(0);
    setDurationSeconds(0);

    try {
      // Start Persistent Backend Scan Session
      const res = await apiClient.request('/scan-sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          operatorUid: user?.uid || 'op-user',
          operatorName: user?.displayName || user?.name || 'Field Operator',
          deviceName: sourceMode === 'local'
            ? (selectedDeviceId ? `USB Mobile Camera (${selectedDeviceId.substring(0, 8)})` : 'USB Mobile Camera Stream')
            : `Wireless WebRTC Mobile Stream (${webrtcSessionId})`
        })
      });

      if (!res.success || !res.scanSessionId) {
        throw new Error(res.error || 'Failed to initialize backend scan session.');
      }

      const activeSessionId = res.scanSessionId;
      setScanSessionId(activeSessionId);
      setIsScanning(true);

      // Start Telemetry Duration Timer
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);

      // Start Frame Sampling & Inference Interval (3 FPS sampling rate)
      scanIntervalRef.current = setInterval(() => {
        captureAndAnalyzeFrame(activeSessionId);
      }, 350);

      // Start MediaRecorder if video stream is available
      recordedChunksRef.current = [];
      try {
        if (window.MediaRecorder && streamRef.current && streamRef.current.getVideoTracks().length > 0) {
          const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? { mimeType: 'video/webm;codecs=vp9' }
            : (MediaRecorder.isTypeSupported('video/webm') ? { mimeType: 'video/webm' } : {});
          const recorder = new MediaRecorder(streamRef.current, options);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          recorder.start(1000);
          mediaRecorderRef.current = recorder;
          console.log('[MediaRecorder] Live scanner video recording started.');
        }
      } catch (recErr) {
        console.warn('[MediaRecorder Start Exception]', recErr.message);
      }

      console.log(`[Live Scanner] Scan started with session ID: ${activeSessionId}`);
    } catch (err) {
      setCameraError(err.message || 'Could not start live scan session.');
      setIsScanning(false);
    }
  };

  // 6. Capture Frame & Execute AI Inference
  const captureAndAnalyzeFrame = async (activeSessionId) => {
    const video = videoRef.current;
    
    // Determine canvas target dimensions safely (guarantees canvas resolution never drops to 2x2)
    const targetW = (video && video.videoWidth > 50) ? video.videoWidth : 640;
    const targetH = (video && video.videoHeight > 50) ? video.videoHeight : 360;

    const canvas = canvasRef.current;
    if (canvas && displayMode === 'overlay') {
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentDetections = liveDetectionsRef.current || [];
        if (currentDetections.length > 0) {
          drawBoundingBoxes(ctx, currentDetections, canvas.width, canvas.height);
        }
      }
    }

    if (!video || !streamRef.current || video.readyState < 2 || video.videoWidth === 0) {
      return;
    }

    // Draw offscreen JPEG frame representation for inference payload
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 640;
    offCanvas.height = 360;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(video, 0, 0, 640, 360);
    const imageBase64 = offCanvas.toDataURL('image/jpeg', 0.7);

    try {
      const res = await apiClient.request('/analysis/live-frame', {
        method: 'POST',
        body: JSON.stringify({
          scanSessionId: activeSessionId,
          frameTimestamp: new Date().toISOString(),
          latitude: liveLocation.lat,
          longitude: liveLocation.lng,
          imageBase64
        })
      });

      if (res.success) {
        setProcessedFrames(res.totalFramesProcessed || (prev => prev + 1));
        const newDetections = res.detections || [];

        if (newDetections.length > 0) {
          setRawDetectionsCount(prev => prev + newDetections.length);
          setLiveDetections(newDetections);
        }
      }
    } catch (err) {
      console.warn('[Frame Inference Warning]', err.message);
    }
  };

  // Render Real-Time AI Bounding Boxes on Canvas Overlay
  const drawBoundingBoxes = (ctx, detections, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Guard against 2x2 or low-res canvas scaling stretch artifacts
    if (width < 50 || height < 50) return;

    detections.forEach(det => {
      if (!det.bbox || det.bbox.length < 4) return;
      const [ymin, xmin, ymax, xmax] = det.bbox;

      const x = xmin * width;
      const y = ymin * height;
      const w = (xmax - xmin) * width;
      const h = (ymax - ymin) * height;

      // Color coding per severity: Critical (#FF647C), High (#F5B942), Medium (#38BDF8)
      const strokeColor = det.severity === 'Critical' ? '#FF647C' : det.severity === 'High' ? '#F5B942' : '#38BDF8';

      // Draw Bounding Box Outline ONLY (never fill the whole bounding box or canvas!)
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      // Draw Label Badge
      ctx.fillStyle = strokeColor;
      const labelText = `${det.category} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeY = max(y - 24, 0);
      ctx.fillRect(x, badgeY, textWidth + 14, 22);

      ctx.fillStyle = '#071522';
      ctx.fillText(labelText, x + 6, badgeY + 15);
    });
  };

  const max = (a, b) => (a > b ? a : b);

  // 7. Stop Live Scan & Finalize Session
  const stopLiveScan = async () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Finalize MediaRecorder and upload recorded video file
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = resolve;
          mediaRecorderRef.current.stop();
        });

        const mimeType = mediaRecorderRef.current.mimeType || 'video/webm';
        if (recordedChunksRef.current.length > 0) {
          const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          if (videoBlob.size > 0) {
            const videoFile = new File([videoBlob], `scan_${scanSessionId || Date.now()}.webm`, { type: mimeType });
            const uploaded = await cloudinaryService.uploadMedia(videoFile, 'road_reports');
            if (uploaded && uploaded.secureUrl) {
              setRecordedVideoUrl(uploaded.secureUrl);
              console.log('[MediaRecorder] Video evidence uploaded successfully:', uploaded.secureUrl);
            }
          }
        }
      } catch (recStopErr) {
        console.warn('[MediaRecorder Stop Warning]', recStopErr.message);
      }
    }

    setIsScanning(false);

    if (!scanSessionId) return;

    try {
      const res = await apiClient.request(`/scan-sessions/${scanSessionId}/stop`, {
        method: 'POST'
      });

      if (res.success && res.session) {
        setFinalSessionSummary(res.session);
        setIsScanFinalized(true);
        console.log(`[Live Scanner] Scan session ${scanSessionId} finalized successfully.`);
      }
    } catch (err) {
      setCameraError(err.message || 'Failed to finalize scan session.');
    }
  };

  // 8. Generate Complaint from Finalized Scan Session (Idempotent Action)
  const handleCreateComplaintFromScan = async () => {
    if (!scanSessionId || !finalSessionSummary) return;

    setCreatingComplaint(true);
    setComplaintError('');

    try {
      const res = await apiClient.request(`/scan-sessions/${scanSessionId}/create-complaint`, {
        method: 'POST',
        body: JSON.stringify({
          evidenceVideo: recordedVideoUrl || 'http://localhost:5000/api/evidence/uploads/sample_pothole_video.mp4',
          mediaResourceType: 'video',
          description: `Road hazard complaint generated from Live GeoAI Scanner session ${scanSessionId}. ${finalSessionSummary.consolidatedHazards?.length || 0} unique hazards identified.`
        })
      });

      if (res.success && res.complaint) {
        setGeneratedComplaint(res.complaint);

        // Also add to local AppContext to trigger immediate notifications & dashboard sync
        if (!res.alreadyExists) {
          addComplaint(res.complaint);
        }
      } else {
        throw new Error(res.error || 'Could not generate complaint from scan session.');
      }
    } catch (err) {
      setComplaintError(err.message || 'Failed to create complaint.');
    } finally {
      setCreatingComplaint(false);
    }
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMobileStreamUrl = () => {
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//${host}${port}/mobile-camera?session=${webrtcSessionId}`;
  };

  const copyMobileLink = () => {
    navigator.clipboard.writeText(getMobileStreamUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Live GeoAI Mobile Camera Scanner"
        description="Stream live mobile video via USB webcam or WebRTC to perform real-time AI road hazard scanning and automated complaint creation."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button variant="outline" icon={RefreshCw} onClick={refreshDevices}>
              Detect Devices
            </Button>
            <Button variant="outline" icon={Video} onClick={() => navigate('/operator/upload')}>
              Video File Upload
            </Button>
          </div>
        }
      />

      {/* Connection Mode Selection Tabs */}
      <Card style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setSourceMode('local');
                stopWebRtcHost();
              }}
              style={{
                backgroundColor: sourceMode === 'local' ? '#38BDF8' : '#0F2942',
                color: sourceMode === 'local' ? '#071522' : '#94A3B8',
                border: '1px solid #1A3F66',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Smartphone size={16} /> Mode 1: USB / DroidCam Webcam
            </button>

            <button
              onClick={() => {
                setSourceMode('webrtc');
                stopCameraStream();
                startWebRtcHost();
              }}
              style={{
                backgroundColor: sourceMode === 'webrtc' ? '#38BDF8' : '#0F2942',
                color: sourceMode === 'webrtc' ? '#071522' : '#94A3B8',
                border: '1px solid #1A3F66',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Zap size={16} /> Mode 2: Wireless WebRTC Mobile Stream
            </button>
          </div>

          {/* Viewfinder Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>VIEW MODE:</span>
            <button
              onClick={() => setDisplayMode('overlay')}
              style={{
                backgroundColor: displayMode === 'overlay' ? '#1E3A5F' : 'transparent',
                color: displayMode === 'overlay' ? '#38BDF8' : '#94A3B8',
                border: '1px solid #164A6B',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Sparkles size={14} /> AI Bounding Boxes Overlay
            </button>

            <button
              onClick={() => setDisplayMode('raw')}
              style={{
                backgroundColor: displayMode === 'raw' ? '#1E3A5F' : 'transparent',
                color: displayMode === 'raw' ? '#38BDF8' : '#94A3B8',
                border: '1px solid #164A6B',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Eye size={14} /> Raw HTML5 Stream View
            </button>
          </div>
        </div>
      </Card>

      {/* Mode 1 Setup Guidance & Selector */}
      {sourceMode === 'local' && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ minWidth: '280px' }}>
                <Select
                  label="Selected Video Device (USB / DroidCam)"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  options={devices.length > 0
                    ? devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1} (${d.deviceId.substring(0, 8)})` }))
                    : [{ value: '', label: 'No Camera Detected (Click Detect Devices)' }]}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                {!isCameraConnected ? (
                  <Button variant="primary" icon={Camera} onClick={() => connectCamera()}>
                    Connect Camera
                  </Button>
                ) : (
                  <Button variant="danger" icon={Square} onClick={stopCameraStream} disabled={isScanning}>
                    Disconnect Camera
                  </Button>
                )}

                {!isScanning ? (
                  <Button variant="success" icon={Play} onClick={startLiveScan} disabled={!isCameraConnected}>
                    Start Live Scan
                  </Button>
                ) : (
                  <Button variant="warning" icon={Square} onClick={stopLiveScan}>
                    Stop Live Scan
                  </Button>
                )}

                {isCameraConnected && (
                  <Button variant="outline" icon={RefreshCw} onClick={() => connectCamera()} title="Re-negotiate Stream Constraints to Resolve Camera Feed">
                    Reset Feed
                  </Button>
                )}
              </div>
            </div>

            {/* Real-time Status Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Badge status={isScanning ? 'In Progress' : isCameraConnected ? 'Verified' : 'Pending'} />
              <Badge status={liveLocation.hasGps ? 'COMPLETED' : 'Low'} />
            </div>
          </div>

          {cameraError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 'var(--radius-sm)', color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>{cameraError}</span>
            </div>
          )}
        </Card>
      )}

      {/* Mode 2 WebRTC Setup & Link Generator */}
      {sourceMode === 'webrtc' && (
        <Card style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #07172B 0%, #0F2942 100%)', border: '1px solid #1A3F66' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                  Wireless Mobile WebRTC Streaming Setup
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                  Open the URL link below on your mobile browser (phone) to stream high-definition video + GPS telemetry directly to this website!
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {!isScanning ? (
                  <Button variant="success" icon={Play} onClick={startLiveScan} disabled={!isCameraConnected}>
                    Start AI Hazard Scan
                  </Button>
                ) : (
                  <Button variant="warning" icon={Square} onClick={stopLiveScan}>
                    Stop AI Hazard Scan
                  </Button>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              backgroundColor: '#071522',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #164A6B',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700, wordBreak: 'break-all' }}>
                {getMobileStreamUrl()}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" icon={Copy} onClick={copyMobileLink}>
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>

                <Button variant="primary" icon={ExternalLink} onClick={() => window.open(getMobileStreamUrl(), '_blank')}>
                  Open Mobile Camera UI
                </Button>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: '#38D996' }} />
              <span>WebRTC Signal Status: <strong style={{ color: isCameraConnected ? '#38D996' : '#F5B942' }}>{webrtcStatus}</strong></span>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Video Viewfinder & Telemetry Inspector */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Left: Viewfinder Card (DOM Video / Image Stream + Overlay Canvas) */}
        <Card style={{ padding: 0, overflow: 'hidden', position: 'relative', backgroundColor: '#071522', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Wireless Mobile Stream Image Renderer */}
          {sourceMode === 'webrtc' && latestMobileFrameUrl && !streamRef.current && (
            <img
              src={latestMobileFrameUrl}
              alt="Live Mobile Stream"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Always-Mounted Video Stream Element */}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: (isCameraConnected && (sourceMode === 'local' || streamRef.current)) ? 'block' : 'none'
            }}
            playsInline
            muted
            autoPlay
          />

          {/* Real-time Bounding Box Overlay Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              display: (isCameraConnected && displayMode === 'overlay') ? 'block' : 'none'
            }}
          />

          {!isCameraConnected && (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#647C90' }}>
              <Camera size={56} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F2F8FC', marginBottom: '0.5rem' }}>
                Camera Stream Offline
              </div>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.25rem', color: '#91A9BB' }}>
                {sourceMode === 'local'
                  ? 'Select your USB / DroidCam camera device above and click Connect Camera.'
                  : 'Open the Mobile Stream link on your phone to initiate live wireless WebRTC streaming.'}
              </p>
              {sourceMode === 'local' ? (
                <Button variant="primary" icon={Camera} onClick={() => connectCamera()}>
                  Connect USB / DroidCam Camera
                </Button>
              ) : (
                <Button variant="primary" icon={ExternalLink} onClick={() => window.open(getMobileStreamUrl(), '_blank')}>
                  Launch Mobile Camera Interface
                </Button>
              )}
            </div>
          )}

          {/* Live Scanning HUD Badge */}
          {isScanning && (
            <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#FFF', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFF', animation: 'pulse 1s infinite' }} />
              LIVE AI SCANNING IN PROGRESS
            </div>
          )}
        </Card>

        {/* Right: Telemetry Metrics & Real-Time Detections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Live Telemetry & Diagnostics">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#0F2942', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1A3F66' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>SCAN DURATION</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38BDF8' }}>{formatDuration(durationSeconds)}</div>
              </div>
              <div style={{ backgroundColor: '#0F2942', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1A3F66' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>PROCESSED FRAMES</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC' }}>{processedFrames}</div>
              </div>
              <div style={{ backgroundColor: '#0F2942', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1A3F66' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>RAW DETECTIONS</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F5B942' }}>{rawDetectionsCount}</div>
              </div>
              <div style={{ backgroundColor: '#0F2942', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1A3F66' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>STREAM RESOLUTION</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38D996', marginTop: '0.4rem' }}>
                  {streamStats.width > 0 ? `${streamStats.width}x${streamStats.height}` : 'Stream Ready'}
                </div>
              </div>
            </div>

            {streamStats.label && (
              <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#071522', borderRadius: '4px', border: '1px solid #164A6B', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                <strong style={{ color: '#38BDF8' }}>Active Track:</strong> {streamStats.label} ({streamStats.tier})
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: '#38BDF8' }} />
              <span>Current GPS Coords: {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}</span>
            </div>
          </Card>

          <Card title="Live Detection Feed">
            {liveDetections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No active hazard detections on current frame.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {liveDetections.map((det, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--electric-blue)' }}>{det.category}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Confidence: {(det.confidence * 100).toFixed(1)}% | {det.locationSource}
                      </div>
                    </div>
                    <Badge status={det.severity} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Finalized Scan Session Summary & Complaint Generation */}
      {isScanFinalized && finalSessionSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <Card style={{ background: 'linear-gradient(135deg, #07172B 0%, #0F2942 100%)', border: '1px solid #1A3F66' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.5px' }}>SCAN SESSION FINALIZED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Session ID: {finalSessionSummary.scanSessionId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {!generatedComplaint ? (
                  <Button variant="primary" icon={Sparkles} onClick={handleCreateComplaintFromScan} loading={creatingComplaint}>
                    Create Government Complaint
                  </Button>
                ) : (
                  <Button variant="success" icon={CheckCircle2} onClick={() => navigate(`/operator/complaints/${generatedComplaint.id}`)}>
                    View Registered Complaint ({generatedComplaint.id})
                  </Button>
                )}
              </div>
            </div>

            {/* Session Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#071522', padding: '0.85rem', borderRadius: '6px', border: '1px solid #164A6B' }}>
                <div style={{ fontSize: '0.75rem', color: '#91A9BB' }}>TOTAL FRAMES</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>{finalSessionSummary.summaryStats?.totalFrames || 0}</div>
              </div>
              <div style={{ backgroundColor: '#071522', padding: '0.85rem', borderRadius: '6px', border: '1px solid #164A6B' }}>
                <div style={{ fontSize: '0.75rem', color: '#91A9BB' }}>RAW DETECTIONS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F5B942' }}>{finalSessionSummary.summaryStats?.rawDetectionsCount || 0}</div>
              </div>
              <div style={{ backgroundColor: '#071522', padding: '0.85rem', borderRadius: '6px', border: '1px solid #164A6B' }}>
                <div style={{ fontSize: '0.75rem', color: '#91A9BB' }}>CONSOLIDATED HAZARDS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38D996' }}>{finalSessionSummary.summaryStats?.uniqueHazardCount || 0}</div>
              </div>
              <div style={{ backgroundColor: '#071522', padding: '0.85rem', borderRadius: '6px', border: '1px solid #164A6B' }}>
                <div style={{ fontSize: '0.75rem', color: '#91A9BB' }}>SCAN DURATION</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8' }}>{formatDuration(finalSessionSummary.summaryStats?.durationSeconds || 0)}</div>
              </div>
            </div>

            {complaintError && (
              <div style={{ marginBottom: '1rem', color: '#F87171', fontSize: '0.85rem' }}>
                {complaintError}
              </div>
            )}

            {/* Consolidated Candidate Hazard Cards & Map */}
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.75rem' }}>
              Consolidated Unique Hazard Candidates ({finalSessionSummary.consolidatedHazards?.length || 0})
            </div>

            <div style={{ height: '320px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <HazardMap
                hazards={finalSessionSummary.consolidatedHazards || []}
                height="320px"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
