import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Edit,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
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
import { cn } from "@/lib/utils";
import {
  usePatientRecordsStats,
  useAllPatients,
  usePatientDetails,
  usePatientTreatments,
  useUpdatePatient,
} from '@/hooks/use-patient-records';
import type { PatientInfo } from '@/types/patient';

type DetailTab = 'overview' | 'treatments';

export default function PatientRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<PatientInfo | null>(null);

  // Fetch data using hooks
  const { data: stats } = usePatientRecordsStats();
  const { data: patients = [], isLoading: patientsLoading } = useAllPatients();
  const { data: patientDetails } = usePatientDetails(selectedPatient?.patientId ?? null);
  const { data: treatments = [], isLoading: treatmentsLoading } = usePatientTreatments(selectedPatient?.patientId ?? null);
  const updatePatientMutation = useUpdatePatient();

  // Stats for display
  const patientStats = useMemo(() => [
    { title: 'Total Patients', value: stats?.totalPatients?.toLocaleString() ?? '0', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active Patients', value: stats?.activePatients?.toLocaleString() ?? '0', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'New This Month', value: stats?.newThisMonth?.toLocaleString() ?? '0', icon: User, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { title: 'Visits This Month', value: stats?.visitsThisMonth?.toLocaleString() ?? '0', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ], [stats]);

  const openDetailModal = (patient: PatientInfo) => {
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

  const handleSaveChanges = async () => {
    if (!editData || !selectedPatient) return;
    
    try {
      await updatePatientMutation.mutateAsync({
        patientId: selectedPatient.patientId,
        data: {
          f_name: editData.firstName,
          l_name: editData.lastName,
          m_name: editData.middleName ?? undefined,
          suffix: editData.suffix ?? undefined,
          email: editData.email ?? undefined,
          pri_contact_no: editData.phone ?? undefined,
          address: editData.address ?? undefined,
          birthdate: editData.birthDate ?? undefined,
          gender: editData.gender ?? undefined,
          blood_type: editData.bloodType ?? undefined,
        },
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone?.includes(searchQuery) ?? false);
      const matchesStatus = statusFilter === 'all' || p.accountStatus.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return 'N/A';
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
          {patientsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                        patient.accountStatus === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold group-hover:text-primary transition-colors">{patient.name}</p>
                          <Badge variant="outline" className={cn("text-xs",
                            patient.accountStatus === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {patient.accountStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{patient.id} • {patient.email ?? 'No email'}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone ?? 'No phone'}
                          </span>
                          {patient.lastVisit && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last visit: {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{patient.totalVisits} visits</p>
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
                              <label className="text-sm text-muted-foreground">First Name</label>
                              <Input
                                value={editData.firstName}
                                onChange={(e) => setEditData({ ...editData, firstName: e.target.value, name: `${e.target.value} ${editData.lastName}` })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Last Name</label>
                              <Input
                                value={editData.lastName}
                                onChange={(e) => setEditData({ ...editData, lastName: e.target.value, name: `${editData.firstName} ${e.target.value}` })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Email</label>
                              <Input
                                value={editData.email ?? ''}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Phone</label>
                              <Input
                                value={editData.phone ?? ''}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Birth Date</label>
                              <Input
                                type="date"
                                value={editData.birthDate ?? ''}
                                onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Gender</label>
                              <Select value={editData.gender ?? ''} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
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
                              <Select value={editData.bloodType ?? ''} onValueChange={(v) => setEditData({ ...editData, bloodType: v })}>
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
                                value={editData.address ?? ''}
                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button 
                              onClick={handleSaveChanges} 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={updatePatientMutation.isPending}
                            >
                              {updatePatientMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
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
                                  <p className="text-sm font-medium">{selectedPatient.email ?? 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-sm font-medium">{selectedPatient.phone ?? 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Address</p>
                                  <p className="text-sm font-medium">{selectedPatient.address ?? 'Not provided'}</p>
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
                                <p className="text-sm font-medium">{selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Age</p>
                                <p className="text-sm font-medium">{calculateAge(selectedPatient.birthDate)} years</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Gender</p>
                                <p className="text-sm font-medium">{selectedPatient.gender ?? 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Blood Type</p>
                                <p className="text-sm font-medium">{selectedPatient.bloodType ?? 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Medical Info */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Medical Information</h4>
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Allergies</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {(patientDetails?.allergies ?? selectedPatient.allergies).length > 0 ? (
                                    (patientDetails?.allergies ?? selectedPatient.allergies).map((allergy, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {allergy.allergy_name}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No known allergies</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                                {patientDetails?.emergencyContact ? (
                                  <p className="text-sm font-medium">
                                    {patientDetails.emergencyContact.ec_f_name} {patientDetails.emergencyContact.ec_l_name} 
                                    {' '}({patientDetails.emergencyContact.ec_relationship}) - {patientDetails.emergencyContact.ec_contact_no}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Not provided</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Patient Stats */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Patient Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Total Visits</p>
                                <p className="text-lg font-bold text-primary">{selectedPatient.totalVisits}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                <p className="text-xs text-muted-foreground">Registered</p>
                                <p className="text-sm font-medium text-cyan-500">{selectedPatient.registeredDate ? new Date(selectedPatient.registeredDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-xs text-muted-foreground">Last Visit</p>
                                <p className="text-sm font-medium text-amber-500">{selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</p>
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
                      {treatmentsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : treatments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No treatment history</p>
                        </div>
                      ) : (
                        treatments.map((treatment, idx) => (
                          <div key={treatment.id ?? idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
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
                                {treatment.notes && <p className="text-sm text-muted-foreground mt-1">{treatment.notes}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{new Date(treatment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
