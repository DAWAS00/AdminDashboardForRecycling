-- Extend notification_type enum with admin-initiated notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'orderAssignedToDriver';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'orderReassigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'accountVerified';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'accountRejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'systemBroadcast';

-- Note: notifications table already exists with recipient_id (uuid), is_read (bool)
-- Note: profiles table already has fcm_token (text)
-- Note: orders table already has dropoff_lat / dropoff_lng — no delivery_lat/lng needed
