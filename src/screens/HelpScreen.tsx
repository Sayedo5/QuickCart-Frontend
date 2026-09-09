import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, EmptyState, ScreenHeader, Skeleton } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { api, toApiError } from '@/services/api';
import type { Faq } from '@/services/api.types';
import { useAppConfigStore } from '@/store/useAppConfigStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

/** Help centre. FAQs and support contacts are managed from the admin panel. */
export function HelpScreen(_: RootScreenProps<'Help'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useAppConfigStore((s) => s.settings);
  const cachedFaqs = useAppConfigStore((s) => s.faqs);

  const [faqs, setFaqs] = useState<Faq[]>(cachedFaqs);
  const [loading, setLoading] = useState(cachedFaqs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(cachedFaqs[0]?.id ?? null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const rows = await api.getFaqs();
      setFaqs(rows);
      setOpen((prev) => prev ?? rows[0]?.id ?? null);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const contacts = [
    settings.supportWhatsApp
      ? { icon: 'logo-whatsapp' as const, title: 'WhatsApp', subtitle: 'Replies in ~2 min', url: `https://wa.me/${settings.supportWhatsApp.replace(/\D/g, '')}`, color: '#25D366' }
      : null,
    settings.supportPhone ? { icon: 'call' as const, title: 'Call support', subtitle: settings.supportPhone, url: `tel:${settings.supportPhone.replace(/\s/g, '')}`, color: palette.secondary } : null,
    settings.supportEmail ? { icon: 'mail' as const, title: 'Email us', subtitle: settings.supportEmail, url: `mailto:${settings.supportEmail}`, color: '#7C5CFF' } : null,
  ].filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Help & FAQ" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={palette.primary} />}
      >
        {contacts.length > 0 ? (
          <View style={styles.contacts}>
            {contacts.map((c) => (
              <Pressable
                key={c.title}
                onPress={() => {
                  haptic.light();
                  Linking.openURL(c.url).catch(() => {});
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.contact, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.contactIcon, { backgroundColor: `${c.color}1A` }]}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                </View>
                <AppText variant="bodySmSemiBold" align="center" style={styles.contactTitle}>
                  {c.title}
                </AppText>
                <AppText variant="caption" tone="tertiary" align="center" numberOfLines={1}>
                  {c.subtitle}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <AppText variant="h4" style={styles.title}>
          Frequently asked questions
        </AppText>

        {loading && faqs.length === 0 ? (
          <Card padded={false}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.faqHeader, { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Skeleton width="70%" height={14} />
              </View>
            ))}
          </Card>
        ) : error && faqs.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="cloud-offline-outline" title="Could not load answers" subtitle={error} actionLabel="Try again" onAction={() => load('initial')} />
          </Card>
        ) : faqs.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="help-circle-outline" title="No questions yet" subtitle="Our team is adding answers here shortly." />
          </Card>
        ) : (
          <Card padded={false}>
            {faqs.map((f, i) => {
              const expanded = open === f.id;
              return (
                <View key={f.id} style={{ borderBottomColor: colors.divider, borderBottomWidth: i < faqs.length - 1 ? StyleSheet.hairlineWidth : 0 }}>
                  <Pressable
                    onPress={() => {
                      haptic.selection();
                      setOpen(expanded ? null : f.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={({ pressed }) => [styles.faqHeader, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
                  >
                    <AppText variant="bodyMedium" style={styles.faqQuestion}>
                      {f.question}
                    </AppText>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={expanded ? palette.primary : colors.textTertiary} />
                  </Pressable>
                  {expanded ? (
                    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} layout={LinearTransition} style={styles.faqBody}>
                      <AppText variant="bodySm" tone="secondary">
                        {f.answer}
                      </AppText>
                    </Animated.View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        )}

        <View style={[styles.legal, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary" style={styles.legalText}>
            Read our <AppText variant="captionMedium" tone="brand">Terms of Service</AppText> and{' '}
            <AppText variant="captionMedium" tone="brand">Privacy Policy</AppText>.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contacts: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  contact: { flex: 1, alignItems: 'center', padding: spacing.sm, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
  contactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { marginTop: spacing.xs },
  title: { marginBottom: spacing.sm },
  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  faqQuestion: { flex: 1, marginRight: spacing.sm },
  faqBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  legal: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, padding: spacing.sm, marginTop: spacing.md },
  legalText: { marginLeft: 6, flex: 1 },
});
