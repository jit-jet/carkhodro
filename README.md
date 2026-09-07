This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## run only db with docker :
docker compose -f docker-compose.db.yml up -d

# then run this in terminal
npx prisma migrate dev --name init   # CREATE DB TABLES AND SQL
npx prisma generate             # CREATE  PRISMA CLIENT
npx prisma db seed

# prisma studio
npx prisma studio


## build app
npm run  build

## Android / iOS (Capacitor)

The website remains a normal server-rendered Next.js application. It cannot be
statically exported because authentication, carts, checkout, server actions,
route handlers, image optimization, and dynamic data require the Next server.
The native projects therefore load the deployed HTTPS site in a Capacitor
WebView; `native-shell/` is only the offline/configuration fallback.

1. Set the native origin before every sync. In production it must be the same
   origin as `NEXT_PUBLIC_APP_URL`, otherwise cookies and the Zibal callback can
   leave the authenticated app session:

   ```powershell
   $env:CAPACITOR_SERVER_URL = "https://your-production-domain.example"
   ```

2. Sync both generated projects:

   ```powershell
   npm run native:sync
   ```

   The sync script also normalizes Swift Package paths produced on Windows so
   the checked-in iOS project opens correctly on macOS.

3. Build Android (Capacitor 8 requires Node 22+, JDK 21, Android SDK 36 and the
   matching build tools):

   ```powershell
   npm run android:apk
   # debug APK: android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. Build iOS on macOS with current Xcode:

   ```bash
   npm run native:ios
   # Select the App target/team, then Product > Build or Archive in Xcode.
   ```

The bundle/application ID is currently `ir.carkhodro.app`; if it must change,
update `capacitor.config.ts`, the Android namespace/application ID/package,
the iOS product bundle identifier, and both custom-scheme registrations
together before store release. Custom-scheme links such as
`ir.carkhodro.app:///products/123` are registered on both platforms. For normal
HTTPS Universal Links/App Links, add the production host in Xcode/Android and
serve Apple's `apple-app-site-association` plus Android's `assetlinks.json`
after the Apple Team ID and Android signing certificate are known.

The generated projects request only Android Internet access. External HTTP(S)
links open in the platform browser, `tel:`/`mailto:`/`sms:` use installed apps,
the Zibal gateway stays inside the authenticated WebView, and printing uses the
native Android/iOS print sheet. Cleartext HTTP is rejected by `native:check`;
for emulator-only development it can be explicitly enabled with
`CAPACITOR_ALLOW_CLEARTEXT=1` (Android emulator normally uses
`http://10.0.2.2:3000`).

Before release, replace the generated placeholder launcher/splash art, confirm
the production URL, configure signing, and test payment return/deep links on
physical Android and iOS devices.



# start project on server
pm2 start npm --name my-app -- start -- -p 3000

# pm2 commands
# List processes
pm2 list

# View logs
pm2 logs my-app

# Restart app
pm2 restart my-app

# Stop app
pm2 stop my-app

# Delete app from PM2
pm2 delete my-app

# Save current processes
pm2 save

# Configure PM2 to start on server boot
pm2 startup

## Torob Product API v3

Torob can pull the public retail catalogue from:

```text
POST https://YOUR_PRODUCTION_HOST/torob_api/v3/products
```

The endpoint implements all three v3 request modes (`page`/`sort`,
`page_urls`, and `page_uniques`) and verifies Torob's Ed25519 JWT from the
`X-Torob-Token` header. No inbound API secret needs to be configured: Torob
signs requests and the application verifies them with Torob's published public
key. `NEXT_PUBLIC_APP_URL` must be the exact public HTTPS origin used by Torob;
its hostname (and port, when non-default) must match the JWT `aud` claim and the
incoming `Host` header.

Only active products with a public retail price are listed. Out-of-stock items
remain addressable but are returned with `availability: false` and
`current_price: 0`, as required by Torob. Product IDs are reused as stable
`page_unique` values; no duplicate catalogue is stored.

To activate the integration, give Torob support the endpoint URL and production
domain and ask them to enable Product API v3 for the shop. The optional outbound
real-time webhook is not enabled; periodic and targeted pulls are fully
supported by this endpoint.
