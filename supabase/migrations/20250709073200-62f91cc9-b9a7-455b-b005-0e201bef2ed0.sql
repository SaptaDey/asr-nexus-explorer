-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create research sessions table
CREATE TABLE public.research_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create graph data table
CREATE TABLE public.graph_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stage executions table
CREATE TABLE public.stage_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for research sessions
CREATE POLICY "Users can view their own sessions" 
ON public.research_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.research_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.research_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.research_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for graph data
CREATE POLICY "Users can view graph data for their sessions" 
ON public.graph_data 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

CREATE POLICY "Users can insert graph data for their sessions" 
ON public.graph_data 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

CREATE POLICY "Users can update graph data for their sessions" 
ON public.graph_data 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

-- Create RLS policies for stage executions
CREATE POLICY "Users can view stage executions for their sessions" 
ON public.stage_executions 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

CREATE POLICY "Users can insert stage executions for their sessions" 
ON public.stage_executions 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

CREATE POLICY "Users can update stage executions for their sessions" 
ON public.stage_executions 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.research_sessions WHERE id = session_id
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_sessions_updated_at
  BEFORE UPDATE ON public.research_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_graph_data_updated_at
  BEFORE UPDATE ON public.graph_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();