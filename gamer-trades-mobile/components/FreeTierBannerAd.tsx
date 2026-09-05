import { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAuth } from '../lib/AuthContext';
import { getBannerAdUnitId } from '../lib/ads';
import { colors } from '../lib/theme';

/**
 * A small AdMob banner shown only to free-plan users -- Pro and Legend subscribers never see
 * it. Renders nothing (not even a placeholder) once the ad fails to load, so a slow/blocked
 * ad network never leaves a dead gap in the layout.
 */
export default function FreeTierBannerAd() {
  const { profile } = useAuth();
  const [failed, setFailed] = useState(false);

  const isFree = (profile?.plan ?? 'free') === 'free';
  if (!isFree || failed) return null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 6, backgroundColor: colors.bg }}>
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
