-- Create phrasal_verbs table
CREATE TABLE public.phrasal_verbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  verb TEXT NOT NULL,
  meanings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, verb)
);

-- Enable Row Level Security
ALTER TABLE public.phrasal_verbs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own phrasal verbs" 
ON public.phrasal_verbs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phrasal verbs" 
ON public.phrasal_verbs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phrasal verbs" 
ON public.phrasal_verbs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phrasal verbs" 
ON public.phrasal_verbs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phrasal_verbs_updated_at
BEFORE UPDATE ON public.phrasal_verbs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();