import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Button, Card, Divider, PriceRow, RadioCard, ScreenHeader, SuccessOverlay } from '@/components';
import { Order } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { selectSelectedAddress, useAddressStore } from '@/store/useAddressStore';
import { useCartStore } from '@/store/useCartStore';
import { useCartQuote } from '@/hooks/useCartQuote';
import { useOrderStore } from '@/store/useOrderStore';
import { selectSelectedMethod, usePaymentStore } from '@/store/usePaymentStore';
import { useWalletStore } from '@/store/useWalletStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency, pluralize } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { PAYMENT_ICON, paymentSubtitle } from './PaymentMethodsScreen';

const ADDRESS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = { Home: 'home', Work: 'briefcase', Other: 'location' };

export function CheckoutScreen({ navigation }: RootScreenProps<'Checkout'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddress = useAddressStore(selectSelectedAddress);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const methods = usePaymentStore((s) => s.methods);
  const selectedMethod = usePaymentStore(selectSelectedMethod);
  const selectMethod = usePaymentStore((s) => s.selectMethod);
  const items = useCartStore((s) => s.items);
  const store = useCartStore((s) => s.store);
  const promo = useCartStore((s) => s.promo);
  const clearCart = useCartStore((s) => s.clear);
  const addOrder = useOrderStore((s) => s.addOrder);
  const walletBalance = useWalletStore((s) => s.balance);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const chevron = useSharedValue(0);

  // The server owns the numbers; the app only renders them.
  const { quote: totals, loading: quoting, error: quoteError, issues } = useCartQuote();
  const canPlace = !!selectedAddress && !!selectedMethod && items.length > 0 && !!store && issues.length === 0 && !quoting;

  const toggleSummary = () => {
    haptic.selection();
    setSummaryOpen((o) => !o);
    chevron.value = withTiming(summaryOpen ? 0 : 1, { duration: 200 });
  };
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${chevron.value * 180}deg` }] }));

  const placeOrder = async () => {
    if (!canPlace || !store || !selectedAddress || !selectedMethod) return;
    if (selectedMethod.type === 'wallet' && walletBalance < totals.total) {
      haptic.error();
      Alert.alert(
        'Insufficient wallet balance',
        `Your wallet has ${formatCurrency(walletBalance)} but this order is ${formatCurrency(totals.total)}. Top up or choose another payment method.`,
        [
          { text: 'Top up', onPress: () => navigation.navigate('Wallet') },
          { text: 'Choose another', style: 'cancel' },
        ],
      );
      return;
    }
    setPlacing(true);
    try {
      // The backend is the source of truth for totals and the order id; the snapshot is
      // only used by the mock implementation to build the order without a server.
      const order: Order = await api.placeOrder({
        storeId: store.id,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
        promoCode: promo?.code,
        addressId: selectedAddress.id,
        paymentMethodId: selectedMethod.id,
      });
      // The backend debits the wallet when the order is placed; re-sync the balance.
      if (selectedMethod.type === 'wallet') useWalletStore.getState().sync();
      addOrder(order);
      clearCart();
      setPlacedOrderId(order.id);
    } catch (e) {
      haptic.error();
      const err = toApiError(e);
      if (err.code === 'PRICE_CHANGED' || err.code === 'OUT_OF_STOCK') {
        Alert.alert('Your cart changed', `${err.message} Please review your cart before placing the order.`, [
          { text: 'Review cart', onPress: () => navigation.navigate('Main', { screen: 'CartTab' }) },
        ]);
      } else {
        Alert.alert('Could not place order', err.message);
      }
    } finally {
      setPlacing(false);
    }
  };

  const goToTracking = useCallback(() => {
    if (!placedOrderId) return;
    navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'OrderTracking', params: { orderId: placedOrderId } }] });
  }, [navigation, placedOrderId]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Checkout" subtitle={store ? `From ${store.name}` : undefined} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Address */}
        <View style={styles.sectionHeader}>
          <AppText variant="h4">Delivery address</AppText>
          <Pressable onPress={() => navigation.navigate('AddAddress')} hitSlop={8} accessibilityRole="button" style={styles.linkRow}>
            <Ionicons name="add" size={16} color={palette.primary} />
            <AppText variant="bodySmSemiBold" tone="brand">
              Add New Address
            </AppText>
          </Pressable>
        </View>
        {addresses.map((a) => (
          <RadioCard
            key={a.id}
            title={a.label}
            subtitle={`${a.street}${a.apartment ? `, ${a.apartment}` : ''} · ${a.city}`}
            icon={ADDRESS_ICON[a.label] ?? 'location'}
            selected={a.id === selectedAddress?.id}
            onPress={() => selectAddress(a.id)}
            badge={a.isDefault ? 'Default' : undefined}
          />
        ))}

        {/* Payment */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <AppText variant="h4">Payment method</AppText>
          <Pressable onPress={() => navigation.navigate('PaymentMethods', { selectMode: true })} hitSlop={8} accessibilityRole="button">
            <AppText variant="bodySmSemiBold" tone="brand">
              Manage
            </AppText>
          </Pressable>
        </View>
        {methods.map((m) => (
          <RadioCard
            key={m.id}
            title={m.label}
            subtitle={paymentSubtitle(m, walletBalance)}
            icon={PAYMENT_ICON[m.type]}
            selected={m.id === selectedMethod?.id}
            onPress={() => selectMethod(m.id)}
            badge={m.type === 'wallet' && walletBalance < totals.total ? 'Low balance' : undefined}
          />
        ))}

        {/* Summary */}
        <Card style={styles.summaryCard} padded={false}>
          <Pressable onPress={toggleSummary} style={styles.summaryHeader} accessibilityRole="button" accessibilityState={{ expanded: summaryOpen }}>
            {store ? <Image source={{ uri: store.image }} style={styles.summaryImage} contentFit="cover" cachePolicy="memory-disk" /> : null}
            <View style={styles.summaryBody}>
              <AppText variant="bodySemiBold">Order summary</AppText>
              <AppText variant="caption" tone="secondary">
                {pluralize(totals.itemCount, 'item')} · {formatCurrency(totals.total)}
              </AppText>
            </View>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </Animated.View>
          </Pressable>
          {summaryOpen ? (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} layout={LinearTransition} style={styles.summaryContent}>
              <Divider />
              {items.map((i) => (
                <View key={i.product.id} style={styles.summaryItem}>
                  <View style={[styles.qty, { backgroundColor: colors.surfaceAlt }]}>
                    <AppText variant="captionMedium">{i.quantity}x</AppText>
                  </View>
                  <AppText variant="bodySm" style={styles.summaryName} numberOfLines={1}>
                    {i.product.name}
                  </AppText>
                  <AppText variant="bodySmMedium">{formatCurrency(i.product.price * i.quantity)}</AppText>
                </View>
              ))}
              <Divider />
              <PriceRow label="Subtotal" value={totals.subtotal} />
              <PriceRow label="Delivery fee" value={totals.deliveryFee} freeLabel="Free" />
              <PriceRow label="Service fee" value={totals.serviceFee} />
              <PriceRow label={totals.taxLabel} value={totals.tax} />
              {totals.discount > 0 ? <PriceRow label={`Discount (${promo?.code})`} value={totals.discount} tone="success" /> : null}
              <Divider />
              <PriceRow label="Total" value={totals.total} bold />
            </Animated.View>
          ) : null}
        </Card>

        {quoteError ? (
          <View style={[styles.note, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.onWarningSoft} />
            <AppText variant="caption" color={colors.onWarningSoft} style={styles.noteText}>
              We could not refresh your total just now. It is confirmed by our servers when you place the order.
            </AppText>
          </View>
        ) : null}

        <View style={[styles.note, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary" style={styles.noteText}>
            Delivering to {selectedAddress?.label ?? 'your address'}. You'll get live updates as the store confirms and your rider heads over.
          </AppText>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.totalCol}>
          <AppText variant="caption" tone="secondary">
            Total
          </AppText>
          <AppText variant="h3">{formatCurrency(totals.total)}</AppText>
        </View>
        <View style={styles.ctaCol}>
          <Button title="Place Order" onPress={placeOrder} disabled={!canPlace} loading={placing} icon="bag-check-outline" />
        </View>
      </View>

      <SuccessOverlay visible={!!placedOrderId} title="Order placed!" subtitle="Your order is confirmed. Let's track it live." onDone={goToTracking} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  summaryCard: { marginTop: spacing.md },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  summaryImage: { width: 44, height: 44, borderRadius: radius.button, backgroundColor: '#EEE' },
  summaryBody: { flex: 1, marginHorizontal: spacing.sm },
  summaryContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  qty: { borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginRight: spacing.xs },
  summaryName: { flex: 1, marginRight: spacing.sm },
  note: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, padding: spacing.sm, marginTop: spacing.md },
  noteText: { flex: 1, marginLeft: spacing.xs },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  totalCol: { marginRight: spacing.md },
  ctaCol: { flex: 1 },
});
