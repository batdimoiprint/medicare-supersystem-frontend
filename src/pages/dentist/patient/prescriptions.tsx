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

// --- Type Definitions ---
interface Prescription {
  id: number;
  patientName: string;
  date: string;
  medications: Medication[];
  instructions: string;
  dentist: string;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
}

// --- Mock Data ---
const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    patientName: 'John Doe',
    date: '2024-01-15',
    medications: [
      {
        id: 1,
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3 times a day',
        duration: '7 days',
        quantity: '21 tablets',
      },
      {
        id: 2,
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed for pain',
        duration: '5 days',
        quantity: '10 tablets',
      },
    ],
    instructions: 'Take Amoxicillin with food. Ibuprofen only when experiencing pain. Complete full course of antibiotics.',
    dentist: 'Dr. Evelyn Reyes',
  },
];

const COMMON_MEDICATIONS = [
  'Amoxicillin',
  'Clindamycin',
  'Ibuprofen',
  'Acetaminophen',
  'Penicillin VK',
  'Metronidazole',
  'Cephalexin',
  'Naproxen',
];

// --- Main Component ---
const PrescriptionsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || 'John Doe');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const patient = searchParams.get('patient');
    if (patient) setSelectedPatient(patient);
  }, [searchParams]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Prescription>>({
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    medications: [],
    instructions: '',
    dentist: 'Dr. Evelyn Reyes',
  });
  const [medicationForm, setMedicationForm] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
  });

  const filteredPrescriptions = prescriptions.filter((prescription) =>
    (selectedPatient === 'All Patients' || prescription.patientName === selectedPatient) &&
    prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientPrescriptions = prescriptions.filter(p => p.patientName === selectedPatient);
  const totalMedications = patientPrescriptions.reduce((sum, p) => sum + p.medications.length, 0);

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      patientName: selectedPatient !== 'All Patients' ? selectedPatient : '',
      date: new Date().toISOString().split('T')[0],
      medications: [],
      instructions: '',
      dentist: 'Dr. Evelyn Reyes',
    });
  };

  const handleEdit = (prescription: Prescription) => {
    setIsEditing(prescription.id);
    setIsAdding(false);
    setFormData(prescription);
  };

  const handleAddMedication = () => {
    if (!medicationForm.name || !medicationForm.dosage || !medicationForm.frequency) return;

    const newMedication: Medication = {
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

  const handleSave = () => {
    if (isEditing) {
      setPrescriptions(prescriptions.map(p =>
        p.id === isEditing ? { ...formData, id: isEditing } as Prescription : p
      ));
      setIsEditing(null);
    } else if (isAdding) {
      const newPrescription: Prescription = {
        ...formData,
        id: Date.now(),
      } as Prescription;
      setPrescriptions([...prescriptions, newPrescription]);
      setIsAdding(false);
    }
    setFormData({
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      medications: [],
      instructions: '',
      dentist: 'Dr. Evelyn Reyes',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      patientName: '',
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
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Pill className="w-8 h-8" />
                Prescription Management - {selectedPatient}
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
      {selectedPatient !== 'All Patients' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                  <p className="text-2xl font-bold">{patientPrescriptions.length}</p>
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
                <FieldLabel>Patient Name</FieldLabel>
                <FieldContent>
                  <Input
                    value={currentForm.patientName}
                    onChange={(e) => setFormData({ ...currentForm, patientName: e.target.value })}
                    placeholder="Enter patient name"
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
                          <SelectValue placeholder="Select or type medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_MEDICATIONS.map((med) => (
                            <SelectItem key={med} value={med}>
                              {med}
                            </SelectItem>
                          ))}
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
        {filteredPrescriptions.length === 0 ? (
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
          filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{prescription.patientName}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {prescription.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {prescription.dentist}
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
                  <h4 className="font-semibold mb-2">Medications:</h4>
                  <div className="space-y-2">
                    {prescription.medications.map((med) => (
                      <div key={med.id} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{med.name} - {med.dosage}</p>
                        <p className="text-sm text-muted-foreground">
                          {med.frequency} for {med.duration} ({med.quantity})
                        </p>
                      </div>
                    ))}
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
          ))
        )}
      </div>
    </>
  );
};

export default PrescriptionsPage;

