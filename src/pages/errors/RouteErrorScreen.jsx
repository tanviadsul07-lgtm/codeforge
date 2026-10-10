import React, { useState } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export const RouteErrorScreen = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage = error?.data?.message || error?.message || error?.statusText || 'An unexpected application error occurred.';

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        border: '1px solid #E2E8F0',
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: '#FEE2E2', color: '#DC2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <AlertTriangle size={36} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.5rem' }}>
          Application Notice
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          PathRakshak AI encountered a temporary display issue loading this component view.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Button variant="outline" icon={RefreshCw} onClick={() => window.location.reload()}>
            Retry / Reload Page
          </Button>
          <Button variant="primary" icon={Home} onClick={() => navigate('/citizen/dashboard')}>
            Return to Dashboard
          </Button>
        </div>

        {/* Developer Diagnostics Dropdown */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', textAlign: 'left' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <span>Technical Diagnostic Information</span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#F1F5F9',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#334155',
              wordBreak: 'break-word',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
