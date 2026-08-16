import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { DetectorId, StrategySignal } from '../lib/strategyEngine';
import { DEMO_SCRIPTS } from '../lib/strategyDemoScripts';
import CandlestickChart from './CandlestickChart';

interface Props {
  id: DetectorId;
  color: string;
}

const STEP_MS = 1400;

export default function StrategyLiveDemo({ id, color }: Props) {
  const script = DEMO_SCRIPTS[id];
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(true);
  }, [id]);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStepIndex(i => {
        if (i >= script.steps.length - 1) {
          setPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return i;
        }
        return i + 1;
      });
    }, STEP_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, id]);

  const replay = () => {
    setStepIndex(0);
    setPlaying(true);
  };

  const step = script.steps[stepIndex];
  const finished = !playing && stepIndex >= script.steps.length - 1;
  const signal: StrategySignal | null = step.signal
    ? {
        strategyId: id,
        direction: step.signal.direction,
        label: step.signal.label,
        detail: step.caption,
        price: step.price,
        index: stepIndex,
        level: step.signal.level,
        level2: step.signal.level2,
      }
    : null;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <BodyText color={color} size={12} weight="semibold">▶ LIVE DEMO — WATCH IT PLAY OUT</BodyText>
        <BodyText color={colors.muted} size={10}>{stepIndex + 1}/{script.steps.length}</BodyText>
      </View>

      <CandlestickChart
        symbol={`demo:${id}`}
        basePrice={script.basePrice}
        livePrice={step.price}
        tickMs={STEP_MS}
        height={170}
        signal={signal}
      />

      <View style={{ marginTop: 10, padding: 10, backgroundColor: colors.bg, borderWidth: 2, borderColor: color, minHeight: 54, justifyContent: 'center' }}>
        <BodyText color={colors.text} size={12}>{step.caption}</BodyText>
      </View>

      {finished && (
        <PixelButton color={color} onPress={replay} style={{ marginTop: 10, paddingVertical: 12 }}>
          ↻ REPLAY DEMO
        </PixelButton>
      )}
    </View>
  );
}
