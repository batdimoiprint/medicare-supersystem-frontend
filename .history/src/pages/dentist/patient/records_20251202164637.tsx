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
import { patientRecordClient } from '@/utils/supabase';

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface EMRRecord {
  id: number;
  patient_id: number;
  date: string;
  time: string;
  chief_complaint: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  dentist: string;
  status: 'Active' | 'Archived';
}

// --- Main Component ---
const PatientRecords = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
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
    notes: '',
    dentist: 'Dr. Evelyn Reyes',
    status: 'Active',
  });

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

  // --- Load EMR Records ---
  const loadRecords = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const { data, error } = await patientRecordClient
        .from('emr_records')
        .select('*')
        .eq('patient_id', selectedPatient)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch records:', error);
        return;
      }

      setRecords(data ?? []);
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
    setFormData(record);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      patientName: selectedPatient !== 'All Patients' ? selectedPatient : '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      chiefComplaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      dentist: 'Dr. Evelyn Reyes',
      status: 'Active',
    });
  };

  const handleSave = () => {
    if (isEditing) {
      setRecords(records.map(r => r.id === isEditing ? { ...formData, id: isEditing } as EMRRecord : r));
      setIsEditing(null);
    } else if (isAdding) {
      const newRecord: EMRRecord = {
        ...formData,
        id: Date.now(),
      } as EMRRecord;
      setRecords([...records, newRecord]);
      setIsAdding(false);
    }
    setFormData({
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      chiefComplaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      dentist: 'Dr. Evelyn Reyes',
      status: 'Active',
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      chiefComplaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      dentist: 'Dr. Evelyn Reyes',
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
      {selectedPatient !== 'All Patients' && (
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
                    {patientRecords.filter(r => r.status === 'Active').length}
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
                <FieldLabel>Patient Name</FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Enter patient name"
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
                    value={formData.dentist}
                    onValueChange={(value) => setFormData({ ...formData, dentist: value })}
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
            <Field orientation="vertical">
              <FieldLabel>Chief Complaint</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
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
                <Input
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  placeholder="Treatment provided"
                />
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
        {filteredRecords.length === 0 ? (
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
                    <CardTitle className="text-xl mb-2">{record.patientName}</CardTitle>
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
                        {record.dentist}
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
                  <p className="text-sm text-muted-foreground">{record.chiefComplaint}</p>
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
                    <Link to={`/dentist/patient/charting?patient=${record.patientName}`}>
                      <Stethoscope className="w-3 h-3 mr-1" />
                      View Chart
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dentist/patient/treatment/plan?patient=${record.patientName}`}>
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

