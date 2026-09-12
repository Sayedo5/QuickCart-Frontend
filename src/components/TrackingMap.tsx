import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { env } from '@/config/env';
import { absoluteFill, palette, radius, spacing, useTheme } from '@/theme';
import { captureException, captureMessage } from '@/services/monitoring';

export type LatLng = { latitude: number; longitude: number };

/** How long to wait for the native map to call onMapReady before giving up. */
const MAP_READY_TIMEOUT_MS = 6000;

interface TrackingMapProps {
  store: LatLng;
  destination: LatLng;
  rider: LatLng | null;
  route: LatLng[];
  /** Drives the rider marker's pulse; only true while the rider is en route. */
  riderMoving: boolean;
  /** Text shown under the fallback headline, e.g. "Arriving in 12 min". */
  fallbackEta: string;
  /** Human-readable status, e.g. "On the way". */
  fallbackStatus: string;
}

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(2.2, { duration: 1200 }), -1, false);
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 2.2 - scale.value }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, style]} />
    </View>
  );
}

/**
 * The text view shown whenever the map cannot be drawn — no Maps API key in the
 * build, missing Play Services, a native crash, or a map that never becomes
 * ready. It carries the same information the map does (where the order is
 * coming from, where it is going, how long it will take), so a customer is
 * never left staring at a blank grey rectangle with no idea what is happening.
 */
function MapUnavailable({ status, eta, reason }: { status: string; eta: string; reason: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fallback, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.fallbackIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="map-outline" size={30} color={palette.primary} />
      </View>
      <AppText variant="h3" align="center">
        Map unavailable
      </AppText>
      <AppText variant="bodySm" tone="secondary" align="center" style={styles.fallbackBody}>
        {reason} Your order is still being tracked normally.
      </AppText>

      <View style={[styles.fallbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.fallbackRow}>
          <Ionicons name="bicycle" size={18} color={palette.primary} />
          <AppText variant="bodySmSemiBold" style={styles.fallbackRowText}>
            {status}
          </AppText>
        </View>
        <View style={[styles.fallbackDivider, { backgroundColor: colors.border }]} />
        <View style={styles.fallbackRow}>
          <Ionicons name="time-outline" size={18} color={palette.primary} />
          <AppText variant="bodySmSemiBold" style={styles.fallbackRowText}>
            {eta}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/**
 * Catches render-time crashes from the native map view (missing Play Services,
 * an incompatible SDK) and hands control back to the fallback rather than
 * letting the global boundary replace the whole tracking screen.
 */
class MapErrorBoundary extends React.Component<{ onError: (message: string) => void; children: React.ReactNode }, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error) {
    captureException(error, { where: 'TrackingMap' });
    this.props.onError('The map could not be loaded on this device.');
  }

  render() {
    return this.state.crashed ? null : this.props.children;
  }
}

/**
 * The live-tracking map: store pin, delivery pin, the route between them and a
 * rider marker driven by the `rider:location` socket event.
 *
 * On Android react-native-maps needs a Maps SDK key compiled into the manifest.
 * Without one the SDK renders a silent blank grid rather than throwing, so we
 * check for the key up front instead of waiting to find out visually. Runtime
 * failures are caught two more ways: an error boundary around the native view,
 * and a readiness timeout for the case where the view mounts but never draws.
 */
export function TrackingMap({ store, destination, rider, route, riderMoving, fallbackEta, fallbackStatus }: TrackingMapProps) {
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(env.mapsConfigured ? null : 'This build has no Google Maps key.');
  const reportedRef = useRef(false);

  const initialRegion = useMemo(
    () => ({
      latitude: (store.latitude + destination.latitude) / 2,
      longitude: (store.longitude + destination.longitude) / 2,
      latitudeDelta: Math.max(0.02, Math.abs(store.latitude - destination.latitude) * 2.5),
      longitudeDelta: Math.max(0.02, Math.abs(store.longitude - destination.longitude) * 2.5),
    }),
    [store, destination],
  );

  // A map that mounts but never signals readiness is the blank-grid case; treat
  // it as a failure rather than showing the customer nothing.
  useEffect(() => {
    if (failed || ready) return;
    const timer = setTimeout(() => {
      setFailed((current) => current ?? 'The map could not be loaded.');
      if (!reportedRef.current) {
        reportedRef.current = true;
        captureMessage(`tracking map never became ready (mapsConfigured=${env.mapsConfigured})`, 'warning');
      }
    }, MAP_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [failed, ready]);

  useEffect(() => {
    if (!ready || route.length === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(route, {
        edgePadding: { top: 140, right: 60, bottom: 420, left: 60 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [ready, route]);

  if (failed) {
    return <MapUnavailable status={fallbackStatus} eta={fallbackEta} reason={failed} />;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapErrorBoundary onError={(message) => setFailed((current) => current ?? message)}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsCompass={false}
        toolbarEnabled={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onMapReady={() => setReady(true)}
      >
        {route.length > 1 ? <Polyline coordinates={route} strokeColor={palette.primary} strokeWidth={4} /> : null}
        <Marker coordinate={store} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.marker, { backgroundColor: colors.surface, borderColor: palette.primary }]}>
            <Ionicons name="storefront" size={16} color={palette.primary} />
          </View>
        </Marker>
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.marker, { backgroundColor: colors.surface, borderColor: palette.secondary }]}>
            <Ionicons name="home" size={16} color={palette.secondary} />
          </View>
        </Marker>
        {rider ? (
          <Marker coordinate={rider} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={riderMoving}>
            <View style={styles.riderMarker}>
              {riderMoving ? <PulsingDot color={palette.primary} /> : null}
              <View style={[styles.riderCore, { backgroundColor: palette.primary }]}>
                <Ionicons name="bicycle" size={18} color={palette.white} />
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>
      </MapErrorBoundary>

      {/* Until the tiles actually draw, cover the view so the customer sees the
          brand surface rather than a half-painted grid. */}
      {ready ? null : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceAlt }]} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  marker: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  riderMarker: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  riderCore: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  pulseWrap: { ...absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  fallback: { ...absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingBottom: 360 },
  fallbackIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  fallbackBody: { marginTop: 4, marginBottom: spacing.md },
  fallbackCard: { alignSelf: 'stretch', borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  fallbackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  fallbackRowText: { marginLeft: spacing.sm, flex: 1 },
  fallbackDivider: { height: StyleSheet.hairlineWidth },
});
