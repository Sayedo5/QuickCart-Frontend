import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Button, EmptyState, IconButton, ScreenHeader } from '@/components';
import { Address } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { useAddressStore } from '@/store/useAddressStore';
import { palette, radius, shadow, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const ICON: Record<Address['label'], keyof typeof Ionicons.glyphMap> = { Home: 'home', Work: 'briefcase', Other: 'location' };

export function AddressesScreen({ navigation, route }: RootScreenProps<'Addresses'>) {
  const selectMode = route.params?.selectMode ?? false;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const addresses = useAddressStore((s) => s.addresses);
  const selectedId = useAddressStore((s) => s.selectedAddressId);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const setDefault = useAddressStore((s) => s.setDefault);
  const removeAddress = useAddressStore((s) => s.removeAddress);

  const onSelect = useCallback(
    (a: Address) => {
      haptic.selection();
      selectAddress(a.id);
      if (selectMode) navigation.goBack();
    },
    [selectAddress, selectMode, navigation],
  );

  const confirmDelete = (a: Address) =>
    Alert.alert('Delete address?', `${a.label} · ${a.street} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { haptic.medium(); removeAddress(a.id); } },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={selectMode ? 'Select address' : 'Addresses'} />
      <FlashList
        data={addresses}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={<EmptyState icon="location-outline" title="No saved addresses" subtitle="Add an address to get your orders delivered." />}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              onLongPress={() => confirmDelete(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? palette.primary : colors.border, opacity: pressed ? 0.9 : 1 },
                !isDark && !selected ? shadow.soft : null,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: selected ? palette.primary : colors.surfaceAlt }]}>
                <Ionicons name={ICON[item.label]} size={20} color={selected ? palette.white : colors.textSecondary} />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <AppText variant="bodySemiBold">{item.label}</AppText>
                  {item.isDefault ? <Badge label="Default" tone="success" small style={{ marginLeft: spacing.xs }} /> : null}
                </View>
                <AppText variant="bodySm" tone="secondary">
                  {item.street}
                  {item.apartment ? `, ${item.apartment}` : ''}
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {item.city}
                </AppText>
                {item.instructions ? (
                  <AppText variant="caption" tone="tertiary" numberOfLines={1} style={{ marginTop: 2 }}>
                    “{item.instructions}”
                  </AppText>
                ) : null}
                {!item.isDefault ? (
                  <Pressable onPress={() => { haptic.selection(); setDefault(item.id); }} hitSlop={6} style={{ marginTop: 6 }}>
                    <AppText variant="captionMedium" tone="brand">
                      Set as default
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.right}>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={palette.primary} /> : null}
                <IconButton icon="trash-outline" variant="plain" size={32} iconSize={18} color={colors.textTertiary} onPress={() => confirmDelete(item)} accessibilityLabel="Delete address" />
              </View>
            </Pressable>
          );
        }}
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.sm, backgroundColor: colors.background }]}>
        <Button title="Add New Address" icon="add" onPress={() => navigation.navigate('AddAddress')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.card, borderWidth: 1.5, marginBottom: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  right: { alignItems: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
