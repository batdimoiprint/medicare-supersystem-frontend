import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Activity,
  Pill,
  Package,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Save,
  Loader2,
  X,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '@/lib/utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const patientRecordClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'patient_record' } });
const dentistClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'dentist' } });
const inventoryClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'inventory' } });
const frontdeskClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'frontdesk' } });
const publicClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'public' } });


// --- Type Definitions ---
interface Appointment {
  appointment_id: number;
  patient_id: number;
  service_id: number;
  personnel_id: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_status_id: number;
  service_name?: string;
  patient_name?: string;
}

interface Patient {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_fee?: number;
}

interface Medicine {
  medicine_id: number;
  medicine_name: string;
}

interface Dentist {
  personnel_id: string;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Tooth {
  number: number;
  condition: string;
  procedureType?: string;
  notes?: string;
}

const STEPS = [
  { id: 1, name: 'Appointment', icon: Calendar },
  { id: 2, name: 'Treatment Plan', icon: ClipboardList },
  { id: 3, name: 'Dental Charting', icon: Activity },
  { id: 4, name: 'Prescriptions', icon: Pill },
  { id: 5, name: 'Materials', icon: Package },
  { id: 6, name: 'Patient Record', icon: FileText },
];

const PatientWorkflow = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicinesList, setMedicinesList] = useState<Array<{ medicine_id: number; medicine_name: string }>>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [toothConditions, setToothConditions] = useState<{ id: number; condition_name: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Array<{
    name: string;
    category: string;
    unit_cost: number;
    id?: number;
  }>>([]);

  // Selected values
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [currentDentistId, setCurrentDentistId] = useState<string | null>(null);
  const [savedTreatmentPlanId, setSavedTreatmentPlanId] = useState<number | null>(null); // Track saved treatment plan ID
  
  // Check for appointment ID in URL params and auto-select it, then move to treatment plan
  useEffect(() => {
    const appointmentParam = searchParams.get('appointment');
    if (appointmentParam && appointments.length > 0) {
      const appointmentId = parseInt(appointmentParam, 10);
      if (!isNaN(appointmentId)) {
        // Verify the appointment exists in the loaded appointments
        const appointmentExists = appointments.some(a => a.appointment_id === appointmentId);
        if (appointmentExists) {
          console.log('Auto-selecting appointment from URL:', appointmentId);
          setSelectedAppointment(appointmentId);
          // Auto-advance to treatment plan step (step 2)
          setCurrentStep(2);
          // Remove the appointment param from URL after setting it
          setSearchParams({}, { replace: true });
        } else {
          console.warn('Appointment ID from URL not found in loaded appointments:', appointmentId);
        }
      }
    }
  }, [searchParams, setSearchParams, appointments]);

  // Step 2: Treatment Plan
  const [treatmentPlan, setTreatmentPlan] = useState({
    treatment_name: '',
    description: '',
    treatment_status: 'Ongoing' as 'Pending' | 'Ongoing' | 'Completed' | 'Cancelled',
    services: [] as Array<{ service_id: number; estimated_cost: number; priority: string; status: string; tooth_number?: string }>,
  });

  // Step 3: Dental Charting
  const [teeth, setTeeth] = useState<Record<number, Tooth>>({});

  // Step 4: Prescriptions
  const [prescriptions, setPrescriptions] = useState<Array<{
    medicine_id: number;
    instructions: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: string;
  }>>([]);

  // Step 5: Material Logging
  const [materials, setMaterials] = useState<Array<{
    item_name: string;
    category: string;
    quantity: number;
    unit_cost: number;
    supplier: string;
    notes: string;
  }>>([]);

  // Step 6: Patient Record
  const [patientRecord, setPatientRecord] = useState<{
    date: string;
    time: string;
    chief_complaint: string;
    diagnosis: string;
    treatment_id: number | null;
    treatment?: string;
    what_was_done?: string;
    medicines?: Array<{ name: string; howOften: string; howManyDays: string }>;
    home_care?: {
      whatToDo: string[];
      whatToAvoid: string[];
      warningSigns: string[];
    };
    notes: string;
    status: string;
    personnel_id?: string | number; // For dentist selection
  }>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    chief_complaint: '',
    diagnosis: '',
    treatment_id: null,
    what_was_done: '',
    medicines: [],
    home_care: {
      whatToDo: [''],
      whatToAvoid: [''],
      warningSigns: [''],
    },
    notes: '',
    status: 'Active',
  });

  // Auto-fill treatment from treatment plan when moving to step 6 or when treatment plan changes
  useEffect(() => {
    if (currentStep === 6 && treatmentPlan.services.length > 0) {
      // Use the first service from the treatment plan
      const firstService = treatmentPlan.services.find(s => s.service_id > 0);
      if (firstService && firstService.service_id > 0) {
        // Only auto-fill if treatment_id is not already set
        if (!patientRecord.treatment_id || patientRecord.treatment_id === 0) {
          setPatientRecord(prev => ({
            ...prev,
            treatment_id: firstService.service_id,
          }));
        }
      }
    }
  }, [currentStep, treatmentPlan.services]);

  // Also auto-fill when treatment plan services are added/updated
  useEffect(() => {
    if (treatmentPlan.services.length > 0 && currentStep >= 6) {
      const firstService = treatmentPlan.services.find(s => s.service_id > 0);
      if (firstService && firstService.service_id > 0 && !patientRecord.treatment_id) {
        setPatientRecord(prev => ({
          ...prev,
          treatment_id: firstService.service_id,
        }));
      }
    }
  }, [treatmentPlan.services]);

  // Auto-fill dentist when moving to step 6
  useEffect(() => {
    if (currentStep === 6 && currentDentistId) {
      // Always set the dentist to the current logged-in dentist when entering step 6
      setPatientRecord(prev => ({
        ...prev,
        personnel_id: currentDentistId,
      }));
    }
  }, [currentStep, currentDentistId]);

  // Get current dentist ID - more robust method
  const getPersonnelId = (): string | null => {
    // Check localStorage first (as used by auth system in src/lib/auth.ts)
    const userId = localStorage.getItem('user_id');
    if (userId) {
      console.log('Found user_id in localStorage:', userId);
      return userId;
    }
    // Fallback: check sessionStorage
    const sessionUserId = sessionStorage.getItem('user_id');
    if (sessionUserId) {
      console.log('Found user_id in sessionStorage:', sessionUserId);
      return sessionUserId;
    }
    // Fallback: try to get from user object
    const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const personnelId = user.personnel_id || user.id || null;
        console.log('Found personnel_id from user object:', personnelId);
        return personnelId;
      } catch {
        return null;
      }
    }
    console.warn('No user_id or user object found in localStorage/sessionStorage');
    return null;
  };

  // Get current dentist ID
  useEffect(() => {
    const personnelId = getPersonnelId();
    setCurrentDentistId(personnelId);
    console.log('Current dentist ID set to:', personnelId);
  }, []);

  // Load appointments assigned to current dentist
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const personnelId = getPersonnelId();
        console.log('Loading appointments for personnel_id:', personnelId);
        
        if (!personnelId) {
          console.warn('No personnel_id found, cannot load appointments');
          setAppointments([]);
          return;
        }

        console.log('Querying with personnel_id:', personnelId, '(type:', typeof personnelId, ')');

        // Load appointment statuses to find "Completed" status_id
        const { data: statusData } = await frontdeskClient
          .from('appointment_status_tbl')
          .select('appointment_status_id, appointment_status_name');
        
        const completedStatusId = statusData?.find(s => 
          s.appointment_status_name?.trim().toLowerCase() === 'completed'
        )?.appointment_status_id || 4; // Default to 4 if not found
        
        console.log('Completed status ID:', completedStatusId);

        // Try querying with personnel_id as string first (since it's stored as text in DB)
        // Exclude appointments with "Completed" status
        let { data, error } = await frontdeskClient
          .from('appointment_tbl')
          .select(`
            appointment_id,
            patient_id,
            service_id,
            personnel_id,
            appointment_date,
            appointment_time,
            appointment_status_id
          `)
          .eq('personnel_id', String(personnelId))
          .neq('appointment_status_id', completedStatusId) // Exclude completed appointments
          .order('appointment_date', { ascending: false })
          .limit(50);

        console.log('First query (string) result - data:', data?.length || 0, 'error:', error);
        if (data && data.length > 0) {
          console.log('Sample appointment personnel_id:', data[0].personnel_id, 'type:', typeof data[0].personnel_id);
        }

        // If no results and no error, try with number
        if ((!data || data.length === 0) && !error) {
          const personnelIdNum = Number(personnelId);
          if (!isNaN(personnelIdNum)) {
            console.log('Trying with personnel_id as number:', personnelIdNum);
            const result = await frontdeskClient
              .from('appointment_tbl')
              .select(`
                appointment_id,
                patient_id,
                service_id,
                personnel_id,
                appointment_date,
                appointment_time,
                appointment_status_id
              `)
              .eq('personnel_id', personnelIdNum)
              .neq('appointment_status_id', completedStatusId) // Exclude completed appointments
              .order('appointment_date', { ascending: false })
              .limit(50);
            data = result.data;
            error = result.error;
            console.log('Second query (number) result - data:', data?.length || 0, 'error:', error);
            if (data && data.length > 0) {
              console.log('Sample appointment personnel_id:', data[0].personnel_id, 'type:', typeof data[0].personnel_id);
            }
          }
        }

        // If still no results, try loading all and filtering client-side
        if ((!data || data.length === 0) && !error) {
          console.log('No results with direct query. Trying to load all appointments and filter client-side...');
          
          // Load appointment statuses to find "Completed" status_id (if not already loaded)
          let completedStatusIdForFilter = 4; // Default
          try {
            const { data: statusData } = await frontdeskClient
              .from('appointment_status_tbl')
              .select('appointment_status_id, appointment_status_name');
            
            completedStatusIdForFilter = statusData?.find(s => 
              s.appointment_status_name?.trim().toLowerCase() === 'completed'
            )?.appointment_status_id || 4;
          } catch (statusErr) {
            console.warn('Could not load appointment statuses, using default completedStatusId = 4');
          }
          
          // First, test if we can access the table at all with a simple count
          try {
            const { count, error: countError } = await frontdeskClient
              .from('appointment_tbl')
              .select('*', { count: 'exact', head: true });
            
            console.log('Table access test - count:', count, 'error:', countError);
            
            if (countError) {
              console.error('Cannot access appointment_tbl:', countError);
              console.error('This is likely a permissions issue. Check RLS policies or grant SELECT permissions.');
            } else if (count === 0) {
              console.warn('Table is accessible but has 0 rows. This could mean:');
              console.warn('1. The table is actually empty');
              console.warn('2. RLS is blocking all rows from view');
            }
          } catch (countErr) {
            console.error('Error testing table access:', countErr);
          }
          
          const { data: allData, error: allError } = await frontdeskClient
            .from('appointment_tbl')
            .select(`
              appointment_id,
              patient_id,
              service_id,
              personnel_id,
              appointment_date,
              appointment_time,
              appointment_status_id
            `)
            .order('appointment_date', { ascending: false })
            .limit(100);

          if (allError) {
            console.error('Error loading all appointments:', allError);
            console.error('Error code:', allError.code);
            console.error('Error message:', allError.message);
            console.error('This suggests a permissions issue. You may need to:');
            console.error('1. Grant SELECT permission: GRANT SELECT ON frontdesk.appointment_tbl TO anon;');
            console.error('2. Or disable RLS: ALTER TABLE frontdesk.appointment_tbl DISABLE ROW LEVEL SECURITY;');
          } else {
            console.log('Loaded all appointments:', allData?.length || 0);
            if (allData && allData.length > 0) {
              console.log('Sample appointment personnel_id:', allData[0].personnel_id, 'type:', typeof allData[0].personnel_id);
              console.log('All personnel_ids in results:', allData.map(a => `${a.personnel_id} (${typeof a.personnel_id})`).slice(0, 10));
              console.log('Looking for personnel_id:', personnelId, 'type:', typeof personnelId);
              
              // Filter client-side - try both string and number comparison
              // Also exclude completed appointments
              data = (allData || []).filter(app => {
                const appPersonnelId = app.personnel_id;
                const matchesString = String(appPersonnelId) === String(personnelId);
                const matchesNumber = Number(appPersonnelId) === Number(personnelId);
                const matches = appPersonnelId != null && (matchesString || matchesNumber);
                const isNotCompleted = app.appointment_status_id !== completedStatusIdForFilter;
                if (matches && isNotCompleted) {
                  console.log('Found matching appointment:', app.appointment_id, 'personnel_id:', appPersonnelId);
                }
                return matches && isNotCompleted;
              });
              error = null;
              console.log('Filtered appointments client-side:', data?.length || 0);
            } else {
              console.warn('No appointments found in database at all. This could mean:');
              console.warn('1. The table is empty');
              console.warn('2. RLS is blocking all rows');
              console.warn('3. SELECT permission is not granted');
              console.warn('Run this SQL to fix: GRANT SELECT ON frontdesk.appointment_tbl TO anon, authenticated;');
            }
          }
        }

        // If error, log detailed error information
        if (error) {
          console.error('Error loading appointments:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          
          // If it's a permission error, try loading all appointments and filtering client-side
          if (error.code === '42501' || error.code === 'PGRST301' || error.message?.includes('permission')) {
            console.log('Permission error detected. Trying to load all appointments and filter client-side...');
            
            // Load appointment statuses to find "Completed" status_id
            let completedStatusIdForError = 4; // Default
            try {
              const { data: statusData } = await frontdeskClient
                .from('appointment_status_tbl')
                .select('appointment_status_id, appointment_status_name');
              
              completedStatusIdForError = statusData?.find(s => 
                s.appointment_status_name?.trim().toLowerCase() === 'completed'
              )?.appointment_status_id || 4;
            } catch (statusErr) {
              console.warn('Could not load appointment statuses, using default completedStatusId = 4');
            }
            
            const { data: allData, error: allError } = await frontdeskClient
              .from('appointment_tbl')
              .select(`
                appointment_id,
                patient_id,
                service_id,
                personnel_id,
                appointment_date,
                appointment_time,
                appointment_status_id
              `)
              .order('appointment_date', { ascending: false })
              .limit(100);

            if (allError) {
              console.error('Error loading all appointments:', allError);
              setAppointments([]);
              return;
            }

            // Filter client-side - exclude completed appointments
            const personnelIdNum = Number(personnelId);
            data = (allData || []).filter(app => 
              app.personnel_id != null && 
              Number(app.personnel_id) === personnelIdNum &&
              app.appointment_status_id !== completedStatusIdForError
            );
            error = null;
            console.log('Filtered appointments client-side:', data?.length || 0);
          } else {
            setAppointments([]);
            return;
          }
        }

        console.log('Loaded appointments:', data?.length || 0, data);

        // Load service names
        const serviceIds = [...new Set((data || []).map(a => a.service_id).filter(Boolean))];
        if (serviceIds.length > 0) {
          const { data: servicesData, error: servicesError } = await dentistClient
            .from('services_tbl')
            .select('service_id, service_name')
            .in('service_id', serviceIds);

          if (servicesError) {
            console.error('Error loading services:', servicesError);
          }

          const serviceMap = new Map(servicesData?.map(s => [s.service_id, s.service_name]) || []);

          const appointmentsWithNames = (data || []).map(app => ({
            ...app,
            service_name: serviceMap.get(app.service_id) || 'Unknown Service',
          }));

          console.log('Appointments with service names:', appointmentsWithNames);
          setAppointments(appointmentsWithNames);
        } else {
          setAppointments(data || []);
        }
      } catch (err: any) {
        console.error('Failed to load appointments:', err);
        console.error('Error stack:', err.stack);
        setAppointments([]);
      }
    };

    loadAppointments();
  }, []);

  // Load patients
  useEffect(() => {
    const loadPatients = async () => {
      const { data } = await patientRecordClient
        .from('patient_tbl')
        .select('patient_id, f_name, m_name, l_name')
        .order('l_name', { ascending: true });
      setPatients(data || []);
    };
    loadPatients();
  }, []);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      const { data } = await dentistClient
        .from('services_tbl')
        .select('service_id, service_name, service_fee')
        .order('service_name', { ascending: true });
      setServices(data || []);
    };
    loadServices();
  }, []);

  // Load medicines (for prescriptions)
  useEffect(() => {
    const loadMedicines = async () => {
      const { data } = await inventoryClient
        .from('medicine_tbl')
        .select('medicine_id, medicine_name, quantity')
        .order('medicine_name', { ascending: true });
      
      // Filter out medicines with quantity 0 or null
      const availableMedicines = (data || []).filter(med => 
        med.quantity != null && Number(med.quantity) > 0
      );
      
      setMedicines(availableMedicines);
    };
    loadMedicines();
  }, []);

  // Load medicines list (for patient record form dropdown)
  useEffect(() => {
    const loadMedicinesList = async () => {
      const { data } = await inventoryClient
        .from('medicine_tbl')
        .select('medicine_id, medicine_name')
        .order('medicine_name', { ascending: true });
      setMedicinesList(data || []);
    };
    loadMedicinesList();
  }, []);

  // Load dentists
  useEffect(() => {
    const loadDentists = async () => {
      try {
        const { data, error } = await publicClient
          .from('personnel_tbl')
          .select('personnel_id, f_name, m_name, l_name, role_id')
          .eq('role_id', '1')
          .order('l_name', { ascending: true });

        if (error) {
          console.error('Failed to load dentists:', error);
          return;
        }

        setDentists(data ?? []);
      } catch (err) {
        console.error('Error loading dentists:', err);
      }
    };
    loadDentists();
  }, []);

  // Load tooth conditions
  useEffect(() => {
    const loadConditions = async () => {
      const { data } = await patientRecordClient
        .from('tooth_conditions')
        .select('id, condition_name')
        .order('condition_name', { ascending: true });
      setToothConditions(data || []);
    };
    loadConditions();
  }, []);

  // Load inventory items (consumables, medicines, equipment)
  useEffect(() => {
    const loadInventoryItems = async () => {
      try {
        const [consumables, medicinesData, equipment] = await Promise.all([
          inventoryClient.from('consumables_tbl').select('consumable_name, unit_cost, consumable_id'),
          inventoryClient.from('medicine_tbl').select('medicine_name, unit_cost, medicine_id'),
          inventoryClient.from('equipment_tbl').select('equipment_name, unit_cost, equipment_id'),
        ]);

        const items: Array<{ name: string; category: string; unit_cost: number; id?: number }> = [
          ...(consumables.data ?? []).map(c => ({ 
            name: c.consumable_name, 
            category: 'Consumables', 
            unit_cost: c.unit_cost || 0,
            id: c.consumable_id 
          })),
          ...(medicinesData.data ?? []).map(m => ({ 
            name: m.medicine_name, 
            category: 'Medicines', 
            unit_cost: m.unit_cost || 0,
            id: m.medicine_id 
          })),
          ...(equipment.data ?? []).map(e => ({ 
            name: e.equipment_name, 
            category: 'Equipment', 
            unit_cost: e.unit_cost || 0,
            id: e.equipment_id 
          })),
        ];
        
        setInventoryItems(items);
      } catch (err) {
        console.error('Failed to load inventory items:', err);
      }
    };
    loadInventoryItems();
  }, []);

  // Initialize teeth when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      const initializeTeeth = () => {
        const newTeeth: Record<number, Tooth> = {};
        for (let i = 1; i <= 32; i++) {
          newTeeth[i] = { number: i, condition: 'Healthy' };
        }
        setTeeth(newTeeth);
      };
      initializeTeeth();
    }
  }, [selectedPatientId]);

  // Auto-populate charting from treatment plan when moving to step 3
  useEffect(() => {
    if (currentStep === 3 && treatmentPlan.services.length > 0 && toothConditions.length > 0 && selectedPatientId) {
      setTeeth(prevTeeth => {
        const updatedTeeth = { ...prevTeeth };
        let hasChanges = false;

        treatmentPlan.services.forEach(service => {
          if (service.tooth_number) {
            const toothNum = parseInt(service.tooth_number);
            if (toothNum >= 1 && toothNum <= 32) {
              // Get the service name to determine condition
              const serviceData = services.find(s => s.service_id === service.service_id);
              if (serviceData) {
                // Map service name to tooth condition
                let conditionName = 'For Filling'; // Default
                const serviceNameLower = serviceData.service_name.toLowerCase();
                
                if (serviceNameLower.includes('crown')) {
                  conditionName = 'Crown';
                } else if (serviceNameLower.includes('implant')) {
                  conditionName = 'Implant';
                } else if (serviceNameLower.includes('root canal')) {
                  conditionName = 'Root Canal';
                } else if (serviceNameLower.includes('filling') || serviceNameLower.includes('fill')) {
                  conditionName = 'For Filling';
                } else if (serviceNameLower.includes('extraction') || serviceNameLower.includes('remove')) {
                  conditionName = 'Missing';
                }

                // Find condition in toothConditions array
                const conditionData = toothConditions.find(c => 
                  c.condition_name.toLowerCase() === conditionName.toLowerCase()
                );
                
                if (conditionData) {
                  updatedTeeth[toothNum] = {
                    number: toothNum,
                    condition: conditionData.condition_name,
                    notes: `From treatment plan: ${serviceData.service_name}`,
                  };
                  hasChanges = true;
                }
              }
            }
          }
        });

        return hasChanges ? updatedTeeth : prevTeeth;
      });
    }
  }, [currentStep, treatmentPlan.services, services, toothConditions, selectedPatientId]);

  // When appointment is selected, set patient and auto-add service to treatment plan
  useEffect(() => {
    if (selectedAppointment) {
      const appointment = appointments.find(a => a.appointment_id === selectedAppointment);
      if (appointment) {
        setSelectedPatientId(appointment.patient_id);
        
        // Auto-add the appointment's service to treatment plan if not already added
        if (appointment.service_id && appointment.service_id > 0) {
          const serviceExists = treatmentPlan.services.some(s => s.service_id === appointment.service_id);
          if (!serviceExists) {
            const service = services.find(s => s.service_id === appointment.service_id);
            if (service) {
              setTreatmentPlan(prev => ({
                ...prev,
                // Auto-fill treatment name with service name if empty
                treatment_name: prev.treatment_name || service.service_name || '',
                services: [...prev.services, {
                  service_id: appointment.service_id,
                  estimated_cost: service.service_fee || 0,
                  priority: 'Medium',
                  status: 'Pending',
                }],
              }));
            }
          }
        }
      }
    }
  }, [selectedAppointment, appointments, services]);

  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.patient_id === patientId);
    if (!patient) return `Patient #${patientId}`;
    return `${patient.f_name || ''} ${patient.m_name || ''} ${patient.l_name || ''}`.trim() || `Patient #${patientId}`;
  };

  const handleNext = async () => {
    // Verification before moving to Prescriptions (Step 4)
    if (currentStep === 3 && currentStep + 1 === 4) {
      // Check if treatment is completed
      if (treatmentPlan.treatment_status !== 'Completed') {
        const confirmed = window.confirm(
          'Is the treatment complete? Click OK to mark it as completed and proceed to prescriptions, or Cancel to stay on this step.'
        );
        
        if (confirmed) {
          // Mark treatment as completed
          setTreatmentPlan(prev => ({ ...prev, treatment_status: 'Completed' }));
          
          // If treatment plan has been saved, update it in database
          if (savedTreatmentPlanId) {
            try {
              await dentistClient
                .from('treatment_plan_tbl')
                .update({ treatment_status: 'Completed' })
                .eq('treatment_id', savedTreatmentPlanId);
              console.log('Treatment plan marked as Completed:', savedTreatmentPlanId);
            } catch (error) {
              console.error('Failed to update treatment plan status:', error);
              alert('Failed to update treatment status. Please try again.');
              return; // Don't proceed if update fails
            }
          }
        } else {
          // User cancelled, don't proceed
          return;
        }
      }
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    setSaving(true);
    try {
      // Step 2: Save Treatment Plan
      if (treatmentPlan.treatment_name) {
        const { data: planData, error: planError } = await dentistClient
          .from('treatment_plan_tbl')
          .insert({
            patient_id: selectedPatientId,
            treatment_name: treatmentPlan.treatment_name,
            description: treatmentPlan.description,
            treatment_status: treatmentPlan.treatment_status,
          })
          .select()
          .single();

        if (planError) throw planError;

        // Store the treatment plan ID for later update
        if (planData?.treatment_id) {
          setSavedTreatmentPlanId(planData.treatment_id);
        }

        if (treatmentPlan.services.length > 0 && planData) {
          const { data: maxData } = await dentistClient
            .from('treatment_services_tbl')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

          let nextId = 1;
          if (maxData?.id) {
            nextId = (maxData.id as number) + 1;
          }

          const servicesToInsert = treatmentPlan.services.map((service, index) => ({
            id: nextId + index,
            treatment_id: planData.treatment_id,
            service_id: service.service_id,
            tooth_number: service.tooth_number || null,
            estimated_cost: service.estimated_cost,
            priority: service.priority,
            status: service.status,
          }));

          await dentistClient.from('treatment_services_tbl').insert(servicesToInsert);
        }
      }

      // Step 3: Save Dental Charting
      const unhealthyTeeth = Object.values(teeth).filter(t => t.condition !== 'Healthy');
      if (unhealthyTeeth.length > 0) {
        const toothNumbers = unhealthyTeeth.map(t => t.number);
        await patientRecordClient
          .from('patient_teeth')
          .delete()
          .eq('patient_id', selectedPatientId)
          .in('tooth_number', toothNumbers);

        const { data: maxData } = await patientRecordClient
          .from('patient_teeth')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();

        let nextId = 1;
        if (maxData?.id) {
          nextId = (maxData.id as number) + 1;
        }

        const conditionMap = new Map(toothConditions.map(c => [c.condition_name, c.id]));

        const rows = unhealthyTeeth.map((tooth, index) => ({
          id: nextId + index,
          patient_id: selectedPatientId,
          tooth_number: tooth.number,
          condition_id: conditionMap.get(tooth.condition) || 1,
          procedure_type: tooth.procedureType || null,
          notes: tooth.notes || null,
        }));

        await patientRecordClient.from('patient_teeth').insert(rows);
      }

      // Step 4: Save Prescriptions and auto-log medicines to materials
      // Build a local materials array to ensure we have all materials before saving
      const materialsToSave = [...materials];
      
      for (const prescription of prescriptions) {
        const { data: maxData } = await dentistClient
          .from('prescription_tbl')
          .select('prescription_id')
          .order('prescription_id', { ascending: false })
          .limit(1)
          .single();

        let nextPrescriptionId = 1;
        if (maxData?.prescription_id) {
          nextPrescriptionId = (maxData.prescription_id as number) + 1;
        }

        await dentistClient.from('prescription_tbl').insert({
          prescription_id: nextPrescriptionId,
          medicine_id: prescription.medicine_id,
          instructions: prescription.instructions || null,
          dosage: prescription.dosage || null,
          frequency: prescription.frequency || null,
          duration: prescription.duration || null,
          quantity: prescription.quantity || null,
          personnel_id: currentDentistId,
        });

        // Auto-log the medicine in materials (if not already added)
        const medicine = medicines.find(m => m.medicine_id === prescription.medicine_id);
        if (medicine) {
          const medicineItem = inventoryItems.find(item => 
            item.category === 'Medicines' && item.name === medicine.medicine_name
          );
          
          if (medicineItem) {
            // Check if this medicine is already in materialsToSave
            const existingIndex = materialsToSave.findIndex(m => 
              m.category === 'Medicines' && m.item_name === medicine.medicine_name
            );
            
            if (existingIndex >= 0) {
              // Update quantity if already exists
              const qty = parseInt(prescription.quantity) || 1;
              materialsToSave[existingIndex].quantity += qty;
            } else {
              // Add new material entry
              const qty = parseInt(prescription.quantity) || 1;
              materialsToSave.push({
                item_name: medicine.medicine_name,
                category: 'Medicines',
                quantity: qty,
                unit_cost: medicineItem.unit_cost,
                supplier: 'N/A',
                notes: `Prescription: ${prescription.instructions || 'N/A'}`,
              });
            }
          }
        }
      }

      // Update state with the final materials array
      setMaterials(materialsToSave);

      // Step 5: Save Material Logging - use materialsToSave instead of materials state
      console.log('Saving materials:', materialsToSave.length, 'items');
      for (const material of materialsToSave) {
        console.log(`Processing material: ${material.item_name}, Category: ${material.category}, Quantity: ${material.quantity}`);
        const { data: maxData } = await inventoryClient
          .from('stock_out')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();

        let nextId = 1;
        if (maxData?.id) {
          nextId = (maxData.id as number) + 1;
        }

        const reference = `SO-${Date.now().toString(36).toUpperCase()}`;
        const notes = `Procedure: ${material.notes || 'N/A'}, Patient: ${getPatientName(selectedPatientId)}`;

        await inventoryClient.from('stock_out').insert({
          id: nextId,
          item_name: material.item_name,
          category: material.category,
          quantity: material.quantity,
          unit: null,
          unit_cost: material.unit_cost,
          supplier: material.supplier,
          reference,
          type: 'Stock Out',
          notes,
          created_by: currentDentistId || null,
          user_name: 'Dentist',
        });

        // Decrement inventory
        if (material.category === 'Consumables') {
          const { data: item } = await inventoryClient
            .from('consumables_tbl')
            .select('quantity')
            .eq('consumable_name', material.item_name)
            .single();
          if (item) {
            const currentQty = item.quantity || 0;
            const newQty = Math.max(0, currentQty - material.quantity); // Prevent negative
            if (newQty !== currentQty) {
              await inventoryClient
                .from('consumables_tbl')
                .update({ quantity: newQty })
                .eq('consumable_name', material.item_name);
            }
          }
        } else if (material.category === 'Medicines') {
          const { data: item, error: fetchError } = await inventoryClient
            .from('medicine_tbl')
            .select('quantity, medicine_id')
            .eq('medicine_name', material.item_name)
            .single();
          
          if (fetchError) {
            console.error('Error fetching medicine:', fetchError);
            console.error('Medicine name:', material.item_name);
            continue;
          }
          
          if (item) {
            const currentQty = Number(item.quantity) || 0;
            const materialQty = Number(material.quantity) || 0;
            const newQty = Math.max(0, currentQty - materialQty); // Prevent negative
            
            console.log(`Decrementing medicine: ${material.item_name}`);
            console.log(`  Current quantity: ${currentQty}`);
            console.log(`  Material quantity: ${materialQty}`);
            console.log(`  New quantity: ${newQty}`);
            
            // Always update if there's a change (even if quantity is 0, we still need to update)
            const { data: updateData, error: updateError } = await inventoryClient
              .from('medicine_tbl')
              .update({ quantity: newQty })
              .eq('medicine_name', material.item_name)
              .select();
            
            if (updateError) {
              console.error('Error updating medicine quantity:', updateError);
              console.error('Update data:', { quantity: newQty, medicine_name: material.item_name });
              console.error('Error details:', JSON.stringify(updateError, null, 2));
            } else {
              console.log(`✓ Successfully updated medicine quantity for ${material.item_name} from ${currentQty} to ${newQty}`);
              console.log('Update result:', updateData);
            }
          } else {
            console.warn(`Medicine not found in database: ${material.item_name}`);
          }
        } else if (material.category === 'Equipment') {
          const { data: item } = await inventoryClient
            .from('equipment_tbl')
            .select('quantity')
            .eq('equipment_name', material.item_name)
            .single();
          if (item) {
            const currentQty = item.quantity || 0;
            const newQty = Math.max(0, currentQty - material.quantity); // Prevent negative
            if (newQty !== currentQty) {
              await inventoryClient
                .from('equipment_tbl')
                .update({ quantity: newQty })
                .eq('equipment_name', material.item_name);
            }
          }
        }

        // Billing will be created after all steps are saved (see below)
      }

      // Step 6: Save Patient Record
      if (patientRecord.chief_complaint || patientRecord.diagnosis) {
        const { data: maxData } = await patientRecordClient
          .from('emr_records')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();

        let nextId = 1;
        if (maxData?.id) {
          nextId = (maxData.id as number) + 1;
        }

        // Combine all additional data into notes as JSON (same as records.tsx)
        const additionalData = {
          what_was_done: patientRecord.what_was_done || null,
          medicines: patientRecord.medicines || [],
          home_care: patientRecord.home_care || null,
          additional_notes: patientRecord.notes || null,
        };

        // Get personnel_id for dentist
        let personnelId: number | null = null;
        if (patientRecord.personnel_id) {
          const parsed = typeof patientRecord.personnel_id === 'string' 
            ? Number(patientRecord.personnel_id) 
            : patientRecord.personnel_id;
          if (!isNaN(parsed) && parsed > 0) {
            personnelId = parsed;
          }
        }
        
        // Use currentDentistId as fallback if personnel_id not set
        if (!personnelId && currentDentistId) {
          const parsed = typeof currentDentistId === 'string' 
            ? Number(currentDentistId) 
            : currentDentistId;
          if (!isNaN(parsed) && parsed > 0) {
            personnelId = parsed;
          }
        }

        await patientRecordClient.from('emr_records').insert({
          id: nextId,
          patient_id: selectedPatientId,
          date: patientRecord.date,
          time: patientRecord.time || null,
          chief_complaint: patientRecord.chief_complaint || null,
          diagnosis: patientRecord.diagnosis || null,
          treatment: patientRecord.treatment_id || null,
          notes: JSON.stringify(additionalData), // Store as JSON
          status: patientRecord.status,
          dentist: personnelId || null, // Send personnel_id (bigint)
        });
      }

      // Update treatment plan status to "Completed" after all steps are saved successfully
      if (savedTreatmentPlanId) {
        try {
          await dentistClient
            .from('treatment_plan_tbl')
            .update({ treatment_status: 'Completed' })
            .eq('treatment_id', savedTreatmentPlanId);
          
          console.log('Treatment plan marked as Completed:', savedTreatmentPlanId);
        } catch (updateError) {
          console.error('Failed to update treatment plan status:', updateError);
          // Don't fail the entire save if status update fails
        }
      }

      // Update appointment status to "Completed" when workflow is saved
      if (selectedAppointment) {
        try {
          // Get the "Completed" status ID
          const { data: statusData } = await frontdeskClient
            .from('appointment_status_tbl')
            .select('appointment_status_id, appointment_status_name')
            .or('appointment_status_name.eq.Completed,appointment_status_name.ilike.completed');

          let completedStatusId = 4; // Default to 4 if not found
          if (statusData && statusData.length > 0) {
            // Find exact match first, then case-insensitive
            const exactMatch = statusData.find(s => s.appointment_status_name === 'Completed');
            completedStatusId = exactMatch?.appointment_status_id || statusData[0].appointment_status_id || 4;
          }

          // Update appointment status to Completed
          const { error: appointmentError } = await frontdeskClient
            .from('appointment_tbl')
            .update({ appointment_status_id: completedStatusId })
            .eq('appointment_id', selectedAppointment);

          if (appointmentError) {
            console.error('Failed to update appointment status:', appointmentError);
          } else {
            console.log(`✓ Appointment ${selectedAppointment} marked as Completed`);
          }
        } catch (appointmentUpdateError) {
          console.error('Error updating appointment status:', appointmentUpdateError);
          // Don't fail the entire save if appointment update fails
        }
      }

      // Create comprehensive billing record
      if (selectedPatientId) {
        try {
          // Get next bill_id
          const { data: maxBillData } = await frontdeskClient
            .from('billing_tbl')
            .select('bill_id')
            .order('bill_id', { ascending: false })
            .limit(1)
            .single();

          let nextBillId = 1;
          if (maxBillData?.bill_id) {
            nextBillId = (maxBillData.bill_id as number) + 1;
          }

          let totalAmount = 0;
          let firstBillServiceId: number | null = null;
          let firstBillMedicineId: number | null = null;
          let firstBillEquipmentId: number | null = null;
          let firstBillConsumableId: number | null = null;

          // 1. Create bill_service_id records for services in treatment plan
          if (treatmentPlan.services.length > 0) {
            const { data: maxServiceBillData } = await frontdeskClient
              .from('bill_service_id')
              .select('bill_service_id')
              .order('bill_service_id', { ascending: false })
              .limit(1)
              .single();

            let nextServiceBillId = 1;
            if (maxServiceBillData?.bill_service_id) {
              nextServiceBillId = (maxServiceBillData.bill_service_id as number) + 1;
            }

            const serviceBills = [];
            for (const service of treatmentPlan.services) {
              const serviceData = services.find(s => s.service_id === service.service_id);
              const unitPrice = service.estimated_cost || serviceData?.service_fee || 0;
              const quantity = 1; // Each service is billed once
              const subTotal = unitPrice * quantity;
              totalAmount += subTotal;

              serviceBills.push({
                bill_service_id: nextServiceBillId,
                bill_id: nextBillId,
                service_id: service.service_id,
                billed_quantity: quantity,
                billed_unit_price: unitPrice,
                sub_total: subTotal,
              });

              if (!firstBillServiceId) {
                firstBillServiceId = nextServiceBillId;
              }
              nextServiceBillId++;
            }

            if (serviceBills.length > 0) {
              await frontdeskClient.from('bill_service_id').insert(serviceBills);
            }
          }

          // 2. Create bill_medicine_tbl records for prescriptions
          if (prescriptions.length > 0) {
            const { data: maxMedicineBillData } = await frontdeskClient
              .from('bill_medicine_tbl')
              .select('bill_medicine_id')
              .order('bill_medicine_id', { ascending: false })
              .limit(1)
              .single();

            let nextMedicineBillId = 1;
            if (maxMedicineBillData?.bill_medicine_id) {
              nextMedicineBillId = (maxMedicineBillData.bill_medicine_id as number) + 1;
            }

            const medicineBills = [];
            for (const prescription of prescriptions) {
              // Get unit_cost from inventoryItems (medicines array might not have it)
              const medicineItem = inventoryItems.find(item => 
                item.category === 'Medicines' && item.id === prescription.medicine_id
              );
              const unitPrice = medicineItem?.unit_cost || 0;
              const quantity = parseInt(prescription.quantity) || 1;
              const subTotal = unitPrice * quantity;
              totalAmount += subTotal;

              medicineBills.push({
                bill_medicine_id: nextMedicineBillId,
                bill_id: nextBillId,
                medicine_id: prescription.medicine_id,
                billed_quantity: quantity,
                billed_unit_price: unitPrice,
                sub_total: subTotal,
              });

              if (!firstBillMedicineId) {
                firstBillMedicineId = nextMedicineBillId;
              }
              nextMedicineBillId++;
            }

            if (medicineBills.length > 0) {
              await frontdeskClient.from('bill_medicine_tbl').insert(medicineBills);
            }
          }

          // 3. Create bill_equipment_tbl records for equipment materials
          const equipmentMaterials = materialsToSave.filter(m => m.category === 'Equipment');
          if (equipmentMaterials.length > 0) {
            const { data: maxEquipmentBillData } = await frontdeskClient
              .from('bill_equipment_tbl')
              .select('bill_equipment_id')
              .order('bill_equipment_id', { ascending: false })
              .limit(1)
              .single();

            let nextEquipmentBillId = 1;
            if (maxEquipmentBillData?.bill_equipment_id) {
              nextEquipmentBillId = (maxEquipmentBillData.bill_equipment_id as number) + 1;
            }

            const equipmentBills = [];
            for (const material of equipmentMaterials) {
              // Find equipment_id from inventoryItems
              const equipmentItem = inventoryItems.find(item => 
                item.category === 'Equipment' && item.name === material.item_name
              );
              if (equipmentItem && equipmentItem.id) {
                const unitPrice = material.unit_cost;
                const quantity = material.quantity;
                const subTotal = unitPrice * quantity;
                totalAmount += subTotal;

                equipmentBills.push({
                  bill_equipment_id: nextEquipmentBillId,
                  bill_id: nextBillId,
                  equipment_id: equipmentItem.id,
                  billed_quantity: quantity,
                  billed_unit_price: unitPrice,
                  sub_total: subTotal,
                });

                if (!firstBillEquipmentId) {
                  firstBillEquipmentId = nextEquipmentBillId;
                }
                nextEquipmentBillId++;
              }
            }

            if (equipmentBills.length > 0) {
              await frontdeskClient.from('bill_equipment_tbl').insert(equipmentBills);
            }
          }

          // 4. Create bill_consumable_tbl records for consumable materials
          const consumableMaterials = materialsToSave.filter(m => m.category === 'Consumables');
          if (consumableMaterials.length > 0) {
            const { data: maxConsumableBillData } = await frontdeskClient
              .from('bill_consumable_tbl')
              .select('bill_consumable_id')
              .order('bill_consumable_id', { ascending: false })
              .limit(1)
              .single();

            let nextConsumableBillId = 1;
            if (maxConsumableBillData?.bill_consumable_id) {
              nextConsumableBillId = (maxConsumableBillData.bill_consumable_id as number) + 1;
            }

            const consumableBills = [];
            for (const material of consumableMaterials) {
              // Find consumables_id from inventoryItems
              const consumableItem = inventoryItems.find(item => 
                item.category === 'Consumables' && item.name === material.item_name
              );
              if (consumableItem && consumableItem.id) {
                const unitPrice = material.unit_cost;
                const quantity = material.quantity;
                const subTotal = unitPrice * quantity;
                totalAmount += subTotal;

                consumableBills.push({
                  bill_consumable_id: nextConsumableBillId,
                  bill_id: nextBillId,
                  consumables_id: consumableItem.id,
                  billed_quantity: quantity,
                  billed_unit_price: unitPrice,
                  sub_total: subTotal,
                });

                if (!firstBillConsumableId) {
                  firstBillConsumableId = nextConsumableBillId;
                }
                nextConsumableBillId++;
              }
            }

            if (consumableBills.length > 0) {
              await frontdeskClient.from('bill_consumable_tbl').insert(consumableBills);
            }
          }

          // 5. Create main billing_tbl record
          if (totalAmount > 0) {
            await frontdeskClient.from('billing_tbl').insert({
              bill_id: nextBillId,
              patient_id: selectedPatientId,
              appointment_id: selectedAppointment || null,
              followup_id: null,
              bill_service_id: firstBillServiceId || null,
              bill_medicine_id: firstBillMedicineId || null,
              bill_equipment_id: firstBillEquipmentId || null,
              bill_consumable_id: firstBillConsumableId || null,
              total_amount: totalAmount,
              payable_amount: totalAmount, // Same as total for now
              cash_paid: null,
              change_amount: null,
              payment_option: null,
              payment_status_id: 1, // Pending
              paymongo_payment_id: null,
            });

            console.log(`✓ Billing record created: Bill ID ${nextBillId}, Total: ${totalAmount}`);
          }
        } catch (billingError) {
          console.error('Failed to create billing record:', billingError);
          // Don't fail the entire save if billing creation fails
        }
      }

      alert('All data saved successfully! Treatment marked as completed.');
      // Reset form
      setCurrentStep(1);
      setSelectedAppointment(null);
      setSelectedPatientId(null);
      setSavedTreatmentPlanId(null); // Reset saved treatment plan ID
      setTreatmentPlan({ treatment_name: '', description: '', treatment_status: 'Ongoing', services: [] });
      setTeeth({});
      setPrescriptions([]);
      setMaterials([]);
      setPatientRecord({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        chief_complaint: '',
        diagnosis: '',
        treatment_id: null,
        what_was_done: '',
        medicines: [],
        home_care: {
          whatToDo: [''],
          whatToAvoid: [''],
          warningSigns: [''],
        },
        notes: '',
        status: 'Active',
        personnel_id: undefined,
      });
    } catch (err: any) {
      console.error('Error saving:', err);
      alert(`Error saving data: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Field orientation="vertical">
              <FieldLabel>Select Appointment</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedAppointment ? String(selectedAppointment) : ''}
                  onValueChange={(value) => setSelectedAppointment(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={appointments.length === 0 ? "No appointments found" : "Select an appointment"} />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.length === 0 ? (
                      <SelectItem value="__no_appointments__" disabled>
                        No appointments found for this dentist
                      </SelectItem>
                    ) : (
                      appointments.map(app => (
                        <SelectItem key={app.appointment_id} value={String(app.appointment_id)}>
                          {app.service_name} - {getPatientName(app.patient_id)} - {app.appointment_date} {app.appointment_time}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            {appointments.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    No appointments found for personnel_id: <span className="font-medium">{currentDentistId || 'Not found'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Check console for debugging information.
                  </p>
                </CardContent>
              </Card>
            )}
            {selectedPatientId && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Patient: <span className="font-medium">{getPatientName(selectedPatientId)}</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {selectedAppointment && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Appointment Service:</span>{' '}
                    {appointments.find(a => a.appointment_id === selectedAppointment)?.service_name || 'Loading...'}
                    {treatmentPlan.services.length > 0 && (
                      <span className="ml-2 text-primary">✓ Added to services</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
            <Field orientation="vertical">
              <FieldLabel>Treatment Name</FieldLabel>
              <FieldContent>
                <Input
                  value={treatmentPlan.treatment_name}
                  onChange={(e) => setTreatmentPlan({ ...treatmentPlan, treatment_name: e.target.value })}
                  placeholder="Enter treatment name"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Input
                  value={treatmentPlan.description}
                  onChange={(e) => setTreatmentPlan({ ...treatmentPlan, description: e.target.value })}
                  placeholder="Enter description"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <div className="flex gap-2">
                  <Select
                    value={treatmentPlan.treatment_status}
                    onValueChange={(value: any) => setTreatmentPlan({ ...treatmentPlan, treatment_status: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {savedTreatmentPlanId && treatmentPlan.treatment_status !== 'Completed' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await dentistClient
                            .from('treatment_plan_tbl')
                            .update({ treatment_status: 'Completed' })
                            .eq('treatment_id', savedTreatmentPlanId);
                          
                          setTreatmentPlan(prev => ({ ...prev, treatment_status: 'Completed' }));
                          alert('Treatment marked as completed!');
                        } catch (error) {
                          console.error('Failed to mark treatment as complete:', error);
                          alert('Failed to update treatment status. Please try again.');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
                {savedTreatmentPlanId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Treatment will be automatically marked as "Completed" when you save all steps.
                  </p>
                )}
              </FieldContent>
            </Field>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FieldLabel>Services</FieldLabel>
                <Button
                  size="sm"
                  onClick={() => setTreatmentPlan({
                    ...treatmentPlan,
                    services: [...treatmentPlan.services, { service_id: 0, estimated_cost: 0, priority: 'Medium', status: 'Pending' }],
                  })}
                >
                  Add Service
                </Button>
              </div>
              {treatmentPlan.services.map((service, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <Field orientation="vertical">
                      <FieldLabel>Service</FieldLabel>
                      <FieldContent>
                        <Select
                          value={String(service.service_id)}
                          onValueChange={(value) => {
                            const newServices = [...treatmentPlan.services];
                            newServices[index].service_id = Number(value);
                            const selectedService = services.find(s => s.service_id === Number(value));
                            if (selectedService) {
                              newServices[index].estimated_cost = selectedService.service_fee || 0;
                            }
                            setTreatmentPlan({ ...treatmentPlan, services: newServices });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map(s => (
                              <SelectItem key={s.service_id} value={String(s.service_id)}>
                                {s.service_name} ({formatCurrency(s.service_fee || 0)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                    <Field orientation="vertical">
                      <FieldLabel>Tooth Number (Optional)</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="1"
                          max="32"
                          value={service.tooth_number || ''}
                          onChange={(e) => {
                            const newServices = [...treatmentPlan.services];
                            newServices[index].tooth_number = e.target.value || undefined;
                            setTreatmentPlan({ ...treatmentPlan, services: newServices });
                          }}
                          placeholder="Enter tooth number (1-32)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty if service doesn't apply to a specific tooth
                        </p>
                      </FieldContent>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field orientation="vertical">
                        <FieldLabel>Estimated Cost</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={service.estimated_cost}
                            onChange={(e) => {
                              const newServices = [...treatmentPlan.services];
                              newServices[index].estimated_cost = Number(e.target.value);
                              setTreatmentPlan({ ...treatmentPlan, services: newServices });
                            }}
                          />
                        </FieldContent>
                      </Field>
                      <Field orientation="vertical">
                        <FieldLabel>Priority</FieldLabel>
                        <FieldContent>
                          <Select
                            value={service.priority}
                            onValueChange={(value) => {
                              const newServices = [...treatmentPlan.services];
                              newServices[index].priority = value;
                              setTreatmentPlan({ ...treatmentPlan, services: newServices });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const newServices = treatmentPlan.services.filter((_, i) => i !== index);
                        setTreatmentPlan({ ...treatmentPlan, services: newServices });
                      }}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {treatmentPlan.services.some(s => s.tooth_number) && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Auto-filled from Treatment Plan:</span>{' '}
                    {treatmentPlan.services
                      .filter(s => s.tooth_number)
                      .map(s => {
                        const service = services.find(sv => sv.service_id === s.service_id);
                        return `Tooth ${s.tooth_number} (${service?.service_name || 'Unknown'})`;
                      })
                      .join(', ')}
                  </p>
                </CardContent>
              </Card>
            )}
            <p className="text-sm text-muted-foreground">
              Click on a tooth to change its condition. Only unhealthy teeth will be saved.
            </p>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 32 }, (_, i) => i + 1).map(toothNum => {
                const tooth = teeth[toothNum] || { number: toothNum, condition: 'Healthy' };
                return (
                  <Card
                    key={toothNum}
                    className={`cursor-pointer hover:border-primary transition-colors ${
                      tooth.condition !== 'Healthy' ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      const currentIndex = toothConditions.findIndex(c => c.condition_name === tooth.condition);
                      const nextIndex = (currentIndex + 1) % toothConditions.length;
                      const nextCondition = toothConditions[nextIndex];
                      setTeeth({
                        ...teeth,
                        [toothNum]: { ...tooth, condition: nextCondition.condition_name },
                      });
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-xs font-medium">{toothNum}</div>
                      <div className="text-xs text-muted-foreground mt-1">{tooth.condition}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FieldLabel>Prescriptions</FieldLabel>
              <Button
                size="sm"
                onClick={() => setPrescriptions([...prescriptions, {
                  medicine_id: 0,
                  instructions: '',
                  dosage: '',
                  frequency: '',
                  duration: '',
                  quantity: '',
                }])}
              >
                Add Prescription
              </Button>
            </div>
            {prescriptions.map((prescription, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <Field orientation="vertical">
                    <FieldLabel>Medicine</FieldLabel>
                    <FieldContent>
                      <Select
                        value={String(prescription.medicine_id)}
                        onValueChange={(value) => {
                          const newPrescriptions = [...prescriptions];
                          newPrescriptions[index].medicine_id = Number(value);
                          
                          // Auto-add medicine to materials when selected
                          const selectedMedicine = medicines.find(m => m.medicine_id === Number(value));
                          if (selectedMedicine) {
                            const medicineItem = inventoryItems.find(item => 
                              item.category === 'Medicines' && item.name === selectedMedicine.medicine_name
                            );
                            
                            if (medicineItem) {
                              // Check if this medicine is already in materials
                              const existingIndex = materials.findIndex(m => 
                                m.category === 'Medicines' && m.item_name === selectedMedicine.medicine_name
                              );
                              
                              if (existingIndex < 0) {
                                // Add new material entry
                                const qty = parseInt(newPrescriptions[index].quantity) || 1;
                                setMaterials([...materials, {
                                  item_name: selectedMedicine.medicine_name,
                                  category: 'Medicines',
                                  quantity: qty,
                                  unit_cost: medicineItem.unit_cost,
                                  supplier: 'N/A',
                                  notes: `Prescription: ${newPrescriptions[index].instructions || 'N/A'}`,
                                }]);
                              }
                            }
                          }
                          
                          setPrescriptions(newPrescriptions);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map(m => (
                            <SelectItem key={m.medicine_id} value={String(m.medicine_id)}>
                              {m.medicine_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field orientation="vertical">
                      <FieldLabel>Dosage</FieldLabel>
                      <FieldContent>
                        <Input
                          value={prescription.dosage}
                          onChange={(e) => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions[index].dosage = e.target.value;
                            setPrescriptions(newPrescriptions);
                          }}
                        />
                      </FieldContent>
                    </Field>
                    <Field orientation="vertical">
                      <FieldLabel>Frequency</FieldLabel>
                      <FieldContent>
                        <Input
                          value={prescription.frequency}
                          onChange={(e) => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions[index].frequency = e.target.value;
                            setPrescriptions(newPrescriptions);
                          }}
                        />
                      </FieldContent>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field orientation="vertical">
                      <FieldLabel>Duration</FieldLabel>
                      <FieldContent>
                        <Input
                          value={prescription.duration}
                          onChange={(e) => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions[index].duration = e.target.value;
                            setPrescriptions(newPrescriptions);
                          }}
                        />
                      </FieldContent>
                    </Field>
                    <Field orientation="vertical">
                      <FieldLabel>Quantity</FieldLabel>
                      <FieldContent>
                        <Input
                          value={prescription.quantity}
                          onChange={(e) => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions[index].quantity = e.target.value;
                            
                            // Update material quantity if medicine is already in materials
                            if (prescription.medicine_id) {
                              const medicine = medicines.find(m => m.medicine_id === prescription.medicine_id);
                              if (medicine) {
                                const materialIndex = materials.findIndex(m => 
                                  m.category === 'Medicines' && m.item_name === medicine.medicine_name
                                );
                                if (materialIndex >= 0) {
                                  const updatedMaterials = [...materials];
                                  updatedMaterials[materialIndex].quantity = parseInt(e.target.value) || 1;
                                  setMaterials(updatedMaterials);
                                }
                              }
                            }
                            
                            setPrescriptions(newPrescriptions);
                          }}
                        />
                      </FieldContent>
                    </Field>
                  </div>
                  <Field orientation="vertical">
                    <FieldLabel>Instructions</FieldLabel>
                    <FieldContent>
                      <Input
                        value={prescription.instructions}
                        onChange={(e) => {
                          const newPrescriptions = [...prescriptions];
                          newPrescriptions[index].instructions = e.target.value;
                          setPrescriptions(newPrescriptions);
                        }}
                      />
                    </FieldContent>
                  </Field>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const newPrescriptions = prescriptions.filter((_, i) => i !== index);
                      setPrescriptions(newPrescriptions);
                    }}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FieldLabel>Materials Used</FieldLabel>
              <Button
                size="sm"
                onClick={() => setMaterials([...materials, {
                  item_name: '',
                  category: '',
                  quantity: 0,
                  unit_cost: 0,
                  supplier: 'N/A',
                  notes: '',
                }])}
              >
                Add Material
              </Button>
            </div>
            {materials.map((material, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <Field orientation="vertical">
                    <FieldLabel>Category</FieldLabel>
                    <FieldContent>
                      <Select
                        value={material.category}
                        onValueChange={(value) => {
                          const newMaterials = [...materials];
                          newMaterials[index].category = value;
                          newMaterials[index].item_name = '';
                          setMaterials(newMaterials);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consumables">Consumables</SelectItem>
                          <SelectItem value="Medicines">Medicines</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Item Name</FieldLabel>
                    <FieldContent>
                      <Select
                        value={material.item_name}
                        onValueChange={(value) => {
                          const newMaterials = [...materials];
                          const selectedItem = inventoryItems.find(item => 
                            item.category === material.category && item.name === value
                          );
                          newMaterials[index].item_name = value;
                          if (selectedItem) {
                            newMaterials[index].unit_cost = selectedItem.unit_cost;
                          }
                          setMaterials(newMaterials);
                        }}
                        disabled={!material.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={material.category ? "Select item" : "Select category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {material.category ? (
                            inventoryItems
                              .filter(item => item.category === material.category)
                              .map(item => (
                                <SelectItem key={`${item.category}-${item.name}`} value={item.name}>
                                  {item.name} ({formatCurrency(item.unit_cost)})
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="__no_category__" disabled>
                              Please select a category first
                            </SelectItem>
                          )}
                          {material.category && inventoryItems.filter(item => item.category === material.category).length === 0 && (
                            <SelectItem value="__no_items__" disabled>
                              No items available in this category
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <div className="grid grid-cols-3 gap-4">
                    <Field orientation="vertical">
                      <FieldLabel>Quantity</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => {
                            const newMaterials = [...materials];
                            newMaterials[index].quantity = Number(e.target.value);
                            setMaterials(newMaterials);
                          }}
                        />
                      </FieldContent>
                    </Field>
                    <Field orientation="vertical">
                      <FieldLabel>Unit Cost</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          value={material.unit_cost}
                          onChange={(e) => {
                            const newMaterials = [...materials];
                            newMaterials[index].unit_cost = Number(e.target.value);
                            setMaterials(newMaterials);
                          }}
                        />
                      </FieldContent>
                    </Field>
                    <Field orientation="vertical">
                      <FieldLabel>Supplier</FieldLabel>
                      <FieldContent>
                        <Input
                          value={material.supplier}
                          onChange={(e) => {
                            const newMaterials = [...materials];
                            newMaterials[index].supplier = e.target.value;
                            setMaterials(newMaterials);
                          }}
                        />
                      </FieldContent>
                    </Field>
                  </div>
                  <Field orientation="vertical">
                    <FieldLabel>Notes</FieldLabel>
                    <FieldContent>
                      <Input
                        value={material.notes}
                        onChange={(e) => {
                          const newMaterials = [...materials];
                          newMaterials[index].notes = e.target.value;
                          setMaterials(newMaterials);
                        }}
                      />
                    </FieldContent>
                  </Field>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const newMaterials = materials.filter((_, i) => i !== index);
                      setMaterials(newMaterials);
                    }}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 6:
        // Helper to get dentist name
        const getDentistName = (dentist: Dentist): string => {
          return `Dr. ${dentist.f_name ?? ''} ${dentist.m_name ?? ''} ${dentist.l_name ?? ''}`.trim();
        };

        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field orientation="vertical">
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Input
                    value={selectedPatientId ? patients.find(p => p.patient_id === selectedPatientId)?.f_name + ' ' + patients.find(p => p.patient_id === selectedPatientId)?.l_name : ''}
                    disabled
                    className="bg-muted"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Date</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={patientRecord.date}
                    onChange={(e) => setPatientRecord({ ...patientRecord, date: e.target.value })}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Time</FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    value={patientRecord.time}
                    onChange={(e) => setPatientRecord({ ...patientRecord, time: e.target.value })}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Dentist</FieldLabel>
                <FieldContent>
                  <Select
                    value={patientRecord.personnel_id ? String(patientRecord.personnel_id) : ''}
                    onValueChange={(value) => setPatientRecord({ ...patientRecord, personnel_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dentists.length === 0 ? "Loading dentists..." : "Select dentist"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.length === 0 ? (
                        <SelectItem value="none" disabled>No dentists available</SelectItem>
                      ) : (
                        dentists.map(d => (
                          <SelectItem key={String(d.personnel_id)} value={String(d.personnel_id)}>
                            {getDentistName(d)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
            <Field orientation="vertical">
              <FieldLabel>Chief Complaint</FieldLabel>
              <FieldContent>
                <Input
                  value={patientRecord.chief_complaint}
                  onChange={(e) => setPatientRecord({ ...patientRecord, chief_complaint: e.target.value })}
                  placeholder="Patient's main complaint"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Diagnosis</FieldLabel>
              <FieldContent>
                <Input
                  value={patientRecord.diagnosis}
                  onChange={(e) => setPatientRecord({ ...patientRecord, diagnosis: e.target.value })}
                  placeholder="Clinical diagnosis"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Treatment</FieldLabel>
              <FieldContent>
                <Select
                  value={patientRecord.treatment_id ? String(patientRecord.treatment_id) : ''}
                  onValueChange={(value) => {
                    const serviceId = Number(value);
                    const selectedService = services.find(s => s.service_id === serviceId);
                    setPatientRecord({ 
                      ...patientRecord, 
                      treatment_id: serviceId,
                      treatment: selectedService?.service_name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={services.length === 0 ? "Loading services..." : "Select treatment/service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.length === 0 ? (
                      <SelectItem value="none" disabled>No services available</SelectItem>
                    ) : (
                      services.map(s => (
                        <SelectItem key={s.service_id} value={String(s.service_id)}>
                          {s.service_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {treatmentPlan.services.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-filled from Treatment Plan: {services.find(s => s.service_id === patientRecord.treatment_id)?.service_name || treatmentPlan.treatment_name}
                  </p>
                )}
              </FieldContent>
            </Field>
            {/* What Was Done Section */}
            <Field orientation="vertical">
              <FieldLabel>What Was Done</FieldLabel>
              <FieldContent>
                <textarea
                  value={patientRecord.what_was_done || ''}
                  onChange={(e) => setPatientRecord({ ...patientRecord, what_was_done: e.target.value })}
                  className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the procedures performed, examinations conducted, and any treatments provided..."
                />
              </FieldContent>
            </Field>

            {/* Dental Charting Section */}
            <Field orientation="vertical">
              <FieldLabel className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dental Charting
              </FieldLabel>
              <FieldContent>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="flex-1"
                  >
                    <Link to={`/dentist/patient/charting?patient=${selectedPatientId}`} target="_blank">
                      <Activity className="w-4 h-4 mr-2" />
                      Add/Edit Charting
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Open charting page to record tooth conditions and procedures
                  </p>
                </div>
              </FieldContent>
            </Field>

            {/* Medicines Prescribed Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Medicines Prescribed
                </FieldLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPatientRecord({
                      ...patientRecord,
                      medicines: [...(patientRecord.medicines || []), { name: '', howOften: '', howManyDays: '' }],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medicine
                </Button>
              </div>
              {(patientRecord.medicines || []).map((medicine, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                      <Field orientation="vertical">
                        <FieldLabel>Medicine Name</FieldLabel>
                        <FieldContent>
                          <Select
                            value={medicine.name}
                            onValueChange={(value) => {
                              const newMedicines = [...(patientRecord.medicines || [])];
                              newMedicines[index].name = value;
                              setPatientRecord({ ...patientRecord, medicines: newMedicines });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select medicine" />
                            </SelectTrigger>
                            <SelectContent>
                              {medicinesList.map(m => (
                                <SelectItem key={m.medicine_id} value={m.medicine_name}>
                                  {m.medicine_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                      <Field orientation="vertical">
                        <FieldLabel>How Often</FieldLabel>
                        <FieldContent>
                          <Input
                            value={medicine.howOften}
                            onChange={(e) => {
                              const newMedicines = [...(patientRecord.medicines || [])];
                              newMedicines[index].howOften = e.target.value;
                              setPatientRecord({ ...patientRecord, medicines: newMedicines });
                            }}
                            placeholder="e.g., Every 6 hours"
                          />
                        </FieldContent>
                      </Field>
                      <Field orientation="vertical">
                        <FieldLabel>How Many Days</FieldLabel>
                        <FieldContent>
                          <Input
                            value={medicine.howManyDays}
                            onChange={(e) => {
                              const newMedicines = [...(patientRecord.medicines || [])];
                              newMedicines[index].howManyDays = e.target.value;
                              setPatientRecord({ ...patientRecord, medicines: newMedicines });
                            }}
                            placeholder="e.g., 2 days"
                          />
                        </FieldContent>
                      </Field>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const newMedicines = [...(patientRecord.medicines || [])];
                        newMedicines.splice(index, 1);
                        setPatientRecord({ ...patientRecord, medicines: newMedicines });
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Home Care Instructions Section */}
            <div className="space-y-4">
              <FieldLabel>Home Care Instructions</FieldLabel>
              <div className="grid md:grid-cols-3 gap-4">
                {/* What To Do */}
                <div className="space-y-2">
                  <FieldLabel className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    WHAT TO DO
                  </FieldLabel>
                  {(patientRecord.home_care?.whatToDo || ['']).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                          newHomeCare.whatToDo[index] = e.target.value;
                          setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                        }}
                        placeholder="e.g., Brush teeth twice daily"
                        className="flex-1"
                      />
                      {(patientRecord.home_care?.whatToDo || []).length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                            newHomeCare.whatToDo.splice(index, 1);
                            setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                      newHomeCare.whatToDo.push('');
                      setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* What To Avoid */}
                <div className="space-y-2">
                  <FieldLabel className="flex items-center gap-2 text-orange-600">
                    <XCircle className="w-4 h-4" />
                    WHAT TO AVOID
                  </FieldLabel>
                  {(patientRecord.home_care?.whatToAvoid || ['']).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                          newHomeCare.whatToAvoid[index] = e.target.value;
                          setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                        }}
                        placeholder="e.g., Avoid sticky foods"
                        className="flex-1"
                      />
                      {(patientRecord.home_care?.whatToAvoid || []).length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                            newHomeCare.whatToAvoid.splice(index, 1);
                            setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                      newHomeCare.whatToAvoid.push('');
                      setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Warning Signs */}
                <div className="space-y-2">
                  <FieldLabel className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    WARNING SIGNS
                  </FieldLabel>
                  {(patientRecord.home_care?.warningSigns || ['']).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                          newHomeCare.warningSigns[index] = e.target.value;
                          setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                        }}
                        placeholder="e.g., Persistent bleeding"
                        className="flex-1"
                      />
                      {(patientRecord.home_care?.warningSigns || []).length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                            newHomeCare.warningSigns.splice(index, 1);
                            setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newHomeCare = { ...(patientRecord.home_care || { whatToDo: [''], whatToAvoid: [''], warningSigns: [''] }) };
                      newHomeCare.warningSigns.push('');
                      setPatientRecord({ ...patientRecord, home_care: newHomeCare });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <Field orientation="vertical">
              <FieldLabel>Additional Notes</FieldLabel>
              <FieldContent>
                <textarea
                  value={patientRecord.notes || ''}
                  onChange={(e) => setPatientRecord({ ...patientRecord, notes: e.target.value })}
                  className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional notes or remarks..."
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select
                  value={patientRecord.status}
                  onValueChange={(value: any) => setPatientRecord({ ...patientRecord, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Treatment Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : isCompleted
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-muted text-muted-foreground border-muted'
                      }`}
                    >
                      {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isActive ? 'font-semibold' : ''}`}>
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep < STEPS.length ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSaveAll} disabled={saving || !selectedPatientId}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientWorkflow;

