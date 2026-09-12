import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Logo, OTPInput, OTPInputHandle, ScreenHeader } from '@/components';
import { useCountdown } from '@/hooks/useCountdown';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useCityStore } from '@/store/useCityStore';
import { palette, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const RESEND_SECONDS = 45;

/** Verifies the 6-digit email code, then signs in or continues to profile setup. */
export function OtpScreen({ navigation, route }: RootScreenProps<'Otp'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const [destination, setDestination] = useState(route.params.destination);
  const [devCode, setDevCode] = useState(route.params.devCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const remaining = useCountdown(RESEND_SECONDS, resendKey);
  const otpRef = useRef<OTPInputHandle>(null);
  const signIn = useAuthStore((s) => s.signIn);

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== 6 || verifying) return;
      setVerifying(true);
      setError(null);
      try {
        const result = await api.verifyOtp({ email, code: value });
        haptic.success();
        // A verified email is enough to create the account. Name and phone are
        // asked for at checkout instead, so nothing blocks a brand-new customer
        // from browsing the moment the code clears.
        const session = result.isNewUser ? await api.completeSignup({ signupToken: result.signupToken }) : result;
        await signIn(session);
        // Cities are per-install, not per-account: only stop at the picker when
        // this device has not chosen one yet.
        const needsCity = !useCityStore.getState().selected;
        navigation.reset({ index: 0, routes: [{ name: needsCity ? 'CitySelect' : 'Main' }] });
      } catch (e) {
        haptic.error();
        setError(toApiError(e).message);
        otpRef.current?.shake();
        setTimeout(() => {
          setCode('');
          otpRef.current?.focus();
        }, 450);
      } finally {
        setVerifying(false);
      }
    },
    [email, verifying, signIn, navigation],
  );

  const resend = async () => {
    if (remaining > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const session = await api.sendOtp({ email, purpose: 'login' });
      setDestination(session.destination);
      setDevCode(session.devCode);
      setCode('');
      setResendKey((k) => k + 1);
      haptic.success();
    } catch (e) {
      haptic.error();
      setError(toApiError(e).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.brandRow}>
          <Logo height={44} />
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="mail-open-outline" size={22} color={palette.primary} />
          </View>
        </View>

        <AppText variant="h1" style={styles.title}>
          Check your email
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          We sent a 6-digit code to <AppText variant="bodySemiBold">{destination}</AppText>.{' '}
          <AppText variant="bodyMedium" tone="brand" onPress={() => navigation.goBack()}>
            Change email
          </AppText>
        </AppText>

        <OTPInput
          ref={otpRef}
          value={code}
          onChange={(v) => {
            setError(null);
            setCode(v);
            if (v.length === 6) verify(v);
          }}
          error={!!error}
          disabled={verifying}
        />

        <View style={styles.helperRow}>
          {error ? (
            <>
              <Ionicons name="alert-circle" size={14} color={palette.error} />
              <AppText variant="caption" tone="error" style={styles.helperText}>
                {error}
              </AppText>
            </>
          ) : devCode ? (
            <AppText variant="caption" tone="tertiary">
              Development mode — your code is {devCode}
            </AppText>
          ) : (
            <AppText variant="caption" tone="tertiary">
              The code expires in 5 minutes. Check your spam folder if it does not arrive.
            </AppText>
          )}
        </View>

        <Button title="Verify & Continue" onPress={() => verify(code)} disabled={code.length !== 6} loading={verifying} size="lg" style={styles.cta} />

        <View style={styles.resendRow}>
          <AppText variant="bodySm" tone="secondary">
            Didn&apos;t get the email?{' '}
          </AppText>
          {remaining > 0 ? (
            <AppText variant="bodySmSemiBold" tone="tertiary">
              Resend in 0:{String(remaining).padStart(2, '0')}
            </AppText>
          ) : (
            <Pressable onPress={resend} disabled={resending} hitSlop={8} accessibilityRole="button">
              <AppText variant="bodySmSemiBold" tone="brand" style={{ opacity: resending ? 0.5 : 1 }}>
                {resending ? 'Sending…' : 'Resend code'}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  helperRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, minHeight: 34 },
  helperText: { marginLeft: 4, flex: 1 },
  cta: { marginTop: spacing.md },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
});
