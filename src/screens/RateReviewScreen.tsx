import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Button, Input, ScreenHeader, SuccessOverlay } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { useOrderStore } from '@/store/useOrderStore';
import { palette, radius, spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

const TAGS = ['Hot & fresh', 'On time', 'Friendly rider', 'Well packed', 'Great value', 'Accurate order'];
const TIPS = [0, 50, 100, 200];
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Star({ index, filled, onPress }: { index: number; filled: boolean; onPress: (i: number) => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        scale.value = withSequence(withTiming(1.3, { duration: 120 }), withTiming(1, { duration: 160 }));
        onPress(index);
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${index} star${index > 1 ? 's' : ''}`}
    >
      <Animated.View style={style}>
        <Ionicons name={filled ? 'star' : 'star-outline'} size={44} color={filled ? palette.star : '#C8C8C8'} />
      </Animated.View>
    </Pressable>
  );
}

export function RateReviewScreen({ navigation, route }: RootScreenProps<'RateReview'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === route.params.orderId));
  const rateOrder = useOrderStore((s) => s.rateOrder);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const goHome = useCallback(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), [navigation]);

  const submit = async () => {
    if (!order || stars === 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    await rateOrder(order.id, { stars, comment: [tags.join(', '), comment.trim()].filter(Boolean).join(' — ') || undefined, tip });
    setSubmitting(false);
    setDone(true);
  };

  if (!order) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Rate order" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="Rate your order"
        right={
          <Pressable onPress={goHome} hitSlop={8} accessibilityRole="button">
            <AppText variant="bodySmSemiBold" tone="secondary">
              Skip
            </AppText>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: order.storeImage }} style={styles.storeImage} contentFit="cover" cachePolicy="memory-disk" />
          <AppText variant="h2" align="center" style={{ marginTop: spacing.sm }}>
            How was {order.storeName}?
          </AppText>
          <AppText variant="body" tone="secondary" align="center">
            Your feedback helps stores and riders improve.
          </AppText>
        </View>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} index={i} filled={i <= stars} onPress={setStars} />
          ))}
        </View>
        <AppText variant="bodySemiBold" align="center" tone={stars ? 'brand' : 'tertiary'} style={styles.starLabel}>
          {stars ? LABELS[stars] : 'Tap a star to rate'}
        </AppText>

        <AppText variant="h4" style={styles.sectionTitle}>
          What went well?
        </AppText>
        <View style={styles.tags}>
          {TAGS.map((t) => {
            const active = tags.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => {
                  haptic.selection();
                  setTags((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]));
                }}
                style={[styles.tag, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? palette.primary : colors.border }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                {active ? <Ionicons name="checkmark" size={14} color={palette.primary} style={{ marginRight: 4 }} /> : null}
                <AppText variant="bodySmMedium" color={active ? palette.primary : colors.text}>
                  {t}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="h4" style={styles.sectionTitle}>
          Tip {order.rider.name.split(' ')[0]}
        </AppText>
        <View style={styles.tips}>
          {TIPS.map((t) => {
            const active = tip === t;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  haptic.selection();
                  setTip(t);
                }}
                style={[styles.tip, { backgroundColor: active ? palette.primary : colors.surface, borderColor: active ? palette.primary : colors.border }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <AppText variant="bodySemiBold" color={active ? palette.white : colors.text}>
                  {t === 0 ? 'No tip' : formatCurrency(t)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Input label="Add a comment (optional)" placeholder="Tell us more about your experience…" value={comment} onChangeText={setComment} multiline numberOfLines={4} style={styles.comment} containerStyle={{ marginTop: spacing.md }} />

        <Button title="Submit review" onPress={submit} disabled={stars === 0} loading={submitting} size="lg" style={{ marginTop: spacing.lg }} />
      </ScrollView>
      <SuccessOverlay visible={done} title="Thanks for your feedback!" subtitle={tip > 0 ? `Your ${formatCurrency(tip)} tip has been sent to ${order.rider.name.split(' ')[0]}.` : 'We appreciate you taking the time.'} onDone={goHome} durationMs={2000} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  storeImage: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#EEE' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  starLabel: { marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, height: 38, borderRadius: radius.pill, borderWidth: 1, marginRight: spacing.xs, marginBottom: spacing.xs },
  tips: { flexDirection: 'row', gap: spacing.xs },
  tip: { flex: 1, height: 46, borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  comment: { minHeight: 96, textAlignVertical: 'top' },
});
