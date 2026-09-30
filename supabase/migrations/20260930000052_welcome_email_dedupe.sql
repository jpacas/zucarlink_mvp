-- T7: el webhook de email de bienvenida (on-profile-complete) no tenía guard de
-- idempotencia. Supabase entrega webhooks "at least once" — un reintento de red
-- puede disparar handleProfileComplete dos veces para la misma transición de
-- profile_status, enviando el correo de bienvenida duplicado. Se suma 'welcome'
-- al mismo log de dedupe que ya usan los demás emails de engagement.

alter table public.engagement_email_log
  drop constraint if exists engagement_email_log_email_type_check;

alter table public.engagement_email_log
  add constraint engagement_email_log_email_type_check
  check (email_type in ('unread_reminder', 'inactivity_digest', 'liked_topic_reply', 'welcome'));
