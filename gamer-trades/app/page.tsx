import Link from 'next/link';

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        backgroundImage:
          'linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div style={{ marginBottom: '24px', fontSize: '48px' }}>🎮</div>

      <h1
        style={{
          fontSize: '28px',
          color: '#00ffff',
          textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff44',
          marginBottom: '8px',
          lineHeight: 1.4,
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        GAMER
        <br />
        <span
          style={{
            color: '#00ff88',
            textShadow: '0 0 20px #00ff88, 0 0 40px #00ff8844',
          }}
        >
          TRADES
        </span>
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '40px',
          lineHeight: 2,
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        PAPER TRADING · HUMAN VS AI · REAL-TIME MARKETS
      </p>

      <Link
        href="/login"
        style={{
          display: 'inline-block',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          padding: '14px 28px',
          background: '#003322',
          color: '#00ff88',
          border: '2px solid #00ff88',
          boxShadow: '4px 4px 0 #00ff8844, 0 0 20px #00ff8833',
          textDecoration: 'none',
          letterSpacing: '1px',
        }}
      >
        ▶ INSERT COIN
      </Link>

      <p
        style={{
          fontSize: '12px',
          color: '#1e3a5f',
          marginTop: '24px',
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        ▲ FREE TO PLAY · NO REAL MONEY AT RISK ▲
      </p>
    </main>
  );
}
