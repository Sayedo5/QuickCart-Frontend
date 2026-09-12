import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AppText, BrandLockup, Button, ScreenHeader } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import type { ServiceCity } from '@/services/api.types';
import { hasLocationPermission, requestAndGetLocation } from '@/services/location';
import { useCityStore } from '@/store/useCityStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

/**
 * City picker.
 *
 * Shown once on first launch (and again from the home header when someone wants
 * to switch). If location permission has already been granted we try GPS
 * silently on mount, so most customers never have to tap anything — but the
 * manual list is always right there, because a denied prompt or a customer
 * ordering to another city must not be a dead end.
 */
export function CitySelectScreen({ navigation, route }: RootScreenProps<'CitySelect'>) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isSwitching = route.params?.switching ?? false;

  const cities = useCityStore((s) => s.cities);
  const selected = useCityStore((s) => s.selected);
  const loading = useCityStore((s) => s.loading);
  const detecting = useCityStore((s) => s.detecting);
  const loadCities = useCityStore((s) => s.loadCities);
  const selectCity = useCityStore((s) => s.selectCity);
  const detectFromLocation = useCityStore((s) => s.detectFromLocation);

  const [notice, setNotice] = useState<string | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  const finish = useCallback(() => {
    if (isSwitching && navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [isSwitching, navigation]);

  const choose = (city: ServiceCity) => {
    haptic.selection();
    selectCity(city);
    finish();
  };

  /** Runs the GPS path; `silent` skips the permission prompt and any messaging. */
  const useMyLocation = useCallback(
    async (silent: boolean) => {
      if (silent && !(await hasLocationPermission())) return;
      setNotice(null);
      const coords = await requestAndGetLocation();
      if (!coords) {
        if (!silent) setNotice('We could not get your location. Pick your city from the list below.');
        return;
      }
      const city = await detectFromLocation(coords);
      if (city) {
        haptic.success();
        selectCity(city);
        finish();
      } else if (!silent) {
        setNotice('QuickCart does not deliver to your area yet. Pick the closest city to browse.');
      }
    },
    [detectFromLocation, selectCity, finish],
  );

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // Auto-detect only on first launch, and only when permission already exists —
  // prompting before the customer knows what the app is gets denied.
  useEffect(() => {
    if (autoTried || isSwitching) return;
    setAutoTried(true);
    useMyLocation(true);
  }, [autoTried, isSwitching, useMyLocation]);

  const busy = detecting || (loading && cities.length === 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isSwitching ? <ScreenHeader title="Change city" /> : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: isSwitching ? spacing.md : insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isSwitching ? null : <BrandLockup height={52} tagline="Food · Grocery · Pharmacy" style={styles.brand} />}

        <AppText variant="h1" style={styles.title}>
          {isSwitching ? 'Switch your city' : 'Where are you ordering?'}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          We&apos;ll show you the stores that actually deliver to you. You can change this any time.
        </AppText>

        <Button
          title={detecting ? 'Finding your city…' : 'Use my current location'}
          icon="navigate"
          variant="outline"
          size="lg"
          loading={detecting}
          onPress={() => useMyLocation(false)}
          style={styles.locateBtn}
        />

        {notice ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            <AppText variant="caption" tone="secondary" style={styles.noticeText}>
              {notice}
            </AppText>
          </View>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <AppText variant="caption" tone="tertiary" style={styles.dividerText}>
            or choose your city
          </AppText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {busy && cities.length === 0 ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          cities.map((city) => {
            const isActive = selected?.name === city.name;
            return (
              <Pressable
                key={city.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Order in ${city.name}`}
                onPress={() => choose(city)}
                style={({ pressed }) => [
                  styles.cityRow,
                  {
                    backgroundColor: isActive ? colors.primarySoft : colors.surface,
                    borderColor: isActive ? palette.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.cityIcon, { backgroundColor: isActive ? palette.primary : colors.surfaceAlt }]}>
                  <Ionicons name="location" size={18} color={isActive ? palette.white : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemiBold">{city.name}</AppText>
                  {city.province ? (
                    <AppText variant="caption" tone="secondary">
                      {city.province}
                    </AppText>
                  ) : null}
                </View>
                {isActive ? (
                  <Ionicons name="checkmark-circle" size={22} color={palette.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  brand: { marginBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  locateBtn: { marginBottom: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.button, padding: spacing.sm, marginBottom: spacing.sm },
  noticeText: { flex: 1, marginLeft: spacing.xs },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { marginHorizontal: spacing.sm },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
});
