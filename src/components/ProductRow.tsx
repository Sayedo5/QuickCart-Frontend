import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { QuantityStepper } from './QuantityStepper';
import { radius, shadow, spacing, useTheme } from '@/theme';
import { Product } from '@/data/types';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

interface ProductRowProps {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onPress?: (product: Product) => void;
  disabled?: boolean;
}

const BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

/** Memoized so cart updates elsewhere do not re-render every row in the menu. */
export const ProductRow = React.memo(function ProductRow({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
  disabled,
}: ProductRowProps) {
  const { colors, palette, isDark } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.divider, opacity: disabled ? 0.55 : 1 }]}>
      <Pressable
        style={styles.info}
        onPress={onPress ? () => onPress(product) : undefined}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `View ${product.name}` : undefined}
      >
        <View style={styles.titleRow}>
          {product.isVeg !== undefined ? (
            <View style={[styles.vegMark, { borderColor: product.isVeg ? palette.secondary : palette.error }]}>
              <View style={[styles.vegDot, { backgroundColor: product.isVeg ? palette.secondary : palette.error }]} />
            </View>
          ) : null}
          <AppText variant="bodySemiBold" numberOfLines={1} style={styles.name}>
            {product.name}
          </AppText>
        </View>
        {product.isPopular ? (
          <View style={styles.popular}>
            <Ionicons name="flame" size={12} color={palette.primary} />
            <AppText variant="label" tone="brand" style={styles.popularText}>
              Popular
            </AppText>
          </View>
        ) : null}
        <AppText variant="bodySm" tone="secondary" numberOfLines={2} style={styles.description}>
          {product.description}
        </AppText>
        <View style={styles.priceRow}>
          <AppText variant="bodySemiBold">{formatCurrency(product.price)}</AppText>
          {product.compareAtPrice ? (
            <AppText variant="bodySm" tone="tertiary" style={styles.compareAt}>
              {formatCurrency(product.compareAtPrice)}
            </AppText>
          ) : null}
          {product.unit ? (
            <AppText variant="caption" tone="tertiary" style={styles.unit}>
              · {product.unit}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.imageCol}>
        <Pressable onPress={onPress ? () => onPress(product) : undefined} accessibilityLabel={`${product.name} photo`}>
          <Image
            source={{ uri: product.image }}
            style={[styles.image, { backgroundColor: colors.surfaceAlt }]}
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            transition={200}
            cachePolicy="memory-disk"
          />
        </Pressable>
        <View style={[styles.action, !isDark ? shadow.soft : null]}>
          {quantity > 0 ? (
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => onIncrement(product.id)}
              onDecrement={() => onDecrement(product.id)}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name}`}
              disabled={disabled}
              onPress={() => {
                haptic.light();
                onAdd(product);
              }}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: palette.primary,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
            >
              <Ionicons name="add" size={20} color={palette.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, paddingRight: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  vegMark: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegDot: { width: 7, height: 7, borderRadius: 4 },
  name: { flex: 1 },
  popular: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  popularText: { marginLeft: 3 },
  description: { marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  compareAt: { marginLeft: spacing.xs, textDecorationLine: 'line-through' },
  unit: { marginLeft: 4 },
  imageCol: { width: 100, alignItems: 'center' },
  image: { width: 100, height: 100, borderRadius: radius.card },
  action: { marginTop: -16, borderRadius: radius.button },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
