/*
  # Finance Tracker Schema

  1. New Tables
    - `pay_cycles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - e.g., "Bi-weekly", "Monthly"
      - `start_date` (date) - when the pay cycle starts
      - `frequency_days` (integer) - number of days in cycle (14 for bi-weekly, 30 for monthly, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - bill name
      - `amount` (decimal) - bill amount
      - `due_day` (integer) - day of month bill is due (1-31)
      - `category` (text) - bill category
      - `is_recurring` (boolean) - whether bill repeats
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only read/write their own pay cycles and bills
*/

-- Create pay_cycles table
CREATE TABLE IF NOT EXISTS pay_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  frequency_days integer NOT NULL CHECK (frequency_days > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount decimal(10, 2) NOT NULL CHECK (amount >= 0),
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category text DEFAULT 'General',
  is_recurring boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pay_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Pay cycles policies
CREATE POLICY "Users can view own pay cycles"
  ON pay_cycles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pay cycles"
  ON pay_cycles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pay cycles"
  ON pay_cycles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pay cycles"
  ON pay_cycles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bills policies
CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON bills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);