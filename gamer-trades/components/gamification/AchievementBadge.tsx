'use client';

interface Achievement {
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'legendary';
}

const RARITY_COLORS = {
  common: '#64748b',
  rare: '#00aaff',
  legendary: '#ffd700',
};

export default function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const color = RARITY_COLORS[achievement.rarity];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        background: achievement.unlocked ? `${color}11` : '#0a0e1a',
        border: `2px solid ${achievement.unlocked ? color : '#1e3a5f'}`,
        boxShadow: achievement.unlocked ? `2px 2px 0 #000, 0 0 8px ${color}44` : '2px 2px 0 #000',
        opacity: achievement.unlocked ? 1 : 0.4,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '18px', filter: achievement.unlocked ? 'none' : 'grayscale(1)' }}>
        {achievement.icon}
      </span>
      <div>
        <div
          style={{
            fontSize: '6px',
            color: achievement.unlocked ? color : '#64748b',
            textShadow: achievement.unlocked ? `0 0 6px ${color}` : 'none',
            marginBottom: '3px',
          }}
        >
          {achievement.name}
        </div>
        <div style={{ fontSize: '5px', color: '#64748b' }}>{achievement.desc}</div>
      </div>
    </div>
  );
}

export const ACHIEVEMENTS: Achievement[] = [
  { icon: '🩸', name: 'FIRST BLOOD', desc: 'Place your first trade', unlocked: true, rarity: 'common' },
  { icon: '💰', name: 'PROFIT PILGRIM', desc: 'First profitable close', unlocked: true, rarity: 'common' },
  { icon: '🤖', name: 'BEAT THE BOT', desc: 'Win vs AI opponent', unlocked: true, rarity: 'rare' },
  { icon: '👑', name: 'LEGEND SLAYER', desc: 'Beat Legend difficulty', unlocked: false, rarity: 'legendary' },
  { icon: '🔥', name: 'HOT STREAK', desc: '5 profitable trades in a row', unlocked: false, rarity: 'rare' },
  { icon: '💎', name: 'DIAMOND HANDS', desc: 'Hold a position 24h+', unlocked: false, rarity: 'legendary' },
];
