export const parseDateObj = (input) => {
  if (!input) return null;
  try {
    if (typeof input === 'object') {
      if (typeof input.toDate === 'function') {
        return input.toDate();
      }
      if (typeof input.seconds === 'number') {
        return new Date(input.seconds * 1000);
      }
    }
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

export const formatDate = (isoString) => {
  const date = parseDateObj(isoString);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export const formatDateTime = (isoString) => {
  const date = parseDateObj(isoString);
  if (!date) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const getStatusBadgeClass = (status) => {
  const strStatus = status ? String(status).trim() : '';
  switch (strStatus) {
    case "Resolved":
    case "Verified":
    case "Completed":
      return "badge-success";
    case "In Progress":
    case "Under Review":
    case "Processing":
    case "Pending Verification":
      return "badge-warning";
    case "Critical":
    case "High":
    case "Rejected":
      return "badge-danger";
    case "Assigned":
    case "Submitted":
      return "badge-info";
    default:
      return "badge-neutral";
  }
};

export const getPriorityBadgeClass = (priority) => {
  const strPriority = priority ? String(priority).trim() : '';
  switch (strPriority) {
    case "Critical":
      return "badge-danger";
    case "High":
      return "badge-warning";
    case "Medium":
      return "badge-info";
    case "Low":
    default:
      return "badge-neutral";
  }
};

export const formatCoordinates = (lat, lng) => {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return "N/A";
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return "N/A";
  return `${numLat.toFixed(4)}° N, ${numLng.toFixed(4)}° E`;
};
