-- Create global theme settings table
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    colors JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Create index on active themes
CREATE INDEX IF NOT EXISTS idx_theme_settings_active ON public.theme_settings (is_active);

-- RLS Policies
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read theme settings
CREATE POLICY "Admin read theme settings" ON public.theme_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Only admins can create theme settings
CREATE POLICY "Admin insert theme settings" ON public.theme_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update theme settings
CREATE POLICY "Admin update theme settings" ON public.theme_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Public read policy for active theme (everyone can read the active theme)
CREATE POLICY "Public read active theme" ON public.theme_settings
    FOR SELECT USING (is_active = true);

-- Insert default Piscola theme
INSERT INTO public.theme_settings (name, colors, is_active, created_at, updated_at)
VALUES (
    'Default Piscola Theme',
    '{
        "primary": "#d32117",
        "foreground": "#301718",
        "background": "#f4f5f7",
        "card": "#ffffff",
        "textAccent": "#ffffff",
        "secondary": "#f5f2f2",
        "accent": "#d32117",
        "muted": "#faf9f9",
        "border": "#e5dede"
    }'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT (name) DO UPDATE SET 
    colors = EXCLUDED.colors,
    updated_at = NOW();

-- Function to ensure only one active theme
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this theme to active, deactivate all others
    IF NEW.is_active = true THEN
        UPDATE public.theme_settings 
        SET is_active = false 
        WHERE id != NEW.id AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active theme
DROP TRIGGER IF EXISTS trigger_ensure_single_active_theme ON public.theme_settings;
CREATE TRIGGER trigger_ensure_single_active_theme
    BEFORE INSERT OR UPDATE ON public.theme_settings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_theme();

-- Create function to get active theme (public access)
CREATE OR REPLACE FUNCTION get_active_theme()
RETURNS TABLE (
    id UUID,
    name TEXT,
    colors JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.colors,
        t.created_at,
        t.updated_at
    FROM public.theme_settings t
    WHERE t.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to public for the function
GRANT EXECUTE ON FUNCTION get_active_theme() TO public;
