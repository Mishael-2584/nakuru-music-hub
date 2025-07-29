-- Create quotes table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contact Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Project Details
    service_category TEXT NOT NULL,
    project_type TEXT,
    event_date DATE,
    location TEXT,
    
    -- Requirements
    budget_range TEXT,
    timeline TEXT,
    specific_requirements TEXT,
    reference_materials_url TEXT,
    
    -- Status and Admin
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    admin_notes TEXT,
    quote_amount DECIMAL(10,2),
    quote_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional Details
    preferred_contact_method TEXT DEFAULT 'email',
    additional_notes TEXT
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Enable RLS (only if not already enabled)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Allow public to insert quotes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quotes' 
        AND policyname = 'Allow public to insert quotes'
    ) THEN
        CREATE POLICY "Allow public to insert quotes" ON quotes
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Allow admins to view all quotes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quotes' 
        AND policyname = 'Allow admins to view all quotes'
    ) THEN
        CREATE POLICY "Allow admins to view all quotes" ON quotes
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create function to update updated_at (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at(); 