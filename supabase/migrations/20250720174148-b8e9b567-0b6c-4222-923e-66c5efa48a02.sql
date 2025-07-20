-- Create storage buckets for ASR-GoT analyses and visualizations
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit) 
VALUES 
  ('asr-got-analyses', 'asr-got-analyses', false, '{"application/json", "text/html", "text/plain"}', 52428800),
  ('asr-got-visualizations', 'asr-got-visualizations', true, '{"image/png", "image/svg+xml", "application/pdf"}', 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage
CREATE POLICY "Users can upload their own analysis files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'asr-got-analyses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own analysis files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'asr-got-analyses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own analysis files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'asr-got-analyses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own analysis files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'asr-got-analyses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Visualization bucket policies (public read)
CREATE POLICY "Anyone can view visualization files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'asr-got-visualizations');

CREATE POLICY "Users can upload visualization files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'asr-got-visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own visualization files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'asr-got-visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own visualization files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'asr-got-visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);