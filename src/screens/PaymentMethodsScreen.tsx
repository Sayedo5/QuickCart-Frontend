import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, BottomSheet, Button, IconButton, Input, ScreenHeader } from '@/components';
import { PaymentMethod, PaymentType } from '@/data/types';
import { RootScreenProps } from '@/navigation/types';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useWalletStore } from '@/store/useWalletStore';
import { palette, radius, shadow, spacing, useTheme } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import {
  cardBrandLabel,
  detectCardBrand,
  digitsOnly,
  MobileWalletProvider,
  networkLabel,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateMobileWallet,
} from '@/utils/validation';

export const PAYMENT_ICON: Record<PaymentType, keyof typeof Ionicons.glyphMap> = {
  card: 'card',
  cash: 'cash',
  wallet: 'wallet',
  jazzcash: 'phone-portrait',
  easypaisa: 'phone-portrait',
};

/** Brand accents for the icon tile. Mobile wallets use their well-known colours. */
export const PAYMENT_COLOR: Record<PaymentType, string> = {
  card: '#1A1F71',
  cash: '#2EC4B6',
  wallet: '#FF6B35',
  jazzcash: '#C8102E',
  easypaisa: '#00A651',
};

const BRAND_COLOR: Record<string, string> = { visa: '#1A1F71', mastercard: '#EB001B', amex: '#2E77BC' };

const formatCardNumber = (v: string, maxLen: number) => digitsOnly(v).slice(0, maxLen).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (v: string) => {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const formatMobile = (v: string) => {
  const d = digitsOnly(v).slice(0, 11);
  return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
};

/** Returns the subtitle for a method, pulling the live wallet balance where relevant. */
export const paymentSubtitle = (m: PaymentMethod, walletBalance: number) => {
  if (m.type === 'wallet') return `Balance: ${formatCurrency(walletBalance)}`;
  if (m.type === 'card') return `${m.subtitle} · Expires ${m.expiry}`;
  return m.subtitle;
};

type Sheet = 'card' | MobileWalletProvider | null;

export function PaymentMethodsScreen({ navigation, route }: RootScreenProps<'PaymentMethods'>) {
  const selectMode = route.params?.selectMode ?? false;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const methods = usePaymentStore((s) => s.methods);
  const selectedId = usePaymentStore((s) => s.selectedMethodId);
  const selectMethod = usePaymentStore((s) => s.selectMethod);
  const setDefault = usePaymentStore((s) => s.setDefault);
  const removeMethod = usePaymentStore((s) => s.removeMethod);
  const addCard = usePaymentStore((s) => s.addCard);
  const addMobileWallet = usePaymentStore((s) => s.addMobileWallet);
  const walletBalance = useWalletStore((s) => s.balance);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [saving, setSaving] = useState(false);

  // Card form
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});
  const brand = useMemo(() => detectCardBrand(number), [number]);
  const cardMaxLen = brand === 'amex' ? 15 : brand === 'unionpay' ? 19 : 16;

  // Mobile wallet form
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState<string | undefined>();
  const mobileCheck = useMemo(() => (sheet === 'jazzcash' || sheet === 'easypaisa' ? validateMobileWallet(sheet, mobile) : null), [sheet, mobile]);

  const closeSheet = () => {
    setSheet(null);
    setHolder('');
    setNumber('');
    setExpiry('');
    setCvv('');
    setCardErrors({});
    setMobile('');
    setMobileError(undefined);
  };

  const validateCard = () => {
    const next: Record<string, string | undefined> = {};
    if (holder.trim().length < 3 || !/^[A-Za-z .'-]+$/.test(holder.trim())) next.holder = 'Enter the name exactly as printed on the card.';
    const num = validateCardNumber(number);
    if (!num.valid) next.number = num.error;
    next.expiry = validateExpiry(expiry);
    next.cvv = validateCvv(cvv, num.brand);
    setCardErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const saveCard = async () => {
    if (!validateCard()) {
      haptic.error();
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const m = await addCard({ holder, number, expiry });
    selectMethod(m.id);
    haptic.success();
    setSaving(false);
    closeSheet();
    if (selectMode) navigation.goBack();
  };

  const saveMobileWallet = async () => {
    if (sheet !== 'jazzcash' && sheet !== 'easypaisa') return;
    const check = validateMobileWallet(sheet, mobile);
    if (!check.valid) {
      setMobileError(check.error);
      haptic.error();
      return;
    }
    const providerName = sheet === 'jazzcash' ? 'JazzCash' : 'Easypaisa';
    const commit = async () => {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 900));
      const m = await addMobileWallet(sheet, mobile);
      setSaving(false);
      if (!m) {
        setMobileError('Could not link this number.');
        return;
      }
      selectMethod(m.id);
      haptic.success();
      closeSheet();
      if (selectMode) navigation.goBack();
    };
    if (check.warning) {
      Alert.alert(`Link ${providerName} account?`, check.warning, [
        { text: 'Change number', style: 'cancel' },
        { text: 'Link anyway', onPress: commit },
      ]);
      return;
    }
    commit();
  };

  const confirmDelete = (m: PaymentMethod) =>
    Alert.alert(`Remove ${m.label}?`, `${m.label} ${m.subtitle} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { haptic.medium(); removeMethod(m.id); } },
    ]);

  const sheetTitle = sheet === 'card' ? 'Add debit / credit card' : sheet === 'jazzcash' ? 'Link JazzCash' : sheet === 'easypaisa' ? 'Link Easypaisa' : '';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={selectMode ? 'Select payment' : 'Payment Methods'} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 150 }} showsVerticalScrollIndicator={false}>
        {methods.map((m) => {
          const selected = m.id === selectedId;
          const tileColor = m.brand ? BRAND_COLOR[m.brand] : PAYMENT_COLOR[m.type];
          const removable = m.type === 'card' || m.type === 'jazzcash' || m.type === 'easypaisa';
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                haptic.selection();
                selectMethod(m.id);
                if (selectMode) navigation.goBack();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? palette.primary : colors.border, opacity: pressed ? 0.9 : 1 },
                !isDark && !selected ? shadow.soft : null,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: tileColor }]}>
                <Ionicons name={PAYMENT_ICON[m.type]} size={20} color={palette.white} />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <AppText variant="bodySemiBold">{m.label}</AppText>
                  {m.isDefault ? <Badge label="Default" tone="success" small style={{ marginLeft: spacing.xs }} /> : null}
                </View>
                <AppText variant="bodySm" tone="secondary">
                  {paymentSubtitle(m, walletBalance)}
                </AppText>
                {m.type === 'wallet' ? (
                  <Pressable onPress={() => navigation.navigate('Wallet')} hitSlop={6} style={{ marginTop: 4 }}>
                    <AppText variant="captionMedium" tone="brand">
                      Top up wallet
                    </AppText>
                  </Pressable>
                ) : !m.isDefault ? (
                  <Pressable onPress={() => { haptic.selection(); setDefault(m.id); }} hitSlop={6} style={{ marginTop: 4 }}>
                    <AppText variant="captionMedium" tone="brand">
                      Set as default
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={palette.primary} /> : null}
              {removable ? <IconButton icon="trash-outline" variant="plain" size={32} iconSize={18} color={colors.textTertiary} onPress={() => confirmDelete(m)} accessibilityLabel={`Remove ${m.label}`} /> : null}
            </Pressable>
          );
        })}
        <View style={[styles.secure, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary" style={{ marginLeft: 6, flex: 1 }}>
            Card numbers are checked with the Luhn algorithm before saving and processed by a PCI-DSS compliant gateway. JazzCash and Easypaisa payments are confirmed with an OTP on your phone.
          </AppText>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.sm, backgroundColor: colors.background }]}>
        <Button title="Add Debit / Credit Card" icon="card-outline" onPress={() => setSheet('card')} />
        <View style={styles.walletRow}>
          <Button title="Link JazzCash" variant="outline" size="md" onPress={() => setSheet('jazzcash')} style={{ flex: 1, marginRight: spacing.xs }} />
          <Button title="Link Easypaisa" variant="outline" size="md" onPress={() => setSheet('easypaisa')} style={{ flex: 1, marginLeft: spacing.xs }} />
        </View>
      </View>

      <BottomSheet visible={sheet !== null} onClose={closeSheet} title={sheetTitle}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {sheet === 'card' ? (
            <>
              <Input label="Name on card" placeholder="Ahmed Raza" value={holder} onChangeText={(t) => { setHolder(t); setCardErrors((e) => ({ ...e, holder: undefined })); }} error={cardErrors.holder} icon="person-outline" autoCapitalize="words" containerStyle={styles.field} />
              <Input
                label="Card number"
                placeholder="4242 4242 4242 4242"
                value={number}
                onChangeText={(t) => { setNumber(formatCardNumber(t, cardMaxLen)); setCardErrors((e) => ({ ...e, number: undefined })); }}
                error={cardErrors.number}
                hint={brand !== 'unknown' && digitsOnly(number).length >= 4 ? `${cardBrandLabel[brand]} detected` : 'Visa, Mastercard, American Express, UnionPay'}
                icon="card-outline"
                keyboardType="number-pad"
                containerStyle={styles.field}
                right={brand !== 'unknown' ? <Badge label={cardBrandLabel[brand]} tone="neutral" small /> : undefined}
              />
              <View style={styles.row}>
                <Input label="Expiry" placeholder="MM/YY" value={expiry} onChangeText={(t) => { setExpiry(formatExpiry(t)); setCardErrors((e) => ({ ...e, expiry: undefined })); }} error={cardErrors.expiry} icon="calendar-outline" keyboardType="number-pad" containerStyle={[styles.field, { flex: 1, marginRight: spacing.xs }]} />
                <Input label={brand === 'amex' ? 'CID (4 digits)' : 'CVV'} placeholder={brand === 'amex' ? '1234' : '123'} value={cvv} onChangeText={(t) => { setCvv(digitsOnly(t).slice(0, 4)); setCardErrors((e) => ({ ...e, cvv: undefined })); }} error={cardErrors.cvv} icon="lock-closed-outline" keyboardType="number-pad" secureTextEntry containerStyle={[styles.field, { flex: 1, marginLeft: spacing.xs }]} />
              </View>
              <Button title="Save Card" onPress={saveCard} loading={saving} size="lg" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }} />
            </>
          ) : sheet ? (
            <>
              <View style={[styles.providerHero, { backgroundColor: `${PAYMENT_COLOR[sheet]}1A` }]}>
                <View style={[styles.providerIcon, { backgroundColor: PAYMENT_COLOR[sheet] }]}>
                  <Ionicons name="phone-portrait" size={22} color={palette.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemiBold">{sheet === 'jazzcash' ? 'JazzCash account' : 'Easypaisa account'}</AppText>
                  <AppText variant="caption" tone="secondary">
                    Enter the mobile number registered with your {sheet === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} account. You will confirm each payment with an OTP.
                  </AppText>
                </View>
              </View>
              <Input
                label="Mobile number"
                placeholder={sheet === 'jazzcash' ? '0300 1234567' : '0345 1234567'}
                value={mobile}
                onChangeText={(t) => { setMobile(formatMobile(t)); setMobileError(undefined); }}
                error={mobileError}
                hint={
                  mobileCheck?.valid
                    ? `${networkLabel[mobileCheck.network]} number${mobileCheck.warning ? ' · unusual for this wallet' : ' · looks good'}`
                    : 'Format: 03XX XXXXXXX (11 digits)'
                }
                icon="call-outline"
                keyboardType="number-pad"
                containerStyle={styles.field}
                right={mobileCheck?.valid ? <Ionicons name={mobileCheck.warning ? 'alert-circle' : 'checkmark-circle'} size={20} color={mobileCheck.warning ? palette.warning : palette.secondary} /> : undefined}
              />
              <Button title={`Link ${sheet === 'jazzcash' ? 'JazzCash' : 'Easypaisa'}`} onPress={saveMobileWallet} loading={saving} disabled={!mobileCheck?.valid} size="lg" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }} />
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.card, borderWidth: 1.5, marginBottom: spacing.sm },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  secure: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.button, padding: spacing.sm, marginTop: spacing.xs },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  walletRow: { flexDirection: 'row', marginTop: spacing.xs },
  field: { marginBottom: spacing.md },
  row: { flexDirection: 'row' },
  providerHero: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.card, marginBottom: spacing.md },
  providerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
});
