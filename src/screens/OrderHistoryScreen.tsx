import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Badge, Button, EmptyState, OrderCardSkeleton, ScreenHeader } from '@/components';
import { Order } from '@/data/types';
import { RootStackParamList } from '@/navigation/types';
import { useCartStore } from '@/store/useCartStore';
import { STATUS_STEPS, statusIndex, useOrderStore } from '@/store/useOrderStore';
import { palette, radius, shadow, spacing, useTheme } from '@/theme';
import { dayKey, formatCurrency, formatDateLabel, formatTime, pluralize } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Row = { type: 'header'; id: string; label: string } | { type: 'order'; id: string; order: Order };

const statusTone = (status: Order['status']): 'success' | 'brand' | 'error' | 'neutral' =>
  status === 'delivered' ? 'success' : status === 'cancelled' ? 'error' : 'brand';

export function useReorder() {
  const navigation = useNavigation<Nav>();
  const cartItems = useCartStore((s) => s.items);
  const cartStore = useCartStore((s) => s.store);
  const replaceCart = useCartStore((s) => s.replaceCart);
  return useCallback(
    (order: Order) => {
      const storeInfo = {
        id: order.storeId,
        name: order.storeName,
        image: order.storeImage,
        deliveryFee: order.deliveryFee,
        minOrder: 0,
        location: order.storeLocation,
      };
      const apply = () => {
        replaceCart(order.items.map((i) => ({ ...i })), storeInfo);
        haptic.success();
        navigation.navigate('Main', { screen: 'CartTab' });
      };
      if (cartItems.length > 0 && cartStore?.id !== order.storeId) {
        Alert.alert('Replace your cart?', `Your cart has items from ${cartStore?.name}. Reordering will replace them.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: apply },
        ]);
      } else {
        apply();
      }
    },
    [cartItems.length, cartStore, replaceCart, navigation],
  );
}

const OrderCard = React.memo(function OrderCard({ order, onPress, onReorder, onTrack, onRate }: { order: Order; onPress: () => void; onReorder: () => void; onTrack: () => void; onRate: () => void }) {
  const { colors, isDark } = useTheme();
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const summary = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order from ${order.storeName}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: isActive ? palette.primary : colors.border, borderWidth: isActive ? 1.5 : isDark ? StyleSheet.hairlineWidth : 0, opacity: pressed ? 0.92 : 1 },
        !isDark ? shadow.soft : null,
      ]}
    >
      <View style={styles.cardTop}>
        <Image source={{ uri: order.storeImage }} style={styles.storeImage} contentFit="cover" cachePolicy="memory-disk" />
        <View style={styles.cardTitle}>
          <AppText variant="bodySemiBold" numberOfLines={1}>
            {order.storeName}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {formatTime(order.createdAt)} · {order.orderNumber}
          </AppText>
        </View>
        <Badge label={STATUS_STEPS[statusIndex(order.status)]?.label ?? 'Cancelled'} tone={statusTone(order.status)} icon={order.status === 'delivered' ? 'checkmark-circle' : order.status === 'cancelled' ? 'close-circle' : 'time'} />
      </View>
      <AppText variant="bodySm" tone="secondary" numberOfLines={2} style={styles.summary}>
        {summary}
      </AppText>
      <View style={styles.cardBottom}>
        <View>
          <AppText variant="caption" tone="tertiary">
            {pluralize(itemCount, 'item')}
          </AppText>
          <AppText variant="bodySemiBold">{formatCurrency(order.total)}</AppText>
        </View>
        <View style={styles.actions}>
          {isActive ? (
            <Button title="Track order" size="sm" fullWidth={false} icon="navigate" variant="secondary" onPress={onTrack} />
          ) : (
            <>
              {order.status === 'delivered' && !order.rating ? <Button title="Rate" size="sm" fullWidth={false} variant="ghost" icon="star-outline" onPress={onRate} style={{ marginRight: spacing.xs }} /> : null}
              {order.rating ? (
                <View style={styles.rated}>
                  <Ionicons name="star" size={14} color={palette.star} />
                  <AppText variant="captionMedium" tone="secondary" style={{ marginLeft: 3 }}>
                    {order.rating.stars}.0
                  </AppText>
                </View>
              ) : null}
              <Button title="Reorder" size="sm" fullWidth={false} variant="outline" icon="refresh" onPress={onReorder} />
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
});

export function OrderHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const orders = useOrderStore((s) => s.orders);
  const hydrated = useOrderStore((s) => s.hydrated);
  const reorder = useReorder();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [hydrated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const rows = useMemo<Row[]>(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const out: Row[] = [];
    let lastKey = '';
    sorted.forEach((o) => {
      const key = dayKey(o.createdAt);
      if (key !== lastKey) {
        out.push({ type: 'header', id: `h_${key}`, label: formatDateLabel(o.createdAt) });
        lastKey = key;
      }
      out.push({ type: 'order', id: o.id, order: o });
    });
    return out;
  }, [orders]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.type === 'header') {
        return (
          <AppText variant="label" tone="tertiary" style={styles.dateHeader}>
            {item.label.toUpperCase()}
          </AppText>
        );
      }
      const o = item.order;
      return (
        <OrderCard
          order={o}
          onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
          onReorder={() => reorder(o)}
          onTrack={() => navigation.navigate('OrderTracking', { orderId: o.id })}
          onRate={() => navigation.navigate('RateReview', { orderId: o.id })}
        />
      );
    },
    [navigation, reorder],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Orders" showBack={false} />
      {loading ? (
        <View style={{ paddingTop: spacing.sm }}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="receipt-outline" title="No orders yet" subtitle="When you place an order it will show up here, so you can track it and reorder in a tap." actionLabel="Browse restaurants" onAction={() => navigation.navigate('Main', { screen: 'HomeTab' })} />
        </View>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.id}
          getItemType={(r) => r.type}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: spacing.xs }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  dateHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.card, padding: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  storeImage: { width: 46, height: 46, borderRadius: radius.button, backgroundColor: '#EEE' },
  cardTitle: { flex: 1, marginHorizontal: spacing.sm },
  summary: { marginTop: spacing.sm },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center' },
  rated: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },
});
