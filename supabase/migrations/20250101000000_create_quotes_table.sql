-- Create quotes table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to insert quotes
CREATE POLICY "Allow public to insert quotes" ON quotes
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view their own quotes (if we add user_id later)
-- CREATE POLICY "Allow users to view own quotes" ON quotes
--     FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view all quotes (we'll handle this in the admin panel)
CREATE POLICY "Allow admins to view all quotes" ON quotes
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at(); 