import { Pressable, PressableProps, StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, font } from '../lib/theme';

export function Screen({ children, style }: ViewProps) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function PixelText({
  children,
  color = colors.text,
  size = 8,
  glow = false,
  style,
  ...rest
}: { children: React.ReactNode; color?: string; size?: number; glow?: boolean } & React.ComponentProps<typeof Text>) {
  return (
    <Text
      style={[
        { fontFamily: font.pixel, color, fontSize: size, lineHeight: size * 1.7 },
        glow && { textShadowColor: color, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style, borderColor = colors.border }: ViewProps & { borderColor?: string }) {
  return <View style={[styles.card, { borderColor }, style]}>{children}</View>;
}

export function PixelButton({
  children,
  color = colors.cyan,
  onPress,
  style,
  disabled,
  ...rest
}: { children: React.ReactNode; color?: string } & PressableProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { borderColor: color, backgroundColor: `${color}22`, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style as object,
      ]}
      {...rest}
    >
      <PixelText color={color} size={8} glow>{children}</PixelText>
    </Pressable>
  );
}

export function Avatar({ emoji = '🎮', size = 36, borderColor = colors.blue }: { emoji?: string; size?: number; borderColor?: string }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: 4, backgroundColor: '#001133',
        borderWidth: 2, borderColor, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderRadius: 2,
    padding: 14,
  },
  button: {
    borderWidth: 2,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
