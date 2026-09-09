import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { AppText, Badge, BottomSheet, Button, IconButton, ProductRow, ProductRowSkeleton, QuantityStepper, RatingBadge, Skeleton } from '@/components';
import { MenuCategory, Product, Store } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { api } from '@/services/api';
import { computeTotals, useCartStore } from '@/store/useCartStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { absoluteFill, palette, radius, shadow, spacing, useTheme } from '@/theme';
import { formatCurrency, pluralize } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type Row = { type: 'section'; id: string; categoryId: string; title: string } | { type: 'product'; id: string; categoryId: string; product: Product };

const HERO_HEIGHT = 280;
const TABS_HEIGHT = 52;
const TOP_BAR_HEIGHT = 56;

function CategoryTabs({
  categories,
  activeId,
  onPress,
  scrollRef,
}: {
  categories: MenuCategory[];
  activeId: string | null;
  onPress: (id: string) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContent}
      style={[styles.tabs, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}
    >
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <Pressable key={c.id} onPress={() => onPress(c.id)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <AppText variant={active ? 'bodySemiBold' : 'bodyMedium'} color={active ? palette.primary : colors.textSecondary}>
              {c.name}
            </AppText>
            <View style={[styles.tabIndicator, { backgroundColor: active ? palette.primary : 'transparent' }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StoreDetailScreen({ navigation, route }: RootScreenProps<'StoreDetail'>) {
  const { storeId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topBarHeight = insets.top + TOP_BAR_HEIGHT;

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const favourite = useFavouritesStore((s) => s.storeIds.includes(storeId));
  const toggleFavourite = useFavouritesStore((s) => s.toggle);

  const listRef = useRef<FlashListRef<Row>>(null);
  const programmaticScroll = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(HERO_HEIGHT + 200);

  const cartItems = useCartStore((s) => s.items);
  const cartStore = useCartStore((s) => s.store);
  const promo = useCartStore((s) => s.promo);
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const replaceCart = useCartStore((s) => s.replaceCart);

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    if (cartStore?.id === storeId) cartItems.forEach((i) => (map[i.product.id] = i.quantity));
    return map;
  }, [cartItems, cartStore, storeId]);

  const cartForThisStore = cartStore?.id === storeId ? cartItems : [];
  const totals = computeTotals(cartForThisStore, promo, store?.deliveryFee ?? 0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getStore(storeId), api.getMenu(storeId)]).then(([storeData, menu]) => {
      if (cancelled) return;
      setStore(storeData);
      setCategories(menu.categories);
      setProducts(menu.products);
      setActiveCategory(menu.categories[0]?.id ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    categories.forEach((c) => {
      out.push({ type: 'section', id: `sec_${c.id}`, categoryId: c.id, title: c.name });
      products.filter((p) => p.categoryId === c.id).forEach((p) => out.push({ type: 'product', id: p.id, categoryId: c.id, product: p }));
    });
    return out;
  }, [categories, products]);

  // FlashList v2 wraps onScroll in its own JS handler, so a worklet handler would never
  // be invoked. Writing the shared value from JS keeps the parallax/sticky logic on the UI thread.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  const heroStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.45], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });

  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 180, HERO_HEIGHT - 110], [0, 1], Extrapolation.CLAMP),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 120, HERO_HEIGHT - 80], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [HERO_HEIGHT - 120, HERO_HEIGHT - 80], [8, 0], Extrapolation.CLAMP) }],
  }));

  const stickyTabsStyle = useAnimatedStyle(() => {
    const threshold = headerHeight.value - TABS_HEIGHT - topBarHeight;
    const visible = scrollY.value >= threshold;
    return { opacity: visible ? 1 : 0, transform: [{ translateY: visible ? 0 : -8 }] };
  });

  // Mirror the sticky-tab visibility into JS state so the invisible overlay never swallows taps.
  useAnimatedReaction(
    () => scrollY.value >= headerHeight.value - TABS_HEIGHT - topBarHeight,
    (visible, prev) => {
      if (visible !== prev) runOnJS(setStickyVisible)(visible);
    },
    [topBarHeight],
  );

  const scrollToCategory = useCallback(
    (categoryId: string) => {
      haptic.selection();
      setActiveCategory(categoryId);
      const index = rows.findIndex((r) => r.type === 'section' && r.categoryId === categoryId);
      if (index < 0) return;
      if (programmaticScroll.current) clearTimeout(programmaticScroll.current);
      programmaticScroll.current = setTimeout(() => (programmaticScroll.current = null), 700);
      listRef.current?.scrollToIndex({ index, animated: true, viewOffset: topBarHeight + TABS_HEIGHT });
    },
    [rows, topBarHeight],
  );

  const onViewableItemsChanged = useRef<NonNullable<FlashListProps<Row>['onViewableItemsChanged']>>(({ viewableItems }) => {
    if (programmaticScroll.current) return;
    const first = viewableItems.find((v) => v.isViewable && v.item)?.item as Row | undefined;
    if (first) setActiveCategory((prev) => (prev === first.categoryId ? prev : first.categoryId));
  }).current;

  const handleAdd = useCallback(
    (product: Product) => {
      if (!store) return;
      const result = addItem(product, store);
      if (result === 'conflict') {
        Alert.alert(
          'Start a new cart?',
          `Your cart has items from ${cartStore?.name}. Adding this item will replace them.`,
          [
            { text: 'Keep current cart', style: 'cancel' },
            {
              text: 'Replace',
              style: 'destructive',
              onPress: () => {
                replaceCart([{ product, quantity: 1 }], {
                  id: store.id,
                  name: store.name,
                  image: store.image,
                  deliveryFee: store.deliveryFee,
                  minOrder: store.minOrder,
                  location: store.location,
                });
                haptic.success();
              },
            },
          ],
        );
      }
    },
    [store, addItem, cartStore, replaceCart],
  );

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.type === 'section') {
        return (
          <AppText variant="h3" style={styles.sectionTitle}>
            {item.title}
          </AppText>
        );
      }
      return (
        <ProductRow
          product={item.product}
          quantity={quantities[item.product.id] ?? 0}
          onAdd={handleAdd}
          onIncrement={increment}
          onDecrement={decrement}
          onPress={setSelectedProduct}
          disabled={store ? !store.isOpen : false}
        />
      );
    },
    [quantities, handleAdd, increment, decrement, store],
  );

  const selectedQty = selectedProduct ? (quantities[selectedProduct.id] ?? 0) : 0;

  const header = (
    <View onLayout={(e) => (headerHeight.value = e.nativeEvent.layout.height)}>
      <View style={{ height: HERO_HEIGHT - 40 }} />
      <View style={[styles.infoCard, { backgroundColor: colors.surface }, !isDark ? shadow.medium : null]}>
        {store ? (
          <>
            <View style={styles.infoTop}>
              <View style={styles.infoTitle}>
                <AppText variant="h2" numberOfLines={2}>
                  {store.name}
                </AppText>
                <AppText variant="bodySm" tone="secondary" numberOfLines={1}>
                  {store.tags.join(' · ')}
                </AppText>
              </View>
              <Image source={{ uri: store.image }} style={styles.infoLogo} contentFit="cover" cachePolicy="memory-disk" />
            </View>
            <View style={styles.infoMeta}>
              <RatingBadge rating={store.rating} count={store.ratingCount} style={{ backgroundColor: colors.surfaceAlt }} />
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <AppText variant="captionMedium" tone="secondary" style={styles.metaText}>
                  {store.deliveryTimeMin}-{store.deliveryTimeMax} min
                </AppText>
              </View>
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="bicycle-outline" size={14} color={colors.textSecondary} />
                <AppText variant="captionMedium" tone="secondary" style={styles.metaText}>
                  {store.deliveryFee === 0 ? 'Free' : formatCurrency(store.deliveryFee)}
                </AppText>
              </View>
            </View>
            <View style={styles.infoBottom}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <AppText variant="caption" tone="tertiary" style={styles.metaText} numberOfLines={1}>
                {store.address} · {store.distanceKm.toFixed(1)} km away · Min order {formatCurrency(store.minOrder)}
              </AppText>
            </View>
            {!store.isOpen ? (
              <View style={[styles.closedBanner, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="moon" size={14} color={palette.error} />
                <AppText variant="captionMedium" tone="error" style={styles.metaText}>
                  This store is currently closed. You can browse the menu but cannot order right now.
                </AppText>
              </View>
            ) : store.promoLabel ? (
              <View style={[styles.closedBanner, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="pricetag" size={14} color={palette.primary} />
                <AppText variant="captionMedium" tone="brand" style={styles.metaText}>
                  {store.promoLabel}
                </AppText>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Skeleton width="60%" height={24} />
            <Skeleton width="40%" height={14} style={{ marginTop: spacing.xs }} />
            <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
          </>
        )}
      </View>
      {categories.length ? <CategoryTabs categories={categories} activeId={activeCategory} onPress={scrollToCategory} /> : <View style={{ height: TABS_HEIGHT }} />}
      {loading ? (
        <View>
          {[0, 1, 2, 3, 4].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </View>
      ) : null}
    </View>
  );

  const showCartBar = totals.itemCount > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Animated.View style={[styles.hero, { width }, heroStyle]}>
        {store ? <Image source={{ uri: store.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.skeleton }]} />}
        <View style={styles.heroTint} />
      </Animated.View>

      <FlashList
        ref={listRef}
        data={loading ? [] : rows}
        keyExtractor={(r) => r.id}
        getItemType={(r) => r.type}
        renderItem={renderItem}
        ListHeaderComponent={header}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 10, minimumViewTime: 50 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + (showCartBar ? 120 : spacing.xl) }}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky tabs */}
      <Animated.View pointerEvents={stickyVisible ? 'box-none' : 'none'} style={[styles.stickyTabs, { top: topBarHeight }, stickyTabsStyle]}>
        {categories.length ? <CategoryTabs categories={categories} activeId={activeCategory} onPress={scrollToCategory} /> : null}
      </Animated.View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top, height: topBarHeight }]} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }, topBarStyle]} />
        <View style={styles.topBarRow}>
          <IconButton icon="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" backgroundColor={isDark ? colors.surfaceAlt : colors.surface} />
          <Animated.View style={[styles.topBarTitle, titleStyle]}>
            <AppText variant="h4" numberOfLines={1}>
              {store?.name ?? ''}
            </AppText>
          </Animated.View>
          <View style={styles.topBarRight}>
            <IconButton icon="share-outline" onPress={() => haptic.light()} accessibilityLabel="Share" backgroundColor={isDark ? colors.surfaceAlt : colors.surface} style={{ marginRight: spacing.xs }} />
            <IconButton
              icon={favourite ? 'heart' : 'heart-outline'}
              color={favourite ? palette.error : undefined}
              onPress={() => {
                const added = toggleFavourite(storeId);
                if (added) haptic.success();
              }}
              accessibilityLabel="Favourite"
              backgroundColor={isDark ? colors.surfaceAlt : colors.surface}
            />
          </View>
        </View>
      </View>

      {/* Product detail sheet */}
      <BottomSheet visible={!!selectedProduct} onClose={() => setSelectedProduct(null)}>
        {selectedProduct ? (
          <View>
            <Image source={{ uri: selectedProduct.image }} style={[styles.sheetImage, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            <View style={styles.sheetTitleRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <AppText variant="h2">{selectedProduct.name}</AppText>
                {selectedProduct.unit ? (
                  <AppText variant="bodySm" tone="secondary">
                    {selectedProduct.unit}
                  </AppText>
                ) : null}
              </View>
              {selectedProduct.isVeg !== undefined ? (
                <Badge label={selectedProduct.isVeg ? 'Veg' : 'Non-veg'} tone={selectedProduct.isVeg ? 'success' : 'error'} />
              ) : null}
            </View>
            <AppText variant="body" tone="secondary" style={styles.sheetDescription}>
              {selectedProduct.description}
            </AppText>
            <View style={styles.sheetPriceRow}>
              <AppText variant="h2" tone="brand">
                {formatCurrency(selectedProduct.price)}
              </AppText>
              {selectedProduct.compareAtPrice ? (
                <AppText variant="body" tone="tertiary" style={styles.sheetCompare}>
                  {formatCurrency(selectedProduct.compareAtPrice)}
                </AppText>
              ) : null}
              {selectedProduct.isPopular ? <Badge label="Popular" tone="brand" icon="flame" style={{ marginLeft: 'auto' }} /> : null}
            </View>
            {store && !store.isOpen ? (
              <Button title="Store is closed right now" disabled />
            ) : selectedQty > 0 ? (
              <View style={styles.sheetActions}>
                <QuantityStepper quantity={selectedQty} size="md" onIncrement={() => increment(selectedProduct.id)} onDecrement={() => decrement(selectedProduct.id)} />
                <Button title={`Done · ${formatCurrency(selectedProduct.price * selectedQty)}`} onPress={() => setSelectedProduct(null)} style={{ flex: 1, marginLeft: spacing.sm }} />
              </View>
            ) : (
              <Button title={`Add to cart · ${formatCurrency(selectedProduct.price)}`} icon="cart-outline" onPress={() => handleAdd(selectedProduct)} />
            )}
          </View>
        ) : null}
      </BottomSheet>

      {/* Floating cart bar */}
      {showCartBar ? (
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={[styles.cartBarWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable
            onPress={() => {
              haptic.medium();
              navigation.navigate('Main', { screen: 'CartTab' });
            }}
            style={({ pressed }) => [styles.cartBar, { backgroundColor: palette.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }, shadow.medium]}
            accessibilityRole="button"
            accessibilityLabel={`View cart, ${totals.itemCount} items, ${formatCurrency(totals.subtotal)}`}
          >
            <View style={styles.cartBadge}>
              <AppText variant="bodySmSemiBold" color={palette.white}>
                {totals.itemCount}
              </AppText>
            </View>
            <AppText variant="button" color={palette.white} style={styles.cartText}>
              View Cart ({pluralize(totals.itemCount, 'item')} · {formatCurrency(totals.subtotal)})
            </AppText>
            <Ionicons name="arrow-forward" size={20} color={palette.white} />
          </Pressable>
          {store && totals.subtotal < store.minOrder ? (
            <Badge label={`Add ${formatCurrency(store.minOrder - totals.subtotal)} more to reach the minimum order`} tone="warning" style={styles.minOrder} />
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { position: 'absolute', top: 0, left: 0, height: HERO_HEIGHT, backgroundColor: '#DDD' },
  heroTint: { ...absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  infoCard: { marginHorizontal: spacing.md, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  infoTop: { flexDirection: 'row', alignItems: 'flex-start' },
  infoTitle: { flex: 1, marginRight: spacing.sm },
  infoLogo: { width: 56, height: 56, borderRadius: radius.button, backgroundColor: '#EEE' },
  infoMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  metaPill: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 4 },
  metaText: { marginLeft: 4, flexShrink: 1 },
  infoBottom: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  closedBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.sm, padding: spacing.xs, marginTop: spacing.sm },
  tabs: { height: TABS_HEIGHT, borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: spacing.md, alignItems: 'center' },
  tab: { paddingHorizontal: spacing.sm, height: TABS_HEIGHT, justifyContent: 'center' },
  tabIndicator: { position: 'absolute', bottom: 0, left: spacing.sm, right: spacing.sm, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  stickyTabs: { position: 'absolute', left: 0, right: 0, height: TABS_HEIGHT },
  sectionTitle: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  topBarTitle: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  topBarRight: { flexDirection: 'row' },
  cartBarWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, alignItems: 'center' },
  cartBar: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: radius.card, paddingHorizontal: spacing.md, alignSelf: 'stretch' },
  cartBadge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cartText: { flex: 1, marginLeft: spacing.sm },
  minOrder: { marginTop: spacing.xs },
  sheetImage: { width: '100%', height: 200, borderRadius: radius.card, marginBottom: spacing.md },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  sheetDescription: { marginBottom: spacing.md },
  sheetPriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sheetCompare: { marginLeft: spacing.xs, textDecorationLine: 'line-through' },
  sheetActions: { flexDirection: 'row', alignItems: 'center' },
});
