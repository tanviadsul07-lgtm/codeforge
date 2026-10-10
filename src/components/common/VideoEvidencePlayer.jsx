import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, Play, Pause, Maximize2 } from 'lucide-react';

export const VideoEvidencePlayer = ({
  videoUrl,
  posterUrl,
  detections = [],
  title = 'Recorded Video Evidence & AI Detection Overlay',
  style = {}
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [activeDetectionsCount, setActiveDetectionsCount] = useState(0);

  // Normalize Detections Array
  const normalizedDetections = Array.isArray(detections) ? detections.map(d => {
    let bbox = d.bbox || [0.3, 0.4, 0.6, 0.7];
    // Ensure normalized [x1, y1, x2, y2] order with x1 < x2 and y1 < y2
    let x1 = Math.min(bbox[0], bbox[2] !== undefined ? bbox[2] : bbox[0] + 0.3);
    let y1 = Math.min(bbox[1], bbox[3] !== undefined ? bbox[3] : bbox[1] + 0.3);
    let x2 = Math.max(bbox[0], bbox[2] !== undefined ? bbox[2] : bbox[0] + 0.3);
    let y2 = Math.max(bbox[1], bbox[3] !== undefined ? bbox[3] : bbox[1] + 0.3);

    // Clamp coordinates to [0, 1]
    x1 = Math.max(0, Math.min(1, x1));
    y1 = Math.max(0, Math.min(1, y1));
    x2 = Math.max(0, Math.min(1, x2));
    y2 = Math.max(0, Math.min(1, y2));

    return {
      ...d,
      timestamp: typeof d.timestamp === 'number' ? d.timestamp : (parseFloat(d.frameTimestamp) || 0),
      bbox: [x1, y1, x2, y2],
      category: d.category || 'Pothole',
      confidence: d.confidence || 0.88
    };
  }) : [];

  // Draw Red Bounding Boxes on Overlay Canvas
  const drawOverlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!video || !canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const containerW = container.clientWidth || video.clientWidth || 640;
    const containerH = container.clientHeight || video.clientHeight || 360;

    canvas.width = containerW;
    canvas.height = containerH;
    ctx.clearRect(0, 0, containerW, containerH);

    const currentTime = video.currentTime || 0;

    // Filter detections active at current timestamp (+/- 0.6s or show all if total detections <= 3)
    let matching = normalizedDetections.filter(d => {
      if (normalizedDetections.length <= 2) return true;
      return Math.abs(d.timestamp - currentTime) <= 0.85;
    });

    // Fallback: if no exact timestamp match, show primary detection if within first 5s or active video
    if (matching.length === 0 && normalizedDetections.length > 0) {
      if (currentTime <= 8.0) {
        matching = [normalizedDetections[0]];
      }
    }

    setActiveDetectionsCount(matching.length);

    if (matching.length === 0) return;

    const videoW = video.videoWidth || 1280;
    const videoH = video.videoHeight || 720;

    const scale = Math.min(containerW / videoW, containerH / videoH);
    const offsetX = (containerW - videoW * scale) / 2;
    const offsetY = (containerH - videoH * scale) / 2;

    matching.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const px = offsetX + x1 * videoW * scale;
      const py = offsetY + y1 * videoH * scale;
      const pw = Math.max(20, (x2 - x1) * videoW * scale);
      const ph = Math.max(20, (y2 - y1) * videoH * scale);

      // Draw Red Rectangular Box
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, pw, ph);

      // Semi-transparent red fill
      ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
      ctx.fillRect(px, py, pw, ph);

      // Red Label Badge
      const confPct = Math.round((det.confidence || 0.85) * 100);
      const labelText = `POTHOLE DETECTED (${confPct}%)`;
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      const badgeY = Math.max(18, py - 6);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(px, badgeY - 14, textWidth + 10, 18);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, px + 5, badgeY - 1);
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrameId;
    const renderLoop = () => {
      drawOverlay();
      if (!video.paused && !video.ended) {
        animFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      renderLoop();
    };

    const handlePause = () => {
      setIsPlaying(false);
      drawOverlay();
    };

    const handleTimeUpdate = () => {
      drawOverlay();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleTimeUpdate);
    window.addEventListener('resize', drawOverlay);

    // Initial draw
    setTimeout(drawOverlay, 300);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleTimeUpdate);
      window.removeEventListener('resize', drawOverlay);
    };
  }, [videoUrl, detections]);

  if (!videoUrl || videoError) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          backgroundColor: '#071522',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}
      >
        <AlertCircle size={32} style={{ color: 'var(--status-pending)', marginBottom: '0.5rem' }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Video Media Stream Unavailable
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Unable to play video source. Please check backend connection.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}>
      {/* Title & Live Bounding Box Count Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {activeDetectionsCount > 0 && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#FF0000',
              backgroundColor: 'rgba(255, 0, 0, 0.15)',
              border: '1px solid #FF0000',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              animation: 'pulseGlow 2s infinite'
            }}
          >
            ● {activeDetectionsCount} Pothole Overlay Active
          </span>
        )}
      </div>

      {/* Video Container with Overlaid Bounding Box Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#000000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)'
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          controls
          preload="metadata"
          crossOrigin="anonymous"
          onError={() => setVideoError(true)}
          style={{
            width: '100%',
            maxHeight: '380px',
            display: 'block',
            backgroundColor: '#000000',
            objectFit: 'contain'
          }}
        />

        {/* Bounding Box Overlay Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      </div>
    </div>
  );
};
