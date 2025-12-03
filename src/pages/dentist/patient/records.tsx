import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  User,
  Calendar,
  Clock,
  Plus,
  Edit,
  Save,
  X,
  Search,
  Download,
  Stethoscope,
  ClipboardList,
  TrendingUp,
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
import { patientRecordClient, dentistClient } from '@/utils/supabase';
import supabase from '@/utils/supabase';

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Dentist {
  personnel_id: number | string; // Can be number or string depending on how Supabase returns it
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_description?: string;
}

interface EMRRecord {
  id: number;
  patient_id: number;
  date: string;
  time: string;
  chief_complaint: string;
  diagnosis: string;
  treatment: string;
  treatment_id?: number; // FK to services_tbl
  notes: string;
  dentist: string;
  personnel_id?: string | number; // FK to personnel_tbl (bigint)
  status: 'Active' | 'Archived';
}

// --- Main Component ---
const PatientRecords = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(searchParams.get('patient') || '');
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<EMRRecord>>({
    patient_id: undefined,
    date: new Date().toISOString().split('T')[0],
    time: '',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    treatment_id: undefined,
    notes: '',
    dentist: '',
    personnel_id: '',
    status: 'Active',
  });

  // Helper to get dentist name
  const getDentistName = (dentist: Dentist): string => {
    return `Dr. ${dentist.f_name ?? ''} ${dentist.m_name ?? ''} ${dentist.l_name ?? ''}`.trim();
  };

  // Helper to get dentist name by ID
  const getDentistNameById = (personnelId?: string | number): string => {
    if (!personnelId) return 'Unknown';
    // Compare as strings to handle both number and string types
    const dentist = dentists.find(d => String(d.personnel_id) === String(personnelId));
    return dentist ? getDentistName(dentist) : 'Unknown';
  };

  // --- Load Patients ---
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

  // --- Load Dentists ---
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

        // Convert personnel_id to number if it's returned as string (bigint handling)
        // Keep as number for consistency since both tables use bigint
        const processedData = data?.map(d => ({
          ...d,
          personnel_id: typeof d.personnel_id === 'string' ? Number(d.personnel_id) : d.personnel_id
        })) ?? [];

        setDentists(processedData);
      } catch (err) {
        console.error('Error loading dentists:', err);
      }
    };
    loadDentists();
  }, []);

  // --- Load Services (Treatments) ---
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await dentistClient
          .from('services_tbl')
          .select('service_id, service_name, service_description')
          .not('service_id', 'is', null)
          .not('service_name', 'is', null)
          .order('service_name', { ascending: true });

        if (error) {
          console.error('Failed to load services:', error);
          return;
        }
        setServices(data ?? []);
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };
    loadServices();
  }, []);

  // --- Load EMR Records ---
  const loadRecords = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      // Select columns - treatment is bigint (service_id), not text
      const { data, error } = await patientRecordClient
        .from('emr_records')
        .select('id, patient_id, date, time, chief_complaint, diagnosis, treatment, notes, dentist, status')
        .eq('patient_id', selectedPatient)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch records:', error);
        return;
      }

      // Transform data: convert IDs to names for display
      // - treatment is service_id (bigint) -> convert to service name
      // - dentist is personnel_id (bigint) -> convert to dentist name
      const transformedData = data?.map(record => {
        const service = services.find(s => s.service_id === record.treatment);
        const dentist = dentists.find(d => 
          typeof d.personnel_id === 'number' 
            ? d.personnel_id === record.dentist
            : Number(d.personnel_id) === record.dentist
        );
        
        return {
          ...record,
          treatment_id: record.treatment, // service_id from database
          treatment: service?.service_name || `Service ID: ${record.treatment}`, // Convert to name for display
          personnel_id: record.dentist, // personnel_id from database (stored in dentist column)
          dentist: dentist ? getDentistName(dentist) : `Dentist ID: ${record.dentist}`, // Convert to name for display
        };
      });

      setRecords(transformedData ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [selectedPatient]);

  // Helper to get patient name by ID
  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.patient_id === patientId);
    if (!patient) return 'Unknown';
    return `${patient.f_name ?? ''} ${patient.m_name ?? ''} ${patient.l_name ?? ''}`.trim();
  };

  const filteredRecords = records.filter((record) =>
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecords = records.length;

  const handleEdit = (record: EMRRecord) => {
    setIsEditing(record.id);
    // Convert IDs back to form format
    // - treatment_id is the service_id (bigint)
    // - personnel_id is the dentist (bigint, stored in dentist column)
    setFormData({
      ...record,
      treatment_id: record.treatment_id, // Already set from transformation
      personnel_id: record.personnel_id ? String(record.personnel_id) : undefined, // Convert to string for form
      // Keep treatment and dentist as display names for the form
    });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    const defaultDentist = dentists.length > 0 ? dentists[0].personnel_id : '';
    setFormData({
      patient_id: selectedPatient ? Number(selectedPatient) : undefined,
      date: new Date().toISOString().split('T')[0],
      time: '',
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      treatment_id: undefined,
      notes: '',
      dentist: '',
      personnel_id: defaultDentist,
      status: 'Active',
    });
  };

  const handleSave = async () => {
    try {
      if (!selectedPatient) {
        alert('Please select a patient first');
        return;
      }

      // Get treatment_id - the treatment column in emr_records is bigint (service_id)
      // If user selected a service from dropdown, use its service_id
      // If user entered custom text, we can't save it as bigint, so we'll need to handle this
      let treatmentId: number | null = null;
      
      if (formData.treatment_id) {
        // User selected a service from dropdown
        treatmentId = formData.treatment_id;
      } else if (formData.treatment && formData.treatment.trim() !== '') {
        // User entered custom treatment text
        // Since treatment column is bigint, we can't save custom text directly
        // Try to find a matching service by name
        const matchingService = services.find(s => 
          s.service_name?.toLowerCase() === formData.treatment?.toLowerCase()
        );
        if (matchingService) {
          treatmentId = matchingService.service_id;
        } else {
          // Custom treatment that doesn't match any service
          // Can't save as bigint, so we'll set to null
          treatmentId = null;
          alert('Custom treatment text cannot be saved. Please select from services dropdown.');
          return;
        }
      }

      // Get personnel_id - the dentist column in emr_records is bigint (personnel_id)
      // We need to save the personnel_id, not the dentist name
      let personnelId: number | null = null;
      
      if (formData.personnel_id) {
        // Convert personnel_id to number (it's bigint in database)
        const parsed = typeof formData.personnel_id === 'string' 
          ? Number(formData.personnel_id) 
          : formData.personnel_id;
        
        if (!isNaN(parsed) && parsed > 0) {
          personnelId = parsed;
        }
      }
      
      if (!personnelId) {
        alert('Please select a dentist');
        return;
      }

      const patientId = Number(selectedPatient);
      
      if (isNaN(patientId)) {
        alert('Invalid patient ID');
        return;
      }

      // Note: emr_records table does NOT have a personnel_id column
      // We only save the dentist name in the 'dentist' field

      if (isEditing) {
        // Update existing record
        // Note: 
        // - treatment column is bigint (service_id), not text
        // - dentist column is bigint (personnel_id), not text
        const updateData: Record<string, any> = {
          date: formData.date || new Date().toISOString().split('T')[0],
          time: formData.time || null,
          chief_complaint: formData.chief_complaint || null,
          diagnosis: formData.diagnosis || null,
          treatment: treatmentId, // Send service_id (bigint)
          notes: formData.notes || null,
          dentist: personnelId, // Send personnel_id (bigint), not name (text)
          status: formData.status || 'Active',
        };

        const { error } = await patientRecordClient
          .from('emr_records')
          .update(updateData)
          .eq('id', isEditing);

        if (error) throw error;
        setIsEditing(null);
      } else if (isAdding) {
        // Get the next available id for emr_records
        // Get the max id to calculate next id
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

        // Insert new record
        // Note: 
        // - treatment column is bigint (service_id), not text
        // - dentist column is bigint (personnel_id), not text
        // - id column is NOT NULL but not auto-generated, so we need to provide it
        const insertData: Record<string, any> = {};
        
        // Add only the fields we know exist
        insertData.id = nextId; // Generate id
        insertData.patient_id = patientId;
        insertData.date = formData.date || new Date().toISOString().split('T')[0];
        insertData.time = formData.time || null;
        insertData.chief_complaint = formData.chief_complaint || null;
        insertData.diagnosis = formData.diagnosis || null;
        insertData.treatment = treatmentId; // Send service_id (bigint)
        insertData.notes = formData.notes || null;
        insertData.status = formData.status || 'Active';
        insertData.dentist = personnelId; // Send personnel_id (bigint), not name (text)

        // Log exactly what we're sending
        console.log('=== INSERT DATA ===');
        console.log('Keys:', Object.keys(insertData));
        console.log('Values:', Object.values(insertData));
        console.log('Full object:', JSON.stringify(insertData, null, 2));
        console.log('Personnel ID (dentist):', personnelId);

        const { error } = await patientRecordClient
          .from('emr_records')
          .insert(insertData);

        if (error) {
          console.error('Insert error details:', error);
          console.error('Insert data that caused error:', insertData);
          throw error;
        }
        setIsAdding(false);
      }

      // Reload records after save
      await loadRecords();

      // Reset form
      setFormData({
        patient_id: undefined,
        date: new Date().toISOString().split('T')[0],
        time: '',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        notes: '',
        dentist: 'Dr. Evelyn Reyes',
        status: 'Active',
      });

      alert('Record saved successfully!');
    } catch (err) {
      console.error('Failed to save record:', err);
      alert('Failed to save record');
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    const defaultDentist = dentists.length > 0 ? dentists[0].personnel_id : '';
    setFormData({
      patient_id: undefined,
      date: new Date().toISOString().split('T')[0],
      time: '',
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      treatment_id: undefined,
      notes: '',
      dentist: '',
      personnel_id: defaultDentist,
      status: 'Active',
    });
  };

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
                <FileText className="w-8 h-8" />
                Patient EMR Records
              </CardTitle>
              <p className="text-muted-foreground">
                Manage and update patient Electronic Medical Records
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {/* Export functionality */ }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                New Record
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
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{totalRecords}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Records</p>
                  <p className="text-2xl font-bold">
                    {records.filter(r => r.status === 'Active').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Field orientation="vertical">
            <FieldLabel>Search Records</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by patient name or diagnosis..."
                  className="pl-10"
                />
              </div>
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit EMR Record' : 'New EMR Record'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field orientation="vertical">
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Input
                    value={selectedPatient ? getPatientName(Number(selectedPatient)) : ''}
                    disabled
                    placeholder="Select a patient first"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Date</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Time</FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Dentist</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.personnel_id ? String(formData.personnel_id) : ''}
                    onValueChange={(value) => setFormData({ ...formData, personnel_id: value })}
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
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  placeholder="Patient's main complaint"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Diagnosis</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Clinical diagnosis"
                />
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Treatment</FieldLabel>
              <FieldContent>
                <Select
                  value={formData.treatment_id ? String(formData.treatment_id) : ''}
                  onValueChange={(value) => {
                    const serviceId = Number(value);
                    const selectedService = services.find(s => s.service_id === serviceId);
                    setFormData({ 
                      ...formData, 
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
                {/* Allow manual entry as fallback */}
                {formData.treatment_id && (
                  <Input
                    className="mt-2"
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    placeholder="Or enter custom treatment"
                  />
                )}
              </FieldContent>
            </Field>
            <Field orientation="vertical">
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional notes..."
                />
              </FieldContent>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Record
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Loading records...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No records found</p>
                <p className="text-sm mt-2">Create a new EMR record to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{getPatientName(record.patient_id)}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {record.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {record.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {record.personnel_id ? getDentistNameById(record.personnel_id) : record.dentist}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'Active'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">Chief Complaint:</p>
                  <p className="text-sm text-muted-foreground">{record.chief_complaint}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Diagnosis:</p>
                  <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Treatment:</p>
                  <p className="text-sm text-muted-foreground">{record.treatment}</p>
                </div>
                {record.notes && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{record.notes}</p>
                  </div>
                )}
                <div className="pt-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dentist/patient/charting?patient=${record.patient_id}`}>
                      <Stethoscope className="w-3 h-3 mr-1" />
                      View Chart
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dentist/patient/treatment/plan?patient=${record.patient_id}`}>
                      <ClipboardList className="w-3 h-3 mr-1" />
                      Treatment Plan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
};

export default PatientRecords;

