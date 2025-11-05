-- Remove the duplicate migration entry so we can reapply it properly
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20250122000025';


