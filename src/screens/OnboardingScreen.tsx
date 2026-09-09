import React, { useCallback, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AppText, BrandLockup, Button } from '@/components';
import { onboardingSlides } from '@/data/misc';
import { RootScreenProps } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

type Slide = (typeof onboardingSlides)[number];

function Illustration({ slide, width }: { slide: Slide; width: number }) {
  const { colors, palette } = useTheme();
  const size = Math.min(width - spacing.xl * 2, 300);
  return (
    <View style={[styles.illustration, { width: size, height: size }]}>
      <View style={[styles.blob, { width: size, height: size, backgroundColor: `${slide.accent}14` }]} />
      <View style={[styles.blob, { width: size * 0.72, height: size * 0.72, backgroundColor: `${slide.accent}26` }]} />
      <View style={[styles.mainIcon, { backgroundColor: colors.surface, shadowColor: slide.accent }]}>
        <Ionicons name={slide.icon} size={72} color={slide.accent} />
      </View>
      <View style={[styles.floating, styles.floatA, { backgroundColor: colors.surface }]}>
        <Ionicons name="star" size={18} color={palette.star} />
      </View>
      <View style={[styles.floating, styles.floatB, { backgroundColor: colors.surface }]}>
        <Ionicons name="checkmark-circle" size={20} color={palette.secondary} />
      </View>
      <View style={[styles.floating, styles.floatC, { backgroundColor: colors.surface }]}>
        <Ionicons name="location" size={18} color={palette.primary} />
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const { colors, palette } = useTheme();
  const width = useSharedValue(active ? 24 : 8);
  React.useEffect(() => {
    width.value = withTiming(active ? 24 : 8, { duration: 250 });
  }, [active, width]);
  const style = useAnimatedStyle(() => ({ width: width.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: active ? palette.primary : colors.border }, style]} />;
}

export function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const isLast = index === onboardingSlides.length - 1;

  const finish = useCallback(() => {
    completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [completeOnboarding, navigation]);

  const next = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [isLast, finish, index]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) {
      haptic.selection();
      setIndex(newIndex);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <BrandLockup height={30} />
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          {({ pressed }) => (
            <AppText variant="bodySemiBold" tone="secondary" style={{ opacity: pressed ? 0.6 : 1 }}>
              Skip
            </AppText>
          )}
        </Pressable>
      </View>
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Illustration slide={item} width={width} />
            <AppText variant="h1" align="center" style={styles.title}>
              {item.title}
            </AppText>
            <AppText variant="body" tone="secondary" align="center" style={styles.subtitle}>
              {item.subtitle}
            </AppText>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {onboardingSlides.map((s, i) => (
            <Dot key={s.id} active={i === index} />
          ))}
        </View>
        <Button
          title={isLast ? 'Get Started' : 'Next'}
          onPress={next}
          icon={isLast ? 'arrow-forward' : undefined}
          iconPosition="right"
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  illustration: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  blob: { position: 'absolute', borderRadius: 999 },
  mainIcon: {
    width: 150,
    height: 150,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  floating: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  floatA: { top: 30, right: 30 },
  floatB: { bottom: 44, left: 22 },
  floatC: { top: 70, left: 26 },
  title: { marginBottom: spacing.sm },
  subtitle: { paddingHorizontal: spacing.md },
  footer: { paddingHorizontal: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  dot: { height: 8, borderRadius: radius.pill, marginHorizontal: 4 },
});
