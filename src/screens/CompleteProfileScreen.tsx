import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, BottomSheet, Button, Input, Logo, ScreenHeader } from '@/components';
import { countries } from '@/data/misc';
import { Country } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { fonts, palette, radius, spacing, useTheme } from '@/theme';
import { formatPkPhone } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { networkLabel, validatePkMobile } from '@/utils/validation';

/** Final signup step: the email is verified, now collect a name and mobile number. */
export function CompleteProfileScreen({ navigation, route }: RootScreenProps<'CompleteProfile'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { email, signupToken } = route.params;
  const signIn = useAuthStore((s) => s.signIn);

  const [name, setName] = useState('');
  const [country, setCountry] = useState<Country>(countries[0]);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const pkCheck = country.dialCode === '+92' ? validatePkMobile(`0${phone}`) : null;
  const phoneValid = pkCheck ? pkCheck.valid : phone.length >= 7;
  const nameValid = name.trim().length >= 2;

  const submit = async () => {
    const next: typeof errors = {};
    if (!nameValid) next.name = 'Enter your full name.';
    if (!phoneValid) next.phone = pkCheck?.error ?? 'Enter a valid mobile number.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic.error();
      return;
    }
    setSaving(true);
    try {
      const result = await api.completeSignup({ signupToken, name: name.trim(), phone, dialCode: country.dialCode });
      haptic.success();
      await signIn(result);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      haptic.error();
      setErrors({ form: toApiError(e).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Logo height={44} />
          <View style={[styles.iconWrap, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.onSecondarySoft} />
          </View>
        </View>

        <AppText variant="h1" style={styles.title}>
          Almost there
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          {email} is verified. Tell us your name and mobile number so riders can reach you.
        </AppText>

        {errors.form ? (
          <View style={[styles.formError, { backgroundColor: colors.errorSoft }]}>
            <Ionicons name="alert-circle" size={16} color={palette.error} />
            <AppText variant="bodySm" tone="error" style={styles.formErrorText}>
              {errors.form}
            </AppText>
          </View>
        ) : null}

        <Input
          label="Full name"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setErrors((p) => ({ ...p, name: undefined }));
          }}
          error={errors.name}
          icon="person-outline"
          placeholder="Ahmed Raza"
          autoCapitalize="words"
          autoComplete="name"
          containerStyle={styles.field}
        />

        <AppText variant="bodySmMedium" tone="secondary" style={styles.label}>
          Mobile number
        </AppText>
        <View style={[styles.phoneRow, { backgroundColor: colors.inputBackground, borderColor: errors.phone ? palette.error : colors.border, borderWidth: errors.phone ? 1.5 : 1 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dialCode}`}
            onPress={() => {
              haptic.selection();
              setPickerOpen(true);
            }}
            style={({ pressed }) => [styles.countryBtn, { borderRightColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText variant="h4">{country.flag}</AppText>
            <AppText variant="bodyMedium" style={styles.dialCode}>
              {country.dialCode}
            </AppText>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            value={country.dialCode === '+92' ? formatPkPhone(phone) : phone}
            onChangeText={(t) => {
              setPhone(t.replace(/\D/g, '').slice(0, 10));
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            placeholder="300 1234567"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            style={[styles.phoneInput, { color: colors.text }]}
          />
        </View>
        {errors.phone ? (
          <AppText variant="caption" tone="error" style={styles.helper}>
            {errors.phone}
          </AppText>
        ) : (
          <AppText variant="caption" tone="tertiary" style={styles.helper}>
            {pkCheck?.valid ? `${networkLabel[pkCheck.network]} number · looks good` : 'Format: 03XX XXXXXXX'}
          </AppText>
        )}

        <Button title="Create my account" onPress={submit} loading={saving} disabled={!nameValid || !phoneValid} size="lg" icon="arrow-forward" iconPosition="right" style={styles.cta} />
      </ScrollView>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Select country" maxHeightRatio={0.7}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {countries.map((item) => {
            const selected = item.code === country.code;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                onPress={() => {
                  haptic.selection();
                  setCountry(item);
                  setPickerOpen(false);
                }}
                style={({ pressed }) => [styles.countryRow, { backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent' }]}
              >
                <AppText variant="h3">{item.flag}</AppText>
                <AppText variant="bodyMedium" style={styles.countryName}>
                  {item.name}
                </AppText>
                <AppText variant="bodyMedium" tone="secondary">
                  {item.dialCode}
                </AppText>
                {selected ? <Ionicons name="checkmark-circle" size={20} color={palette.primary} style={styles.check} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  formError: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, padding: spacing.sm, marginBottom: spacing.md },
  formErrorText: { flex: 1, marginLeft: spacing.xs },
  field: { marginBottom: spacing.md },
  label: { marginBottom: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, minHeight: 52, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, alignSelf: 'stretch', borderRightWidth: 1 },
  dialCode: { marginHorizontal: 6 },
  phoneInput: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, paddingHorizontal: spacing.sm, alignSelf: 'stretch' },
  helper: { marginTop: 6, marginBottom: spacing.lg },
  cta: { marginTop: spacing.xs },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.button },
  countryName: { flex: 1, marginLeft: spacing.sm },
  check: { marginLeft: spacing.sm },
});
