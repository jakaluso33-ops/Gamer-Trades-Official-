import { useEffect, useState } from 'react';
import { View, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PixelText, BodyText, PixelButton, Card } from './ui';
import { colors } from '../lib/theme';
import { DISCLAIMER_TEXT } from '../lib/legalContent';

const ACK_KEY = 'gt_disclaimer_ack_v1';

export default function DisclaimerGate() {
  const [checked, setChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ACK_KEY).then(v => {
      setAcknowledged(v === '1');
      setChecked(true);
    });
  }, []);

  const acknowledge = async () => {
    await AsyncStorage.setItem(ACK_KEY, '1');
    setAcknowledged(true);
  };

  if (!checked || acknowledged) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: '#000000dd', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Card borderColor={colors.gold} style={{ maxWidth: 420 }}>
          <PixelText color={colors.gold} size={11} glow style={{ marginBottom: 12 }}>⚠ BEFORE YOU START</PixelText>
          <BodyText color={colors.text} size={13} style={{ marginBottom: 16 }}>
            {DISCLAIMER_TEXT}
          </BodyText>
          <PixelButton color={colors.green} onPress={acknowledge}>▶ I UNDERSTAND</PixelButton>
        </Card>
      </View>
    </Modal>
  );
}
