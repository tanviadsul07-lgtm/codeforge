import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { HazardMap } from '../../components/maps/HazardMap';
import { HAZARD_CATEGORIES } from '../../utils/constants';
import { Download, Layers } from 'lucide-react';

export const GisHazardMapScreen = () => {
  const { hazards } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedHazard, setSelectedHazard] = useState(() => (Array.isArray(hazards) && hazards.length > 0 ? hazards[0] : null));

  const filtered = (hazards || []).filter(h => {
    if (!h) return false;
    const searchLower = (search || '').toLowerCase();
    const matchesCat = selectedCategory === 'All' || h.category === selectedCategory || h.reportType === selectedCategory;
    const matchesSev = selectedSeverity === 'All' || h.severity === selectedSeverity;
    const matchesStat = selectedStatus === 'All' || h.verificationStatus === selectedStatus;
    const addrStr = (h.address || h.location || '').toLowerCase();
    const idStr = (h.id || h.hazardId || '').toLowerCase();
    const matchesSearch = !searchLower || addrStr.includes(searchLower) || idStr.includes(searchLower);
    return matchesCat && matchesSev && matchesStat && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        title="GIS Geospatial Hazard Intelligence Map"
        description="High-resolution GIS mapping platform visualizing road hazards, severity distributions, and municipal spatial telemetry."
        actions={
          <Button variant="primary" icon={Download} onClick={() => navigate('/geojson-export')}>
            Export GeoJSON Layer
          </Button>
        }
      />

      {/* Control Filters */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search address, ID, or area..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={['All', ...HAZARD_CATEGORIES]}
              style={{ width: '150px' }}
            />
            <Select
              label="Severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              options={['All', 'Critical', 'High', 'Medium', 'Low']}
              style={{ width: '130px' }}
            />
            <Select
              label="Verification"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={['All', 'Verified', 'Pending Verification', 'False Positive']}
              style={{ width: '160px' }}
            />
          </div>
        </div>
      </Card>

      {/* Map + Inspector Panel */}
      <div className="grid-two-col">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <HazardMap
            hazards={filtered}
            selectedHazardId={selectedHazard?.id}
            onSelectHazard={(h) => setSelectedHazard(h)}
            height="620px"
          />
        </Card>

        <div>
          {selectedHazard ? (
            <Card title={`GIS Inspector: ${selectedHazard.id}`}>
              <img
                src={selectedHazard.evidenceImage}
                alt={selectedHazard.category}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedHazard.category}</h3>
                <Badge status={selectedHazard.severity} />
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {selectedHazard.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem', backgroundColor: 'var(--bg-sidebar)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div><strong>Address:</strong> {selectedHazard.address}</div>
                <div><strong>Coordinates:</strong> [{selectedHazard.longitude}, {selectedHazard.latitude}] (WGS-84)</div>
                <div><strong>Confidence:</strong> {(selectedHazard.confidence * 100).toFixed(1)}%</div>
                <div><strong>Verification:</strong> <Badge status={selectedHazard.verificationStatus} /></div>
                <div><strong>Session Source:</strong> {selectedHazard.sessionId}</div>
              </div>
            </Card>
          ) : (
            <Card title="GIS Inspector">
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Select a hazard pin on the GIS map.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
