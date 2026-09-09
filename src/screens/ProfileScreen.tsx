import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, BottomSheet, Card, IconButton, Logo, ScreenHeader } from '@/components';
import { RootStackParamList } from '@/navigation/types';
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { ThemeMode, useSettingsStore } from '@/store/useSettingsStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useWalletStore } from '@/store/useWalletStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  last?: boolean;
}

function Row({ icon, label, value, onPress, tone = 'default', last }: RowProps) {
  const { colors, palette: p } = useTheme();
  const color = tone === 'danger' ? p.error : colors.text;
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tone === 'danger' ? colors.errorSoft : colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={tone === 'danger' ? p.error : colors.textSecondary} />
      </View>
      <AppText variant="bodyMedium" color={color} style={styles.rowLabel}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="bodySm" tone="secondary" style={{ marginRight: 4 }}>
          {value}
        </AppText>
      ) : null}
      {tone !== 'danger' ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

const THEME_OPTIONS: Array<{ key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'system', label: 'System default', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const orders = useOrderStore((s) => s.orders);
  const addresses = useAddressStore((s) => s.addresses);
  const methods = usePaymentStore((s) => s.methods);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const clearCart = useCartStore((s) => s.clear);
  const walletBalance = useWalletStore((s) => s.balance);
  const favouriteCount = useFavouritesStore((s) => s.storeIds.length);
  const [themeSheet, setThemeSheet] = useState(false);

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to verify your phone number to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          clearCart();
          signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);

  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const memberSince = user ? new Date(user.memberSince).getFullYear() : '';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Profile" showBack={false} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View>
              <Image source={{ uri: user?.avatar }} style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]} cachePolicy="memory-disk" />
              <View style={[styles.verified, { backgroundColor: palette.secondary, borderColor: colors.surface }]}>
                <Ionicons name="checkmark" size={10} color={palette.white} />
              </View>
            </View>
            <View style={styles.userBody}>
              <AppText variant="h3" numberOfLines={1}>
                {user?.name}
              </AppText>
              <AppText variant="bodySm" tone="secondary" numberOfLines={1}>
                {user?.email}
              </AppText>
              <AppText variant="caption" tone="tertiary">
                {user?.dialCode} {user?.phone} · Member since {memberSince}
              </AppText>
            </View>
            <IconButton icon="create-outline" variant="soft" onPress={() => navigation.navigate('EditProfile')} accessibilityLabel="Edit profile" />
          </View>
          <View style={[styles.stats, { borderTopColor: colors.divider }]}>
            <View style={styles.stat}>
              <AppText variant="h3">{delivered}</AppText>
              <AppText variant="caption" tone="secondary">
                Orders
              </AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <AppText variant="h3">{addresses.length}</AppText>
              <AppText variant="caption" tone="secondary">
                Addresses
              </AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <Pressable style={styles.stat} onPress={() => navigation.navigate('Wallet')} accessibilityRole="button" accessibilityLabel="Open wallet">
              <AppText variant="h3" tone="brand">
                {formatCurrency(walletBalance)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                Wallet
              </AppText>
            </Pressable>
          </View>
        </Card>

        <AppText variant="label" tone="tertiary" style={styles.groupLabel}>
          ACCOUNT
        </AppText>
        <Card padded={false} style={styles.group}>
          <Row icon="wallet-outline" label="QuickCart Wallet" value={formatCurrency(walletBalance)} onPress={() => navigation.navigate('Wallet')} />
          <Row icon="heart-outline" label="Favourite Stores" value={`${favouriteCount} saved`} onPress={() => navigation.navigate('Favourites')} />
          <Row icon="pricetags-outline" label="Offers & Promos" onPress={() => navigation.navigate('Offers')} />
          <Row icon="location-outline" label="Addresses" value={`${addresses.length} saved`} onPress={() => navigation.navigate('Addresses')} />
          <Row icon="card-outline" label="Payment Methods" value={`${methods.length} methods`} onPress={() => navigation.navigate('PaymentMethods')} />
          <Row icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
          <Row icon="color-palette-outline" label="Appearance" value={THEME_OPTIONS.find((t) => t.key === themeMode)?.label} onPress={() => setThemeSheet(true)} last />
        </Card>

        <AppText variant="label" tone="tertiary" style={styles.groupLabel}>
          SUPPORT
        </AppText>
        <Card padded={false} style={styles.group}>
          <Row icon="help-circle-outline" label="Help & FAQ" onPress={() => navigation.navigate('Help')} />
          <Row icon="document-text-outline" label="Terms & Privacy" onPress={() => navigation.navigate('Help')} />
          <Row icon="log-out-outline" label="Logout" tone="danger" onPress={confirmLogout} last />
        </Card>

        <View style={styles.footer}>
          <Logo height={28} />
          <AppText variant="caption" tone="tertiary" align="center" style={styles.version}>
            QuickCart v1.0.0 · Made with ❤️ in Lahore
          </AppText>
        </View>
      </ScrollView>

      <BottomSheet visible={themeSheet} onClose={() => setThemeSheet(false)} title="Appearance">
        {THEME_OPTIONS.map((opt) => {
          const selected = themeMode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                haptic.selection();
                setThemeMode(opt.key);
                setThemeSheet(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [styles.themeRow, { backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent' }]}
            >
              <Ionicons name={opt.icon} size={20} color={selected ? palette.primary : colors.textSecondary} />
              <AppText variant="bodyMedium" color={selected ? palette.primary : colors.text} style={styles.themeLabel}>
                {opt.label}
              </AppText>
              {selected ? <Ionicons name="checkmark-circle" size={20} color={palette.primary} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  userCard: { marginBottom: spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  verified: { position: 'absolute', right: 0, bottom: 0, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  userBody: { flex: 1, marginHorizontal: spacing.sm },
  stats: { flexDirection: 'row', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth },
  groupLabel: { marginBottom: spacing.xs, marginLeft: spacing.xxs },
  group: { marginBottom: spacing.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rowIcon: { width: 36, height: 36, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, marginLeft: spacing.sm },
  footer: { alignItems: 'center', marginTop: spacing.xs },
  version: { marginTop: spacing.xs },
  themeRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.button, marginBottom: 4 },
  themeLabel: { flex: 1, marginLeft: spacing.sm },
});
