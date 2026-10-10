import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { cloudinaryService } from '../../services/cloudinaryService';
import { apiClient } from '../../services/apiClient';
import { Upload, Video, FileText, CheckCircle2, AlertCircle, Cpu, X, Sparkles, MapPin } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const VideoGpsUploadScreen = () => {
  const { user } = useAuth();
  const { addSurveySession } = useApp();
  const navigate = useNavigate();
  usePageTitle();

  // File States
  const [videoFile, setVideoFile] = useState(null);
  const [gpsFile, setGpsFile] = useState(null);
  const [gpsCsvText, setGpsCsvText] = useState('');
  const [gpsPreviewStats, setGpsPreviewStats] = useState(null);

  // Configuration States
  const [sampleFps, setSampleFps] = useState('3.0');
  const [offsetSeconds, setOffsetSeconds] = useState('0.0');

  // Job Execution & Polling States
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [completedJob, setCompletedJob] = useState(null);
  const [error, setError] = useState('');

  // Handle Video File Selection
  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    try {
      const validation = await cloudinaryService.validateFile(file);
      if (validation.resourceType !== 'video') {
        throw new Error('Selected file is not a valid video format.');
      }
      setVideoFile(file);
    } catch (err) {
      setError(err.message || 'Invalid video file selected.');
      e.target.value = '';
    }
  };

  // Handle GPS CSV File Selection & Client-Side Validation
  const handleGpsSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.trim().split(/\r?\n/).filter(l => l.trim().length > 0);

      if (lines.length < 3) {
        setError('GPS file must contain a header row and at least 2 coordinate points.');
        return;
      }

      const header = lines[0].toLowerCase();
      if (!header.includes('lat') || !header.includes('lon')) {
        setError('GPS CSV file must contain column headers: time_sec, lat, lon');
        return;
      }

      let validPoints = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        if (parts.length >= 3) {
          const lat = parseFloat(parts[1]);
          const lon = parseFloat(parts[2]);
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            validPoints++;
          }
        }
      }

      if (validPoints < 2) {
        setError('GPS file does not contain valid latitude/longitude numbers.');
        return;
      }

      setGpsFile(file);
      setGpsCsvText(content);
      setGpsPreviewStats({ totalRows: lines.length - 1, validPoints });
    };

    reader.readAsText(file);
  };

  // Polling AI Processing Job Status
  useEffect(() => {
    let timer = null;
    if (activeJobId && loading) {
      timer = setInterval(async () => {
        try {
          const res = await apiClient.request(`/analysis/jobs/${activeJobId}`);
          if (res.success && res.job) {
            const job = res.job;
            setUploadProgress(job.progressPercent || 50);

            if (job.status === 'PROCESSING') {
              setStatusMessage(`Executing AI Computer Vision Inference (${job.progressPercent}%)...`);
            } else if (job.status === 'COMPLETED') {
              clearInterval(timer);
              setLoading(false);
              setCompletedJob(job);
              setStatusMessage('AI Video & GPS Analysis Completed Successfully!');
              addSurveySession({
                name: `Survey Run ${job.jobId}`,
                roadName: videoFile?.name || "Survey Drive",
                area: "Geotagged Area",
                videoFileName: videoFile?.name || "survey_video.mp4",
                gpsFileName: gpsFile?.name || "gps_log.csv"
              });
            } else if (job.status === 'FAILED') {
              clearInterval(timer);
              setLoading(false);
              setError(job.error || 'AI detection processing failed.');
            }
          }
        } catch (pollErr) {
          console.warn('[Job Polling Warning]', pollErr.message);
        }
      }, 2000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeJobId, loading]);

  // Execute Real Upload & Submit AI Job
  const handleStartAnalysis = async () => {
    if (loading) return;
    if (!videoFile || !gpsCsvText) {
      setError('Please select both an MP4 video file and a valid GPS CSV file.');
      return;
    }

    setError('');
    setLoading(true);
    setCompletedJob(null);
    setUploadProgress(5);
    setStatusMessage('Uploading video footage to Cloudinary...');

    try {
      // Step 1: Upload MP4 video to Cloudinary using signed architecture
      const uploadRes = await cloudinaryService.uploadMedia(
        videoFile,
        'survey_videos',
        (pct) => {
          setUploadProgress(Math.max(5, Math.min(60, Math.round(pct * 0.6))));
          setStatusMessage(`Uploading MP4 Video to Cloudinary (${pct}%)...`);
        }
      );

      setUploadProgress(65);
      setStatusMessage('Submitting Video & GPS telemetry to AI processing worker...');

      // Step 2: Submit job to backend API endpoint
      const jobRes = await apiClient.request('/analysis/submit-job', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: uploadRes.secureUrl,
          cloudinaryPublicId: uploadRes.publicId,
          gpsCsvContent: gpsCsvText,
          sampleFps: parseFloat(sampleFps) || 3.0,
          offsetSeconds: parseFloat(offsetSeconds) || 0.0
        })
      });

      if (!jobRes.success || !jobRes.jobId) {
        throw new Error(jobRes.error || 'Failed to queue AI analysis job.');
      }

      setActiveJobId(jobRes.jobId);
      setUploadProgress(70);
      setStatusMessage(`AI Job ${jobRes.jobId} queued. Starting YOLO Inference...`);
    } catch (err) {
      console.error('[AI Upload Analysis Error]', err);
      setLoading(false);
      setError(err.message || 'Failed to execute video & GPS AI analysis.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Autonomous Road Video & GPS AI Detector"
        description="Upload dashcam video footage alongside GPS CSV trajectory logs to run real YOLO Computer Vision inference and hazard mapping."
      />

      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <Sparkles size={24} style={{ color: 'var(--electric-blue)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--cyan-accent)' }}>YOLO Computer Vision Inference Engine:</strong> Detects road hazards, interpolates vehicle GPS trajectories, and places geolocated hazard markers directly on the GIS map.
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          border: '1px solid rgba(255, 100, 124, 0.3)'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {completedJob ? (
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'var(--success-bg)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', border: '1px solid rgba(56, 217, 150, 0.3)'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            AI Detection Job Completed!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Job ID: <strong style={{ color: 'var(--electric-blue)' }}>{completedJob.jobId}</strong> | Detected <strong>{completedJob.hazardCount} Pothole Hazards</strong> with geolocated coordinates.
          </p>

          {/* Evidence Grid Preview */}
          {completedJob.features && completedJob.features.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              {completedJob.features.slice(0, 4).map((f, idx) => (
                <div key={idx} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                  <img src={f.evidenceImage} alt={f.hazard} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{f.hazard} ({f.severity})</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Confidence: {(f.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button variant="outline" onClick={() => { setCompletedJob(null); setVideoFile(null); setGpsFile(null); }}>
              Analyze Another Video
            </Button>
            <Button variant="primary" onClick={() => navigate(user?.role === 'CITIZEN' ? '/citizen/map' : '/operator/gis')}>
              View Results on GIS Map
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid-equal-two">
            {/* Left: Video Dropzone */}
            <Card title="1. Dashcam Video File (.MP4, .MOV, .WEBM)">
              {videoFile ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-sidebar)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-soft-blue)', color: 'var(--electric-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{videoFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {videoFile.type || 'MP4 Video'}
                      </div>
                    </div>
                  </div>
                  {!loading && (
                    <Button variant="outline" size="sm" onClick={() => setVideoFile(null)} style={{ padding: '4px 8px' }}>
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{
                  border: '2px dashed var(--electric-blue)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-sidebar)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoSelect}
                    style={{ display: 'none' }}
                    id="video-file-input"
                    disabled={loading}
                  />
                  <label htmlFor="video-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    <Upload size={40} style={{ color: 'var(--electric-blue)', marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Click to Select Dashcam MP4 Video</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Supports MP4, WEBM, MOV up to 100MB</div>
                  </label>
                </div>
              )}
            </Card>

            {/* Right: GPS Telemetry Dropzone */}
            <Card title="2. GPS Trajectory Log (.CSV with time_sec,lat,lon)">
              {gpsFile ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-sidebar)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{gpsFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {gpsPreviewStats?.validPoints || 0} valid coordinate points loaded
                      </div>
                    </div>
                  </div>
                  {!loading && (
                    <Button variant="outline" size="sm" onClick={() => { setGpsFile(null); setGpsCsvText(''); }} style={{ padding: '4px 8px' }}>
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{
                  border: '2px dashed var(--success)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-sidebar)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleGpsSelect}
                    style={{ display: 'none' }}
                    id="gps-file-input"
                    disabled={loading}
                  />
                  <label htmlFor="gps-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    <Upload size={40} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Click to Select GPS CSV Log File</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>CSV with headers: time_sec, lat, lon</div>
                  </label>
                </div>
              )}
            </Card>
          </div>

          {/* Inference Parameters */}
          <Card title="3. Inference Sampling Parameters" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select
                label="Sample Frequency (Frames/Sec)"
                value={sampleFps}
                onChange={(e) => setSampleFps(e.target.value)}
                options={['1.0', '2.0', '3.0', '5.0']}
                disabled={loading}
              />
              <Input
                label="Video vs GPS Time Offset (Seconds)"
                type="number"
                value={offsetSeconds}
                onChange={(e) => setOffsetSeconds(e.target.value)}
                disabled={loading}
              />
            </div>
          </Card>

          {/* Progress & Submit Action */}
          <Card style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem' }}>
            {loading && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--electric-blue)', marginBottom: '0.35rem' }}>
                  <span>{statusMessage}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--electric-blue)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              icon={Cpu}
              loading={loading}
              onClick={handleStartAnalysis}
              disabled={!videoFile || !gpsFile || loading}
              style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}
            >
              {loading ? 'Processing Video & GPS Inference...' : 'Upload & Run AI Pothole Inference'}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
};
