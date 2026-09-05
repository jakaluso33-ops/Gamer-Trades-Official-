import { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';

export type TradeOutcome = 'take_profit' | 'stop_loss';

const DISPLAY_MS = 1800;

const CONFIG: Record<TradeOutcome, { label: string; color: string; sub: string }> = {
  take_profit: { label: 'TAKE PROFIT', color: colors.green, sub: '✓ TARGET HIT' },
  stop_loss: { label: 'GAME OVER', color: colors.red, sub: '⛔ STOP LOSS HIT' },
};

/**
 * A full-screen, retro-video-game-styled banner flashed whenever a trade auto-closes on its
 * stop-loss or take-profit level -- big pixel-font text (the same PressStart2P font used
 * everywhere else in the app), green "TAKE PROFIT" on a win, red "GAME OVER" on a loss,
 * punchy scale-in/fade-out, auto-dismisses itself after a couple seconds.
 */
export default function TradeOutcomeBanner({ outcome, onDone }: { outcome: TradeOutcome | null; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!outcome) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.delay(DISPLAY_MS),
      Animated.timing(opacity, { toValue: 0, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  if (!outcome) return null;
  const { label, color, sub } = CONFIG[outcome];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', opacity },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <PixelText
            color={color}
            size={26}
            glow
            style={{ textAlign: 'center', textShadowRadius: 20 }}
          >
            {label}
          </PixelText>
          <BodyText color={color} size={14} weight="semibold" style={{ marginTop: 14, textAlign: 'center', letterSpacing: 1 }}>
            {sub}
          </BodyText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
