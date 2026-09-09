import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Button, EmptyState, ScreenHeader, Skeleton } from '@/components';
import { Promo } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { computeTotals, useCartStore } from '@/store/useCartStore';
import { palette, radius, shadow, spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

/** Presentation metadata per coupon type — the coupons themselves come from the API. */
const TYPE_META: Record<Promo['type'], { icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  percent: { icon: 'pricetag', accent: '#FF6B35' },
  fixed: { icon: 'wallet', accent: '#7C5CFF' },
  free_delivery: { icon: 'bicycle', accent: '#2EC4B6' },
};

export function OffersScreen({ navigation }: RootScreenProps<'Offers'>) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const store = useCartStore((s) => s.store);
  const activePromo = useCartStore((s) => s.promo);
  const applyPromo = useCartStore((s) => s.applyPromo);

  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const subtotal = computeTotals(items, null, store?.deliveryFee ?? 0).subtotal;

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      setPromos(await api.getPromos());
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const apply = async (promo: Promo) => {
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add items from any store first, then apply this code at checkout.', [
        { text: 'Browse stores', onPress: () => navigation.navigate('Main', { screen: 'HomeTab' }) },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    setApplying(promo.code);
    try {
      const validated = await api.validatePromo(promo.code, subtotal);
      applyPromo(validated);
      haptic.success();
      Alert.alert('Code applied', `${promo.code} is now active on your cart.`, [
        { text: 'View cart', onPress: () => navigation.navigate('Main', { screen: 'CartTab' }) },
        { text: 'Keep browsing', style: 'cancel' },
      ]);
    } catch (e) {
      haptic.error();
      Alert.alert('Cannot apply yet', toApiError(e).message);
    } finally {
      setApplying(null);
    }
  };

  const header = (
    <LinearGradient colors={[palette.primary, '#FF8F5E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroText}>
        <AppText variant="label" color="rgba(255,255,255,0.85)">
          THIS WEEK IN LAHORE
        </AppText>
        <AppText variant="h2" color={palette.white}>
          Save on every order
        </AppText>
        <AppText variant="bodySm" color="rgba(255,255,255,0.9)">
          Apply a code below or enter it in your cart.
        </AppText>
      </View>
      <Ionicons name="pricetags" size={48} color="rgba(255,255,255,0.95)" />
    </LinearGradient>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Offers & Promos" />
      {loading && promos.length === 0 ? (
        <View style={styles.loading}>
          <Skeleton height={110} borderRadius={radius.card} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} borderRadius={radius.card} style={styles.loadingCard} />
          ))}
        </View>
      ) : error && promos.length === 0 ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load offers" subtitle={error} actionLabel="Try again" onAction={() => load('initial')} />
      ) : promos.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title="No active offers"
          subtitle="Check back soon — new promo codes are added every week."
          actionLabel="Browse stores"
          onAction={() => navigation.navigate('Main', { screen: 'HomeTab' })}
        />
      ) : (
        <FlashList
          data={promos}
          keyExtractor={(p) => p.code}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={header}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={palette.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type];
            const isActive = activePromo?.code === item.code;
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isActive ? palette.secondary : colors.border }, !isDark ? shadow.soft : null]}>
                <View style={[styles.iconWrap, { backgroundColor: `${meta.accent}1A` }]}>
                  <Ionicons name={meta.icon} size={24} color={meta.accent} />
                </View>
                <View style={styles.body}>
                  <AppText variant="bodySemiBold" numberOfLines={2}>
                    {item.description}
                  </AppText>
                  <View style={styles.codeRow}>
                    <Pressable
                      onPress={() => {
                        haptic.selection();
                        Alert.alert('Promo code', item.code);
                      }}
                      style={[styles.code, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                      accessibilityLabel={`Promo code ${item.code}`}
                    >
                      <Ionicons name="ticket-outline" size={14} color={colors.textSecondary} />
                      <AppText variant="label" style={styles.codeText}>
                        {item.code}
                      </AppText>
                    </Pressable>
                    {item.minOrder ? (
                      <AppText variant="caption" tone="tertiary">
                        Min {formatCurrency(item.minOrder)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                <Button
                  title={isActive ? 'Applied' : 'Apply'}
                  size="sm"
                  fullWidth={false}
                  variant={isActive ? 'secondary' : 'outline'}
                  icon={isActive ? 'checkmark' : undefined}
                  loading={applying === item.code}
                  disabled={isActive}
                  onPress={() => apply(item)}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { padding: spacing.md },
  loadingCard: { marginTop: spacing.sm },
  hero: { borderRadius: radius.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  heroText: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.card, borderWidth: 1.5, marginBottom: spacing.sm },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginHorizontal: spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: spacing.xs },
  code: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xs, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 8, paddingVertical: 3 },
  codeText: { marginLeft: 4 },
});
