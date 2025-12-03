import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Edit,
  X,
  Calendar,
  Pill,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  User,
  Stethoscope,
  ClipboardList,
  Clock,
  CheckCircle2,
  Save,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const patientRecordClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'patient_record' } });
const frontdeskClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'frontdesk' } });
const dentistClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'dentist' } });
const inventoryClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'inventory' } });

// Type definitions
interface Patient {
  patient_id: number;
  f_name: string;
  m_name?: string;
  l_name: string;
  suffix?: string;
  email?: string;
  pri_contact_no?: string;
  sec_contact_no?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  blood_type?: string;
  created_at?: string;
  status?: string;
}

interface EmergencyContact {
  ec_id?: number;
  patient_id: number;
  ec_name?: string;
  ec_relationship?: string;
  ec_contact_no?: string;
}

interface EMRRecord {
  id: number;
  patient_id: number;
  date: string;
  time?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: number;
  notes?: string;
  dentist?: number;
  status?: string;
}

interface Prescription {
  prescription_id: number;
  patient_id: number;
  medicine_id: number;
  instructions?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  created_at?: string;
  personnel_id?: string;
}

interface Billing {
  bill_id: number;
  patient_id: number;
  appointment_id?: number;
  total_amount?: number;
  payable_amount?: number;
  cash_paid?: number;
  payment_option?: string;
  payment_status_id?: number;
  created_at?: string;
}

interface Service {
  service_id: number;
  service_name: string;
}

interface Medicine {
  medicine_id: number;
  medicine_name: string;
}

interface Dentist {
  personnel_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Appointment {
  appointment_id: number;
  patient_id: number;
  appointment_date?: string;
  status_id?: number;
}

type DetailTab = 'overview' | 'treatments' | 'prescriptions' | 'followups' | 'billing';

export default function PatientRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  
  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    newThisMonth: 0,
    visitsThisMonth: 0
  });

  // Load initial data
  useEffect(() => {
    loadPatients();
    loadServices();
    loadMedicines();
    loadDentists();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await patientRecordClient
        .from('patient_tbl')
        .select('*')
        .order('l_name', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
        return;
      }

      setPatients(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(p => p.status !== 'inactive').length || 0;
      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const newPatients = data?.filter(p => {
        const createdAt = p.created_at ? new Date(p.created_at) : null;
        return createdAt && createdAt >= startOfMonth;
      }).length || 0;

      setStats(prev => ({
        ...prev,
        totalPatients: total,
        activePatients: active,
        newThisMonth: newPatients
      }));

      // Load emergency contacts for all patients
      const { data: ecData } = await patientRecordClient
        .from('emergency_contact_tbl')
        .select('*');
      setEmergencyContacts(ecData || []);

    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data } = await dentistClient
        .from('services_tbl')
        .select('service_id, service_name');
      setServices(data || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const loadMedicines = async () => {
    try {
      const { data } = await inventoryClient
        .from('medicine_tbl')
        .select('medicine_id, medicine_name');
      setMedicines(data || []);
    } catch (err) {
      console.error('Error loading medicines:', err);
    }
  };

  const loadDentists = async () => {
    try {
      const { data } = await supabase
        .from('personnel_tbl')
        .select('personnel_id, f_name, m_name, l_name')
        .eq('role_id', 1);
      setDentists(data || []);
    } catch (err) {
      console.error('Error loading dentists:', err);
    }
  };

  const loadPatientDetails = async (patientId: number) => {
    setLoadingDetails(true);
    try {
      // Load EMR records
      const { data: emrData } = await patientRecordClient
        .from('emr_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });
      setEmrRecords(emrData || []);

      // Load prescriptions
      const { data: prescData } = await patientRecordClient
        .from('prescription_tbl')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      setPrescriptions(prescData || []);

      // Load billing
      const { data: billData } = await frontdeskClient
        .from('billing_tbl')
        .select('*')
        .eq('patient_id', patientId)
        .order('bill_id', { ascending: false });
      setBillings(billData || []);

      // Load appointments (for follow-ups)
      const { data: apptData } = await frontdeskClient
        .from('appointments_tbl')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });
      setAppointments(apptData || []);

      // Update visits this month stat
      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const visitsCount = emrData?.filter(r => {
        const recordDate = r.date ? new Date(r.date) : null;
        return recordDate && recordDate >= startOfMonth;
      }).length || 0;
      
      setStats(prev => ({ ...prev, visitsThisMonth: visitsCount }));

    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openDetailModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditData({ ...patient });
    setDetailTab('overview');
    setIsEditMode(false);
    setShowDetailModal(true);
    loadPatientDetails(patient.patient_id);
    setTimeout(() => setIsDetailOpen(true), 10);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedPatient(null);
      setEditData(null);
      setIsEditMode(false);
    }, 200);
  };

  const handleSaveChanges = async () => {
    if (!editData || !selectedPatient) return;
    setSavingChanges(true);
    
    try {
      const { error } = await patientRecordClient
        .from('patient_tbl')
        .update({
          f_name: editData.f_name,
          m_name: editData.m_name,
          l_name: editData.l_name,
          suffix: editData.suffix,
          email: editData.email,
          pri_contact_no: editData.pri_contact_no,
          sec_contact_no: editData.sec_contact_no,
          address: editData.address,
          birthdate: editData.birthdate,
          gender: editData.gender,
          blood_type: editData.blood_type,
        })
        .eq('patient_id', selectedPatient.patient_id);

      if (error) {
        console.error('Error updating patient:', error);
        alert('Failed to save changes');
        return;
      }

      // Update local state
      setPatients(prev => prev.map(p => 
        p.patient_id === selectedPatient.patient_id ? { ...p, ...editData } : p
      ));
      setSelectedPatient({ ...selectedPatient, ...editData });
      setIsEditMode(false);
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes');
    } finally {
      setSavingChanges(false);
    }
  };

  // Helper functions
  const getPatientName = (patient: Patient) => {
    return `${patient.f_name || ''} ${patient.m_name || ''} ${patient.l_name || ''}`.trim();
  };

  const getPatientInitials = (patient: Patient) => {
    return `${patient.f_name?.[0] || ''}${patient.l_name?.[0] || ''}`.toUpperCase();
  };

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getServiceName = (serviceId?: number) => {
    if (!serviceId) return 'Unknown Service';
    const service = services.find(s => s.service_id === serviceId);
    return service?.service_name || `Service #${serviceId}`;
  };

  const getMedicineName = (medicineId?: number) => {
    if (!medicineId) return 'Unknown Medicine';
    const medicine = medicines.find(m => m.medicine_id === medicineId);
    return medicine?.medicine_name || `Medicine #${medicineId}`;
  };

  const getDentistName = (dentistId?: number) => {
    if (!dentistId) return 'Unknown';
    const dentist = dentists.find(d => d.personnel_id === dentistId);
    if (!dentist) return `Dentist #${dentistId}`;
    return `Dr. ${dentist.f_name || ''} ${dentist.l_name || ''}`.trim();
  };

  const getEmergencyContact = (patientId: number) => {
    return emergencyContacts.find(ec => ec.patient_id === patientId);
  };

  const filteredPatients = patients.filter(p => {
    const fullName = getPatientName(p).toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      (p.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(p.patient_id).includes(searchQuery) ||
      (p.pri_contact_no?.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && p.status !== 'inactive') ||
      (statusFilter === 'inactive' && p.status === 'inactive');
    return matchesSearch && matchesStatus;
  });

  const patientStats = [
    { title: 'Total Patients', value: stats.totalPatients.toLocaleString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active Patients', value: stats.activePatients.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'New This Month', value: stats.newThisMonth.toLocaleString(), icon: User, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { title: 'Records This Month', value: stats.visitsThisMonth.toLocaleString(), icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const detailTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'treatments', label: 'Treatments', icon: Stethoscope },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'followups', label: 'Appointments', icon: ClipboardList },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Patient Records
              </CardTitle>
              <p className="text-muted-foreground">
                Access complete patient information, treatment histories, and billing
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patientStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-lg">All Patients</CardTitle>
              <CardDescription>Click on a patient to view full records</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading patients...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No patients found</p>
                </div>
              ) : (
                filteredPatients.map((patient, index) => (
                  <motion.div
                    key={patient.patient_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openDetailModal(patient)}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                          patient.status !== 'inactive' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {getPatientInitials(patient)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold group-hover:text-primary transition-colors">{getPatientName(patient)}</p>
                            <Badge variant="outline" className={cn("text-xs",
                              patient.status !== 'inactive' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-muted text-muted-foreground'
                            )}>
                              {patient.status !== 'inactive' ? 'active' : 'inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">PAT-{String(patient.patient_id).padStart(4, '0')} • {patient.email || 'No email'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {patient.pri_contact_no && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {patient.pri_contact_no}
                              </span>
                            )}
                            {patient.created_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Registered: {new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{patient.gender || 'N/A'}</p>
                          <p className="font-semibold text-primary">{patient.birthdate ? `${calculateAge(patient.birthdate)} yrs` : 'N/A'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isDetailOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={closeDetailModal}
          />
          <div
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isDetailOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden bg-card shadow-2xl m-4 border flex flex-col">
              {/* Modal Header */}
              <div className="bg-[#00a8a8] px-5 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    {getPatientInitials(selectedPatient)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{getPatientName(selectedPatient)}</h3>
                    <p className="text-xs text-white/70">PAT-{String(selectedPatient.patient_id).padStart(4, '0')} • {selectedPatient.birthdate ? `${calculateAge(selectedPatient.birthdate)} years old` : 'Age N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditMode && detailTab === 'overview' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsEditMode(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className="hover:bg-white/20 rounded p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b bg-muted/30 px-4 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto py-2">
                  {detailTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={detailTab === tab.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setDetailTab(tab.id as DetailTab);
                        if (tab.id !== 'overview') setIsEditMode(false);
                      }}
                      className="gap-2 shrink-0"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Modal Content */}
              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-6">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading details...</span>
                    </div>
                  ) : (
                    <>
                  {/* Overview Tab */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      {isEditMode && editData ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">First Name</label>
                              <Input
                                value={editData.f_name || ''}
                                onChange={(e) => setEditData({ ...editData, f_name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Last Name</label>
                              <Input
                                value={editData.l_name || ''}
                                onChange={(e) => setEditData({ ...editData, l_name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Middle Name</label>
                              <Input
                                value={editData.m_name || ''}
                                onChange={(e) => setEditData({ ...editData, m_name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Email</label>
                              <Input
                                value={editData.email || ''}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Primary Contact</label>
                              <Input
                                value={editData.pri_contact_no || ''}
                                onChange={(e) => setEditData({ ...editData, pri_contact_no: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Birth Date</label>
                              <Input
                                type="date"
                                value={editData.birthdate || ''}
                                onChange={(e) => setEditData({ ...editData, birthdate: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Gender</label>
                              <Select value={editData.gender || ''} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Blood Type</label>
                              <Select value={editData.blood_type || ''} onValueChange={(v) => setEditData({ ...editData, blood_type: v })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select blood type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm text-muted-foreground">Address</label>
                              <Input
                                value={editData.address || ''}
                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button onClick={handleSaveChanges} className="bg-emerald-600 hover:bg-emerald-700" disabled={savingChanges}>
                              {savingChanges ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => {
                              setIsEditMode(false);
                              setEditData({ ...selectedPatient });
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          {/* Contact Info */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Email</p>
                                  <p className="text-sm font-medium">{selectedPatient.email || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-sm font-medium">{selectedPatient.pri_contact_no || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Address</p>
                                  <p className="text-sm font-medium">{selectedPatient.address || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Personal Info */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Personal Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Birth Date</p>
                                <p className="text-sm font-medium">{selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Age</p>
                                <p className="text-sm font-medium">{selectedPatient.birthdate ? `${calculateAge(selectedPatient.birthdate)} years` : 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Gender</p>
                                <p className="text-sm font-medium">{selectedPatient.gender || 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Blood Type</p>
                                <p className="text-sm font-medium">{selectedPatient.blood_type || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Emergency Contact */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Emergency Contact</h4>
                            <div className="p-3 rounded-lg bg-muted/50">
                              {(() => {
                                const ec = getEmergencyContact(selectedPatient.patient_id);
                                if (ec) {
                                  return (
                                    <div>
                                      <p className="text-sm font-medium">{ec.ec_name || 'N/A'}</p>
                                      <p className="text-xs text-muted-foreground">{ec.ec_relationship || 'N/A'} • {ec.ec_contact_no || 'N/A'}</p>
                                    </div>
                                  );
                                }
                                return <p className="text-sm text-muted-foreground">No emergency contact on file</p>;
                              })()}
                            </div>
                          </div>

                          {/* Patient Stats */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Patient Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Total Records</p>
                                <p className="text-lg font-bold text-primary">{emrRecords.length}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-muted-foreground">Total Billed</p>
                                <p className="text-lg font-bold text-emerald-500">{formatCurrency(billings.reduce((sum, b) => sum + (b.total_amount || 0), 0))}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <p className="text-xs text-muted-foreground">Prescriptions</p>
                                <p className="text-lg font-bold text-cyan-500">{prescriptions.length}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-xs text-muted-foreground">Appointments</p>
                                <p className="text-lg font-bold text-amber-500">{appointments.length}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Treatments Tab */}
                  {detailTab === 'treatments' && (
                    <div className="space-y-3">
                      {emrRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No treatment history</p>
                        </div>
                      ) : (
                        emrRecords.map((record, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{getServiceName(record.treatment)}</p>
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {record.status || 'completed'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{getDentistName(record.dentist)}</p>
                                {record.chief_complaint && <p className="text-sm text-muted-foreground mt-1">Complaint: {record.chief_complaint}</p>}
                                {record.diagnosis && <p className="text-sm text-muted-foreground">Diagnosis: {record.diagnosis}</p>}
                                {record.notes && <p className="text-sm text-muted-foreground">Notes: {record.notes}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                                {record.time && <p className="text-xs text-muted-foreground">{record.time}</p>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Prescriptions Tab */}
                  {detailTab === 'prescriptions' && (
                    <div className="space-y-3">
                      {prescriptions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No prescriptions</p>
                        </div>
                      ) : (
                        prescriptions.map((prescription, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-primary" />
                                  <p className="font-semibold">{getMedicineName(prescription.medicine_id)}</p>
                                </div>
                                {prescription.dosage && <p className="text-sm text-muted-foreground mt-1">Dosage: {prescription.dosage}</p>}
                                {prescription.frequency && <p className="text-sm text-muted-foreground">Frequency: {prescription.frequency}</p>}
                                {prescription.duration && <p className="text-sm text-muted-foreground">Duration: {prescription.duration}</p>}
                                {prescription.instructions && <p className="text-sm text-muted-foreground">Instructions: {prescription.instructions}</p>}
                              </div>
                              <p className="text-sm text-muted-foreground">{prescription.created_at ? new Date(prescription.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Follow-ups Tab */}
                  {detailTab === 'followups' && (
                    <div className="space-y-3">
                      {appointments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No appointments</p>
                        </div>
                      ) : (
                        appointments.map((appt, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">Appointment #{appt.appointment_id}</p>
                                  <Badge variant="outline" className={cn("text-xs",
                                    appt.status_id === 1 
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  )}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {appt.status_id === 1 ? 'Scheduled' : appt.status_id === 2 ? 'Completed' : 'Status ' + appt.status_id}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Billing Tab */}
                  {detailTab === 'billing' && (
                    <div className="space-y-4">
                      {/* Billing Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground">Total Billed</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(billings.reduce((sum, b) => sum + (b.total_amount || 0), 0))}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-sm text-muted-foreground">Total Transactions</p>
                          <p className="text-2xl font-bold text-emerald-500">{billings.length}</p>
                        </div>
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Transaction History</h4>
                        {billings.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No billing history</p>
                          </div>
                        ) : (
                          billings.map((bill, idx) => (
                            <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">Bill #{bill.bill_id}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-xs",
                                      bill.payment_option === 'paymongo' 
                                        ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    )}>
                                      {bill.payment_option === 'paymongo' ? 'PayMongo' : bill.payment_option || 'Cash'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary">{formatCurrency(bill.total_amount || 0)}</p>
                                  <Badge variant="outline" className={cn("text-xs",
                                    bill.payment_status_id === 2 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  )}>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {bill.payment_status_id === 2 ? 'Paid' : bill.payment_status_id === 1 ? 'Pending' : 'Status ' + bill.payment_status_id}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>
              </ScrollArea>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end shrink-0">
                <Button variant="outline" onClick={closeDetailModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
