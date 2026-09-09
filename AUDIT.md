# QuickCart Mobile — Audit

State of the Expo app before the production pass, and what changed. Written against
the code in this repository; every item below was verified in the source, not assumed.

---

## 1. Inventory

### Screens (23 + 2 navigators)

| Screen | Purpose | Data source before | Data source now |
| --- | --- | --- | --- |
| `SplashScreen` | Animated logo, routes by auth state | local | unchanged (no data) |
| `OnboardingScreen` | 3 slides, first launch only | `onboardingSlides` (static copy) | unchanged — UI copy, not business data |
| `LoginScreen` | Sign in | phone + fake OTP | **email → `POST /auth/send-otp`** |
| `OtpScreen` | 6-digit verification | hardcoded `123456` | **`POST /auth/verify-otp`** |
| `CompleteProfileScreen` | **new** — name + mobile after a new email verifies | — | `POST /auth/signup` |
| `HomeScreen` | Address bar, search, categories, store list | `storesResponse` array | `GET /stores`, `GET /banners`, `GET /settings/public` |
| `SearchScreen` | Debounced search | local filter | `GET /search?q=` |
| `StoreDetailScreen` | Collapsing header, sticky tabs, menu | `menuResponse` array | `GET /stores/:id`, `GET /stores/:id/menu` |
| `CartScreen` | Swipe-to-delete, promo, breakdown | local `computeTotals` | **`POST /orders/quote`** (server totals) |
| `CheckoutScreen` | Address, payment, place order | local totals, client-made order id | **`POST /orders`** (server totals + server id) |
| `OrderTrackingScreen` | Live map, stepper, ETA | timer simulation | Socket.io `order:status` + `rider:location` |
| `OrderHistoryScreen` | Grouped by date, reorder | `ordersResponse` array | `GET /orders/my` |
| `OrderDetailScreen` | Items, timeline, receipt | local array | order store (backed by API) |
| `RateReviewScreen` | Stars, tags, tip | local write | `POST /orders/:id/review` |
| `ProfileScreen` | Account hub, theme, logout | local | auth + wallet + favourites stores |
| `AddressesScreen` | List, select, set default, delete | local array | `GET/PATCH/DELETE /addresses` |
| `AddAddressScreen` | New address form | local push | `POST /addresses` |
| `PaymentMethodsScreen` | Cards + mobile wallets | local array | `GET/POST/DELETE /payment-methods` |
| `WalletScreen` | Balance, history, top-up | local numbers | `GET /wallet`, `POST /wallet/top-up` |
| `FavouritesScreen` | Saved stores | `storesResponse` lookup | `GET /favourites` + `GET /stores` |
| `OffersScreen` | Promo codes | `promosResponse` array | `GET /coupons`, `POST /coupons/validate` |
| `NotificationsScreen` | Push preferences | local | local (device preference, correctly local) |
| `HelpScreen` | FAQ accordion, contacts | `faqs` array | `GET /content/faqs`, `GET /settings/public` |
| `EditProfileScreen` | Name, email, avatar | local | `PATCH /users/me` |

Navigators: `RootNavigator` (native stack, 22 routes) and `MainTabs` (Home, Cart,
Orders, Profile with a live cart badge).

### Reusable components (21)

`AppText`, `Button` (4 states), `IconButton`, `Card`, `Badge`/`RatingBadge`,
`CategoryChip`, `QuantityStepper`, `Skeleton` + `StoreCardSkeleton` /
`ProductRowSkeleton` / `OrderCardSkeleton`, `EmptyState`, `BottomSheet`, `OTPInput`,
`StatusStepper`, `RadioCard`, `Input`, `ScreenHeader`, `StoreCard`, `ProductRow`,
`SuccessOverlay`, `PriceRow`/`Divider`, `Logo`/`BrandLockup`,
plus **new** `ErrorBoundary` and `OfflineBanner`.

### Mock / hardcoded data found

| File | Contents | Resolution |
| --- | --- | --- |
| `src/data/stores.ts` | 16 store objects | now seeds the backend (`prisma/seed-data.ts`); used by the app only in offline demo mode |
| `src/data/products.ts` | 244 products across 16 menus | same |
| `src/data/orders.ts` | 5 built past orders | same |
| `src/data/misc.ts` | addresses, payment methods, promos, riders, FAQs, countries, onboarding copy | business parts moved to the API; countries and onboarding copy stay local (UI constants) |
| `src/data/config.ts` | currency, tax rate, fees, city | now **defaults only** — live values come from `GET /settings/public` |
| Home banner | hardcoded gradient + copy | `GET /banners`, admin-editable |
| `HelpScreen` FAQs | 7 hardcoded entries | `GET /content/faqs`, admin-editable |
| `OffersScreen` promos | 5 hardcoded codes | `GET /coupons`, admin-editable |

Everything an admin could reasonably want to change — a price, a photo, a banner,
a delivery fee, an FAQ answer, the tax rate — is now served by the API.

### State management

Zustand with `persist` (AsyncStorage), 8 stores:
`useAuthStore`, `useCartStore`, `useOrderStore`, `useAddressStore`, `usePaymentStore`,
`useFavouritesStore`, `useWalletStore`, `useSettingsStore` (theme), plus the **new**
`useAppConfigStore` (backend settings, banners, FAQs).

### Network layer

Before: a single `src/services/api.ts` returning in-memory objects with fake latency.
Now: `api.types.ts` (the contract) with two implementations behind it —
`api.remote.ts` (axios → backend) and `api.mock.ts` (offline demo) — selected by
`EXPO_PUBLIC_API_URL`. `http.ts` adds the bearer token, refreshes on 401 with a
single-flight queue, and normalises every failure into `ApiError`.

### TODO / FIXME / console

`grep -rn "TODO\|FIXME\|console\." src` → **0 results.** No debug logging ships.

### Unused dependencies

`react-native-screens` and `react-native-worklets` show as "unused" to a naive grep;
both are peer requirements (React Navigation and Reanimated) and must stay.
No genuinely unused dependency was found.

---

## 2. Bugs found and fixed

| # | Bug | Impact | Fix |
| --- | --- | --- | --- |
| 1 | `Layout` import removed from Reanimated 4 | Crash on Cart, Checkout and Help | switched to `LinearTransition` |
| 2 | `StyleSheet.absoluteFillObject` removed in RN 0.86 | Type error, wrong layout | local `absoluteFill` token in the theme |
| 3 | FlashList v2 wraps `onScroll` in a JS handler | Store Detail parallax and sticky tabs never moved | write the shared value from JS instead of a worklet handler |
| 4 | Invisible top bar and hidden sticky tabs kept `pointerEvents` | Taps on the store hero and info card were swallowed | `pointerEvents` follows visibility |
| 5 | OTP auto-submitted from an effect on every render | Duplicate verify calls, flaky errors | submit from the change handler once |
| 6 | Android font padding on Poppins/Inter | Button and chip labels sat off-centre and clipped | `includeFontPadding: false` in `AppText`, taller heading line heights |
| 7 | Status stepper labels used negative margins | Labels overlapped on small screens | one flex column per step with half-width connectors |
| 8 | `palette.*Soft` tints were light-mode only | Badges, selected rows and pills were unreadable in dark mode | moved to theme tokens with dark variants plus `onSecondarySoft` / `onWarningSoft` text colours |
| 9 | Card form accepted any 16 digits | Invalid cards saved | **Luhn** checksum, IIN brand detection, per-brand length, expiry-in-past and CVV length |
| 10 | Wallet numbers accepted landlines | Payments would fail later | Pakistani mobile validation with operator prefix detection and a JazzCash/Easypaisa network warning |
| 11 | Order ids were generated on the device | Duplicate or unknown ids server-side | order id and number come from `POST /orders` |
| 12 | Totals were computed on the device | Stale prices, spoofable totals | `POST /orders/quote` owns every number |
| 13 | Tokens were in AsyncStorage | Readable on a rooted device | `expo-secure-store` (keychain/keystore) |
| 14 | No error boundary | A render error showed a white screen | global `ErrorBoundary` with retry, reports to Sentry |
| 15 | No offline handling | Requests hung silently | `OfflineBanner` with retry plus per-screen error states |
| 16 | `Splashscreen.setOptions` in Expo Go | Console warning on every start | removed (development-build only API) |

### Backend bugs found by the app's integration pass

| # | Bug | Fix |
| --- | --- | --- |
| B1 | One Express 5 router mounted at two paths only matched the first mount, so every `/api/v1/*` route fell through to the auth router and returned 401 | build the router with a factory and mount two instances |
| B2 | The account router's `use(requireAuth)` at mount path `/` also guarded later routers, making the public `POST /riders/apply` return 401 and turning 404s into 401s | `requireAuth` attached per route; specific routers mounted before the catch-all |
| B3 | Order transactions exceeded Prisma's 5 s interactive-transaction cap against remote Neon | trimmed the transaction to the atomic writes, read back outside it, raised the timeout |

---

## 3. Verification performed

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` (app) | passes, 0 errors |
| `npx expo export --platform android` | bundles successfully |
| `npx expo install --check` | all dependencies match SDK 57 |
| Backend `npm run smoke` | **56/56 assertions pass** against live Neon |
| Mobile API path verification | every one of the 35 paths the app calls exists on the backend |
| Validator unit tests (Luhn, expiry, CVV, PK mobile) | 21/21 pass |
| Admin `npm run build` | compiles, 16 routes |

### Not verified

- No physical device or emulator was available in this environment, so the app was not
  launched on hardware. Bundling, typechecking and the API contract are verified; the
  on-device pass (cold start, background/foreground, notification taps, map rendering)
  is listed in `HANDOVER.md` as the remaining manual step.
- Push delivery needs a development or production build; Expo Go cannot receive remote
  push on SDK 53+. Local notifications for order status work in Expo Go.
- Cloudinary and SMTP were not configured here, so uploads and real OTP emails ran in
  their documented fallback modes (503 with a URL-paste fallback, and console-logged codes).
