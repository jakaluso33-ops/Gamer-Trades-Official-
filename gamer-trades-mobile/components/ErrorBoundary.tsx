import { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import { PixelText, PixelButton } from './ui';
import { colors } from '../lib/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <PixelText size={40}>🎮💥</PixelText>
          <PixelText color={colors.red} size={11} glow style={{ textAlign: 'center' }}>
            GAME OVER — APP CRASHED
          </PixelText>
          <PixelText color={colors.muted} size={6} style={{ textAlign: 'center', lineHeight: 11, maxWidth: 300 }}>
            Something went wrong. Your account and trading data are safe on the server — try again below.
          </PixelText>
          <PixelButton color={colors.blue} onPress={() => this.setState({ hasError: false })}>
            ↺ TRY AGAIN
          </PixelButton>
        </View>
      );
    }
    return this.props.children;
  }
}
