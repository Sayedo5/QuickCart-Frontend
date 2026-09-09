import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge, RatingBadge } from './Badge';
import { absoluteFill, radius, shadow, spacing, useTheme } from '@/theme';
import { Store } from '@/data/types';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
  compact?: boolean;
}

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const StoreCard = React.memo(function StoreCard({ store, onPress, compact }: StoreCardProps) {
  const { colors, palette, isDark } = useTheme();
  const feeLabel = store.deliveryFee === 0 ? 'Free delivery' : `${formatCurrency(store.deliveryFee)} delivery`;

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${store.name}`}
        onPress={() => {
          haptic.light();
          onPress(store);
        }}
        style={({ pressed }) => [
          styles.compact,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          !isDark ? shadow.soft : null,
        ]}
      >
        <Image source={{ uri: store.image }} style={styles.compactImage} contentFit="cover" placeholder={{ blurhash: BLURHASH }} transition={200} cachePolicy="memory-disk" />
        <View style={styles.compactBody}>
          <AppText variant="bodySemiBold" numberOfLines={1}>
            {store.name}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {store.area} · {store.tags.slice(0, 2).join(' · ')}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color={palette.star} />
            <AppText variant="captionMedium" style={styles.metaText}>
              {store.rating.toFixed(1)}
            </AppText>
            <AppText variant="caption" tone="tertiary" style={styles.metaText}>
              · {store.deliveryTimeMin}-{store.deliveryTimeMax} min
            </AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${store.name}`}
      onPress={() => {
        haptic.light();
        onPress(store);
      }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? StyleSheet.hairlineWidth : 0 },
        !isDark ? shadow.soft : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: store.image }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: BLURHASH }}
          transition={250}
          cachePolicy="memory-disk"
        />
        {store.promoLabel ? <Badge label={store.promoLabel} tone="brand" icon="pricetag" style={styles.promo} /> : null}
        {!store.isOpen ? (
          <View style={styles.closedOverlay}>
            <Badge label="Closed" tone="dark" />
          </View>
        ) : null}
        <RatingBadge rating={store.rating} count={store.ratingCount} style={styles.rating} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="h4" numberOfLines={1} style={styles.title}>
            {store.name}
          </AppText>
          <AppText variant="caption" tone="tertiary">
            {store.distanceKm.toFixed(1)} km
          </AppText>
        </View>
        <AppText variant="bodySm" tone="secondary" numberOfLines={1}>
          {store.area} · {store.tags.join(' · ')}
        </AppText>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <AppText variant="captionMedium" tone="secondary" style={styles.metaText}>
            {store.deliveryTimeMin}-{store.deliveryTimeMax} min
          </AppText>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Ionicons name="bicycle-outline" size={15} color={store.deliveryFee === 0 ? palette.secondary : colors.textSecondary} />
          <AppText variant="captionMedium" color={store.deliveryFee === 0 ? palette.secondaryPressed : colors.textSecondary} style={styles.metaText}>
            {feeLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  imageWrap: { height: 160, backgroundColor: '#EEE' },
  image: { width: '100%', height: '100%' },
  promo: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  rating: { position: 'absolute', bottom: spacing.sm, left: spacing.sm },
  closedOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.sm, paddingHorizontal: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, marginRight: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { marginLeft: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: spacing.xs },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compactImage: { width: 64, height: 64, borderRadius: radius.button, backgroundColor: '#EEE' },
  compactBody: { flex: 1, marginHorizontal: spacing.sm },
});
