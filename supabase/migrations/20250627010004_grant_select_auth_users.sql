-- Allow all authenticated users to select from auth.users (needed for RLS policies)
GRANT SELECT ON TABLE auth.users TO authenticated; 