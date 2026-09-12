import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Badge, Button, Card, Divider, PriceRow, ScreenHeader } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { selectTaxLabel, useAppConfigStore } from '@/store/useAppConfigStore';
import { STATUS_STEPS, statusIndex, useOrderStore } from '@/store/useOrderStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency, formatDateTime, formatTime } from '@/utils/format';
import { useReorder } from './OrderHistoryScreen';
import { PAYMENT_ICON } from './PaymentMethodsScreen';

export function OrderDetailScreen({ navigation, route }: RootScreenProps<'OrderDetail'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === route.params.orderId));
  const taxLabel = useAppConfigStore(selectTaxLabel);
  const reorder = useReorder();

  if (!order) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Order" />
        <AppText variant="body" tone="secondary" align="center" style={{ marginTop: spacing.xl }}>
          Order not found.
        </AppText>
      </View>
    );
  }

  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const timeline: Array<{ label: string; at?: string }> = [
    { label: 'Order placed', at: order.timeline.placedAt },
    { label: 'Preparing', at: order.timeline.preparingAt },
    { label: 'Picked up by rider', at: order.timeline.pickedUpAt },
    { label: 'Delivered', at: order.timeline.deliveredAt },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={order.orderNumber} subtitle={formatDateTime(order.createdAt)} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.storeRow}>
            <Image source={{ uri: order.storeImage }} style={styles.storeImage} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.storeBody}>
              <AppText variant="h4" numberOfLines={1}>
                {order.storeName}
              </AppText>
              <Badge label={STATUS_STEPS[statusIndex(order.status)]?.label ?? 'Cancelled'} tone={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'brand'} style={{ marginTop: 4 }} />
            </View>
          </View>
          {isActive ? <Button title="Track order" icon="navigate" variant="secondary" onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })} style={{ marginTop: spacing.md }} /> : null}
        </Card>

        <Card style={styles.card}>
          <AppText variant="h4" style={styles.sectionTitle}>
            Items
          </AppText>
          {order.items.map((i) => (
            <View key={i.product.id} style={styles.itemRow}>
              <Image source={{ uri: i.product.image }} style={[styles.itemImage, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" cachePolicy="memory-disk" />
              <View style={styles.itemBody}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {i.product.name}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {i.quantity} × {formatCurrency(i.product.price)}
                </AppText>
              </View>
              <AppText variant="bodySemiBold">{formatCurrency(i.product.price * i.quantity)}</AppText>
            </View>
          ))}
          <Divider />
          <PriceRow label="Subtotal" value={order.subtotal} />
          <PriceRow label="Delivery fee" value={order.deliveryFee} freeLabel="Free" />
          <PriceRow label="Service fee" value={order.serviceFee} />
          <PriceRow label={taxLabel} value={order.tax} />
          {order.discount > 0 ? <PriceRow label={`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`} value={order.discount} tone="success" /> : null}
          <Divider />
          <PriceRow label="Total" value={order.total} bold />
        </Card>

        <Card style={styles.card}>
          <AppText variant="h4" style={styles.sectionTitle}>
            Timeline
          </AppText>
          {timeline.map((t, i) => {
            const done = !!t.at;
            return (
              <View key={t.label} style={styles.timelineRow}>
                <View style={styles.timelineCol}>
                  <View style={[styles.timelineDot, { backgroundColor: done ? palette.secondary : colors.border }]}>
                    {done ? <Ionicons name="checkmark" size={10} color={palette.white} /> : null}
                  </View>
                  {i < timeline.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: done && timeline[i + 1].at ? palette.secondary : colors.border }]} /> : null}
                </View>
                <View style={styles.timelineBody}>
                  <AppText variant="bodyMedium" tone={done ? 'primary' : 'tertiary'}>
                    {t.label}
                  </AppText>
                  {t.at ? (
                    <AppText variant="caption" tone="secondary">
                      {formatTime(t.at)}
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })}
        </Card>

        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="location" size={18} color={palette.primary} />
            </View>
            <View style={styles.infoBody}>
              <AppText variant="bodySemiBold">{order.address.label}</AppText>
              <AppText variant="bodySm" tone="secondary">
                {order.address.street}
                {order.address.apartment ? `, ${order.address.apartment}` : ''} · {order.address.city}
              </AppText>
            </View>
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.secondarySoft }]}>
              <Ionicons name={PAYMENT_ICON[order.paymentMethod.type]} size={18} color={palette.secondaryPressed} />
            </View>
            <View style={styles.infoBody}>
              <AppText variant="bodySemiBold">{order.paymentMethod.label}</AppText>
              <AppText variant="bodySm" tone="secondary">
                {order.paymentMethod.subtitle}
              </AppText>
            </View>
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Image source={{ uri: order.rider.avatar }} style={styles.riderAvatar} cachePolicy="memory-disk" />
            <View style={styles.infoBody}>
              <AppText variant="bodySemiBold">{order.rider.name}</AppText>
              <AppText variant="bodySm" tone="secondary">
                Rider · {order.rider.vehicle}
              </AppText>
            </View>
          </View>
        </Card>

        {order.rating ? (
          <Card style={styles.card}>
            <AppText variant="h4" style={styles.sectionTitle}>
              Your rating
            </AppText>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= order.rating!.stars ? 'star' : 'star-outline'} size={22} color={palette.star} />
              ))}
            </View>
            {order.rating.comment ? (
              <AppText variant="bodySm" tone="secondary" style={{ marginTop: spacing.xs }}>
                “{order.rating.comment}”
              </AppText>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.actions}>
          {order.status === 'delivered' && !order.rating ? <Button title="Rate & Review" icon="star" onPress={() => navigation.navigate('RateReview', { orderId: order.id })} style={{ marginBottom: spacing.xs }} /> : null}
          {!isActive ? <Button title="Reorder" icon="refresh" variant={order.status === 'delivered' && !order.rating ? 'outline' : 'primary'} onPress={() => reorder(order)} style={{ marginBottom: spacing.xs }} /> : null}
          <Button title="Need help with this order?" variant="ghost" icon="help-circle-outline" onPress={() => navigation.navigate('Help')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  storeRow: { flexDirection: 'row', alignItems: 'center' },
  storeImage: { width: 56, height: 56, borderRadius: radius.button, backgroundColor: '#EEE' },
  storeBody: { flex: 1, marginLeft: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemImage: { width: 44, height: 44, borderRadius: radius.sm },
  itemBody: { flex: 1, marginHorizontal: spacing.sm },
  timelineRow: { flexDirection: 'row', minHeight: 44 },
  timelineCol: { width: 24, alignItems: 'center' },
  timelineDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { flex: 1, width: 2, marginVertical: 2 },
  timelineBody: { flex: 1, marginLeft: spacing.xs, paddingBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  infoIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1, marginLeft: spacing.sm },
  riderAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#DDD' },
  stars: { flexDirection: 'row', gap: 4 },
  actions: { marginTop: spacing.xs },
});
