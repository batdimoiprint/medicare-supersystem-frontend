import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Default client (can be used for general queries - public schema)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client for patient_record schema
export const patientRecordClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'patient_record',
  },
});

// Client for dentist schema
export const dentistClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'dentist',
  },
});

// Client for inventory schema
export const inventoryClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'inventory',
  },
});

// Client for frontdesk schema
export const frontdeskClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'frontdesk',
  },
});

export default supabase;
