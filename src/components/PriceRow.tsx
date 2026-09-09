import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';

interface PriceRowProps {
  label: string;
  value: number;
  bold?: boolean;
  tone?: 'default' | 'success' | 'muted';
  freeLabel?: string;
}

export function PriceRow({ label, value, bold, tone = 'default', freeLabel }: PriceRowProps) {
  const { palette } = useTheme();
  const isFree = value === 0 && !!freeLabel;
  const valueColor = tone === 'success' || isFree ? palette.secondaryPressed : undefined;
  return (
    <View style={styles.row}>
      <AppText variant={bold ? 'h4' : 'body'} tone={bold ? 'primary' : 'secondary'}>
        {label}
      </AppText>
      <AppText variant={bold ? 'h4' : 'bodyMedium'} color={valueColor}>
        {isFree ? freeLabel : tone === 'success' ? `-${formatCurrency(value)}` : formatCurrency(value)}
      </AppText>
    </View>
  );
}

export function Divider({ inset }: { inset?: boolean }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider, marginHorizontal: inset ? spacing.md : 0 }]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
