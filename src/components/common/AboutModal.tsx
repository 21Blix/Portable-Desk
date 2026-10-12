import React from 'react';
import { ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { ToolModalWrapper } from '../workspace/ToolModalWrapper';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <ToolModalWrapper
      title="About This Nonsense"
      tagline="the manifesto of a tiny paper workshop"
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            background: 'radial-gradient(circle at top, #29124a 0%, #141624 100%)',
            border: '2px solid var(--purple-electric)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={24} color="var(--lime-acid)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff' }}>
              Why does this exist?
            </h3>
          </div>
          <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Most online PDF tools are sterile corporate SaaS dashboards covered in paywalls, 3-document daily limits,
            ad banners, and deceptive subscription popups.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '10px', lineHeight: 1.6 }}>
            <strong>Portable Desk</strong> is a passion project built on a different philosophy: what if pdf editing became truly free and local
          </p>
        </div>

        {/* Privacy Section */}
        <div className="settings-group">
          <div className="settings-group-title">
            <ShieldCheck size={22} color="var(--cyan-electric)" />
            <span>Absolute Privacy Guarantee (Zero Cloud Processing)</span>
          </div>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <li>
              <strong style={{ color: 'var(--lime-acid)' }}>100% in your browser:</strong> Every operation (merging,
              splitting, extracting, numbering, and converting) is executed strictly inside your device's memory using
              WebAssembly and JavaScript (<code style={{ color: 'var(--cyan-electric)' }}>pdf-lib</code> &amp; Mozilla{' '}
              <code style={{ color: 'var(--cyan-electric)' }}>pdfjs-dist</code>).
            </li>
            <li>
              <strong style={{ color: 'var(--lime-acid)' }}>No Uploads:</strong> Files never leave your computer. We
              have no server backend, no database, no Firebase, and no cloud storage.
            </li>
            <li>
              <strong style={{ color: 'var(--lime-acid)' }}>No Tracking or Ads:</strong> Zero telemetry, zero
              fingerprinting, zero analytics, zero surveillance cookies.
            </li>
          </ul>
        </div>

        {/* Tech Specs */}
        <div className="settings-group">
          <div className="settings-group-title">
            <Terminal size={22} color="var(--pink-hot)" />
            <span>Under The Hood</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {['React 19', 'Vite', 'TypeScript', 'pdf-lib', 'Mozilla PDF.js', 'JSZip', 'Web Audio API', 'Cloudflare Pages'].map(
              (tech) => (
                <span
                  key={tech}
                  style={{
                    background: '#1c1e30',
                    border: '1px solid rgba(146, 91, 255, 0.4)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--lime-acid)' }}>
            Made with strong mentality
          </div>
        </div>
      </div>
    </ToolModalWrapper>
  );
};
