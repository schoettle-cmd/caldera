# caldera-mail

Inbound forwarding for privacy@, legal@ and hello@caldera.social.

Resend receives mail for caldera.social (receiving MX) and calls `POST /hooks/resend-inbound` (event `email.received`).
`server.mjs` verifies the Svix signature, fetches the message, and re-sends it from `inbox@caldera.social` to `FORWARD_TO`
with Reply-To set to the original sender. Attachments are not forwarded (noted in the forwarded mail; they stay in Resend).

Runs on DIRECTOR: /opt/caldera-mail, pm2 `caldera-mail` (ubuntu), 127.0.0.1:4791, nginx `location = /hooks/resend-inbound`
in the caldera.social server block. Env in /opt/caldera-mail/.env (600): RESEND_API_KEY, WEBHOOK_SECRET, FORWARD_TO, ALIASES, PORT.
