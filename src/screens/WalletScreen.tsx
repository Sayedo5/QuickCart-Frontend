import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, BottomSheet, Button, Logo, ScreenHeader } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { useWalletStore, WalletTransaction, WalletTxType } from '@/store/useWalletStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';

const TOPUP_AMOUNTS = [500, 1000, 2000, 5000];
const SOURCES: Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { key: 'JazzCash', label: 'JazzCash', icon: 'phone-portrait', color: '#C8102E' },
  { key: 'Easypaisa', label: 'Easypaisa', icon: 'phone-portrait', color: '#00A651' },
  { key: 'Card', label: 'Debit / Credit Card', icon: 'card', color: '#1A1F71' },
];

const TX_META: Record<WalletTxType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  topup: { icon: 'arrow-down-circle', color: palette.secondaryPressed },
  payment: { icon: 'bag-handle', color: palette.primary },
  refund: { icon: 'refresh-circle', color: '#7C5CFF' },
  cashback: { icon: 'gift', color: '#FFB020' },
};

export function WalletScreen(_: RootScreenProps<'Wallet'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const topUp = useWalletStore((s) => s.topUp);
  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [source, setSource] = useState(SOURCES[0].key);
  const [loading, setLoading] = useState(false);

  const confirmTopUp = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    await topUp(amount, source);
    haptic.success();
    setLoading(false);
    setSheet(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="QuickCart Wallet" />
      <FlashList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={['#1A1A1A', '#3A3A3A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <View style={styles.cardTop}>
                <AppText variant="label" color="rgba(255,255,255,0.7)">
                  AVAILABLE BALANCE
                </AppText>
                <View style={styles.logoChip}>
                  <Logo height={22} />
                </View>
              </View>
              <AppText variant="display" color={palette.white}>
                {formatCurrency(balance)}
              </AppText>
              <View style={styles.cardActions}>
                <Button title="Top up" icon="add" size="sm" fullWidth={false} onPress={() => setSheet(true)} />
                <AppText variant="caption" color="rgba(255,255,255,0.7)" style={{ marginLeft: spacing.sm, flex: 1 }}>
                  Refunds land here instantly. Use it at checkout for one-tap payment.
                </AppText>
              </View>
            </LinearGradient>
            <AppText variant="h4" style={styles.sectionTitle}>
              Recent activity
            </AppText>
          </View>
        }
        renderItem={({ item }: { item: WalletTransaction }) => {
          const meta = TX_META[item.type];
          const positive = item.amount > 0;
          return (
            <View style={[styles.row, { borderBottomColor: colors.divider }]}>
              <View style={[styles.rowIcon, { backgroundColor: `${meta.color}1A` }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={styles.rowBody}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {item.title}
                </AppText>
                <AppText variant="caption" tone="secondary" numberOfLines={1}>
                  {item.subtitle ? `${item.subtitle} · ` : ''}
                  {formatDateTime(item.createdAt)}
                </AppText>
              </View>
              <AppText variant="bodySemiBold" color={positive ? palette.secondaryPressed : colors.text}>
                {positive ? '+' : ''}
                {formatCurrency(item.amount)}
              </AppText>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Top up wallet">
        <AppText variant="bodySmMedium" tone="secondary" style={styles.label}>
          Amount
        </AppText>
        <View style={styles.amounts}>
          {TOPUP_AMOUNTS.map((a) => {
            const active = amount === a;
            return (
              <Pressable
                key={a}
                onPress={() => {
                  haptic.selection();
                  setAmount(a);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.amount, { backgroundColor: active ? palette.primary : colors.surface, borderColor: active ? palette.primary : colors.border }]}
              >
                <AppText variant="bodySemiBold" color={active ? palette.white : colors.text}>
                  {formatCurrency(a)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="bodySmMedium" tone="secondary" style={styles.label}>
          Pay with
        </AppText>
        {SOURCES.map((s) => {
          const active = source === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => {
                haptic.selection();
                setSource(s.key);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.source, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? palette.primary : colors.border }]}
            >
              <View style={[styles.sourceIcon, { backgroundColor: s.color }]}>
                <Ionicons name={s.icon} size={16} color={palette.white} />
              </View>
              <AppText variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.sm }}>
                {s.label}
              </AppText>
              {active ? <Ionicons name="checkmark-circle" size={20} color={palette.primary} /> : null}
            </Pressable>
          );
        })}
        <Button title={`Add ${formatCurrency(amount)}`} onPress={confirmTopUp} loading={loading} size="lg" style={{ marginTop: spacing.md, marginBottom: spacing.sm }} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  logoChip: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  sectionTitle: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, marginHorizontal: spacing.sm },
  label: { marginBottom: 6, marginTop: spacing.xs },
  amounts: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  amount: { flex: 1, height: 44, borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  source: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.button, borderWidth: 1, marginBottom: spacing.xs },
  sourceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
