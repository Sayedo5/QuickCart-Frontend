import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { AppText, BottomSheet, CategoryChip, EmptyState, IconButton, Logo, StoreCard, StoreCardSkeleton } from '@/components';
import { Store, StoreCategory } from '@/data/types';
import { RootStackParamList } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import type { Banner } from '@/services/api.types';
import { selectSelectedAddress, useAddressStore } from '@/store/useAddressStore';
import { useAppConfigStore } from '@/store/useAppConfigStore';
import { useCityStore } from '@/store/useCityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { selectActiveOrder, STATUS_STEPS, statusIndex, useOrderStore } from '@/store/useOrderStore';
import { palette, radius, shadow, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Category = StoreCategory | 'all';

const CATEGORIES: Array<{ key: Category; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'restaurants', label: 'Restaurants', icon: 'restaurant-outline' },
  { key: 'grocery', label: 'Grocery', icon: 'basket-outline' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'medkit-outline' },
];

const ADDRESS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = { Home: 'home', Work: 'briefcase', Other: 'location' };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddress = useAddressStore(selectSelectedAddress);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const activeOrder = useOrderStore(selectActiveOrder);
  const settings = useAppConfigStore((s) => s.settings);
  const city = useCityStore((s) => s.selected);
  const cityName = city?.name ?? settings.serviceCity;
  const cachedBanners = useAppConfigStore((s) => s.banners);
  const syncConfig = useAppConfigStore((s) => s.sync);

  const [category, setCategory] = useState<Category>('all');
  const [stores, setStores] = useState<Store[]>([]);
  const [banners, setBanners] = useState<Banner[]>(cachedBanners);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressSheet, setAddressSheet] = useState(false);

  const load = useCallback(
    async (cat: Category, mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        // Scope the catalog to the customer's city so a Lahore restaurant never
        // shows up for someone ordering in Karachi.
        const page = await api.getStores({ category: cat, city: cityName });
        setStores(page.items);
      } catch (e) {
        setError(toApiError(e).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cityName],
  );

  useEffect(() => {
    load(category, 'initial');
  }, [category, load]);

  useEffect(() => {
    api.getBanners().then(setBanners).catch(() => undefined);
  }, []);

  const onRefresh = useCallback(async () => {
    syncConfig();
    api.getBanners().then(setBanners).catch(() => undefined);
    await load(category, 'refresh');
  }, [category, load, syncConfig]);

  const openStore = useCallback((store: Store) => navigation.navigate('StoreDetail', { storeId: store.id }), [navigation]);

  const openBanner = useCallback(
    (banner: Banner) => {
      haptic.light();
      if (banner.target.type === 'store' && banner.target.value) navigation.navigate('StoreDetail', { storeId: banner.target.value });
      else if (banner.target.type === 'category' && banner.target.value) setCategory(banner.target.value as Category);
      else navigation.navigate('Offers');
    },
    [navigation],
  );

  const listData = useMemo(() => (loading ? [] : stores), [loading, stores]);

  const header = (
    <View>
      {settings.announcement ? (
        <View style={[styles.announcement, { backgroundColor: colors.warningSoft }]}>
          <Ionicons name="megaphone-outline" size={18} color={colors.onWarningSoft} />
          <View style={styles.announcementBody}>
            <AppText variant="bodySmSemiBold" color={colors.onWarningSoft}>
              {settings.announcement.title}
            </AppText>
            <AppText variant="caption" color={colors.onWarningSoft}>
              {settings.announcement.body}
            </AppText>
          </View>
        </View>
      ) : null}

      {banners.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled={banners.length > 1}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerRow}
        >
          {banners.map((banner) => (
            <Pressable
              key={banner.id}
              onPress={() => openBanner(banner)}
              style={({ pressed }) => [styles.bannerWrap, { opacity: pressed ? 0.92 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={banner.title}
            >
              <LinearGradient colors={banner.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <View style={styles.bannerText}>
                  {banner.label ? (
                    <AppText variant="label" color="rgba(255,255,255,0.85)">
                      {banner.label}
                    </AppText>
                  ) : null}
                  <AppText variant="h2" color={palette.white} numberOfLines={2}>
                    {banner.title}
                  </AppText>
                  {banner.subtitle ? (
                    <AppText variant="bodySm" color="rgba(255,255,255,0.9)" numberOfLines={2}>
                      {banner.subtitle}
                    </AppText>
                  ) : null}
                </View>
                {banner.image ? (
                  <Image source={{ uri: banner.image }} style={styles.bannerImage} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={styles.bannerIcon}>
                    <Ionicons name="fast-food" size={54} color="rgba(255,255,255,0.95)" />
                  </View>
                )}
                <View style={[styles.bannerBlob, styles.bannerBlobA]} />
                <View style={[styles.bannerBlob, styles.bannerBlobB]} />
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {activeOrder ? (
        <Pressable
          onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
          style={({ pressed }) => [styles.activeOrder, { backgroundColor: colors.surface, borderColor: palette.secondary, opacity: pressed ? 0.9 : 1 }, !isDark ? shadow.soft : null]}
          accessibilityRole="button"
          accessibilityLabel="Track your active order"
        >
          <View style={[styles.activeIcon, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="bicycle" size={22} color={colors.onSecondarySoft} />
          </View>
          <View style={styles.activeBody}>
            <AppText variant="bodySemiBold" numberOfLines={1}>
              {activeOrder.storeName} · {STATUS_STEPS[statusIndex(activeOrder.status)].label}
            </AppText>
            <AppText variant="caption" tone="secondary">
              Tap to track your order live
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <CategoryChip key={c.key} label={c.label} icon={c.icon} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <AppText variant="h3">{category === 'all' ? `Popular in ${cityName}` : CATEGORIES.find((c) => c.key === category)?.label}</AppText>
        {!loading && !error ? (
          <AppText variant="caption" tone="tertiary">
            {stores.length} place{stores.length === 1 ? '' : 's'}
          </AppText>
        ) : null}
      </View>

      {loading ? (
        <View>
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs, backgroundColor: colors.background }]}>
        <View style={styles.topRow}>
          <Logo height={34} style={styles.topLogo} />
          {/* City and address are separate targets: the city scopes the whole
              catalog, the address only picks where this order goes. */}
          <View style={styles.locationBtn}>
            <Pressable
              onPress={() => {
                haptic.selection();
                navigation.navigate('CitySelect', { switching: true });
              }}
              hitSlop={{ top: 6, bottom: 2, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Change city, currently ${cityName}`}
              style={({ pressed }) => [styles.cityChipRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <AppText variant="caption" tone="brand">
                {cityName}
              </AppText>
              <Ionicons name="swap-horizontal" size={11} color={palette.primary} style={{ marginLeft: 3 }} />
            </Pressable>
            <Pressable
              onPress={() => {
                haptic.selection();
                setAddressSheet(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
              style={({ pressed }) => [styles.locationRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="location" size={16} color={palette.primary} />
              <AppText variant="bodySemiBold" numberOfLines={1} style={styles.locationText}>
                {selectedAddress ? `${selectedAddress.label} · ${selectedAddress.street}` : 'Select address'}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <IconButton icon="heart-outline" variant="soft" onPress={() => navigation.navigate('Favourites')} accessibilityLabel="Favourites" style={styles.headerIcon} />
          <Pressable onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' })} accessibilityLabel="Profile">
            <Image source={{ uri: user?.avatar }} style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]} cachePolicy="memory-disk" />
          </Pressable>
        </View>

        <AppText variant="h2" style={styles.greeting}>
          {greeting()}
          {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </AppText>

        <Pressable
          onPress={() => navigation.navigate('Search')}
          accessibilityRole="search"
          accessibilityLabel="Search stores and products"
          style={({ pressed }) => [styles.search, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }, !isDark ? shadow.soft : null]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <AppText variant="body" tone="tertiary" style={styles.searchText} numberOfLines={1}>
            Search for restaurants, groceries…
          </AppText>
          <IconButton icon="options-outline" variant="soft" size={32} iconSize={16} onPress={() => navigation.navigate('Search')} />
        </Pressable>
      </View>

      <FlashList
        data={listData}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <StoreCard store={item} onPress={openStore} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState icon="cloud-offline-outline" title="Could not load stores" subtitle={error} actionLabel="Try again" onAction={() => load(category, 'initial')} />
          ) : (
            <EmptyState icon="storefront-outline" title="No stores found" subtitle="Try a different category or check back later." />
          )
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet visible={addressSheet} onClose={() => setAddressSheet(false)} title="Delivery address">
        {addresses.length === 0 ? (
          <AppText variant="bodySm" tone="secondary" style={styles.noAddress}>
            You have no saved addresses yet.
          </AppText>
        ) : (
          addresses.map((a) => {
            const selected = a.id === selectedAddress?.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => {
                  haptic.selection();
                  selectAddress(a.id);
                  setAddressSheet(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.addressRow,
                  { backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent', borderColor: selected ? palette.primary : colors.border },
                ]}
              >
                <View style={[styles.addressIcon, { backgroundColor: selected ? palette.primary : colors.surfaceAlt }]}>
                  <Ionicons name={ADDRESS_ICON[a.label] ?? 'location'} size={18} color={selected ? palette.white : colors.textSecondary} />
                </View>
                <View style={styles.addressBody}>
                  <AppText variant="bodySemiBold">{a.label}</AppText>
                  <AppText variant="bodySm" tone="secondary" numberOfLines={1}>
                    {a.street}
                    {a.apartment ? `, ${a.apartment}` : ''}
                  </AppText>
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={palette.primary} /> : null}
              </Pressable>
            );
          })
        )}
        <Pressable
          onPress={() => {
            setAddressSheet(false);
            navigation.navigate('AddAddress');
          }}
          style={({ pressed }) => [styles.addAddress, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={22} color={palette.primary} />
          <AppText variant="bodySemiBold" tone="brand" style={styles.addAddressText}>
            Add new address
          </AppText>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  topLogo: { marginRight: spacing.sm },
  locationBtn: { flex: 1, marginRight: spacing.xs },
  cityChipRow: { flexDirection: 'row', alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginHorizontal: 4, flexShrink: 1 },
  headerIcon: { marginRight: spacing.xs },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  greeting: { marginTop: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.card,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchText: { flex: 1, marginLeft: spacing.xs },
  announcement: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginTop: spacing.xs, padding: spacing.sm, borderRadius: radius.button },
  announcementBody: { flex: 1, marginLeft: spacing.xs },
  bannerRow: { paddingLeft: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  bannerWrap: { marginRight: spacing.sm },
  banner: { width: 320, borderRadius: radius.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 120 },
  bannerText: { flex: 1, zIndex: 1 },
  bannerIcon: { width: 84, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  bannerImage: { width: 76, height: 76, borderRadius: radius.button, zIndex: 1 },
  bannerBlob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  bannerBlobA: { width: 160, height: 160, right: -50, top: -60 },
  bannerBlobB: { width: 90, height: 90, right: 40, bottom: -50 },
  activeOrder: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.sm, borderRadius: radius.card, borderWidth: 1 },
  activeIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeBody: { flex: 1, marginHorizontal: spacing.sm },
  chips: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.card, borderWidth: 1, marginBottom: spacing.xs },
  addressIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addressBody: { flex: 1, marginHorizontal: spacing.sm },
  noAddress: { paddingVertical: spacing.md, textAlign: 'center' },
  addAddress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  addAddressText: { marginLeft: spacing.xs },
});
