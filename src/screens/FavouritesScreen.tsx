import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, EmptyState, ScreenHeader, StoreCard, StoreCardSkeleton } from '@/components';
import { Store } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { palette, spacing, useTheme } from '@/theme';

/**
 * Saved stores. Ids come from the favourites store (synced with the backend) and
 * the store records are fetched fresh so prices and open/closed state are current.
 */
export function FavouritesScreen({ navigation }: RootScreenProps<'Favourites'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ids = useFavouritesStore((s) => s.storeIds);
  const syncFavourites = useFavouritesStore((s) => s.sync);

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        if (ids.length === 0) {
          setStores([]);
          return;
        }
        // One list request, filtered locally, so this works against both API modes.
        const page = await api.getStores();
        setStores(ids.map((id) => page.items.find((s) => s.id === id)).filter((s): s is Store => !!s));
      } catch (e) {
        setError(toApiError(e).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ids],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const onRefresh = useCallback(async () => {
    await syncFavourites();
    await load('refresh');
  }, [syncFavourites, load]);

  if (loading && stores.length === 0 && ids.length > 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Favourites" />
        <View style={styles.loading}>
          <StoreCardSkeleton />
          <StoreCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Favourites" subtitle={stores.length ? `${stores.length} saved place${stores.length === 1 ? '' : 's'}` : undefined} />
      {error && stores.length === 0 ? (
        <View style={styles.centre}>
          <EmptyState icon="cloud-offline-outline" title="Could not load favourites" subtitle={error} actionLabel="Try again" onAction={() => load('initial')} />
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.centre}>
          <EmptyState
            icon="heart-outline"
            title="No favourites yet"
            subtitle="Tap the heart on any store to save it here for quick reordering."
            actionLabel="Explore stores"
            onAction={() => navigation.navigate('Main', { screen: 'HomeTab' })}
            accent="#E53935"
          />
        </View>
      ) : (
        <FlashList
          data={stores}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <StoreCard store={item} onPress={(s) => navigation.navigate('StoreDetail', { storeId: s.id })} />}
          ListHeaderComponent={
            <AppText variant="bodySm" tone="secondary" style={styles.hint}>
              Tap the heart on any store page to add or remove it here.
            </AppText>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl, paddingTop: spacing.xs }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { paddingTop: spacing.sm },
  centre: { flex: 1, justifyContent: 'center' },
  hint: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});
