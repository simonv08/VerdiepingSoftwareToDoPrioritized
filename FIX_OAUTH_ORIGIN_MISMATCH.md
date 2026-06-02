# Fix Google OAuth origin_mismatch Error

## Problem

Google OAuth requires JavaScript origins to be registered in Google Cloud Console. Your app is running from an origin that's not registered.

## Your Origins

Based on your setup, register these in Google Cloud Console:

### Development

```
http://localhost:5173
http://localhost:3000
```

### Production (Firebase Hosting)

```
https://todo-6ba77.firebaseapp.com
https://todo-6ba77.web.app
```

### Android/Capacitor (for later)

```
capacitor://localhost
```

## Step-by-Step Fix

### 1. Go to Google Cloud Console

1. Visit: https://console.cloud.google.com
2. Select your project (based on your Client ID: `188476231988-...`)
3. Go to **APIs & Services** > **Credentials**

### 2. Edit OAuth 2.0 Client

1. Find your **Web client** in the credentials list
2. Click the **edit icon** (pencil) next to it
3. Under **Authorized JavaScript origins**, click **Add URI**

### 3. Add Your Origins

Add each of these:

**For Development:**

- `http://localhost:5173`

**For Production (add later when ready):**

- `https://todo-6ba77.firebaseapp.com`
- `https://todo-6ba77.web.app`

### 4. Save Changes

Click **Save** at the bottom of the dialog.

### 5. Restart Your Dev Server

```bash
cd todo-app
npm run dev
```

The server must be running on the **exact same URL** you registered. If Vite shows a different port (e.g., 5174), you need to either:

- Register that new port in Google Cloud Console, OR
- Configure Vite to use port 5173

### 6. Clear Browser Cache

1. Open DevTools (F12)
2. Go to **Application** tab
3. Clear **localStorage** and **sessionStorage**
4. Close and reopen the app

## Verify It Works

You should now be able to click "Sign in with Google" without the origin_mismatch error.

## For Capacitor/Android (Optional)

If using the mobile app, also add:

- `capacitor://localhost`
- `ionic://localhost`

## Troubleshooting

| Issue                         | Solution                                                |
| ----------------------------- | ------------------------------------------------------- |
| Still getting origin_mismatch | Clear browser cache, restart dev server on correct port |
| Port number is different      | Update Google Cloud to use the actual port (e.g., 5174) |
| Changes not applying          | Wait 1-2 minutes for Google to update credentials       |
| Wrong project selected        | Verify project ID matches your Client ID                |

## How to Find Your Project ID

188476231988-b5rm9c3319bgmkkud4kehqrn5vgmko4l.apps.googleusercontent.com
Your Client ID is: ``

The first number (`188476231988`) is your **Project ID**. Use this to find the correct project in Google Cloud Console.

## When You Deploy to Production

After deploying to Firebase Hosting, update Google Cloud Console with your actual Firebase URLs:

- `https://todo-6ba77.firebaseapp.com`
- `https://todo-6ba77.web.app`

## References

- [OAuth 2.0 Origin Mismatch Error](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-mismatch)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Provider Docs](https://www.npmjs.com/package/@react-oauth/google)
