import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { spacing, useTheme } from '@/theme';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, right, onBack, showBack = true, transparent, style, large }: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const canGoBack = navigation.canGoBack();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xs, backgroundColor: transparent ? 'transparent' : colors.background },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack && (canGoBack || onBack) ? (
            <IconButton
              icon="chevron-back"
              variant="soft"
              onPress={onBack ?? (() => navigation.goBack())}
              accessibilityLabel="Go back"
            />
          ) : null}
        </View>
        {!large && title ? (
          <View style={styles.center}>
            <AppText variant="h4" numberOfLines={1} align="center">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" tone="secondary" numberOfLines={1} align="center">
                {subtitle}
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={styles.center} />
        )}
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
      {large && title ? (
        <View style={styles.largeTitle}>
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="secondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  side: { width: 44, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  largeTitle: { marginTop: spacing.xs },
});
