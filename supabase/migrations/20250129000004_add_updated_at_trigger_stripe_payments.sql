-- Add updated_at trigger for stripe_payments table

CREATE TRIGGER update_stripe_payments_updated_at 
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_stripe_payments_updated_at ON stripe_payments IS 'Automatically updates updated_at timestamp on row update';

