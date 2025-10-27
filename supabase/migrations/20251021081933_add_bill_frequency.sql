/*
  # Add Bill Frequency Support

  1. Changes
    - Add `frequency_type` column to bills table (weekly, fortnightly, monthly, custom)
    - Add `frequency_days` column for custom frequencies
    - Add `next_due_date` column to track when bill is next due
    - Remove constraint on `due_day` to allow flexibility
    - Update `due_day` to be nullable for non-monthly bills

  2. Notes
    - Existing bills will default to monthly frequency
    - `due_day` is kept for monthly bills (day of month)
    - `next_due_date` is used to calculate when bills occur in pay cycles
    - `frequency_days` is used for custom frequency (e.g., every 10 days)
*/

-- Add new columns to bills table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'frequency_type'
  ) THEN
    ALTER TABLE bills ADD COLUMN frequency_type text DEFAULT 'monthly' CHECK (frequency_type IN ('weekly', 'fortnightly', 'monthly', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'frequency_days'
  ) THEN
    ALTER TABLE bills ADD COLUMN frequency_days integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'next_due_date'
  ) THEN
    ALTER TABLE bills ADD COLUMN next_due_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Update due_day to be nullable
DO $$
BEGIN
  ALTER TABLE bills ALTER COLUMN due_day DROP NOT NULL;
END $$;