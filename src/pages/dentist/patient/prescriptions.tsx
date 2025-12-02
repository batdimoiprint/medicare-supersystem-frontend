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
import { patientRecordClient, inventoryClient } from '@/utils/supabase';

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Medicine {
  medicine_id: number;
  medicine_name: string;
  unit_cost?: number;
}

interface Prescription {
  prescription_id: number;
  patient_id: number;
  date: string;
  medications: string; // JSON string of medications
  instructions: string;
  dentist: string;
  status?: string;
}

interface MedicationItem {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
}

// --- Main Component ---
const PrescriptionsPage = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(searchParams.get('patient') || '');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

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
        const { data, error } = await inventoryClient
          .from('medicine_tbl')
          .select('medicine_id, medicine_name, unit_cost')
          .order('medicine_name', { ascending: true });

        if (error) return console.error('Failed to fetch medicines:', error);
        setMedicines(data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMedicines();
  }, []);

  // Load prescriptions
  const loadPrescriptions = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const { data, error } = await patientRecordClient
        .from('prescription_tbl')
        .select('*')
        .eq('patient_id', selectedPatient)
        .order('date', { ascending: false });

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

  // Parse medications JSON
  const parseMedications = (medicationsJson: string): MedicationItem[] => {
    try {
      return JSON.parse(medicationsJson || '[]');
    } catch {
      return [];
    }
  };

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    patient_id?: number;
    date: string;
    medications: MedicationItem[];
    instructions: string;
    dentist: string;
  }>({
    patient_id: undefined,
    date: new Date().toISOString().split('T')[0],
    medications: [],
    instructions: '',
    dentist: 'Dr. Evelyn Reyes',
  });
  const [medicationForm, setMedicationForm] = useState<Partial<MedicationItem>>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
  });

  const filteredPrescriptions = prescriptions.filter((prescription) =>
    prescription.instructions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.dentist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMedications = prescriptions.reduce((sum, p) => sum + parseMedications(p.medications).length, 0);

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      patient_id: selectedPatient ? Number(selectedPatient) : undefined,
      date: new Date().toISOString().split('T')[0],
      medications: [],
      instructions: '',
      dentist: 'Dr. Evelyn Reyes',
    });
  };

  const handleEdit = (prescription: Prescription) => {
    setIsEditing(prescription.prescription_id);
    setIsAdding(false);
    setFormData({
      patient_id: prescription.patient_id,
      date: prescription.date,
      medications: parseMedications(prescription.medications),
      instructions: prescription.instructions,
      dentist: prescription.dentist,
    });
  };

  const handleAddMedication = () => {
    if (!medicationForm.name || !medicationForm.dosage || !medicationForm.frequency) return;

    const newMedication: MedicationItem = {
      id: Date.now(),
      name: medicationForm.name || '',
      dosage: medicationForm.dosage || '',
      frequency: medicationForm.frequency || '',
      duration: medicationForm.duration || '',
      quantity: medicationForm.quantity || '',
    };

    setFormData({
      ...formData,
      medications: [...(formData.medications || []), newMedication],
    });

    setMedicationForm({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
    });
  };

  const handleRemoveMedication = (medId: number) => {
    setFormData({
      ...formData,
      medications: (formData.medications || []).filter(m => m.id !== medId),
    });
  };

  const handleSave = async () => {
    try {
      const medicationsJson = JSON.stringify(formData.medications);

      if (isEditing) {
        const { error } = await patientRecordClient
          .from('prescription_tbl')
          .update({
            date: formData.date,
            medications: medicationsJson,
            instructions: formData.instructions,
            dentist: formData.dentist,
          })
          .eq('prescription_id', isEditing);

        if (error) throw error;
        setIsEditing(null);
      } else if (isAdding) {
        const { error } = await patientRecordClient
          .from('prescription_tbl')
          .insert({
            patient_id: Number(selectedPatient),
            date: formData.date,
            medications: medicationsJson,
            instructions: formData.instructions,
            dentist: formData.dentist,
            status: 'Pending',
          });

        if (error) throw error;
        setIsAdding(false);
      }

      await loadPrescriptions();
      alert('Prescription saved successfully!');

      setFormData({
        patient_id: undefined,
        date: new Date().toISOString().split('T')[0],
        medications: [],
        instructions: '',
        dentist: 'Dr. Evelyn Reyes',
      });
    } catch (err) {
      console.error('Failed to save prescription:', err);
      alert('Failed to save prescription');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      patient_id: undefined,
      date: new Date().toISOString().split('T')[0],
      medications: [],
      instructions: '',
      dentist: 'Dr. Evelyn Reyes',
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
            <div className="grid md:grid-cols-3 gap-4">
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
                <FieldLabel>Date</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={currentForm.date}
                    onChange={(e) => setFormData({ ...currentForm, date: e.target.value })}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Dentist</FieldLabel>
                <FieldContent>
                  <Select
                    value={currentForm.dentist}
                    onValueChange={(value) => setFormData({ ...currentForm, dentist: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr. Evelyn Reyes">Dr. Evelyn Reyes</SelectItem>
                      <SelectItem value="Dr. Mark Santos">Dr. Mark Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            {/* Add Medication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Medication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field orientation="vertical">
                    <FieldLabel>Medication Name</FieldLabel>
                    <FieldContent>
                      <Select
                        value={medicationForm.name}
                        onValueChange={(value) => setMedicationForm({ ...medicationForm, name: value })}
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
                              <SelectItem key={med.medicine_id} value={med.medicine_name}>
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
                        value={medicationForm.dosage}
                        onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                        placeholder="e.g., 500mg"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Frequency</FieldLabel>
                    <FieldContent>
                      <Input
                        value={medicationForm.frequency}
                        onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                        placeholder="e.g., 3 times a day"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Duration</FieldLabel>
                    <FieldContent>
                      <Input
                        value={medicationForm.duration}
                        onChange={(e) => setMedicationForm({ ...medicationForm, duration: e.target.value })}
                        placeholder="e.g., 7 days"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Quantity</FieldLabel>
                    <FieldContent>
                      <Input
                        value={medicationForm.quantity}
                        onChange={(e) => setMedicationForm({ ...medicationForm, quantity: e.target.value })}
                        placeholder="e.g., 21 tablets"
                      />
                    </FieldContent>
                  </Field>
                  <div className="flex items-end">
                    <Button onClick={handleAddMedication} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medication
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medications List */}
            {currentForm.medications && currentForm.medications.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Medications</h3>
                {currentForm.medications.map((med) => (
                  <Card key={med.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{med.name}</h4>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <p><span className="font-medium">Dosage:</span> {med.dosage}</p>
                            <p><span className="font-medium">Frequency:</span> {med.frequency}</p>
                            <p><span className="font-medium">Duration:</span> {med.duration}</p>
                            <p><span className="font-medium">Quantity:</span> {med.quantity}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(med.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

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
            const medications = parseMedications(prescription.medications);
            return (
              <Card key={prescription.prescription_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{getPatientName(prescription.patient_id)}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {prescription.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {prescription.dentist}
                        </div>
                        {prescription.status && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            prescription.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            prescription.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {prescription.status}
                          </span>
                        )}
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
                    <h4 className="font-semibold mb-2">Medications:</h4>
                    <div className="space-y-2">
                      {medications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No medications prescribed</p>
                      ) : (
                        medications.map((med) => (
                          <div key={med.id} className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">{med.name} - {med.dosage}</p>
                            <p className="text-sm text-muted-foreground">
                              {med.frequency} for {med.duration} ({med.quantity})
                            </p>
                          </div>
                        ))
                      )}
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

