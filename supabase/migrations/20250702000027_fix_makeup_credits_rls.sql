-- Migration: Fix makeup_credits RLS policies to allow INSERT operations
-- Date: 2025-07-02

-- Add INSERT policy for makeup_credits to allow the cancellation function to create credits
CREATE POLICY "System can insert makeup credits" ON public.makeup_credits
  FOR INSERT WITH CHECK (true);

-- Also add a policy for service role to manage makeup credits
CREATE POLICY "Service role can manage makeup credits" ON public.makeup_credits
  FOR ALL USING (auth.role() = 'service_role');

-- Add policy for authenticated users to insert their own makeup credits
CREATE POLICY "Users can insert their own makeup credits" ON public.makeup_credits
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  ); 