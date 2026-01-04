# send-push-notification Edge Function

This Edge Function expects to receive a JSON payload from a Supabase Database Webhook whenever a new row is inserted into `public.notifications`.

Behavior:
- Reads `user_id`, `title`, and `message` (or `body`) from the payload record.
- Queries `push_tokens` table for all `is_active = true` tokens for that user and sends an FCM message to those tokens using `FCM_SERVER_KEY`.

Environment variables (set these in the Supabase Functions settings):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FCM_SERVER_KEY` (your Firebase server key)

Database Webhook (Supabase Console):
1. Go to your Supabase project → Database → Webhooks → Create a Webhook
2. Target URL: `https://<your-edge-fn-url>/send-push-notification` (deployed function URL)
3. Events: `INSERT` on `public.notifications`
4. Leave schema to `public` and table to `notifications`
5. Save. On each insert, Supabase will POST the new row payload to the function.

Notes:
- The function accepts several payload shapes: `record`, `new`, or direct object shapes. It will attempt to map `user_id` from `user_id` or `userId` and will look for `title` and `message` or `body`.
- If `FCM_SERVER_KEY` is not provided, the function will perform a dry run and return the tokens found.

Security:
- The function uses the Supabase Service Role Key to query `push_tokens`. Keep this key secret and limit who can call the function end-to-end.
