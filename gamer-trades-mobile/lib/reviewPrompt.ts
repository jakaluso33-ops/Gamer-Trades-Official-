import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const MAX_PROMPTS = 3; // Apple's own guidance caps how often this is meaningful to ask
const MIN_INTERVAL_MS = 45 * 24 * 60 * 60 * 1000; // ~45 days between asks

function countKey(userId: string): string {
  return `gt_review_prompt_count_${userId}`;
}
function lastShownKey(userId: string): string {
  return `gt_review_prompt_last_shown_${userId}`;
}

/**
 * Asks the OS to show the native App Store / Play Store in-app review sheet, but only at a
 * genuine positive moment (a winning trade close, hitting a streak milestone) -- never right
 * after a loss or a friction point. The OS itself ultimately decides whether to actually show
 * anything (both platforms silently rate-limit this regardless of what we do here), but we
 * still cap how often we even ask, so we're not hammering that budget on low-value moments.
 */
export async function maybePromptReview(userId: string): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    const [countStr, lastStr] = await Promise.all([
      AsyncStorage.getItem(countKey(userId)),
      AsyncStorage.getItem(lastShownKey(userId)),
    ]);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const last = lastStr ? parseInt(lastStr, 10) : 0;

    if (count >= MAX_PROMPTS) return;
    if (Date.now() - last < MIN_INTERVAL_MS) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(countKey(userId), String(count + 1));
    await AsyncStorage.setItem(lastShownKey(userId), String(Date.now()));
  } catch {
    // Review prompting is a nice-to-have -- never let it surface an error to the user.
  }
}
