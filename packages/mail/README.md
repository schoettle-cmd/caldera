# caldera-mail

Inbound forwarding for privacy@, legal@ and hello@caldera.social.

Resend receives mail for caldera.social (receiving MX) and calls `POST /hooks/resend-inbound` (event `email.received`).
`server.mjs` verifies the Svix signature, fetches the message, and re-sends it from `inbox@caldera.social` to `FORWARD_TO`
with Reply-To set to the original sender. Attachments are not forwarded (noted in the forwarded mail; they stay in Resend).

Run it as a small Node service behind your web server: listen on a local port and proxy only the webhook path to it.
Configuration is by environment variables (keep the env file readable by the service user only): RESEND_API_KEY,
WEBHOOK_SECRET, FORWARD_TO, ALIASES, PORT.
