import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText, Button, Input, ScreenHeader } from '@/components';
import { RootScreenProps } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { palette, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const AVATARS = [47, 32, 12, 59, 5, 20, 68, 44].map((i) => `https://i.pravatar.cc/200?img=${i}`);

export function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    await updateProfile({ name: name.trim(), email: email.trim(), avatar });
    haptic.success();
    setSaving(false);
    navigation.goBack();
  };

  const dirty = name !== user?.name || email !== user?.email || avatar !== user?.avatar;

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatar }} style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]} cachePolicy="memory-disk" transition={200} />
          <View style={[styles.camera, { backgroundColor: palette.primary, borderColor: colors.background }]}>
            <Ionicons name="camera" size={16} color={palette.white} />
          </View>
        </View>
        <AppText variant="bodySmMedium" tone="secondary" align="center" style={{ marginBottom: spacing.sm }}>
          Choose a profile photo
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
          {AVATARS.map((a) => {
            const selected = a === avatar;
            return (
              <Pressable
                key={a}
                onPress={() => {
                  haptic.selection();
                  setAvatar(a);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.avatarOption, { borderColor: selected ? palette.primary : 'transparent' }]}
              >
                <Image source={{ uri: a }} style={styles.avatarSmall} cachePolicy="memory-disk" />
              </Pressable>
            );
          })}
        </ScrollView>

        <Input label="Full name" value={name} onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }} error={errors.name} icon="person-outline" autoCapitalize="words" containerStyle={styles.field} />
        <Input label="Email address" value={email} onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }} error={errors.email} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} containerStyle={styles.field} />
        <Input label="Phone number" value={`${user?.dialCode ?? ''} ${user?.phone ?? ''}`} editable={false} icon="call-outline" hint="Phone number is verified and cannot be changed here." containerStyle={styles.field} style={{ color: colors.textTertiary }} />

        <Button title="Save Changes" onPress={save} loading={saving} disabled={!dirty} size="lg" icon="checkmark" style={{ marginTop: spacing.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  avatarWrap: { alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarRow: { paddingHorizontal: spacing.xs, paddingBottom: spacing.lg, alignSelf: 'center' },
  avatarOption: { padding: 3, borderWidth: 2, borderRadius: 30, marginHorizontal: 4 },
  avatarSmall: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#DDD' },
  field: { marginBottom: spacing.md },
});
