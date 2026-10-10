export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateCoordinates = (lat, lng) => {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  return !isNaN(numLat) && !isNaN(numLng) && numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180;
};

export const validateFileUpload = (file, allowedExtensions = ['.mp4', '.mov', '.gpx', '.csv']) => {
  if (!file) return { valid: false, message: "No file selected." };
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, message: `Unsupported file format ${ext}. Allowed: ${allowedExtensions.join(', ')}` };
  }
  return { valid: true, message: "File valid." };
};
