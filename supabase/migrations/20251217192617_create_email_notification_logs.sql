-- Create email notification logs table to track all email execution attempts

CREATE TABLE IF NOT EXISTS public.email_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type TEXT NOT NULL CHECK (email_type IN ('weekly_digest', 'monthly_report')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cron', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
    skip_reason TEXT,
    recipient_email TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_notification_logs IS 'Tracks all email notification execution attempts (sent, skipped, or failed)';
COMMENT ON COLUMN public.email_notification_logs.email_type IS 'Type of email: weekly_digest or monthly_report';
COMMENT ON COLUMN public.email_notification_logs.period_start IS 'Start date of the reporting period';
COMMENT ON COLUMN public.email_notification_logs.period_end IS 'End date of the reporting period';
COMMENT ON COLUMN public.email_notification_logs.trigger_type IS 'How the email was triggered: cron or manual';
COMMENT ON COLUMN public.email_notification_logs.status IS 'Execution status: sent, skipped, or failed';
COMMENT ON COLUMN public.email_notification_logs.skip_reason IS 'Reason for skipping (e.g., no_reviews, duplicate_send, monthly_report_week)';
COMMENT ON COLUMN public.email_notification_logs.recipient_email IS 'Email address of the recipient';
COMMENT ON COLUMN public.email_notification_logs.company_id IS 'Company ID if email is company-specific';
COMMENT ON COLUMN public.email_notification_logs.total_reviews IS 'Total number of reviews in the period';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_email_type_period 
    ON public.email_notification_logs(email_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_email_notification_logs_status_created 
    ON public.email_notification_logs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_notification_logs_company_id 
    ON public.email_notification_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_email_notification_logs_recipient_email 
    ON public.email_notification_logs(recipient_email);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_timestamp_before_update_email_notification_logs
    BEFORE UPDATE ON public.email_notification_logs
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all logs
CREATE POLICY "admin_full_access_email_notification_logs"
    ON public.email_notification_logs
    FOR ALL
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
