import { apiClient } from './apiClient';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const cloudinaryService = {
  // Validate File before Upload
  async validateFile(file) {
    if (!file) {
      throw new Error('No media file selected.');
    }

    const isImage = file.type.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = file.type.startsWith('video/') || ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      throw new Error('Unsupported file type. Please upload a valid image (JPG, PNG, WEBP) or video (MP4, WEBM, MOV).');
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`);
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      throw new Error(`Video file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 100MB.`);
    }

    let durationSeconds = null;

    if (isVideo) {
      try {
        durationSeconds = await this.getVideoDuration(file);
        if (durationSeconds && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
          throw new Error(`Video duration (${Math.round(durationSeconds)}s) exceeds maximum allowed length of 2 minutes.`);
        }
      } catch (err) {
        if (err.message && err.message.includes('exceeds maximum allowed length')) {
          throw err;
        }
      }
    }

    return {
      resourceType: isVideo ? 'video' : 'image',
      sizeBytes: file.size,
      durationSeconds
    };
  },

  // Helper to calculate video duration using DOM Video element
  getVideoDuration(file) {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve(video.duration || null);
        };
        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(file);
      } catch {
        resolve(null);
      }
    });
  },

  // Read File as Base64 String Helper
  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Upload Media File to Cloudinary or Local Server Fallback with Progress
  async uploadMedia(file, folder = 'road_reports', onProgress = () => {}) {
    const validation = await this.validateFile(file);
    const resourceType = validation.resourceType;

    // 1. Try Cloudinary Signed Upload
    try {
      console.log(`[Cloudinary Upload] Requesting signed authorization for ${file.name} (${resourceType})...`);
      
      const sigRes = await apiClient.request('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({ folder, resourceType })
      });

      if (sigRes && sigRes.success && sigRes.signature && sigRes.apiKey) {
        const cloudName = sigRes.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigRes.apiKey);
        formData.append('timestamp', sigRes.timestamp);
        formData.append('signature', sigRes.signature);
        formData.append('folder', sigRes.folder);

        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };

          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                console.log('[Cloudinary Upload] Signed upload successful:', data.secure_url);

                apiClient.request('/uploads/register', {
                  method: 'POST',
                  body: JSON.stringify({
                    cloudinaryPublicId: data.public_id,
                    secureUrl: data.secure_url,
                    resourceType,
                    format: data.format,
                    sizeBytes: data.bytes,
                    durationSeconds: data.duration || validation.durationSeconds || null
                  })
                }).catch(() => {});

                resolve({
                  success: true,
                  secureUrl: data.secure_url,
                  publicId: data.public_id,
                  resourceType,
                  format: data.format || (file.type.split('/')[1] || 'mp4'),
                  sizeBytes: data.bytes || file.size,
                  durationSeconds: data.duration || validation.durationSeconds || null
                });
              } catch (jsonErr) {
                reject(jsonErr);
              }
            } else {
              reject(new Error(`Cloudinary HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error on Cloudinary request'));
          xhr.ontimeout = () => reject(new Error('Timeout on Cloudinary request'));
          xhr.send(formData);
        });
      }
    } catch (cloudErr) {
      console.warn('[Cloudinary Upload Failed, Falling back to local backend upload]', cloudErr.message);
    }

    // 2. Local Backend Upload Fallback (Guaranteed to work 100% locally and preserve original video file)
    console.log(`[Local Media Upload] Uploading ${file.name} to local Express backend storage...`);
    onProgress(30);

    const base64Data = await this.readFileAsBase64(file);
    onProgress(60);

    const localRes = await apiClient.request('/uploads/media', {
      method: 'POST',
      body: JSON.stringify({
        fileData: base64Data,
        fileName: file.name,
        mimeType: file.type,
        resourceType
      })
    });

    onProgress(100);

    if (!localRes || !localRes.success) {
      throw new Error(localRes?.error || 'Local media upload to backend failed.');
    }

    return {
      success: true,
      secureUrl: localRes.secureUrl,
      publicId: localRes.publicId || file.name,
      resourceType,
      format: file.name.split('.').pop() || (resourceType === 'video' ? 'mp4' : 'jpg'),
      sizeBytes: localRes.sizeBytes || file.size,
      durationSeconds: validation.durationSeconds || null,
      detections: localRes.detections || []
    };
  }
};
