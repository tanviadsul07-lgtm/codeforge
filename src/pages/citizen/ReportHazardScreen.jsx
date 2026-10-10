import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { HazardMap } from '../../components/maps/HazardMap';
import { HAZARD_CATEGORIES, PRIORITIES } from '../../utils/constants';
import { cloudinaryService } from '../../services/cloudinaryService';
import { dbService } from '../../services/dbService';
import { Upload, MapPin, CheckCircle2, ShieldAlert, Video, Image as ImageIcon, X, AlertTriangle, Map } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const ReportHazardScreen = () => {
  const { addComplaint } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle();

  const [category, setCategory] = useState(HAZARD_CATEGORIES[0] || 'Pothole');
  const [description, setDescription] = useState('');
  
  // Location & GPS State
  const [omitLocation, setOmitLocation] = useState(false);
  const [location, setLocation] = useState('Ring Road, Near Lajpat Nagar Flyover, New Delhi');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const [severity, setSeverity] = useState('High');
  
  // Media State
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [uploadedAsset, setUploadedAsset] = useState(null);

  // Upload & Progress State
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleMediaSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    try {
      const validation = await cloudinaryService.validateFile(file);
      setSelectedFile(file);
      setMediaType(validation.resourceType);
      
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
      setUploadedAsset(null); // Clear any prior uploaded asset
    } catch (valErr) {
      setError(valErr.message || 'Selected file validation failed.');
      e.target.value = '';
    }
  };

  const removeSelectedMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setSelectedFile(null);
    setMediaPreview(null);
    setUploadedAsset(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!description.trim()) {
      setError('Please provide a detailed description of the road hazard.');
      return;
    }

    setError('');
    setLoading(true);
    setUploadProgress(5);
    setStatusMessage('Preparing report data...');

    try {
      let mediaData = uploadedAsset;

      if (selectedFile && !mediaData) {
        setStatusMessage(`Uploading ${mediaType} evidence to Cloudinary...`);
        
        mediaData = await cloudinaryService.uploadMedia(
          selectedFile,
          'road_reports',
          (percent) => {
            setUploadProgress(Math.max(10, Math.min(90, percent)));
            setStatusMessage(`Uploading ${mediaType} to Cloudinary (${percent}%)...`);
          }
        );

        setUploadedAsset(mediaData);
      }

      setUploadProgress(92);
      setStatusMessage('Saving report to Firestore...');

      const reportPayload = {
        category,
        description,
        location: omitLocation ? 'Location Omitted by Citizen' : location,
        hasLocation: !omitLocation,
        latitude: omitLocation ? null : latitude,
        longitude: omitLocation ? null : longitude,
        severity,
        submittedBy: user?.displayName || user?.name || 'Citizen Contributor',
        citizenEmail: user?.email || 'citizen@example.com'
      };

      const newFirestoreReport = await dbService.createReport(
        reportPayload,
        user?.uid,
        mediaData
      );

      addComplaint({
        ...reportPayload,
        id: newFirestoreReport.reportId,
        evidenceImage: newFirestoreReport.evidenceImage,
        evidenceVideo: newFirestoreReport.evidenceVideo,
        mediaResourceType: newFirestoreReport.mediaResourceType
      });

      setUploadProgress(100);
      setStatusMessage('Report submitted successfully!');
      setSuccess(newFirestoreReport);
    } catch (err) {
      console.error('[Submit Hazard Error]', err);
      setError(
        err.message || 'Failed to submit report. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Report Road Hazard"
        description="Help protect fellow commuters by logging geotagged road defects with Cloudinary media evidence."
      />

      {!user && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--electric-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
            <AlertTriangle size={20} />
            <span>Please log in to register authenticated hazard reports under your account.</span>
          </div>
          <Link to="/login">
            <Button variant="primary" style={{ padding: '0.4rem 1rem', fontSize: '0.825rem' }}>
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {success ? (
        <Card style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'var(--success-bg)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', border: '1px solid rgba(56, 217, 150, 0.3)'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Report {success.reportId} Registered!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Your hazard report for <strong>{success.category}</strong> has been saved in Cloud Firestore and media evidence hosted securely on Cloudinary.
          </p>

          {success.evidenceImage && (
            <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '240px' }}>
              {success.mediaResourceType === 'video' && success.evidenceVideo ? (
                <video src={success.evidenceVideo} controls style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
              ) : (
                <img src={success.evidenceImage} alt="Submitted Evidence" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button variant="outline" onClick={() => {
              setSuccess(null);
              setDescription('');
              removeSelectedMedia();
              setUploadProgress(0);
            }}>
              Report Another Hazard
            </Button>
            <Button variant="primary" onClick={() => navigate('/citizen/complaints')}>
              View My Dashboard
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid-two-col">
          {/* Left Form */}
          <Card title="Hazard Details Form">
            {error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 100, 124, 0.3)'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Select
                label="Hazard Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={HAZARD_CATEGORIES}
                disabled={loading}
              />

              <div className="input-group">
                <label className="input-label">Detailed Description</label>
                <textarea
                  className="textarea-field"
                  placeholder="Describe hazard depth, lane position, traffic obstruction..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Location Controls & GPS Toggle */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={omitLocation}
                    onChange={(e) => setOmitLocation(e.target.checked)}
                    disabled={loading}
                    style={{ accentColor: 'var(--electric-blue)' }}
                  />
                  Omit GPS & Location Coordinates
                </label>
              </div>

              {!omitLocation && (
                <>
                  <Input
                    label="Address / Landmark Location"
                    type="text"
                    icon={MapPin}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                    required={!omitLocation}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Input
                      label="Latitude"
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      disabled={loading}
                    />
                    <Input
                      label="Longitude"
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Map}
                      onClick={() => setMapPickerOpen(true)}
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      Pick Location Manually on Interactive Map
                    </Button>
                  </div>
                </>
              )}

              <Select
                label="Perceived Hazard Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                options={PRIORITIES}
                disabled={loading}
              />

              {/* Upload Progress Bar */}
              {loading && (
                <div style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--electric-blue)', marginBottom: '0.25rem' }}>
                    <span>{statusMessage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--electric-blue)',
                      transition: 'width 0.3s ease-in-out'
                    }} />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                icon={ShieldAlert}
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              >
                {loading ? statusMessage || 'Submitting...' : 'Submit Hazard Complaint'}
              </Button>
            </form>
          </Card>

          {/* Right: Media Upload Dropzone & Evidence Preview */}
          <Card title="Upload Media Evidence (Cloudinary)">
            <div style={{
              border: '2px dashed var(--electric-blue)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-sidebar)',
              marginBottom: '1.25rem',
              position: 'relative'
            }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                style={{ display: 'none' }}
                id="media-upload-input"
                disabled={loading}
              />
              <label htmlFor="media-upload-input" style={{ cursor: loading ? 'not-allowed' : 'pointer', display: 'block' }}>
                <Upload size={38} style={{ color: 'var(--electric-blue)', marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Click to Upload or Drag Photo / Video
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Images (JPG, PNG, WEBP &lt; 10MB) • Videos (MP4, WEBM &lt; 100MB, &lt; 2 mins)
                </div>
              </label>
            </div>

            {/* Selected File Preview */}
            {mediaPreview && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {mediaType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                    <span>{selectedFile?.name || 'Selected Evidence Preview'}</span>
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={removeSelectedMedia}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      style={{ width: '100%', maxHeight: '240px', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Media Evidence Preview"
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>

                {selectedFile && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'right' }}>
                    File Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Interactive Map Location Picker Modal */}
      <Modal
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        title="Select Location Coordinates on Interactive Map"
        footer={
          <Button variant="primary" onClick={() => setMapPickerOpen(false)}>
            Confirm Selected Coordinates ({parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)})
          </Button>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Click anywhere on the map to place the hazard pin and set GPS latitude & longitude.
        </p>
        <HazardMap
          hazards={[{ id: 'selected-pin', latitude: parseFloat(latitude) || 28.6139, longitude: parseFloat(longitude) || 77.2090, category, severity }]}
          selectedHazardId="selected-pin"
          height="320px"
          onMapClick={({ lat, lng }) => {
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
          }}
        />
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--electric-blue)' }}>
          Selected GPS: Lat {latitude}, Lng {longitude}
        </div>
      </Modal>
    </div>
  );
};
