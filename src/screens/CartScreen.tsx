import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Button, Card, Divider, EmptyState, PriceRow, QuantityStepper, ScreenHeader } from '@/components';
import { CartItem } from '@/data/types';
import { RootStackParamList } from '@/navigation/types';
import { api, ApiError } from '@/services/api';
import { selectSelectedAddress, useAddressStore } from '@/store/useAddressStore';
import { useCartStore } from '@/store/useCartStore';
import { useCartQuote } from '@/hooks/useCartQuote';
import { fonts, palette, radius, shadow, spacing, useTheme } from '@/theme';
import { formatCurrency, pluralize } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function CartRow({ item, onIncrement, onDecrement, onDelete }: { item: CartItem; onIncrement: () => void; onDecrement: () => void; onDelete: () => void }) {
  const { colors } = useTheme();
  const renderRightActions = () => (
    <Pressable onPress={onDelete} style={[styles.deleteAction, { backgroundColor: palette.error }]} accessibilityRole="button" accessibilityLabel={`Remove ${item.product.name}`}>
      <Ionicons name="trash" size={22} color={palette.white} />
      <AppText variant="captionMedium" color={palette.white}>
        Delete
      </AppText>
    </Pressable>
  );
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify().damping(20)}>
      <ReanimatedSwipeable renderRightActions={renderRightActions} rightThreshold={56} overshootRight={false} friction={2} containerStyle={{ backgroundColor: colors.background }}>
        <View style={[styles.row, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
          <Image source={{ uri: item.product.image }} style={[styles.rowImage, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.rowBody}>
            <AppText variant="bodySemiBold" numberOfLines={2}>
              {item.product.name}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {formatCurrency(item.product.price)} each{item.product.unit ? ` · ${item.product.unit}` : ''}
            </AppText>
            <View style={styles.rowBottom}>
              <QuantityStepper quantity={item.quantity} onIncrement={onIncrement} onDecrement={onDecrement} />
              <AppText variant="bodySemiBold">{formatCurrency(item.product.price * item.quantity)}</AppText>
            </View>
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const store = useCartStore((s) => s.store);
  const promo = useCartStore((s) => s.promo);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);
  const clear = useCartStore((s) => s.clear);
  const address = useAddressStore(selectSelectedAddress);

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Totals come from the backend so prices, fees, tax and discounts are always authoritative.
  const { quote: totals, loading: quoting, confirmed, error: quoteError, issues } = useCartQuote();
  const belowMin = !!store && totals.subtotal < totals.minOrder;
  const canCheckout = !!address && !belowMin && items.length > 0 && issues.length === 0;

  const onApplyPromo = async () => {
    if (!promoInput.trim() || promoLoading) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await api.validatePromo(promoInput, totals.subtotal);
      applyPromo(res);
      haptic.success();
      setPromoInput('');
    } catch (e) {
      haptic.error();
      setPromoError(e instanceof ApiError ? e.message : 'Could not apply promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const confirmClear = () =>
    Alert.alert('Clear cart?', 'All items will be removed from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clear() },
    ]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartRow
        item={item}
        onIncrement={() => increment(item.product.id)}
        onDecrement={() => decrement(item.product.id)}
        onDelete={() => {
          haptic.medium();
          removeItem(item.product.id);
        }}
      />
    ),
    [increment, decrement, removeItem],
  );

  if (items.length === 0 || !store) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Cart" showBack={false} />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Looks like you haven't added anything yet. Explore stores near you."
            actionLabel="Browse stores"
            onAction={() => navigation.navigate('Main', { screen: 'HomeTab' })}
          />
        </View>
      </View>
    );
  }

  const header = (
    <Pressable
      onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
      style={({ pressed }) => [styles.storeRow, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }, !isDark ? shadow.soft : null]}
      accessibilityRole="button"
      accessibilityLabel={`Add more items from ${store.name}`}
    >
      <Image source={{ uri: store.image }} style={styles.storeImage} contentFit="cover" cachePolicy="memory-disk" />
      <View style={styles.storeBody}>
        <AppText variant="bodySemiBold" numberOfLines={1}>
          {store.name}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {pluralize(totals.itemCount, 'item')} · Min order {formatCurrency(totals.minOrder)}
        </AppText>
      </View>
      <View style={styles.addMore}>
        <Ionicons name="add" size={16} color={palette.primary} />
        <AppText variant="bodySmSemiBold" tone="brand">
          Add more
        </AppText>
      </View>
    </Pressable>
  );

  const footer = (
    <View style={styles.footer}>
      {/* Promo code */}
      <Card style={styles.section}>
        <AppText variant="h4" style={styles.sectionTitle}>
          Promo code
        </AppText>
        {promo ? (
          <View style={[styles.promoApplied, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.onSecondarySoft} />
            <View style={styles.promoAppliedBody}>
              <AppText variant="bodySemiBold" color={colors.onSecondarySoft}>
                {promo.code} applied
              </AppText>
              <AppText variant="caption" color={colors.onSecondarySoft}>
                {promo.description}
              </AppText>
            </View>
            <Pressable onPress={() => { haptic.selection(); removePromo(); }} hitSlop={8} accessibilityLabel="Remove promo">
              <Ionicons name="close-circle" size={20} color={colors.onSecondarySoft} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.promoRow}>
              <View style={[styles.promoInput, { backgroundColor: colors.inputBackground, borderColor: promoError ? palette.error : colors.border }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  value={promoInput}
                  onChangeText={(t) => {
                    setPromoError(null);
                    setPromoInput(t.toUpperCase());
                  }}
                  placeholder="Enter code"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={onApplyPromo}
                  style={[styles.promoField, { color: colors.text }]}
                />
              </View>
              <Button title="Apply" onPress={onApplyPromo} loading={promoLoading} disabled={!promoInput.trim()} fullWidth={false} style={styles.applyBtn} />
            </View>
            {promoError ? (
              <AppText variant="caption" tone="error" style={styles.promoError}>
                {promoError}
              </AppText>
            ) : (
              <AppText variant="caption" tone="tertiary" style={styles.promoError}>
                Try WELCOME20, FREESHIP or SAVE100 — see all in Offers
              </AppText>
            )}
          </>
        )}
      </Card>

      {/* Address */}
      <Pressable onPress={() => navigation.navigate('Addresses', { selectMode: true })} accessibilityRole="button" accessibilityLabel="Change delivery address">
        {({ pressed }) => (
          <Card style={[styles.section, styles.addressCard, { opacity: pressed ? 0.85 : 1, borderColor: address ? colors.border : palette.warning, borderWidth: address ? 0 : 1.5 }]}>
            <View style={[styles.addressIcon, { backgroundColor: address ? colors.primarySoft : colors.warningSoft }]}>
              <Ionicons name={address ? 'location' : 'alert-circle'} size={20} color={address ? palette.primary : palette.warning} />
            </View>
            <View style={styles.addressBody}>
              <AppText variant="bodySemiBold">{address ? `Deliver to ${address.label}` : 'Select a delivery address'}</AppText>
              <AppText variant="caption" tone="secondary" numberOfLines={1}>
                {address ? `${address.street}${address.apartment ? `, ${address.apartment}` : ''}` : 'Required to proceed to checkout'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Card>
        )}
      </Pressable>

      {issues.length > 0 ? (
        <Card style={[styles.section, { borderColor: palette.warning, borderWidth: 1.5 }]}>
          <View style={styles.noticeRow}>
            <Ionicons name="alert-circle" size={18} color={palette.warning} />
            <AppText variant="bodySmMedium" style={styles.noticeText}>
              {issues.some((i) => i.type === 'price_changed')
                ? 'Some prices changed since you added these items. The new total is shown below.'
                : 'Some items are no longer available. Remove them to continue.'}
            </AppText>
          </View>
        </Card>
      ) : null}

      {/* Breakdown */}
      <Card style={styles.section}>
        <AppText variant="h4" style={styles.sectionTitle}>
          Price details
        </AppText>
        <PriceRow label={`Subtotal (${pluralize(totals.itemCount, 'item')})`} value={totals.subtotal} />
        <PriceRow label="Delivery fee" value={totals.deliveryFee} freeLabel="Free" />
        <PriceRow label="Service fee" value={totals.serviceFee} />
        <PriceRow label={totals.taxLabel} value={totals.tax} />
        {totals.discount > 0 ? <PriceRow label={`Discount (${promo?.code})`} value={totals.discount} tone="success" /> : null}
        <Divider />
        <PriceRow label="Total" value={totals.total} bold />
        {quoting ? (
          <AppText variant="caption" tone="tertiary" style={styles.quoteNote}>
            Updating totals…
          </AppText>
        ) : quoteError ? (
          <AppText variant="caption" tone="error" style={styles.quoteNote}>
            Showing an estimate — we could not reach the server. Totals are confirmed at checkout.
          </AppText>
        ) : confirmed ? (
          <AppText variant="caption" tone="tertiary" style={styles.quoteNote}>
            Totals confirmed by QuickCart.
          </AppText>
        ) : null}
      </Card>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Cart"
        showBack={false}
        right={
          <Pressable onPress={confirmClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear cart">
            <AppText variant="bodySmSemiBold" tone="error">
              Clear
            </AppText>
          </Pressable>
        }
      />
      <FlashList
        data={items}
        keyExtractor={(i) => i.product.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.totalCol}>
          <AppText variant="caption" tone="secondary">
            Total
          </AppText>
          <AppText variant="h3">{formatCurrency(totals.total)}</AppText>
        </View>
        <View style={styles.ctaCol}>
          <Button title="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} disabled={!canCheckout} icon="arrow-forward" iconPosition="right" />
          {belowMin ? (
            <AppText variant="caption" tone="error" align="center" style={styles.ctaHint}>
              Add {formatCurrency(totals.minOrder - totals.subtotal)} more to reach the minimum
            </AppText>
          ) : !address ? (
            <AppText variant="caption" tone="tertiary" align="center" style={styles.ctaHint}>
              Select an address to continue
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  storeRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.md, padding: spacing.sm, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
  storeImage: { width: 48, height: 48, borderRadius: radius.button, backgroundColor: '#EEE' },
  storeBody: { flex: 1, marginHorizontal: spacing.sm },
  addMore: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  rowImage: { width: 72, height: 72, borderRadius: radius.button },
  rowBody: { flex: 1, marginLeft: spacing.sm, justifyContent: 'space-between' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  deleteAction: { width: 88, alignItems: 'center', justifyContent: 'center', marginVertical: 0 },
  footer: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  promoInput: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: radius.button, borderWidth: 1, paddingHorizontal: spacing.sm, marginRight: spacing.xs },
  promoField: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, marginLeft: spacing.xs, letterSpacing: 1, height: '100%' },
  applyBtn: { paddingHorizontal: spacing.lg },
  promoError: { marginTop: 6 },
  promoApplied: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, padding: spacing.sm },
  promoAppliedBody: { flex: 1, marginHorizontal: spacing.xs },
  addressCard: { flexDirection: 'row', alignItems: 'center' },
  addressIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addressBody: { flex: 1, marginHorizontal: spacing.sm },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  totalCol: { marginRight: spacing.md },
  ctaCol: { flex: 1 },
  ctaHint: { marginTop: 4 },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  noticeText: { flex: 1, marginLeft: spacing.xs },
  quoteNote: { marginTop: spacing.xs },
});
