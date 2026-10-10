import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'nyymao4r',
  api_key: process.env.CLOUDINARY_API_KEY || '311494319942591',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_cloudinary_secret_key_server_only',
  secure: true
});

export const generateUploadSignature = (folder = 'road_reports', resourceType = 'auto') => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET || 'demo_cloudinary_secret_key_server_only'
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'nyymao4r',
    apiKey: process.env.CLOUDINARY_API_KEY || '311494319942591',
    folder
  };
};

export default cloudinary;
