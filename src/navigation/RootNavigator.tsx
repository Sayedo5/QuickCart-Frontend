import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { MainTabs } from './MainTabs';
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OtpScreen } from '@/screens/OtpScreen';
import { CompleteProfileScreen } from '@/screens/CompleteProfileScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { StoreDetailScreen } from '@/screens/StoreDetailScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderTrackingScreen } from '@/screens/OrderTrackingScreen';
import { OrderDetailScreen } from '@/screens/OrderDetailScreen';
import { RateReviewScreen } from '@/screens/RateReviewScreen';
import { AddressesScreen } from '@/screens/AddressesScreen';
import { AddAddressScreen } from '@/screens/AddAddressScreen';
import { PaymentMethodsScreen } from '@/screens/PaymentMethodsScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { HelpScreen } from '@/screens/HelpScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { FavouritesScreen } from '@/screens/FavouritesScreen';
import { OffersScreen } from '@/screens/OffersScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { fonts, palette, useTheme } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useTheme();

  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: palette.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: palette.primary,
    },
    fonts: {
      regular: { fontFamily: fonts.body, fontWeight: '400' },
      medium: { fontFamily: fonts.bodyMedium, fontWeight: '500' },
      bold: { fontFamily: fonts.heading, fontWeight: '600' },
      heavy: { fontFamily: fonts.headingBold, fontWeight: '700' },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="RateReview" component={RateReviewScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Favourites" component={FavouritesScreen} />
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
