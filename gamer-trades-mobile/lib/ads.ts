import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Ad unit IDs, wired to the values in app.json's `extra` (real AdMob account IDs go there
 * once created -- see app.json for where to swap Google's public test IDs for the real ones).
 * Always falls back to react-native-google-mobile-ads' own TestIds in __DEV__ so local/dev
 * builds never risk serving (or accidentally clicking) real ads, which AdMob policy forbids.
 */
function resolveAdUnitId(iosExtraKey: string, androidExtraKey: string, devFallback: string): string {
  if (__DEV__) return devFallback;
  const extra = Constants.expoConfig?.extra ?? {};
  const id = Platform.OS === 'ios' ? extra[iosExtraKey] : extra[androidExtraKey];
  return typeof id === 'string' && id.length > 0 ? id : devFallback;
}

export function getBannerAdUnitId(): string {
  return resolveAdUnitId('admobBannerIdIos', 'admobBannerIdAndroid', TestIds.BANNER);
}

export function getInterstitialAdUnitId(): string {
  return resolveAdUnitId('admobInterstitialIdIos', 'admobInterstitialIdAndroid', TestIds.INTERSTITIAL);
}
