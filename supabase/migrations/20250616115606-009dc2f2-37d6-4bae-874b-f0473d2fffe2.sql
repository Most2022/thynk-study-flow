
-- Create a table for user tasks (to-do list)
CREATE TABLE public.batch_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('weekly', 'monthly')),
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.batch_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own batch tasks" 
  ON public.batch_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch tasks" 
  ON public.batch_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch tasks" 
  ON public.batch_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch tasks" 
  ON public.batch_tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Drop the old batch_targets table since we're replacing it
DROP TABLE IF EXISTS public.batch_targets;
