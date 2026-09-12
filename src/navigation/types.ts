import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  /** Email OTP verification. `devCode` is only present in backend development mode. */
  Otp: { email: string; destination: string; isNewUser: boolean; devCode?: string };
  CompleteProfile: { email: string; signupToken: string };
  /** City picker. `switching` true when opened from the home header, not first launch. */
  CitySelect: { switching?: boolean } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Search: undefined;
  StoreDetail: { storeId: string };
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderDetail: { orderId: string };
  RateReview: { orderId: string };
  Addresses: { selectMode?: boolean } | undefined;
  AddAddress: undefined;
  PaymentMethods: { selectMode?: boolean } | undefined;
  Notifications: undefined;
  Help: undefined;
  EditProfile: undefined;
  Favourites: undefined;
  Offers: undefined;
  Wallet: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type TabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<MainTabParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
