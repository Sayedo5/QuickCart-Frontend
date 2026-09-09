# QuickCart — Handover

Three separate projects that together make up the QuickCart delivery platform.

```
D:\Project\
  DeliveryApp\          the Expo customer app  (this folder — "quickcart-app")
  quickcart-backend\    Express + Prisma + Neon API
  quickcart-admin\      Next.js admin dashboard
```

Only the backend touches the database. The app and the panel both call the backend.

---

## 1. What changed

Full detail is in [AUDIT.md](./AUDIT.md). Summary:

**Built from scratch**
- `quickcart-backend` — 22-table Prisma schema migrated into Neon, 81 endpoints,
  email-OTP auth with JWT, Socket.io realtime, Cloudinary uploads, role guards,
  rate limiting, and a 56-assertion end-to-end test suite.
- `quickcart-admin` — Next.js dashboard with full CRUD over stores, products,
  categories, orders, riders, users, coupons, banners, reviews and global settings.

**Mobile app, production pass**
- Every mock array replaced with a real API call; the in-repo data now only powers an
  explicit offline demo mode and seeds the backend.
- Auth reworked from fake phone OTP to real email OTP against the backend, with a new
  profile-completion step for first-time users.
- Cart and checkout totals now come from `POST /orders/quote`; order ids come from the server.
- Tokens moved to the device keychain (`expo-secure-store`) with silent refresh on 401.
- Loading skeletons, empty states and retryable error states on every data screen.
- Global error boundary, offline banner, Sentry hook-up, push notifications with deep links.
- 16 UI and logic bugs fixed, including dark-mode contrast, Android text clipping,
  the store-detail parallax, and Luhn/mobile-number validation.

---

## 2. Running it locally

Start the backend first — the other two depend on it.

### Backend

```bash
cd D:\Project\quickcart-backend
npm install
cp .env.example .env          # fill in DATABASE_URL, DIRECT_URL, JWT secrets
npx prisma migrate dev --name init
npm run seed
npm run dev                   # http://localhost:4000
```

Verify: `npm run smoke` in a second terminal should print `56 passed, 0 failed`.

### Admin panel

```bash
cd D:\Project\quickcart-admin
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm run dev                   # http://localhost:3000
```

Sign in with `admin@quickcart.pk` / `Admin@12345` (whatever you set in the backend `.env`).

### Mobile app

```bash
cd D:\Project\DeliveryApp
npm install
cp .env.example .env
# set EXPO_PUBLIC_API_URL to your machine's LAN IP, not localhost, e.g.
#   EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api/v1
#   EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:4000
npx expo start
```

Scan the QR code with Expo Go (SDK 57). To demo without a backend, set
`EXPO_PUBLIC_USE_MOCK_API=true` and the app runs entirely on bundled data.

> A phone cannot reach `localhost` on your computer. Use the LAN IP shown by
> `npx expo start`, and make sure that IP:4000 is allowed through your firewall.
> Add the same origin to the backend's `CLIENT_ORIGINS`.

---

## 3. Environment variables

### Backend (`quickcart-backend/.env`)

| Variable | Required | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon console → Connection string (the **pooled** one, contains `-pooler`) |
| `DIRECT_URL` | yes | Same string with `-pooler` removed — used only by migrations |
| `JWT_ACCESS_SECRET` | yes | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | yes | Generate a second, different value |
| `PORT` | no | Defaults to 4000 |
| `CLIENT_ORIGINS` | yes in prod | Comma-separated: admin panel origin + Expo dev origin |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | yes in prod | Gmail app password, or Resend / Brevo free tier |
| `MAIL_FROM` | no | e.g. `QuickCart <no-reply@quickcart.pk>` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | Cloudinary dashboard (free tier) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | yes | Your choice — seeds the admin login |
| `EXPO_ACCESS_TOKEN` | no | Expo dashboard, raises push rate limits |

### Admin (`quickcart-admin/.env.local`)

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://quickcart-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://quickcart-api.onrender.com` |

### Mobile (`DeliveryApp/.env`)

| Variable | Example / note |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.10:4000/api/v1`, or your deployed API |
| `EXPO_PUBLIC_SOCKET_URL` | Same host without `/api/v1` |
| `EXPO_PUBLIC_USE_MOCK_API` | `true` to demo with no backend |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry project → Client Keys. Empty disables Sentry |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | Google Cloud → Maps SDK for Android. Needed only for standalone Android builds |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Printed by `eas init`. Needed for push tokens |
| `EXPO_PUBLIC_APP_ENV` | `development` / `staging` / `production` |

`EXPO_PUBLIC_*` values are compiled into the JavaScript bundle, so treat them as public.
Never put the Neon URL, JWT secrets or the Cloudinary secret in the app.

---

## 4. Building the Android APK

```bash
npm install -g eas-cli
eas login
cd D:\Project\DeliveryApp
eas init                 # writes EXPO_PUBLIC_EAS_PROJECT_ID — copy it into .env
eas build --platform android --profile production-apk
```

`eas.json` already defines four profiles:

| Profile | Output | Use |
| --- | --- | --- |
| `development` | dev client | native debugging, mock API on |
| `preview` | APK | internal testing against staging |
| `production` | AAB | Play Store upload, auto-incremented version code |
| `production-apk` | APK | the installable file to hand to a client |

Set the production API URL in the EAS build environment (Expo dashboard →
project → Environment variables) so the build points at your deployed backend
rather than a LAN address.

Signing: EAS generates and stores the upload keystore on first build. Back it up with
`eas credentials`. Losing it means you cannot update an existing Play Store listing.

Build takes 10-20 minutes; the dashboard gives you a download link when it finishes.

---

## 5. Deploying

| Piece | Where | Notes |
| --- | --- | --- |
| Backend | Render or Railway | Build `npm install && npm run build`, start `npm start`. Add every backend env var. Run `npx prisma migrate deploy` once |
| Database | Neon | Already migrated. Enable a paid tier before launch so it does not sleep |
| Admin | Vercel | Import the folder as its own project, add the two `NEXT_PUBLIC_*` vars |
| Mobile | EAS Build | Point `EXPO_PUBLIC_API_URL` at the deployed backend, then rebuild |

After deploying the backend, add the Vercel domain to `CLIENT_ORIGINS` and redeploy it,
otherwise the admin panel gets CORS errors.

### Publishing an app update

- JavaScript-only change: `eas update --branch production` (over-the-air, no store review).
- Native change (new dependency, permission, icon): bump `version` in `app.config.ts`,
  then `eas build --platform android --profile production` and upload the AAB.

---

## 6. Verified vs. remaining

**Verified in this environment**

| Check | Result |
| --- | --- |
| Prisma migration into Neon | 22 tables created (`20260908072134_init`) |
| Seed | 17 stores, 244 products, 5 riders, 5 coupons, admin + demo customer |
| Backend end-to-end suite | 56/56 pass against the live database |
| Every mobile API path exists on the backend | 35/35 |
| Validator unit tests | 21/21 (Luhn, brand, expiry, CVV, PK mobile, wallet networks) |
| App typecheck and Metro bundle | pass |
| Admin typecheck and production build | pass, 16 routes |

**Remaining manual steps** — these need hardware or third-party accounts that were not
available here:

1. **Run on a real device.** Cold start, background/foreground, rotation, no-network and
   slow-network passes over the full flow (sign up → browse → cart → checkout → track → rate).
2. **Push notifications.** Needs a development or production build plus
   `EXPO_PUBLIC_EAS_PROJECT_ID`; Expo Go cannot receive remote push on SDK 53+.
   Send a test from the admin panel's Settings → Send announcement.
3. **Real OTP email.** Add SMTP credentials, then confirm a code arrives and check the
   spam folder on a fresh address.
4. **Cloudinary.** Add the three keys, then upload a product photo from the admin panel
   and confirm it appears in the app.
5. **Maps on a standalone build.** Add `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`; Expo Go
   uses Expo's own key, a standalone APK needs yours.
6. **Sentry.** Add the DSN and confirm a forced error appears in the dashboard.

---

## 7. Known limitations and recommendations

| Item | Status | Recommendation |
| --- | --- | --- |
| **Payments are not charged** | Cash, wallet and "linked" JazzCash/Easypaisa work as records; no gateway is called | Integrate JazzCash or Easypaisa merchant APIs (or Stripe for international). The order flow already has `paymentStatus`, and the wallet debit/refund path is in place, so this is a contained change in `orderController.placeOrder` |
| **Card numbers** | Luhn-validated then discarded; only brand + last4 stored | Correct for now. Tokenise with the gateway before taking card payments; never store a PAN |
| **SMS OTP** | Not implemented — no free provider exists | Email OTP is live and free. If a launch market needs SMS, budget per message with Twilio or a local aggregator; it is a paid line item, not a one-off integration |
| **Rider app** | Not built | The backend already supports it: approved riders get a `RIDER` role account, `PUT /orders/:id/status` and `PUT /riders/:id/location` are role-guarded and ready |
| **Rider location in production** | Updated via the API when a rider (or admin) posts a fix | A rider app should post every 5-10 seconds while an order is `PICKED_UP` |
| **Mock mode** | Ships in the bundle | Harmless and useful for demos, but set `EXPO_PUBLIC_USE_MOCK_API=false` for release builds |
| **Store Detail cart bar** | Shows a locally estimated subtotal | Display only; the Cart and Checkout screens show server-confirmed totals |
| **Neon free tier** | Sleeps when idle | First request after idling takes a few seconds. Upgrade before launch |
| **Admin roles** | Single admin role | Add staff vs super-admin scoping if more than one person will operate it |
| **Tests** | Backend smoke suite + validator unit tests | Add Jest/Vitest unit tests around `pricingService` and the order status machine before the team grows |

---

## 8. Support quick reference

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| App shows "No internet connection" against a running backend | Phone cannot reach `localhost` | Use the LAN IP in `EXPO_PUBLIC_API_URL`, allow port 4000 through the firewall |
| Admin panel shows a CORS error | Origin missing | Add it to the backend's `CLIENT_ORIGINS` and restart |
| OTP never arrives | SMTP not set | In development the code is printed in the server console and returned as `devCode` |
| Image upload returns 503 | Cloudinary not configured | Add the three keys, or paste an image URL in the admin panel |
| `P2028` on placing an order | Neon cold start exceeded the transaction timeout | Retry; the timeout is already raised to 30 s. Consider a paid Neon tier |
| Admin cannot sign in | Account is not `ADMIN` | Re-run `npm run seed`, or `POST /api/v1/admin/admins` from an existing admin |
