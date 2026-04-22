# BookTrade

Useful commands for local development, native builds, and Supabase pushes.

## Install

```powershell
npm install
```

## Run the app

Start Metro:

```powershell
npm run start
```

Start Android:

```powershell
npm run android
```

Start iOS:

```powershell
npm run ios
```

Start web:

```powershell
npm run web
```

## Checks

Lint:

```powershell
npm run lint
```

TypeScript:

```powershell
npx tsc --noEmit
```

## Build mobile apps

Log in to Expo EAS:

```powershell
npx eas-cli login --web
```

Build Android APK:

```powershell
npx eas-cli build --platform android --profile preview --non-interactive
```

Build Android development client:

```powershell
npx eas-cli build --platform android --profile development
```

Build iOS:

```powershell
npx eas-cli build --platform ios --profile production
```

Build iOS development client:

```powershell
npx eas-cli build --platform ios --profile development
```

## Supabase

Check Supabase CLI:

```powershell
npx supabase --version
```

Link project:

```powershell
npx supabase link --project-ref bnkinypdvwhydbybohgk
```

Push database migrations:

```powershell
$env:SUPABASE_DB_PASSWORD="YOUR_DATABASE_PASSWORD"
npx supabase db push
```

If PowerShell has trouble with `npx`, use:

```powershell
$env:SUPABASE_DB_PASSWORD="YOUR_DATABASE_PASSWORD"
npx.cmd supabase db push
```
