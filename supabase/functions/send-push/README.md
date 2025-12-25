# send-push

Supabase Edge Function to send FCM push notifications.

## Secrets required

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FCM_SERVER_KEY` (FCM legacy server key)

## Request

POST JSON:

```json
{
  "title": "...",
  "body": "...",
  "targetGroup": "all|affiliates|artists|non_members|south_africa|international|individual",
  "targetId": "<userId when targetGroup=individual>",
  "image": "https://..." 
}
```

Authorization:

- `Bearer <supabase access token>`

Rules:

- `targetGroup=individual`: allowed for the user themself or admin.
- all other target groups: admin only.
