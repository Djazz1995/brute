/** Build + export shareable roast cards (§4.8, §15.3).
 *
 *  `buildCard` is pure (in-memory RoastCard — cards aren't persisted in v1).
 *  `exportImage` shares a captured card image via the system share sheet
 *  (IG / TikTok / X / WhatsApp all appear there). The view→image capture is a UI
 *  concern done in the screen with react-native-view-shot; this service owns the
 *  share I/O. Native-only — web falls back to a no-op (guarded by caller).
 */

import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

import type { RoastCard } from '@/models';

type BuildOpts = { goalId: string; text: string; wave: number; watermark?: boolean };

export const shareService = {
  /** Assemble a card model from a roast line (§4.8). */
  buildCard({ goalId, text, wave, watermark = true }: BuildOpts): RoastCard {
    return {
      id: `${goalId}-${wave}-${Date.now()}`,
      goalId,
      text,
      wave,
      watermark,
      createdAt: new Date().toISOString(),
    };
  },

  /** True if the platform can present a share sheet. */
  async canShare(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    return Sharing.isAvailableAsync();
  },

  /** Share an already-captured card image (local file URI) to any target app. */
  async exportImage(uri: string): Promise<void> {
    if (!(await this.canShare())) throw new Error('Sharing is not available on this device.');
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your roast',
      UTI: 'public.png',
    });
  },
};
