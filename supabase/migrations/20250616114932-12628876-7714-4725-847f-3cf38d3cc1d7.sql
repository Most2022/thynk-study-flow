
-- Create a table for batch targets (monthly and weekly)
CREATE TABLE public.batch_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('weekly', 'monthly')),
  target_value INTEGER NOT NULL CHECK (target_value >= 0 AND target_value <= 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, batch_id, target_type, start_date)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.batch_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for batch targets
CREATE POLICY "Users can view their own batch targets" 
  ON public.batch_targets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch targets" 
  ON public.batch_targets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch targets" 
  ON public.batch_targets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch targets" 
  ON public.batch_targets 
  FOR DELETE 
  USING (auth.uid() = user_id);
