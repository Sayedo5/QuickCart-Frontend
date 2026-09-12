import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { AppText, BottomSheet, Button, IconButton, StatusStepper } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { STATUS_STEPS, statusIndex, useOrderStore } from '@/store/useOrderStore';
import { absoluteFill, palette, radius, shadow, spacing, useTheme } from '@/theme';
import { formatCountdown, formatCurrency, pluralize } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type LatLng = { latitude: number; longitude: number };

/** Builds a gently curved mock route between two points with fixed waypoints. */
const buildRoute = (from: LatLng, to: LatLng, points = 12): LatLng[] => {
  const out: LatLng[] = [];
  const dLat = to.latitude - from.latitude;
  const dLng = to.longitude - from.longitude;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const curve = Math.sin(t * Math.PI) * 0.0025;
    out.push({ latitude: from.latitude + dLat * t + curve * (dLng >= 0 ? 1 : -1), longitude: from.longitude + dLng * t - curve });
  }
  return out;
};

const interpolateRoute = (route: LatLng[], progress: number): LatLng => {
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];
  const scaled = progress * (route.length - 1);
  const i = Math.floor(scaled);
  const t = scaled - i;
  const a = route[i];
  const b = route[Math.min(i + 1, route.length - 1)];
  return { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };
};

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(2.2, { duration: 1200 }), -1, false);
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 2.2 - scale.value }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, style]} />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

export function OrderTrackingScreen({ navigation, route }: RootScreenProps<'OrderTracking'>) {
  const { orderId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId));
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  /** Real GPS fix pushed by the rider over the socket, when one has arrived. */
  const liveRiderPosition = useOrderStore((s) => s.riderPositions[orderId]);
  const mapRef = useRef<MapView>(null);
  const [now, setNow] = useState(Date.now());
  const [ratePrompt, setRatePrompt] = useState(false);
  const promptedRef = useRef(false);

  const routePoints = useMemo(() => (order ? buildRoute(order.storeLocation, order.address.location) : []), [order]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (routePoints.length && mapRef.current) {
      const t = setTimeout(() => {
        mapRef.current?.fitToCoordinates(routePoints, { edgePadding: { top: 140, right: 60, bottom: 420, left: 60 }, animated: true });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [routePoints]);

  useEffect(() => {
    if (order?.status === 'delivered' && !order.rating && !promptedRef.current) {
      promptedRef.current = true;
      haptic.success();
      const t = setTimeout(() => setRatePrompt(true), 900);
      return () => clearTimeout(t);
    }
  }, [order?.status, order?.rating]);

  /**
   * Fallback animation for the map pin: how far along the route the rider should
   * be, based on the backend's own ETA rather than a fixed client-side duration.
   * Only used until the first real GPS fix arrives over the socket.
   */
  const progress = useMemo(() => {
    if (!order) return 0;
    if (order.status === 'delivered') return 1;
    if (order.status !== 'picked_up' || !order.timeline.pickedUpAt) return 0;
    const startedAt = new Date(order.timeline.pickedUpAt).getTime();
    const etaAt = new Date(order.estimatedDeliveryAt).getTime();
    const rideDuration = etaAt - startedAt;
    if (!Number.isFinite(rideDuration) || rideDuration <= 0) return 0;
    return Math.min(1, Math.max(0, (now - startedAt) / rideDuration));
  }, [order, now]);

  const riderPosition = useMemo(() => {
    // Prefer the rider's actual reported location; fall back to the ETA-based estimate.
    if (liveRiderPosition) return { latitude: liveRiderPosition.latitude, longitude: liveRiderPosition.longitude };
    return routePoints.length ? interpolateRoute(routePoints, progress) : null;
  }, [liveRiderPosition, routePoints, progress]);

  const goHome = useCallback(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), [navigation]);

  if (!order) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <AppText variant="body" tone="secondary">
          Order not found.
        </AppText>
        <Button title="Back to Home" onPress={goHome} fullWidth={false} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const step = STATUS_STEPS[statusIndex(order.status)];
  const etaMs = new Date(order.estimatedDeliveryAt).getTime() - now;
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const confirmCancel = () =>
    Alert.alert('Cancel order?', 'You can cancel free of charge until the store starts preparing.', [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => { cancelOrder(order.id); haptic.medium(); } },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: (order.storeLocation.latitude + order.address.location.latitude) / 2, longitude: (order.storeLocation.longitude + order.address.location.longitude) / 2, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
        showsCompass={false}
        toolbarEnabled={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        <Polyline coordinates={routePoints} strokeColor={palette.primary} strokeWidth={4} />
        <Marker coordinate={order.storeLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.marker, { backgroundColor: colors.surface, borderColor: palette.primary }]}>
            <Ionicons name="storefront" size={16} color={palette.primary} />
          </View>
        </Marker>
        <Marker coordinate={order.address.location} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.marker, { backgroundColor: colors.surface, borderColor: palette.secondary }]}>
            <Ionicons name="home" size={16} color={palette.secondary} />
          </View>
        </Marker>
        {riderPosition && !isCancelled ? (
          <Marker coordinate={riderPosition} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={order.status === 'picked_up'}>
            <View style={styles.riderMarker}>
              {order.status === 'picked_up' ? <PulsingDot color={palette.primary} /> : null}
              <View style={[styles.riderCore, { backgroundColor: palette.primary }]}>
                <Ionicons name="bicycle" size={18} color={palette.white} />
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        <IconButton icon="chevron-back" onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome())} accessibilityLabel="Go back" style={shadow.soft} />
        <View style={[styles.orderPill, { backgroundColor: colors.surface }, shadow.soft]}>
          <AppText variant="bodySmSemiBold">Order {order.orderNumber}</AppText>
        </View>
        <IconButton icon="help-circle-outline" onPress={() => navigation.navigate('Help')} accessibilityLabel="Help" style={shadow.soft} />
      </View>

      {/* Bottom panel */}
      <Animated.View entering={FadeInDown.duration(350)} style={[styles.panel, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.md }, shadow.medium]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        {isCancelled ? (
          <View style={styles.cancelled}>
            <Ionicons name="close-circle" size={40} color={palette.error} />
            <AppText variant="h3" style={{ marginTop: spacing.xs }}>
              Order cancelled
            </AppText>
            <AppText variant="bodySm" tone="secondary" align="center">
              Any payment will be refunded within 3-5 business days.
            </AppText>
            <Button title="Back to Home" onPress={goHome} style={{ marginTop: spacing.md }} />
          </View>
        ) : (
          <>
            <View style={styles.etaRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="h3">{isDelivered ? 'Delivered 🎉' : step.label}</AppText>
                <AppText variant="bodySm" tone="secondary">
                  {step.description}
                </AppText>
              </View>
              <View style={[styles.etaBox, { backgroundColor: isDelivered ? colors.secondarySoft : colors.primarySoft }]}>
                <AppText variant="label" color={isDelivered ? colors.onSecondarySoft : palette.primary}>
                  {isDelivered ? 'ARRIVED' : 'ETA'}
                </AppText>
                <AppText variant="h3" color={isDelivered ? colors.onSecondarySoft : palette.primary}>
                  {isDelivered ? '00:00' : formatCountdown(etaMs)}
                </AppText>
              </View>
            </View>

            <View style={styles.stepper}>
              <StatusStepper status={order.status} />
            </View>

            {/* Rider card */}
            <View style={[styles.riderCard, { backgroundColor: colors.surfaceAlt }]}>
              <Image source={{ uri: order.rider.avatar }} style={styles.riderAvatar} cachePolicy="memory-disk" />
              <View style={styles.riderBody}>
                <AppText variant="bodySemiBold">{order.rider.name}</AppText>
                <View style={styles.riderMeta}>
                  <Ionicons name="star" size={12} color={palette.star} />
                  <AppText variant="caption" tone="secondary" style={{ marginLeft: 3 }}>
                    {order.rider.rating.toFixed(1)} · {order.rider.vehicle} · {order.rider.plate}
                  </AppText>
                </View>
              </View>
              <IconButton icon="call" variant="brand" size={42} onPress={() => Linking.openURL(`tel:${order.rider.phone}`)} accessibilityLabel="Call rider" style={{ marginRight: spacing.xs }} />
              <IconButton icon="chatbubble-ellipses" variant="filled" size={42} color={palette.primary} onPress={() => Linking.openURL(`sms:${order.rider.phone}`)} accessibilityLabel="Message rider" />
            </View>

            <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })} style={({ pressed }) => [styles.summaryRow, { opacity: pressed ? 0.7 : 1 }]} accessibilityRole="button">
              <Image source={{ uri: order.storeImage }} style={styles.storeImage} cachePolicy="memory-disk" />
              <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                <AppText variant="bodySmSemiBold" numberOfLines={1}>
                  {order.storeName}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {pluralize(itemCount, 'item')} · {formatCurrency(order.total)} · {order.paymentMethod.label}
                </AppText>
              </View>
              <AppText variant="bodySmSemiBold" tone="brand">
                Details
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={palette.primary} />
            </Pressable>

            {isDelivered ? (
              order.rating ? (
                <Button title="Back to Home" onPress={goHome} variant="ghost" />
              ) : (
                <Button title="Rate your order" icon="star" onPress={() => navigation.navigate('RateReview', { orderId: order.id })} />
              )
            ) : order.status === 'placed' ? (
              <Button title="Cancel order" variant="ghost" onPress={confirmCancel} />
            ) : null}
          </>
        )}
      </Animated.View>

      <BottomSheet visible={ratePrompt} onClose={() => setRatePrompt(false)}>
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="checkmark-done" size={32} color={colors.onSecondarySoft} />
          </View>
          <AppText variant="h2" align="center">
            Order delivered!
          </AppText>
          <AppText variant="body" tone="secondary" align="center" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
            How was your experience with {order.storeName} and {order.rider.name.split(' ')[0]}?
          </AppText>
          <Button title="Rate & Review" icon="star" onPress={() => { setRatePrompt(false); navigation.navigate('RateReview', { orderId: order.id }); }} />
          <Button title="Maybe later" variant="ghost" onPress={() => { setRatePrompt(false); goHome(); }} style={{ marginTop: spacing.xs }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderPill: { paddingHorizontal: spacing.md, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  marker: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  riderMarker: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  riderCore: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  pulseWrap: { ...absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  pulseCore: { width: 0, height: 0 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  etaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  etaBox: { borderRadius: radius.button, paddingHorizontal: spacing.sm, paddingVertical: 6, alignItems: 'center', marginLeft: spacing.sm, minWidth: 84 },
  stepper: { marginBottom: spacing.md },
  riderCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, padding: spacing.sm, marginBottom: spacing.sm },
  riderAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#DDD' },
  riderBody: { flex: 1, marginHorizontal: spacing.sm },
  riderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, marginBottom: spacing.sm },
  storeImage: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: '#EEE' },
  cancelled: { alignItems: 'center', paddingVertical: spacing.md },
  prompt: { alignItems: 'center', paddingVertical: spacing.md },
  promptIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
});
