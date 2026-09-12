import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AppText, BrandLockup, Button, Input } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { useCityStore } from '@/store/useCityStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { isValidEmail } from '@/utils/validation';

/**
 * Email-based sign-in. The backend emails a 6-digit code (there is no free SMS
 * OTP provider), verifies it, then issues a JWT. An unknown email creates the
 * account on the spot — name and phone are collected later, from Edit Profile —
 * so a brand-new customer reaches the home screen straight after verifying.
 */
export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidEmail(email);

  const sendCode = async () => {
    if (loading) return;
    if (!valid) {
      haptic.error();
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await api.sendOtp({ email: email.trim().toLowerCase(), purpose: 'login' });
      haptic.success();
      navigation.navigate('Otp', {
        email: email.trim().toLowerCase(),
        destination: session.destination,
        isNewUser: session.isNewUser,
        devCode: session.devCode,
      });
    } catch (e) {
      haptic.error();
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup height={56} tagline="Pakistan's fastest delivery" style={styles.brand} />

        <AppText variant="h1" style={styles.title}>
          Sign in or sign up
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          Enter your email and we will send you a 6-digit verification code.
        </AppText>

        <Input
          label="Email address"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          error={error ?? undefined}
          hint="The code arrives by email and expires in 5 minutes."
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          containerStyle={styles.field}
        />

        <Button title="Continue with email" onPress={sendCode} disabled={!valid} loading={loading} size="lg" icon="paper-plane-outline" style={styles.cta} />

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary" style={styles.infoText}>
            No password to remember. We confirm it is you with a one-time code.
          </AppText>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <AppText variant="caption" tone="tertiary" style={styles.dividerText}>
            delivering across Pakistan
          </AppText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.badges}>
          {(
            [
              { icon: 'restaurant-outline', label: 'Restaurants' },
              { icon: 'basket-outline', label: 'Grocery' },
              { icon: 'medkit-outline', label: 'Pharmacy' },
            ] as const
          ).map((b) => (
            <View key={b.label} style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name={b.icon} size={18} color={palette.primary} />
              <AppText variant="caption" tone="secondary" style={styles.badgeText}>
                {b.label}
              </AppText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.reset({ index: 0, routes: [{ name: useCityStore.getState().selected ? 'Main' : 'CitySelect' }] })}
          style={styles.browse}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <AppText variant="bodySmSemiBold" tone="brand" align="center" style={{ opacity: pressed ? 0.6 : 1 }}>
              Browse without signing in
            </AppText>
          )}
        </Pressable>

        <AppText variant="caption" tone="tertiary" align="center" style={styles.terms}>
          By continuing you agree to our <AppText variant="captionMedium" tone="brand">Terms of Service</AppText> and{' '}
          <AppText variant="captionMedium" tone="brand">Privacy Policy</AppText>.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  brand: { marginBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  cta: { marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  infoText: { flex: 1, marginLeft: spacing.xs },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { marginHorizontal: spacing.sm },
  badges: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  badge: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
  badgeText: { marginTop: 4 },
  browse: { marginTop: spacing.lg, paddingVertical: spacing.xs },
  terms: { marginTop: 'auto', paddingTop: spacing.lg },
});
