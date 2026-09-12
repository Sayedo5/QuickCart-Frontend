import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, EmptyState, IconButton, Skeleton, StoreCard } from '@/components';
import { Product, Store } from '@/data/types';
import { useDebounce } from '@/hooks/useDebounce';
import { RootScreenProps } from '@/navigation/types';
import { api } from '@/services/api';
import { useAppConfigStore } from '@/store/useAppConfigStore';
import { useCityStore } from '@/store/useCityStore';
import { fonts, palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type Row =
  | { type: 'header'; id: string; title: string }
  | { type: 'store'; id: string; store: Store }
  | { type: 'product'; id: string; product: Product & { store: Store } };

const POPULAR = ['Biryani', 'Karahi', 'Zinger', 'Chai', 'Pizza', 'Milk', 'Mangoes', 'Paracetamol'];

let recentSearches: string[] = [];

export function SearchScreen({ navigation }: RootScreenProps<'Search'>) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  // Search is scoped to the customer's city, like the home catalog. Both hooks
  // must run every render, so resolve the fallback after they are both read.
  const selectedCity = useCityStore((s) => s.selected?.name);
  const defaultCity = useAppConfigStore((s) => s.settings.serviceCity);
  const cityName = selectedCity ?? defaultCity;
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ stores: Store[]; products: Array<Product & { store: Store }> } | null>(null);
  const [recents, setRecents] = useState(recentSearches);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = debounced.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.search(q, cityName).then((res) => {
      if (cancelled) return;
      setResults(res);
      setLoading(false);
      recentSearches = [q, ...recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      setRecents(recentSearches);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced, cityName]);

  const rows = useMemo<Row[]>(() => {
    if (!results) return [];
    const out: Row[] = [];
    if (results.stores.length) {
      out.push({ type: 'header', id: 'h_stores', title: `Stores (${results.stores.length})` });
      results.stores.forEach((s) => out.push({ type: 'store', id: `s_${s.id}`, store: s }));
    }
    if (results.products.length) {
      out.push({ type: 'header', id: 'h_products', title: `Items (${results.products.length})` });
      results.products.forEach((p) => out.push({ type: 'product', id: `p_${p.id}`, product: p }));
    }
    return out;
  }, [results]);

  const showSuggestions = !query.trim();
  const noResults = !loading && results && rows.length === 0;

  const renderChip = (label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <Pressable
      key={label}
      onPress={() => {
        haptic.selection();
        setQuery(label);
      }}
      style={({ pressed }) => [styles.chip, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <AppText variant="bodySmMedium" style={styles.chipText}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton icon="chevron-back" variant="soft" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: query ? palette.primary : colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search stores or items"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: colors.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showSuggestions ? (
        <View style={styles.suggestions}>
          {recents.length ? (
            <>
              <View style={styles.sectionRow}>
                <AppText variant="h4">Recent</AppText>
                <Pressable
                  onPress={() => {
                    recentSearches = [];
                    setRecents([]);
                  }}
                  hitSlop={8}
                >
                  <AppText variant="bodySmMedium" tone="brand">
                    Clear
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.chipsWrap}>{recents.map((r) => renderChip(r, 'time-outline'))}</View>
            </>
          ) : null}
          <AppText variant="h4" style={styles.sectionTitle}>
            Popular searches
          </AppText>
          <View style={styles.chipsWrap}>{POPULAR.map((p) => renderChip(p, 'trending-up-outline'))}</View>
        </View>
      ) : loading ? (
        <View style={styles.loading}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonRow, { borderBottomColor: colors.divider }]}>
              <Skeleton width={56} height={56} borderRadius={radius.button} />
              <View style={styles.skeletonText}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
              </View>
            </View>
          ))}
        </View>
      ) : noResults ? (
        <EmptyState
          icon="search-outline"
          title={`No results for "${debounced.trim()}"`}
          subtitle="Check the spelling or try a more general term."
        />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.id}
          getItemType={(r) => r.type}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <AppText variant="h4" style={styles.listHeader}>
                  {item.title}
                </AppText>
              );
            }
            if (item.type === 'store') {
              return <StoreCard store={item.store} compact onPress={(s) => navigation.navigate('StoreDetail', { storeId: s.id })} />;
            }
            const p = item.product;
            return (
              <Pressable
                onPress={() => {
                  haptic.light();
                  navigation.navigate('StoreDetail', { storeId: p.storeId });
                }}
                style={({ pressed }) => [styles.productRow, { borderBottomColor: colors.divider, opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
              >
                <Image source={{ uri: p.image }} style={[styles.productImage, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                <View style={styles.productBody}>
                  <AppText variant="bodySemiBold" numberOfLines={1}>
                    {p.name}
                  </AppText>
                  <AppText variant="caption" tone="secondary" numberOfLines={1}>
                    {p.store.name} · {p.store.deliveryTimeMin}-{p.store.deliveryTimeMax} min
                  </AppText>
                  <AppText variant="bodySmSemiBold" tone="brand" style={{ marginTop: 2 }}>
                    {formatCurrency(p.price)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? colors.textTertiary : colors.textSecondary} />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    height: 46,
    borderRadius: radius.button,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, marginLeft: spacing.xs, height: '100%' },
  suggestions: { padding: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.xs },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipText: { marginLeft: 6 },
  loading: { paddingTop: spacing.sm },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  skeletonText: { flex: 1, marginLeft: spacing.sm },
  listHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  productImage: { width: 56, height: 56, borderRadius: radius.button },
  productBody: { flex: 1, marginHorizontal: spacing.sm },
});
