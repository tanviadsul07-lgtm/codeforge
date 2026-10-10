import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cloudinaryService } from '../../services/cloudinaryService';
import { Camera, Trash2, RefreshCw, AlertCircle, CheckCircle2, User } from 'lucide-react';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const PERMITTED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const ProfilePictureUploader = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentAvatar = preview || user?.avatar || user?.photoURL;

  // Generate initials for default avatar fallback
  const getInitials = (name) => {
    if (!name) return 'PR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Format & Size Validation
    if (!PERMITTED_FORMATS.includes(file.type)) {
      setError('Invalid file format. Only JPG, JPEG, PNG, and WebP images are permitted.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(`Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 5MB.`);
      return;
    }

    // Local Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setLoading(true);
    setProgress(10);

    try {
      let photoURL = null;

      // Try signed Cloudinary upload first
      try {
        const uploadRes = await cloudinaryService.uploadMedia(file, 'user_avatars', (p) => setProgress(p));
        if (uploadRes && uploadRes.secureUrl) {
          photoURL = uploadRes.secureUrl;
        }
      } catch (cloudErr) {
        console.warn('[Profile Avatar] Cloudinary upload deferred/failed, using fallback data URL:', cloudErr.message);
        // Resilient Fallback: Convert to data URL for immediate profile image persistence
        photoURL = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(file);
        });
      }

      if (photoURL) {
        // Persist photoURL to AuthContext & Firestore users/{uid} profile
        await updateProfile({ avatar: photoURL, photoURL });
        setSuccess('Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('[Avatar Upload Error]', err);
      setError(err.message || 'Failed to upload profile picture. Please try again.');
      setPreview(null);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    setError('');
    setSuccess('');
    setPreview(null);
    try {
      setLoading(true);
      await updateProfile({ avatar: '', photoURL: '' });
      setSuccess('Profile picture removed.');
    } catch (err) {
      setError('Failed to remove profile picture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--bg-sidebar)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem'
    }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/jpg,image/webp"
        style={{ display: 'none' }}
      />

      {/* Circular Avatar */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={user?.name || 'User Avatar'}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--electric-blue)',
              boxShadow: 'var(--shadow-glow)'
            }}
          />
        ) : (
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-soft-blue)',
            color: 'var(--electric-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            border: '3px solid var(--border-color)'
          }}>
            {getInitials(user?.name)}
          </div>
        )}

        {/* Floating Upload Trigger Overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--electric-blue)',
            color: '#071522',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            border: '2px solid var(--bg-card)',
            cursor: 'pointer'
          }}
          title="Upload / Change Avatar"
        >
          <Camera size={16} />
        </button>
      </div>

      {/* User Basic Identifiers */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
        {user?.name || 'PathRakshak User'}
      </h3>
      <span className="badge badge-neutral" style={{ marginBottom: '1rem', fontSize: '0.7rem' }}>
        {user?.role || 'CITIZEN'}
      </span>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={14} />
          <span>{currentAvatar ? 'Change Photo' : 'Upload Photo'}</span>
        </button>

        {currentAvatar && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(255, 100, 124, 0.4)' }}
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Upload Progress Bar */}
      {loading && (
        <div style={{ width: '100%', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Uploading Avatar...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--electric-blue)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Feedback */}
      {success && (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};
