export const generateGeoJSON = (hazards) => {
  const validFeatures = hazards
    .filter(h => typeof h.latitude === 'number' && typeof h.longitude === 'number' && !isNaN(h.latitude) && !isNaN(h.longitude))
    .map(hazard => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [hazard.longitude, hazard.latitude] // GeoJSON RFC 7946 requires [lon, lat]
      },
      properties: {
        id: hazard.id,
        category: hazard.category,
        severity: hazard.severity,
        confidence: hazard.confidence,
        address: hazard.address,
        timestamp: hazard.timestamp,
        verificationStatus: hazard.verificationStatus,
        description: hazard.description,
        complaintId: hazard.complaintId || null
      }
    }));

  return {
    type: "FeatureCollection",
    generator: "PathRakshak AI GIS Engine",
    exportedAt: new Date().toISOString(),
    features: validFeatures
  };
};

export const downloadGeoJSON = (data, filename = "pathrakshak_hazards.geojson") => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
