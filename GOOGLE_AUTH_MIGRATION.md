# Google Login Change Notes

This file explains, in very simple words:

- what the old Google login approach was
- what the new approach is
- what changed in the code
- why those changes were made
- which ports are used and why

## 1. Old Approach: Passport-Based Google Login

Before, Google login was using **Passport**.

The flow was like this:

1. Frontend sent the user to a backend route like `/auth/google`
2. Passport redirected the user to Google
3. After login, Google redirected back to a callback route like `/auth/google/callback`
4. Passport read the Google profile
5. Backend created or found the user
6. Backend created a JWT token
7. Backend redirected the user back to the frontend

This approach worked, but it had some extra moving parts:

- a Google strategy file
- a redirect route
- a callback route
- frontend redirect handling
- Google callback URL setup

So the flow was more complicated.

## 2. New Approach: `google-auth-library`

Now Google login uses **Google's official auth library**: `google-auth-library`.

The new flow is much simpler:

1. Frontend shows the Google login button
2. User logs in with Google on the frontend
3. Google gives the frontend an **ID token**
4. Frontend sends that ID token to the backend using `POST /api/auth/google`
5. Backend verifies that token using `google-auth-library`
6. If valid, backend finds or creates the user
7. Backend creates a JWT token
8. Backend returns the token and user data

In short:

- **Old flow**: Google redirected the user to the backend
- **New flow**: Frontend gets Google token, backend verifies it

This new approach is easier to understand and easier to connect with a separate frontend.

## 3. Why We Changed It

We changed it because the frontend and backend are now separate projects.

With Passport Google OAuth redirect flow, we had to manage:

- backend redirect routes
- callback URLs
- frontend callback page
- redirect coordination between frontend and backend

With `google-auth-library`, the frontend and backend have cleaner responsibilities:

- frontend handles the Google sign-in UI
- backend only verifies the Google token and logs the user in

This is simpler and cleaner.

## 4. Main Difference Between Old and New Approach

### Old Passport approach

- used `passport-google-oauth20`
- needed `google.strategy.ts`
- needed `/auth/google`
- needed `/auth/google/callback`
- needed Google callback URL in env
- backend handled redirects

### New `google-auth-library` approach

- uses `google-auth-library`
- does **not** use Passport for Google login
- does **not** need `google.strategy.ts`
- does **not** need `/auth/google/callback`
- frontend sends `idToken` directly to backend
- backend verifies token and returns JWT

## 5. Changes Made, File by File

## 5.1 `src/auth/google.strategy.ts`

### Before

This file handled Google OAuth using Passport.

It contained:

- Google client ID
- Google client secret
- Google callback URL
- Passport validate logic

### Now

This file is no longer needed for Google login.

### Why

Because we are not using Passport for Google login anymore.

Instead of Passport strategy + callback redirect, we now verify the Google ID token directly in the service.

## 5.2 `src/auth/auth.controller.ts`

### Before

This controller had:

- `GET /auth/google`
- `GET /auth/google/callback`
- Passport guards like `AuthGuard("google")`

### Now

It has:

- `POST /auth/google`

Now the controller receives this body:

```json
{
  "idToken": "google-id-token"
}
```

Then it calls the auth service, gets a JWT token, sets a cookie, and returns the result.

### Why

Because the frontend now sends the Google token directly to the backend.

No redirect flow is needed.

## 5.3 `src/auth/auth.service.ts`

### Before

This service supported normal signup/login and also had logic to create a Google user after Passport gave back the profile.

### Now

This service imports:

```ts
import { OAuth2Client } from "google-auth-library";
```

It now:

- creates an `OAuth2Client`
- verifies the Google ID token
- reads user data from the token payload
- checks that email is verified
- finds or creates the user
- creates the app JWT token

Important methods now are:

- `loginWithGoogle(idToken)`
- `verifyGoogleIdToken(idToken)`
- `findOrCreateGoogleUser(email)`

### Why

This is now the main backend logic for Google login.

So instead of trusting Passport redirect data, we verify the Google token directly using Google's own library.

## 5.4 `src/auth/auth.module.ts`

### Before

This module included the Google Passport strategy provider.

### Now

The Google strategy provider was removed.

JWT secret also now reads from env:

```ts
secret: process.env.JWT_SECRET || "DEV_SECRET_CHANGE_ME"
```

### Why

- Google strategy is no longer needed
- reading JWT secret from env is better than hardcoding it

## 5.5 `src/auth/dto/google-login.dto.ts`

### Before

This file did not exist.

### Now

This file was added to accept:

```json
{
  "idToken": "..."
}
```

### Why

It gives a clean request shape for the new Google login endpoint.

## 5.6 `package.json`

### Before

The project used:

- `passport-google-oauth20`
- `@types/passport-google-oauth20`

### Now

We changed dependencies so that:

- `google-auth-library` was added
- Passport Google OAuth package was removed

### Why

Because Google login no longer uses Passport redirect-based OAuth.

Now it uses token verification with Google's official library.

## 5.7 `.env`

### Before

The older Google Passport flow needed values like:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

### Now

The important values are:

```env
PORT=3002
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=DEV_SECRET_CHANGE_ME
FRONTEND_URL=http://localhost:3000
```

### Why

For the new flow:

- `GOOGLE_CLIENT_ID` is used to verify the Google ID token
- `GOOGLE_CLIENT_SECRET` is not needed for this backend flow
- `GOOGLE_CALLBACK_URL` is not needed because there is no backend callback route now

We also cleaned duplicate env values to avoid confusion.

## 5.8 `src/main.ts`

### Changes made

This file was updated to:

- listen on `process.env.PORT ?? 3002`
- print the backend URL in the console
- keep CORS enabled for frontend origins
- use `cookie-parser` correctly

### Why

This was needed because:

- backend and frontend were using different ports
- frontend needed to call backend without port conflict
- backend was crashing due to the `cookie-parser` import style

## 6. Port Explanation

The ports were important because there was a conflict.

## 6.1 `3000`

This port is used by the **frontend**.

In your setup, the frontend app was running on:

```text
http://localhost:3000
```

### Why this matters

At one point, the backend was also expected on `3000`.

That caused confusion because requests were going to the frontend app instead of the backend.

## 6.2 `3002`

This port is used by the **backend**.

So the Nest API now runs on:

```text
http://localhost:3002/api
```

### Why this was changed

To avoid conflict with the frontend.

Now:

- frontend can stay on `3000`
- backend can stay on `3002`
- requests clearly go to the correct app

## 6.3 Why `/api` is part of the backend URL

In `src/main.ts`, the app uses:

```ts
app.setGlobalPrefix("api");
```

That means all backend routes start with `/api`.

So:

- login route becomes `/api/auth/login`
- signup route becomes `/api/auth/signup`
- Google login route becomes `/api/auth/google`

## 6.4 Final local URLs

### Frontend

```text
http://localhost:3000
```

### Backend

```text
http://localhost:3002/api
```

### Swagger docs

```text
http://localhost:3002/docs
```

## 7. Simple Comparison

## Old way

- backend redirect to Google
- Google redirect back to backend
- Passport strategy handled profile
- callback URL was required
- more setup and more moving parts

## New way

- frontend gets Google token
- frontend sends token to backend
- backend verifies token using `google-auth-library`
- no callback route needed
- simpler for separate frontend/backend apps

## 8. Why the New Way is Better Here

For this project, the new way is better because:

- frontend and backend are separate
- flow is easier to understand
- fewer redirect issues
- fewer callback URL issues
- backend code is simpler
- easier to debug

## 9. Final Summary

Previously, Google login used Passport and redirect routes.

Now, Google login uses `google-auth-library` and a direct token verification flow.

The biggest idea is:

- **old**: "Google sends user back to backend"
- **new**: "Frontend gets Google token, backend verifies it"

Also, ports were cleaned up:

- frontend uses `3000`
- backend uses `3002`

This makes the project easier to run and easier to understand.
