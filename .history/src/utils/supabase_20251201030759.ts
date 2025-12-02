import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Default client (can be used for general queries)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client for patient_record schema
export const patientRecordClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'patient_record',
  },
});

export default supabase;
