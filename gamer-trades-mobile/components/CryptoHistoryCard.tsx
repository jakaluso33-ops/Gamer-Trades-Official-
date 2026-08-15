import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';
import { getCryptoProfile } from '../lib/cryptoContent';

interface Props {
  symbol: string;
}

export default function CryptoHistoryCard({ symbol }: Props) {
  const [open, setOpen] = useState(false);
  const profile = getCryptoProfile(symbol);
  if (!profile) return null;

  return (
    <Card borderColor={profile.color}>
      <Pressable onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PixelText size={22}>{profile.icon}</PixelText>
          <View>
            <BodyText color={profile.color} size={13} weight="semibold" glow>THE STORY OF {profile.name.toUpperCase()}</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>Launched {profile.launched} · {profile.founders}</BodyText>
          </View>
        </View>
        <BodyText color={colors.muted} size={16}>{open ? '▲' : '▼'}</BodyText>
      </Pressable>

      {open && (
        <View style={{ marginTop: 14 }}>
          <BodyText color={colors.gold} size={11} weight="medium" style={{ marginBottom: 8 }}>◆ HOW IT STARTED</BodyText>
          {profile.originStory.map((p, i) => (
            <BodyText key={i} color={colors.text} size={13} style={{ marginBottom: 10 }}>{p}</BodyText>
          ))}

          <BodyText color={colors.blue} size={11} weight="medium" style={{ marginTop: 4, marginBottom: 8 }}>◆ WHAT MAKES IT DIFFERENT</BodyText>
          {profile.whatMakesItDifferent.map((p, i) => (
            <BodyText key={i} color={colors.text} size={13} style={{ marginBottom: 10 }}>{p}</BodyText>
          ))}

          <View style={{ marginTop: 4, padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
            <BodyText color={profile.color} size={11} weight="medium" style={{ marginBottom: 6 }}>✦ FUN FACT</BodyText>
            <BodyText color={colors.muted} size={13}>{profile.funFact}</BodyText>
          </View>
        </View>
      )}
    </Card>
  );
}
