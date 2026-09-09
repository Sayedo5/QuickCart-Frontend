import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, ScreenHeader } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { NotificationPrefs, useSettingsStore } from '@/store/useSettingsStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const ROWS: Array<{ key: keyof NotificationPrefs; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }> = [
  { key: 'orderUpdates', icon: 'bicycle-outline', title: 'Order updates', subtitle: 'Status changes, rider arrival and delivery confirmations' },
  { key: 'promotions', icon: 'pricetag-outline', title: 'Promotions & offers', subtitle: 'Deals, promo codes and new store launches near you' },
  { key: 'reminders', icon: 'alarm-outline', title: 'Reorder reminders', subtitle: 'Gentle nudges to reorder your weekly favourites' },
  { key: 'emailDigest', icon: 'mail-outline', title: 'Email digest', subtitle: 'A weekly summary of your orders and savings' },
];

export function NotificationsScreen(_: RootScreenProps<'Notifications'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const prefs = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
        <Card padded={false}>
          {ROWS.map((r, i) => (
            <View key={r.key} style={[styles.row, { borderBottomColor: colors.divider, borderBottomWidth: i < ROWS.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
              <View style={[styles.icon, { backgroundColor: prefs[r.key] ? colors.primarySoft : colors.surfaceAlt }]}>
                <Ionicons name={r.icon} size={18} color={prefs[r.key] ? palette.primary : colors.textSecondary} />
              </View>
              <View style={styles.body}>
                <AppText variant="bodyMedium">{r.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {r.subtitle}
                </AppText>
              </View>
              <Switch
                value={prefs[r.key]}
                onValueChange={(v) => {
                  haptic.selection();
                  setNotification(r.key, v);
                }}
                trackColor={{ true: palette.primary, false: colors.border }}
                thumbColor={palette.white}
                accessibilityLabel={r.title}
              />
            </View>
          ))}
        </Card>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: spacing.md, marginHorizontal: spacing.xxs }}>
          Push permissions are managed in your device settings. Order updates are strongly recommended so you never miss a delivery.
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginHorizontal: spacing.sm },
});
