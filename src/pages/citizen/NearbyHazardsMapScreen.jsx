import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge } from '../../components/common/Badge';
import { HazardMap } from '../../components/maps/HazardMap';
import { HAZARD_CATEGORIES } from '../../utils/constants';

export const NearbyHazardsMapScreen = () => {
  const { hazards } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedHazard, setSelectedHazard] = useState(null);

  const filtered = (hazards || []).filter(h => {
    if (!h) return false;
    const searchLower = (search || '').toLowerCase();
    const matchesCat = selectedCategory === 'All' || h.category === selectedCategory || h.reportType === selectedCategory;
    const matchesSev = selectedSeverity === 'All' || h.severity === selectedSeverity;
    const addrStr = (h.address || h.location || '').toLowerCase();
    const catStr = (h.category || h.reportType || '').toLowerCase();
    const matchesSearch = !searchLower || addrStr.includes(searchLower) || catStr.includes(searchLower);
    return matchesCat && matchesSev && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        title="Nearby Road Hazards GIS Map"
        description="Explore active geolocated road defects detected by AI surveillance and citizen reports."
      />

      {/* Map Control Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search address or area..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={['All', ...HAZARD_CATEGORIES]}
              style={{ width: '160px' }}
            />
            <Select
              label="Severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              options={['All', 'Critical', 'High', 'Medium', 'Low']}
              style={{ width: '140px' }}
            />
          </div>
        </div>
      </Card>

      {/* Map + Side Panel */}
      <div className="grid-two-col">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <HazardMap
            hazards={filtered}
            selectedHazardId={selectedHazard?.id}
            onSelectHazard={(h) => setSelectedHazard(h)}
            height="580px"
          />
        </Card>

        {/* Selected Hazard Details Side Panel */}
        <div>
          {selectedHazard ? (
            <Card title={`Hazard Record: ${selectedHazard.id}`}>
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={selectedHazard.evidenceImage}
                  alt={selectedHazard.category}
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedHazard.category}</span>
                  <Badge status={selectedHazard.severity} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {selectedHazard.description}
                </p>
              </div>

              <div style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-sidebar)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div><strong>Location:</strong> {selectedHazard.address}</div>
                <div><strong>AI Confidence:</strong> {(selectedHazard.confidence * 100).toFixed(1)}%</div>
                <div><strong>Verification:</strong> <Badge status={selectedHazard.verificationStatus} /></div>
                {selectedHazard.complaintId && (
                  <div><strong>Complaint Ref:</strong> {selectedHazard.complaintId}</div>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Selected Hazard Panel">
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Click any marker on the map to inspect geolocated hazard evidence & severity metrics.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
