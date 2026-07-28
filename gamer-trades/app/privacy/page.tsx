import Link from 'next/link';
import { PRIVACY_POLICY, LEGAL_UPDATED } from '@/lib/legalContent';

export const metadata = { title: 'Privacy Policy — GamerTrades' };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0e1a', padding: '32px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: '10px', color: '#64748b', textDecoration: 'none' }}>◀ BACK TO HOME</Link>
        <h1 className="font-pixel" style={{ fontSize: '16px', color: '#00ffff', textShadow: '0 0 10px #00ffff', marginTop: '20px', marginBottom: '6px' }}>
          PRIVACY POLICY
        </h1>
        <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '24px' }}>Last updated: {LEGAL_UPDATED}</p>
        {PRIVACY_POLICY.map(section => (
          <section key={section.heading} style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '9px', color: '#00aaff', textShadow: '0 0 8px #00aaff', marginBottom: '8px' }}>
              {section.heading}
            </h2>
            <p style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.9 }}>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
