// Prescriptions page - Manage patient prescriptions
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pill,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  User,
  Search,
  Printer,
  Briefcase,
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
import { PatientNav } from '@/components/dentist/PatientNav';
import { PatientSelector } from '@/components/dentist/PatientSelector';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const patientRecordClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'patient_record' } });
const inventoryClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'inventory' } });
const dentistClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'dentist' } });

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Medicine {
  medicine_id: number; // bigint in database
  medicine_name: string; // text in database
  unit_cost?: number;
}

interface Dentist {
  personnel_id: string;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Prescription {
  prescription_id: number; // bigint in database
  medicine_id: number; // bigint in database
  instructions?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  created_at?: string;
  personnel_id?: string; // dentist who created the prescription
}


// --- Main Component ---
const PrescriptionsPage = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(searchParams.get('patient') || '');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to get dentist name
  const getDentistName = (dentist: Dentist): string => {
    return `Dr. ${dentist.f_name ?? ''} ${dentist.m_name ?? ''} ${dentist.l_name ?? ''}`.trim();
  };

  // Load patients
  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        const { data, error } = await patientRecordClient
          .from('patient_tbl')
          .select('patient_id, f_name, m_name, l_name')
          .order('l_name', { ascending: true });

        if (!mounted) return;
        if (error) return console.error('Failed to fetch patients:', error);

        setPatients(data ?? []);
        if (!selectedPatient && data && data.length > 0) {
          setSelectedPatient(String(data[0].patient_id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPatients();
    return () => { mounted = false; };
  }, [selectedPatient]);

  // Load medicines from inventory
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        console.log('Loading medicines from inventory.medicine_tbl...');
        // Try loading all medicines first, then filter in JavaScript if needed
        const { data, error } = await inventoryClient
          .from('medicine_tbl')
          .select('medicine_id, medicine_name, unit_cost')
          .order('medicine_name', { ascending: true });

        if (error) {
          console.error('Failed to fetch medicines - Error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Don't show alert for permission errors, just log
          if (error.code !== 'PGRST301') {
            console.warn('Medicine loading error (might be permissions):', error.message);
          }
          return;
        }
        
        console.log('Raw medicines data:', data);
        console.log('Medicines count:', data?.length || 0);
        
        // Filter out any medicines with null medicine_id or medicine_name
        const validMedicines = (data ?? []).filter(med => 
          med.medicine_id != null && med.medicine_name != null && med.medicine_name.trim() !== ''
        );
        
        console.log('Valid medicines after filtering:', validMedicines);
        console.log('Valid medicines count:', validMedicines.length);
        
        if (validMedicines.length === 0) {
          console.warn('No valid medicines found. Raw data:', data);
          // Don't show alert, just log - might be empty table or permission issue
        }
        
        setMedicines(validMedicines);
      } catch (err) {
        console.error('Exception loading medicines:', err);
      }
    };
    loadMedicines();
  }, []);

  // Load dentists from personnel_tbl where role_id = 1
  useEffect(() => {
    const loadDentists = async () => {
      try {
        const { data, error } = await supabase
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

  // Load prescriptions from dentist.prescription_tbl
  const loadPrescriptions = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      // Load prescriptions from dentist.prescription_tbl
      // Note: prescription_tbl doesn't have patient_id column, so we load all prescriptions
      const { data, error } = await dentistClient
        .from('prescription_tbl')
        .select('prescription_id, medicine_id, instructions, dosage, frequency, duration, quantity, created_at, personnel_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch prescriptions:', error);
        return;
      }
      
      setPrescriptions(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [selectedPatient]);

  // Helper to get patient name by ID
  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.patient_id === patientId);
    if (!patient) return 'Unknown';
    return `${patient.f_name ?? ''} ${patient.m_name ?? ''} ${patient.l_name ?? ''}`.trim();
  };

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    medicine_id?: number;
    instructions?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: string;
    personnel_id?: string;
  }>({
    medicine_id: undefined,
    instructions: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    personnel_id: '',
  });

  // Helper to get medicine name by ID
  const getMedicineName = (medicineId: number): string => {
    const medicine = medicines.find(m => m.medicine_id === medicineId);
    return medicine?.medicine_name || `Medicine #${medicineId}`;
  };

  // Helper to get dentist name by ID
  const getDentistNameById = (personnelId?: string): string => {
    if (!personnelId) return 'Unknown';
    const dentist = dentists.find(d => d.personnel_id === personnelId);
    return dentist ? getDentistName(dentist) : 'Unknown';
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const medicineName = getMedicineName(prescription.medicine_id);
    const dentistName = getDentistNameById(prescription.personnel_id);
    return (
      prescription.instructions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dentistName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalMedications = prescriptions.length; // Each prescription is one medication

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    const defaultDentist = dentists.length > 0 ? dentists[0].personnel_id : '';
    setFormData({
      medicine_id: undefined,
      instructions: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      personnel_id: defaultDentist,
    });
  };

  const handleEdit = (prescription: Prescription) => {
    setIsEditing(prescription.prescription_id);
    setIsAdding(false);
    setFormData({
      medicine_id: prescription.medicine_id,
      instructions: prescription.instructions || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      quantity: prescription.quantity || '',
      personnel_id: prescription.personnel_id || '',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.medicine_id) {
        alert('Please select a medicine');
        return;
      }

      if (!formData.personnel_id) {
        alert('Please select a dentist');
        return;
      }

      if (isEditing) {
        const prescriptionData = {
          medicine_id: formData.medicine_id,
          instructions: formData.instructions || null,
          dosage: formData.dosage || null,
          frequency: formData.frequency || null,
          duration: formData.duration || null,
          quantity: formData.quantity || null,
          personnel_id: formData.personnel_id,
        };

        const { error } = await dentistClient
          .from('prescription_tbl')
          .update(prescriptionData)
          .eq('prescription_id', isEditing);

        if (error) throw error;
        setIsEditing(null);
      } else if (isAdding) {
        // Get the next prescription_id by finding the max and adding 1
        // This is needed if prescription_id is NOT NULL but not auto-generated
        const { data: maxData, error: maxError } = await dentistClient
          .from('prescription_tbl')
          .select('prescription_id')
          .order('prescription_id', { ascending: false })
          .limit(1)
          .single();

        let nextPrescriptionId = 1;
        if (!maxError && maxData) {
          nextPrescriptionId = (maxData.prescription_id as number) + 1;
        } else if (maxError && maxError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is fine for first insert
          console.warn('Could not get max prescription_id, using 1:', maxError);
        }

        const prescriptionData = {
          prescription_id: nextPrescriptionId,
          medicine_id: formData.medicine_id,
          instructions: formData.instructions || null,
          dosage: formData.dosage || null,
          frequency: formData.frequency || null,
          duration: formData.duration || null,
          quantity: formData.quantity || null,
          personnel_id: formData.personnel_id,
        };

        const { error } = await dentistClient
          .from('prescription_tbl')
          .insert(prescriptionData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        setIsAdding(false);
      }

      await loadPrescriptions();
      alert('Prescription saved successfully!');

      const defaultDentist = dentists.length > 0 ? dentists[0].personnel_id : '';
      setFormData({
        medicine_id: undefined,
        instructions: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: '',
        personnel_id: defaultDentist,
      });
    } catch (err) {
      console.error('Failed to save prescription:', err);
      alert('Failed to save prescription');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    const defaultDentist = dentists.length > 0 ? dentists[0].personnel_id : '';
    setFormData({
      medicine_id: undefined,
      instructions: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      personnel_id: defaultDentist,
    });
  };

  const currentForm = isAdding || isEditing ? formData : null;

  return (
    <>
      {/* Workspace Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Briefcase className="w-8 h-8" />
                Workspace
              </CardTitle>
              <p className="text-muted-foreground">
                Patient management workspace for dental charting, records, and treatment planning.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <PatientNav />

      {/* Patient Selector */}
      <PatientSelector
        selectedPatient={selectedPatient}
        onPatientChange={setSelectedPatient}
        patients={patients}
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Pill className="w-8 h-8" />
                Prescription Management - {selectedPatient ? getPatientName(Number(selectedPatient)) : 'Select Patient'}
              </CardTitle>
              <p className="text-muted-foreground">
                Create and manage patient prescriptions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                New Prescription
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {selectedPatient && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                  <p className="text-2xl font-bold">{prescriptions.length}</p>
                </div>
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Medications</p>
                  <p className="text-2xl font-bold">{totalMedications}</p>
                </div>
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Field orientation="vertical">
            <FieldLabel>Search Prescriptions</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by patient name..."
                  className="pl-10"
                />
              </div>
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {currentForm && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Prescription' : 'New Prescription'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field orientation="vertical">
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Input
                    value={getPatientName(Number(selectedPatient))}
                    disabled
                    className="bg-muted"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Dentist</FieldLabel>
                <FieldContent>
                  <Select
                    value={currentForm.personnel_id || ''}
                    onValueChange={(value) => setFormData({ ...currentForm, personnel_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dentists.length === 0 ? "Loading dentists..." : "Select dentist"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.length === 0 ? (
                        <SelectItem value="none" disabled>No dentists available</SelectItem>
                      ) : (
                        dentists.map(d => (
                          <SelectItem key={d.personnel_id} value={d.personnel_id}>
                            {getDentistName(d)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            {/* Medicine Selection and Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medicine Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field orientation="vertical">
                    <FieldLabel>Medicine Name *</FieldLabel>
                    <FieldContent>
                      <Select
                        value={currentForm.medicine_id ? String(currentForm.medicine_id) : ''}
                        onValueChange={(value) => {
                          // Convert to number since medicine_id is bigint
                          setFormData({ ...currentForm, medicine_id: Number(value) });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={medicines.length === 0 ? "No medicines available" : "Select medication"} />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No medicines found in inventory
                            </SelectItem>
                          ) : (
                            medicines.map((med) => (
                              <SelectItem key={med.medicine_id} value={String(med.medicine_id)}>
                                {med.medicine_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Dosage</FieldLabel>
                    <FieldContent>
                      <Input
                        value={currentForm.dosage || ''}
                        onChange={(e) => setFormData({ ...currentForm, dosage: e.target.value })}
                        placeholder="e.g., 500mg"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Frequency</FieldLabel>
                    <FieldContent>
                      <Input
                        value={currentForm.frequency || ''}
                        onChange={(e) => setFormData({ ...currentForm, frequency: e.target.value })}
                        placeholder="e.g., 3 times a day"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Duration</FieldLabel>
                    <FieldContent>
                      <Input
                        value={currentForm.duration || ''}
                        onChange={(e) => setFormData({ ...currentForm, duration: e.target.value })}
                        placeholder="e.g., 7 days"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Quantity</FieldLabel>
                    <FieldContent>
                      <Input
                        value={currentForm.quantity || ''}
                        onChange={(e) => setFormData({ ...currentForm, quantity: e.target.value })}
                        placeholder="e.g., 21 tablets"
                      />
                    </FieldContent>
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Field orientation="vertical">
              <FieldLabel>Instructions</FieldLabel>
              <FieldContent>
                <textarea
                  value={currentForm.instructions}
                  onChange={(e) => setFormData({ ...currentForm, instructions: e.target.value })}
                  className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional instructions for the patient..."
                />
              </FieldContent>
            </Field>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Prescription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Loading prescriptions...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No prescriptions found</p>
                <p className="text-sm mt-2">Create a new prescription to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => {
            const medicineName = getMedicineName(prescription.medicine_id);
            const dentistName = getDentistNameById(prescription.personnel_id);
            const prescriptionDate = prescription.created_at 
              ? new Date(prescription.created_at).toLocaleDateString()
              : 'N/A';
            
            return (
              <Card key={prescription.prescription_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {selectedPatient ? getPatientName(Number(selectedPatient)) : 'Prescription'}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {prescriptionDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {dentistName}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(prescription)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Medicine:</h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-2">{medicineName}</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {prescription.dosage && (
                          <p><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                        )}
                        {prescription.frequency && (
                          <p><span className="font-medium">Frequency:</span> {prescription.frequency}</p>
                        )}
                        {prescription.duration && (
                          <p><span className="font-medium">Duration:</span> {prescription.duration}</p>
                        )}
                        {prescription.quantity && (
                          <p><span className="font-medium">Quantity:</span> {prescription.quantity}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {prescription.instructions && (
                    <div>
                      <h4 className="font-semibold mb-1">Instructions:</h4>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
};

export default PrescriptionsPage;

