# Railway Deployment Notes

This project supports two database modes:

- Local development: uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Railway production: uses `DATABASE_URL` only

## Runtime behavior

- In production, the app will only use `DATABASE_URL`
- In production, the app will never fall back to localhost DB settings
- If `DATABASE_URL` is missing on Railway, startup fails with a clear error
- Health endpoint is available at `/api/health`

## Railway backend Variables: keep these

Set these keys on the Railway backend service:

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL`

## Railway backend Variables: delete these

Delete these keys from the Railway backend service if they exist:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `PORT`

## Why delete `PORT`

Railway provides `PORT` automatically at runtime.
You should not hardcode or manually set `PORT` in Railway service variables.

## API base URL

This backend uses:

```ts
app.setGlobalPrefix("api");
```

So all frontend API calls must include `/api`.

Examples:

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/google`
- `GET /api/health`
- `GET /api/recordings`

## Start command

Production must start from compiled output:

```bash
node dist/main.js
```

This repo is configured so:

- `npm run build` builds the app
- `npm start` runs `node dist/main.js`

## Deploy checklist

1. Confirm Railway backend Variables contain `DATABASE_URL`
2. Remove all `DB_*` variables from Railway
3. Remove any manual `PORT` variable from Railway
4. Deploy the backend again
5. Check `/api/health`
6. Check backend logs for:
   - `[DB] DATABASE_URL present: true`
   - `[DB] config mode: railway`
