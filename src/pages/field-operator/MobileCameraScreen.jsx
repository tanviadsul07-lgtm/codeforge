import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { Smartphone, Camera, Video, MapPin, CheckCircle2, AlertTriangle, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export const MobileCameraScreen = () => {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session');

  const [sessionId, setSessionId] = useState(urlSessionId || `SCAN-MOBILE-${Date.now().toString(36)}`);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090, accuracy: null });

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const signalPollRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const geoWatchRef = useRef(null);
  const processedSignalIdsRef = useRef(new Set());

  useEffect(() => {
    // Start High-Precision GPS Location Tracking on Mobile Phone
    if ('geolocation' in navigator) {
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn('[Mobile GPS Error]', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
    }

    // Auto-acquire camera on mount
    initCamera(facingMode);

    return () => {
      stopStream();
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, []);

  const initCamera = async (targetFacing = 'environment') => {
    setErrorMsg('');
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback to generic video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn('[Mobile Video Play]', err));
      }
    } catch (err) {
      console.error('[Mobile Camera Init Error]', err);
      setErrorMsg('Failed to access mobile camera. Please grant camera permissions.');
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    initCamera(nextFacing);
  };

  const startWebRtcStreaming = async () => {
    if (!localStreamRef.current) {
      await initCamera(facingMode);
    }

    setErrorMsg('');
    setConnectionStatus('Initializing Stream...');
    setIsStreaming(true);

    // Start Live High-FPS Frame Streaming over HTTP REST API to ensure 100% video stream delivery
    frameIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = 640;
      offCanvas.height = 360;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(video, 0, 0, 640, 360);
      const imageBase64 = offCanvas.toDataURL('image/jpeg', 0.65);

      try {
        await apiClient.request(`/scan-sessions/${sessionId}/live-mobile-frame`, {
          method: 'POST',
          body: JSON.stringify({
            frameTimestamp: new Date().toISOString(),
            latitude: location.lat,
            longitude: location.lng,
            imageBase64
          })
        });
        setConnectionStatus('Connected & Streaming Live Frames');
      } catch (err) {
        console.warn('[Mobile Frame Post Error]', err.message);
      }
    }, 330);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerRef.current = pc;

      // Add camera tracks to peer connection
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          apiClient.request('/webrtc/signal', {
            method: 'POST',
            body: JSON.stringify({
              sessionId,
              type: 'candidate',
              candidate: event.candidate,
              sender: 'mobile-peer'
            })
          }).catch(e => console.warn('[ICE Candidate Send Warning]', e));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC State Change]', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStatus('Connected & Streaming Live (P2P + HTTP)');
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send SDP Offer to Server Signaling Channel
      await apiClient.request('/webrtc/signal', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          type: 'offer',
          sdp: offer.sdp,
          sender: 'mobile-peer'
        })
      });

      // Poll for Server Answer Signal from Laptop / Website
      signalPollRef.current = setInterval(async () => {
        try {
          const res = await apiClient.request(`/webrtc/signals/${sessionId}`);
          if (res.success && res.signals) {
            for (const sig of res.signals) {
              if (processedSignalIdsRef.current.has(sig.id)) continue;
              processedSignalIdsRef.current.add(sig.id);

              if (sig.sender === 'host-peer') {
                if (sig.type === 'answer' && pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sig.sdp }));
                } else if (sig.type === 'candidate' && sig.candidate) {
                  await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
                }
              }
            }
          }
        } catch (pollErr) {
          console.warn('[Signal Poll Warning]', pollErr);
        }
      }, 1000);

    } catch (err) {
      console.warn('[WebRTC Mobile Stream Warning]', err.message);
    }
  };

  const stopStream = () => {
    if (signalPollRef.current) clearInterval(signalPollRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setIsStreaming(false);
    setConnectionStatus('Disconnected');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#071522',
      color: '#F8FAFC',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #1A3F66'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#1E3A5F', padding: '0.5rem', borderRadius: '8px', color: '#38BDF8' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>PathRakshak Mobile AI Stream</h2>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Session: <strong style={{ color: '#38BDF8' }}>{sessionId}</strong></div>
          </div>
        </div>

        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '20px',
          backgroundColor: isStreaming ? 'rgba(56, 217, 150, 0.15)' : 'rgba(148, 163, 184, 0.15)',
          color: isStreaming ? '#38D996' : '#94A3B8',
          border: `1px solid ${isStreaming ? '#38D996' : '#94A3B8'}`
        }}>
          {isStreaming ? 'LIVE STREAMING' : 'OFFLINE'}
        </div>
      </div>

      {/* Main Viewfinder Card */}
      <div style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        minHeight: '380px',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        border: '1px solid #164A6B',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          playsInline
          muted
          autoPlay
        />

        {/* HUD Live Badge */}
        {isStreaming && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#FFF',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Zap size={14} /> LIVE WEBRTC STREAMING
          </div>
        )}

        {/* GPS Badge */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(7, 21, 34, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#38BDF8',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid #164A6B'
        }}>
          <MapPin size={14} />
          <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
          {location.accuracy && <span style={{ color: '#94A3B8' }}>(&plusmn;{Math.round(location.accuracy)}m)</span>}
        </div>

        {/* Camera Flip Overlay Button */}
        <button
          onClick={toggleCameraFacing}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(7, 21, 34, 0.85)',
            border: '1px solid #164A6B',
            color: '#FFF',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            cursor: 'pointer'
          }}
          title="Flip Mobile Camera"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Connection Diagnostics & Controls */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#0F2942',
          borderRadius: '8px',
          border: '1px solid #1A3F66',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Connection Status: <strong style={{ color: isStreaming ? '#38D996' : '#F5B942' }}>{connectionStatus}</strong>
          </div>
          <ShieldCheck size={18} style={{ color: '#38BDF8' }} />
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            color: '#F87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {!isStreaming ? (
            <button
              onClick={startWebRtcStreaming}
              style={{
                backgroundColor: '#38BDF8',
                color: '#071522',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.5rem',
                gridColumn: 'span 2'
              }}
            >
              <Zap size={18} /> Start Mobile WebRTC Stream
            </button>
          ) : (
            <button
              onClick={stopStream}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFF',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.5rem',
                gridColumn: 'span 2'
              }}
            >
              Stop Mobile Stream
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
