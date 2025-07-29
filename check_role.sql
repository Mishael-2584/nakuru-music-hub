-- Check user role for mishaelgebre@gmail.com
SELECT 
  'profiles' as table_name,
  id,
  email,
  role
FROM public.profiles 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'teachers' as table_name,
  id,
  email,
  status as role
FROM public.teachers 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'pending_teachers' as table_name,
  id,
  email,
  status as role
FROM public.pending_teachers 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'registrations' as table_name,
  id,
  email,
  status as role
FROM public.registrations 
WHERE email = 'mishaelgebre@gmail.com'; 