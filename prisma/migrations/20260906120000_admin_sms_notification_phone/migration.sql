-- Private recipient for paid retail order and wholesale invoice SMS alerts.
ALTER TABLE "site_settings"
ADD COLUMN "admin_sms_notification_phone" TEXT;
