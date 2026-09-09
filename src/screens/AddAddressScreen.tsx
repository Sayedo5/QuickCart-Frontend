import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, Input, ScreenHeader } from '@/components';
import { Address } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { useAddressStore } from '@/store/useAddressStore';
import { absoluteFill, palette, radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const LABELS: Array<{ key: Address['label']; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'Home', icon: 'home' },
  { key: 'Work', icon: 'briefcase' },
  { key: 'Other', icon: 'location' },
];

export function AddAddressScreen({ navigation }: RootScreenProps<'AddAddress'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const addAddress = useAddressStore((s) => s.addAddress);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const [label, setLabel] = useState<Address['label']>('Home');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('Lahore, Punjab');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ street?: string; city?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (street.trim().length < 4) next.street = 'Enter a valid street address.';
    if (city.trim().length < 2) next.city = 'Enter your city.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const address = await addAddress({ label, street: street.trim(), apartment: apartment.trim() || undefined, city: city.trim(), instructions: instructions.trim() || undefined, isDefault });
    selectAddress(address.id);
    haptic.success();
    setSaving(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add New Address" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card style={styles.mapCard} padded={false}>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.gridLine, { backgroundColor: colors.border, top: i * 28 }]} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <View key={`v${i}`} style={[styles.gridLineV, { backgroundColor: colors.border, left: i * 60 }]} />
              ))}
            </View>
            <View style={[styles.pin, { backgroundColor: palette.primary }]}>
              <Ionicons name="location" size={22} color={palette.white} />
            </View>
            <AppText variant="caption" tone="secondary" style={styles.mapHint}>
              Location is set from the address you enter
            </AppText>
          </View>
        </Card>

        <AppText variant="bodySmMedium" tone="secondary" style={styles.label}>
          Save as
        </AppText>
        <View style={styles.labels}>
          {LABELS.map((l) => {
            const active = label === l.key;
            return (
              <Pressable
                key={l.key}
                onPress={() => {
                  haptic.selection();
                  setLabel(l.key);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.labelChip, { backgroundColor: active ? palette.primary : colors.surface, borderColor: active ? palette.primary : colors.border }]}
              >
                <Ionicons name={l.icon} size={16} color={active ? palette.white : colors.textSecondary} />
                <AppText variant="bodySmMedium" color={active ? palette.white : colors.text} style={{ marginLeft: 6 }}>
                  {l.key}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Input label="Street address" placeholder="House 12, Street 5, Sector A" value={street} onChangeText={(t) => { setStreet(t); setErrors((e) => ({ ...e, street: undefined })); }} error={errors.street} icon="map-outline" containerStyle={styles.field} autoCapitalize="words" />
        <Input label="Apartment, floor, etc. (optional)" placeholder="DHA Phase 6, near Jalal Sons" value={apartment} onChangeText={setApartment} icon="business-outline" containerStyle={styles.field} autoCapitalize="words" />
        <Input label="City" placeholder="Lahore, Punjab" value={city} onChangeText={(t) => { setCity(t); setErrors((e) => ({ ...e, city: undefined })); }} error={errors.city} icon="navigate-outline" containerStyle={styles.field} autoCapitalize="words" />
        <Input label="Delivery instructions (optional)" placeholder="Ring the bell, call on arrival…" value={instructions} onChangeText={setInstructions} icon="chatbox-ellipses-outline" containerStyle={styles.field} multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />

        <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">Set as default address</AppText>
            <AppText variant="caption" tone="secondary">
              Used automatically for new orders
            </AppText>
          </View>
          <Switch value={isDefault} onValueChange={(v) => { haptic.selection(); setIsDefault(v); }} trackColor={{ true: palette.primary, false: colors.border }} thumbColor={palette.white} />
        </View>

        <Button title="Save Address" onPress={save} loading={saving} size="lg" icon="checkmark" style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  mapCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  mapPlaceholder: { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridLines: { ...absoluteFill },
  gridLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  pin: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  mapHint: { position: 'absolute', bottom: spacing.xs },
  label: { marginBottom: 6 },
  labels: { flexDirection: 'row', marginBottom: spacing.md },
  labelChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 40, borderRadius: radius.pill, borderWidth: 1, marginRight: spacing.xs },
  field: { marginBottom: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
});
