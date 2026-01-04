# Push Notification Bridge Setup

This outlines the steps to enable push notifications end-to-end (client → DB → Edge Function → FCM).

1) Run SQL Migrations
- `supabase/migrations/20260102_ensure_push_tokens.sql` — ensures `push_tokens` table exists and has correct RLS.
- `supabase/migrations/20260102_add_user_id_to_notifications.sql` — adds `user_id` (snake_case) to `notifications` and updates RLS policies.

Apply them in your Supabase project (via psql/supabase CLI or Supabase Console migrations).

2) Environment Variables (for Edge Function)
- `SUPABASE_URL` (project URL)
- `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- `FCM_SERVER_KEY` (Firebase legacy server key)
 - `FIREBASE_SERVICE_ACCOUNT` (JSON-stringified Firebase service account credentials for FCM HTTP v1)
 - `FIREBASE_PROJECT_ID` (optional, will be read from service account if not provided)

PayFast Webhook:
- `PAYFAST_ALLOWED_IPS` - comma-separated CIDR ranges PayFast uses for ITN servers. This must be set to validate incoming IPs for the PayFast ITN webhook.

Set these in the Supabase Functions settings or in your CI environment for deployment.

3) Deploy Edge Function
- Deploy `supabase/functions/send-push-notification` using `supabase functions deploy send-push-notification`.

Note: The Edge Function must use the Service Role Key client and explicitly query `public.push_tokens` (not `auth.*` or `users` tables) so RLS does not prevent the system from seeing tokens for arbitrary users.

4) Create Database Webhook
- In Supabase Console → Database → Webhooks → Create Webhook
  - URL: `https://<your-edge-fn-url>/send-push-notification`
  - Events: `INSERT` on `public.notifications`
  - Save.

7) Realtime & Triggers (orders -> notifications)
- A trigger `notify_on_order_status_change()` is provided in `supabase/migrations/20260102_orders_notifications_triggers_and_replica.sql`.
  - It inserts a notification row when an `orders` row transitions to `processing` or `shipped`.
  - The migration also sets `REPLICA IDENTITY FULL` on `orders` and `notifications` and creates a publication `orders_notifications_pub` to ensure realtime events are available to Supabase Realtime.
  - After applying migrations, confirm Realtime toggle in Supabase Console for `orders` and `notifications` (usually enabled when publications/replication are set up).

5) Client-side
- The client will upsert push tokens into `push_tokens` (see `utils/pushNotifications.ts`). Make sure the client is authenticated so RLS (user_id = auth.uid()) allows the upsert.

6) Admin Testing
- In Admin → Push Notification panel, use the new **Send Test Notification** box to enter a `User UID` and send a test notification. This inserts a row in `notifications` and should trigger a webhook.

Troubleshooting:
- If no devices receive messages, verify `push_tokens` contains tokens for the user and `FCM_SERVER_KEY` is set.
- Use the `sendAdminPush` function for manual sends; its logs are helpful.

Token self-healing:
- The Edge Function performs token self-healing: when Firebase responds with an error indicating a token is invalid or unregistered (e.g., `InvalidRegistration`, `NotRegistered`), the function will automatically remove that token from `public.push_tokens` to keep the database clean.

Security Notes:
- Keep the service role key and FCM server key secure. Only the Edge Function should hold the service role key.
- Consider rotating push tokens on logout or token invalidation.
