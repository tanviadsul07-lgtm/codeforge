import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import {
  ArrowRight,
  ShieldCheck,
  Video,
  MapPin,
  FileCheck,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart3
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  usePageTitle();

  const features = [
    {
      icon: Cpu,
      title: 'AI Road Hazard Detection',
      description: 'YOLO computer vision inference extracts potholes and surface defects automatically from dashcam video frames.',
      accent: '#12BDF2'
    },
    {
      icon: Video,
      title: 'Video & GPS Trajectory Sync',
      description: 'Synchronize MP4 road survey video with GPS CSV log trackpoints for precise spatial geolocation.',
      accent: '#45E4F4'
    },
    {
      icon: MapPin,
      title: 'Interactive GIS Telemetry Map',
      description: 'Geospatial hazard visualization with real-time severity markers, detailed popups, and GeoJSON spatial export.',
      accent: '#38D996'
    },
    {
      icon: FileCheck,
      title: 'Field Operator Inspection',
      description: 'Authorized field crews inspect assigned hazard pins, upload on-site photo evidence, and verify severity.',
      accent: '#F5B942'
    },
    {
      icon: Briefcase,
      title: 'Municipal Repair Work Orders',
      description: 'Road Department Officers dispatch repair crews, manage active work orders, and track repair progress from 0% to 100%.',
      accent: '#FF647C'
    }
  ];

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#071522',
      color: '#F2F8FC',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* Header Bar */}
      <header style={{
        backgroundColor: '#0D263B',
        borderBottom: '1px solid #164A6B',
        padding: '1.25rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Logo size="md" showTagline={true} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/role-selection')} icon={ArrowRight} iconPosition="right">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        {/* Subtle Radial Lighting Accent */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(18, 189, 242, 0.18) 0%, rgba(69, 228, 244, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Feature Badge Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          backgroundColor: '#123651',
          border: '1px solid #12BDF2',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#12BDF2',
          marginBottom: '1.75rem',
          boxShadow: '0 0 16px rgba(18, 189, 242, 0.25)'
        }}>
          <Sparkles size={16} />
          <span>AUTONOMOUS ROAD HAZARD DETECTOR</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '1.25rem',
          letterSpacing: '-0.02em',
          maxWidth: '900px'
        }}>
          Smarter Roads. <span style={{ color: '#12BDF2' }}>Safer Journeys.</span>
        </h1>

        {/* Supporting Subtitle */}
        <p style={{
          fontSize: '1.15rem',
          color: '#91A9BB',
          maxWidth: '750px',
          lineHeight: 1.6,
          marginBottom: '2.5rem'
        }}>
          Detect road hazards, report dangerous conditions, and help coordinate faster road repairs with PathRakshak AI.
        </p>

        {/* Call to Action Buttons */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/role-selection')}
            icon={ArrowRight}
            iconPosition="right"
            style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: 800 }}
          >
            Get Started
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
            style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
          >
            Sign In
          </Button>
        </div>

        {/* Verified System Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          marginTop: '4rem',
          textAlign: 'left'
        }}>
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#123651',
            border: '1px solid #164A6B',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <CheckCircle2 size={22} style={{ color: '#38D996', flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F2F8FC' }}>
              Real-time YOLO Video Frame Analysis
            </div>
          </div>

          <div style={{
            padding: '1.25rem',
            backgroundColor: '#123651',
            border: '1px solid #164A6B',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <CheckCircle2 size={22} style={{ color: '#38D996', flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F2F8FC' }}>
              GPS Trajectory Interpolation
            </div>
          </div>

          <div style={{
            padding: '1.25rem',
            backgroundColor: '#123651',
            border: '1px solid #164A6B',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <CheckCircle2 size={22} style={{ color: '#38D996', flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F2F8FC' }}>
              Direct Municipal Work Order Tracking
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section style={{
        backgroundColor: '#0D263B',
        borderTop: '1px solid #164A6B',
        borderBottom: '1px solid #164A6B',
        padding: '5rem 2.5rem'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#F2F8FC', marginBottom: '0.5rem' }}>
              Unified Intelligent Platform Capabilities
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#91A9BB' }}>
              End-to-end integration supporting Citizens, Field Operators, and Road Department Officers
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.75rem'
          }}>
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="card accent-line-top"
                  style={{
                    backgroundColor: '#123651',
                    border: '1px solid #164A6B',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem 1.75rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#0D263B',
                    color: feat.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #164A6B',
                    marginBottom: '1.25rem'
                  }}>
                    <IconComp size={24} />
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F2F8FC', marginBottom: '0.5rem' }}>
                    {feat.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#91A9BB', lineHeight: 1.6 }}>
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#071522',
        padding: '2.5rem',
        borderTop: '1px solid #164A6B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <Logo size="sm" showTagline={true} />
        <div style={{ fontSize: '0.8rem', color: '#91A9BB' }}>
          &copy; {new Date().getFullYear()} PathRakshak AI. All rights reserved. Your Intelligent Road Protector.
        </div>
      </footer>
    </div>
  );
};
