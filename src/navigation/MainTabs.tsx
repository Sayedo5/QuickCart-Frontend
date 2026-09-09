import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '@/screens/HomeScreen';
import { CartScreen } from '@/screens/CartScreen';
import { OrderHistoryScreen } from '@/screens/OrderHistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { selectItemCount, useCartStore } from '@/store/useCartStore';
import { fonts, palette, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  CartTab: { active: 'cart', inactive: 'cart-outline' },
  OrdersTab: { active: 'receipt', inactive: 'receipt-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

function TabIcon({ route, focused, color }: { route: keyof MainTabParamList; focused: boolean; color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={focused ? ICONS[route].active : ICONS[route].inactive} size={24} color={color} />
      {focused ? <View style={[styles.activeDot, { backgroundColor: palette.primary }]} /> : null}
    </View>
  );
}

export function MainTabs() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore(selectItemCount);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.divider,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          elevation: isDark ? 0 : 8,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0 : 0.06,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ focused, color }) => <TabIcon route={route.name} focused={focused} color={color} />,
        tabBarBadgeStyle: { backgroundColor: palette.primary, color: palette.white, fontFamily: fonts.bodySemiBold, fontSize: 10, minWidth: 18, height: 18, lineHeight: 17 },
      })}
      screenListeners={{ tabPress: () => haptic.selection() }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ title: 'Cart', tabBarBadge: cartCount > 0 ? cartCount : undefined }} />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  activeDot: { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2 },
});
