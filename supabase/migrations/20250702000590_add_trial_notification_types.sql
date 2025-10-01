-- Add missing notification types for trial bookings
-- This migration updates the notification_type check constraint to include trial-related types

-- Drop the existing check constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add the new check constraint with additional notification types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
    'approval_request_approved',
    'approval_request_rejected', 
    'approval_request_submitted',
    'lesson_scheduled',
    'lesson_cancelled',
    'payment_due',
    'payment_received',
    'announcement',
    'system_update',
    'trial_booking',
    'trial_assignment',
    'trial_scheduled',
    'trial_completed',
    'trial_cancelled',
    'other'
));
