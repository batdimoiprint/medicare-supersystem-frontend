import { useState } from 'react';
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
  AlertCircle,
  Save,
  ChevronRight
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

// Patient Data
const patients = [
  {
    id: 'PAT-001',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 917 123 4567',
    address: '123 Rizal St., Makati City',
    birthDate: '1990-05-15',
    gender: 'Female',
    bloodType: 'O+',
    allergies: ['Penicillin'],
    emergencyContact: 'Juan Santos - +63 918 765 4321',
    registeredDate: '2024-01-15',
    lastVisit: '2025-11-28',
    status: 'active',
    totalVisits: 12,
    totalSpent: 45000
  },
  {
    id: 'PAT-002',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 918 234 5678',
    address: '456 Bonifacio Ave., Quezon City',
    birthDate: '1985-08-22',
    gender: 'Male',
    bloodType: 'A+',
    allergies: [],
    emergencyContact: 'Ana Dela Cruz - +63 919 876 5432',
    registeredDate: '2023-06-10',
    lastVisit: '2025-12-01',
    status: 'active',
    totalVisits: 24,
    totalSpent: 78500
  },
  {
    id: 'PAT-003',
    name: 'Ana Reyes',
    email: 'ana.reyes@email.com',
    phone: '+63 919 345 6789',
    address: '789 Mabini Blvd., Manila',
    birthDate: '1995-12-03',
    gender: 'Female',
    bloodType: 'B+',
    allergies: ['Ibuprofen', 'Latex'],
    emergencyContact: 'Pedro Reyes - +63 920 987 6543',
    registeredDate: '2024-03-20',
    lastVisit: '2025-11-15',
    status: 'active',
    totalVisits: 8,
    totalSpent: 32000
  },
  {
    id: 'PAT-004',
    name: 'Pedro Garcia',
    email: 'pedro.garcia@email.com',
    phone: '+63 920 456 7890',
    address: '321 Luna St., Pasig City',
    birthDate: '1978-03-10',
    gender: 'Male',
    bloodType: 'AB+',
    allergies: [],
    emergencyContact: 'Maria Garcia - +63 921 098 7654',
    registeredDate: '2022-11-05',
    lastVisit: '2025-10-20',
    status: 'inactive',
    totalVisits: 35,
    totalSpent: 125000
  },
  {
    id: 'PAT-005',
    name: 'Sofia Martinez',
    email: 'sofia.martinez@email.com',
    phone: '+63 921 567 8901',
    address: '654 Aguinaldo Highway, Cavite',
    birthDate: '2000-07-25',
    gender: 'Female',
    bloodType: 'O-',
    allergies: ['Aspirin'],
    emergencyContact: 'Carlos Martinez - +63 922 109 8765',
    registeredDate: '2024-08-12',
    lastVisit: '2025-12-02',
    status: 'active',
    totalVisits: 5,
    totalSpent: 18500
  },
];

// Treatment History
const treatmentHistory = [
  { id: 1, patientId: 'PAT-001', date: '2025-11-28', service: 'Dental Cleaning', dentist: 'Dr. Smith', notes: 'Regular cleaning, no issues found', status: 'completed', cost: 2500 },
  { id: 2, patientId: 'PAT-001', date: '2025-10-15', service: 'Dental Filling', dentist: 'Dr. Johnson', notes: 'Composite filling on tooth #14', status: 'completed', cost: 3500 },
  { id: 3, patientId: 'PAT-001', date: '2025-08-20', service: 'Root Canal', dentist: 'Dr. Lee', notes: 'Root canal treatment on tooth #36', status: 'completed', cost: 8500 },
  { id: 4, patientId: 'PAT-002', date: '2025-12-01', service: 'Teeth Whitening', dentist: 'Dr. Smith', notes: 'Professional whitening treatment', status: 'completed', cost: 5000 },
  { id: 5, patientId: 'PAT-002', date: '2025-11-10', service: 'Dental Cleaning', dentist: 'Dr. Johnson', notes: 'Routine checkup and cleaning', status: 'completed', cost: 2500 },
];

// Prescriptions
const prescriptions = [
  { id: 1, patientId: 'PAT-001', date: '2025-11-28', medication: 'Amoxicillin 500mg', dosage: '3x daily for 7 days', prescribedBy: 'Dr. Smith', status: 'active' },
  { id: 2, patientId: 'PAT-001', date: '2025-10-15', medication: 'Ibuprofen 400mg', dosage: 'As needed for pain', prescribedBy: 'Dr. Johnson', status: 'completed' },
  { id: 3, patientId: 'PAT-002', date: '2025-12-01', medication: 'Sensodyne Toothpaste', dosage: 'Use twice daily', prescribedBy: 'Dr. Smith', status: 'active' },
];

// Follow-up Recommendations
const followUps = [
  { id: 1, patientId: 'PAT-001', scheduledDate: '2025-12-28', service: 'Dental Cleaning', dentist: 'Dr. Smith', notes: 'Regular 6-month checkup', status: 'scheduled' },
  { id: 2, patientId: 'PAT-001', scheduledDate: '2026-02-15', service: 'Root Canal Follow-up', dentist: 'Dr. Lee', notes: 'Check healing progress', status: 'recommended' },
  { id: 3, patientId: 'PAT-002', scheduledDate: '2026-01-01', service: 'Teeth Whitening Touch-up', dentist: 'Dr. Smith', notes: 'Optional touch-up session', status: 'recommended' },
];

// Billing Summary
const billingHistory = [
  { id: 1, patientId: 'PAT-001', date: '2025-11-28', service: 'Dental Cleaning', amount: 2500, method: 'cash', status: 'paid' },
  { id: 2, patientId: 'PAT-001', date: '2025-10-15', service: 'Dental Filling', amount: 3500, method: 'paymongo', status: 'paid' },
  { id: 3, patientId: 'PAT-001', date: '2025-08-20', service: 'Root Canal', amount: 8500, method: 'paymongo', status: 'paid' },
  { id: 4, patientId: 'PAT-002', date: '2025-12-01', service: 'Teeth Whitening', amount: 5000, method: 'cash', status: 'paid' },
];

// Stats
const patientStats = [
  { title: 'Total Patients', value: '1,234', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Active Patients', value: '1,089', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'New This Month', value: '45', icon: User, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { title: 'Visits This Month', value: '328', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

type DetailTab = 'overview' | 'treatments' | 'prescriptions' | 'followups' | 'billing';

export default function PatientRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<typeof patients[0] | null>(null);

  const openDetailModal = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setEditData({ ...patient });
    setDetailTab('overview');
    setIsEditMode(false);
    setShowDetailModal(true);
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

  const handleSaveChanges = () => {
    // In real app, save to backend
    console.log('Saving changes:', editData);
    setIsEditMode(false);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPatientTreatments = (patientId: string) => treatmentHistory.filter(t => t.patientId === patientId);
  const getPatientPrescriptions = (patientId: string) => prescriptions.filter(p => p.patientId === patientId);
  const getPatientFollowUps = (patientId: string) => followUps.filter(f => f.patientId === patientId);
  const getPatientBilling = (patientId: string) => billingHistory.filter(b => b.patientId === patientId);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const detailTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'treatments', label: 'Treatments', icon: Stethoscope },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'followups', label: 'Follow-ups', icon: ClipboardList },
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
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No patients found</p>
              </div>
            ) : (
              filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openDetailModal(patient)}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                        patient.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold group-hover:text-primary transition-colors">{patient.name}</p>
                          <Badge variant="outline" className={cn("text-xs",
                            patient.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {patient.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{patient.id} • {patient.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last visit: {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{patient.totalVisits} visits</p>
                        <p className="font-semibold text-primary">{formatCurrency(patient.totalSpent)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
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
                    {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPatient.name}</h3>
                    <p className="text-xs text-white/70">{selectedPatient.id} • {calculateAge(selectedPatient.birthDate)} years old</p>
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
                  {/* Overview Tab */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      {isEditMode && editData ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Full Name</label>
                              <Input
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Email</label>
                              <Input
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Phone</label>
                              <Input
                                value={editData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Birth Date</label>
                              <Input
                                type="date"
                                value={editData.birthDate}
                                onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Gender</label>
                              <Select value={editData.gender} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
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
                              <Select value={editData.bloodType} onValueChange={(v) => setEditData({ ...editData, bloodType: v })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
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
                                value={editData.address}
                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm text-muted-foreground">Emergency Contact</label>
                              <Input
                                value={editData.emergencyContact}
                                onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button onClick={handleSaveChanges} className="bg-emerald-600 hover:bg-emerald-700">
                              <Save className="w-4 h-4 mr-2" />
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
                                  <p className="text-sm font-medium">{selectedPatient.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-sm font-medium">{selectedPatient.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Address</p>
                                  <p className="text-sm font-medium">{selectedPatient.address}</p>
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
                                <p className="text-sm font-medium">{new Date(selectedPatient.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Age</p>
                                <p className="text-sm font-medium">{calculateAge(selectedPatient.birthDate)} years</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Gender</p>
                                <p className="text-sm font-medium">{selectedPatient.gender}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Blood Type</p>
                                <p className="text-sm font-medium">{selectedPatient.bloodType}</p>
                              </div>
                            </div>
                          </div>

                          {/* Medical Info */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Medical Information</h4>
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Allergies</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {selectedPatient.allergies.length > 0 ? (
                                    selectedPatient.allergies.map((allergy, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {allergy}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No known allergies</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                                <p className="text-sm font-medium">{selectedPatient.emergencyContact}</p>
                              </div>
                            </div>
                          </div>

                          {/* Patient Stats */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Patient Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Total Visits</p>
                                <p className="text-lg font-bold text-primary">{selectedPatient.totalVisits}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-muted-foreground">Total Spent</p>
                                <p className="text-lg font-bold text-emerald-500">{formatCurrency(selectedPatient.totalSpent)}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <p className="text-xs text-muted-foreground">Registered</p>
                                <p className="text-sm font-medium text-cyan-500">{new Date(selectedPatient.registeredDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-xs text-muted-foreground">Last Visit</p>
                                <p className="text-sm font-medium text-amber-500">{new Date(selectedPatient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
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
                      {getPatientTreatments(selectedPatient.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No treatment history</p>
                        </div>
                      ) : (
                        getPatientTreatments(selectedPatient.id).map((treatment, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{treatment.service}</p>
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {treatment.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{treatment.dentist}</p>
                                <p className="text-sm text-muted-foreground mt-1">{treatment.notes}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{new Date(treatment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p className="font-semibold text-primary mt-1">{formatCurrency(treatment.cost)}</p>
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
                      {getPatientPrescriptions(selectedPatient.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No prescriptions</p>
                        </div>
                      ) : (
                        getPatientPrescriptions(selectedPatient.id).map((prescription, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-primary" />
                                  <p className="font-semibold">{prescription.medication}</p>
                                  <Badge variant="outline" className={cn("text-xs",
                                    prescription.status === 'active' 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-muted text-muted-foreground'
                                  )}>
                                    {prescription.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Dosage: {prescription.dosage}</p>
                                <p className="text-xs text-muted-foreground mt-1">Prescribed by: {prescription.prescribedBy}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{new Date(prescription.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Follow-ups Tab */}
                  {detailTab === 'followups' && (
                    <div className="space-y-3">
                      {getPatientFollowUps(selectedPatient.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No follow-up recommendations</p>
                        </div>
                      ) : (
                        getPatientFollowUps(selectedPatient.id).map((followUp, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{followUp.service}</p>
                                  <Badge variant="outline" className={cn("text-xs",
                                    followUp.status === 'scheduled' 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  )}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {followUp.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{followUp.dentist}</p>
                                <p className="text-sm text-muted-foreground mt-1">{followUp.notes}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{new Date(followUp.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(selectedPatient.totalSpent)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-sm text-muted-foreground">Total Transactions</p>
                          <p className="text-2xl font-bold text-emerald-500">{getPatientBilling(selectedPatient.id).length}</p>
                        </div>
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Transaction History</h4>
                        {getPatientBilling(selectedPatient.id).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No billing history</p>
                          </div>
                        ) : (
                          getPatientBilling(selectedPatient.id).map((bill, idx) => (
                            <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{bill.service}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-xs",
                                      bill.method === 'paymongo' 
                                        ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    )}>
                                      {bill.method === 'paymongo' ? 'PayMongo' : 'Cash'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(bill.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary">{formatCurrency(bill.amount)}</p>
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {bill.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
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
