import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { generateGeoJSON, downloadGeoJSON } from '../../utils/geojson';
import { HAZARD_CATEGORIES } from '../../utils/constants';
import { Download, CheckCircle2, FileJson, Layers } from 'lucide-react';

export const GeoJsonExportScreen = () => {
  const { hazards } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [exported, setExported] = useState(false);

  const filteredHazards = hazards.filter(h => {
    const matchesCat = categoryFilter === 'All' || h.category === categoryFilter;
    const matchesSev = severityFilter === 'All' || h.severity === severityFilter;
    return matchesCat && matchesSev;
  });

  const validGeolocated = filteredHazards.filter(h => typeof h.latitude === 'number' && typeof h.longitude === 'number');

  const handleDownload = () => {
    const geojsonData = generateGeoJSON(validGeolocated);
    downloadGeoJSON(geojsonData, `pathrakshak_hazards_${Date.now()}.geojson`);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="GeoJSON Spatial Data Export"
        description="Export verified road hazard records into standard GeoJSON RFC 7946 format for GIS software integration (QGIS, ArcGIS)."
      />

      <div className="grid-two-col">
        <Card title="Export Filters & Parameters">
          <Select
            label="Hazard Category Filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={['All', ...HAZARD_CATEGORIES]}
          />

          <Select
            label="Severity Rating Filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={['All', 'Critical', 'High', 'Medium', 'Low']}
          />

          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-sidebar)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            <div><strong>Format Standard:</strong> GeoJSON RFC 7946</div>
            <div><strong>Coordinate System:</strong> EPSG:4326 (WGS 84)</div>
            <div><strong>Coordinate Pair Ordering:</strong> <code style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>[longitude, latitude]</code></div>
            <div><strong>Total Matching Hazards:</strong> {validGeolocated.length} geolocated points</div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Download}
            onClick={handleDownload}
            disabled={validGeolocated.length === 0}
            style={{ width: '100%' }}
          >
            Download GeoJSON File ({validGeolocated.length} Features)
          </Button>

          {exported && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={18} />
              <span>GeoJSON file downloaded successfully!</span>
            </div>
          )}
        </Card>

        {/* Live GeoJSON Payload Preview */}
        <Card title="GeoJSON Payload Structure Preview">
          <div style={{
            backgroundColor: '#0F172A',
            color: '#38BDF8',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
            <pre>{JSON.stringify(generateGeoJSON(validGeolocated.slice(0, 2)), null, 2)}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
};
