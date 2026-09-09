import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const canHaptic = Platform.OS !== 'web';

export const haptic = {
  light: () => {
    if (!canHaptic) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    if (!canHaptic) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  selection: () => {
    if (!canHaptic) return;
    Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    if (!canHaptic) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (!canHaptic) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
