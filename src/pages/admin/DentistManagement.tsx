import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Search,
  Filter,
  X,
  Calendar,
  Pill,
  Phone,
  Mail,
  User,
  ClipboardList,
  Clock,
  CheckCircle2,
  ChevronRight,
  Users,
  Star
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

// Dentist Data
const dentists = [
  {
    id: 'DEN-001',
    name: 'Dr. Michael Smith',
    email: 'michael.smith@medicare.com',
    phone: '+63 917 111 2222',
    specialization: 'General Dentistry',
    services: ['Dental Cleaning', 'Dental Filling', 'Tooth Extraction'],
    status: 'active',
    schedule: [
      { day: 'Monday', time: '9:00 AM - 5:00 PM' },
      { day: 'Tuesday', time: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', time: '9:00 AM - 12:00 PM' },
      { day: 'Friday', time: '9:00 AM - 5:00 PM' },
    ],
    totalPatients: 156,
    totalTreatments: 423,
    rating: 4.8,
    joinedDate: '2022-03-15'
  },
  {
    id: 'DEN-002',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@medicare.com',
    phone: '+63 918 222 3333',
    specialization: 'Endodontics',
    services: ['Root Canal', 'Pulpotomy', 'Apicoectomy'],
    status: 'active',
    schedule: [
      { day: 'Monday', time: '10:00 AM - 6:00 PM' },
      { day: 'Wednesday', time: '10:00 AM - 6:00 PM' },
      { day: 'Thursday', time: '10:00 AM - 6:00 PM' },
      { day: 'Saturday', time: '9:00 AM - 2:00 PM' },
    ],
    totalPatients: 98,
    totalTreatments: 287,
    rating: 4.9,
    joinedDate: '2021-08-20'
  },
  {
    id: 'DEN-003',
    name: 'Dr. James Lee',
    email: 'james.lee@medicare.com',
    phone: '+63 919 333 4444',
    specialization: 'Orthodontics',
    services: ['Braces', 'Retainers', 'Invisalign', 'Orthodontic Adjustment'],
    status: 'active',
    schedule: [
      { day: 'Tuesday', time: '8:00 AM - 4:00 PM' },
      { day: 'Thursday', time: '8:00 AM - 4:00 PM' },
      { day: 'Saturday', time: '8:00 AM - 12:00 PM' },
    ],
    totalPatients: 134,
    totalTreatments: 512,
    rating: 4.7,
    joinedDate: '2020-11-10'
  },
  {
    id: 'DEN-004',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@medicare.com',
    phone: '+63 920 444 5555',
    specialization: 'Cosmetic Dentistry',
    services: ['Teeth Whitening', 'Veneers', 'Dental Bonding'],
    status: 'on-leave',
    schedule: [
      { day: 'Monday', time: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', time: '9:00 AM - 5:00 PM' },
      { day: 'Friday', time: '9:00 AM - 5:00 PM' },
    ],
    totalPatients: 87,
    totalTreatments: 198,
    rating: 4.9,
    joinedDate: '2023-01-05'
  },
  {
    id: 'DEN-005',
    name: 'Dr. Robert Garcia',
    email: 'robert.garcia@medicare.com',
    phone: '+63 921 555 6666',
    specialization: 'Prosthodontics',
    services: ['Crowns', 'Bridges', 'Dentures', 'Dental Implants'],
    status: 'active',
    schedule: [
      { day: 'Monday', time: '8:00 AM - 4:00 PM' },
      { day: 'Tuesday', time: '8:00 AM - 4:00 PM' },
      { day: 'Thursday', time: '8:00 AM - 4:00 PM' },
      { day: 'Friday', time: '8:00 AM - 12:00 PM' },
    ],
    totalPatients: 112,
    totalTreatments: 345,
    rating: 4.6,
    joinedDate: '2021-05-18'
  },
];

// Assigned Patients
const assignedPatients = [
  { id: 1, dentistId: 'DEN-001', patientName: 'Maria Santos', patientId: 'PAT-001', lastVisit: '2025-11-28', nextAppointment: '2025-12-28', status: 'active' },
  { id: 2, dentistId: 'DEN-001', patientName: 'Juan Dela Cruz', patientId: 'PAT-002', lastVisit: '2025-12-01', nextAppointment: '2026-01-15', status: 'active' },
  { id: 3, dentistId: 'DEN-001', patientName: 'Sofia Martinez', patientId: 'PAT-005', lastVisit: '2025-12-02', nextAppointment: null, status: 'completed' },
  { id: 4, dentistId: 'DEN-002', patientName: 'Ana Reyes', patientId: 'PAT-003', lastVisit: '2025-11-15', nextAppointment: '2025-12-20', status: 'active' },
  { id: 5, dentistId: 'DEN-002', patientName: 'Pedro Garcia', patientId: 'PAT-004', lastVisit: '2025-10-20', nextAppointment: null, status: 'inactive' },
  { id: 6, dentistId: 'DEN-003', patientName: 'Maria Santos', patientId: 'PAT-001', lastVisit: '2025-09-10', nextAppointment: '2026-03-10', status: 'active' },
];

// Treatment Logs
const treatmentLogs = [
  { id: 1, dentistId: 'DEN-001', patientName: 'Maria Santos', service: 'Dental Cleaning', date: '2025-11-28', notes: 'Regular cleaning completed. No issues found. Recommended flossing twice daily.', status: 'completed', cost: 2500 },
  { id: 2, dentistId: 'DEN-001', patientName: 'Juan Dela Cruz', service: 'Dental Filling', date: '2025-12-01', notes: 'Composite filling on tooth #14. Patient tolerated procedure well.', status: 'completed', cost: 3500 },
  { id: 3, dentistId: 'DEN-001', patientName: 'Sofia Martinez', service: 'Tooth Extraction', date: '2025-12-02', notes: 'Extracted tooth #38. Prescribed antibiotics and pain medication.', status: 'completed', cost: 2000 },
  { id: 4, dentistId: 'DEN-002', patientName: 'Ana Reyes', service: 'Root Canal', date: '2025-11-15', notes: 'Root canal treatment on tooth #36. Two more sessions needed.', status: 'in-progress', cost: 8500 },
  { id: 5, dentistId: 'DEN-002', patientName: 'Pedro Garcia', service: 'Root Canal', date: '2025-10-20', notes: 'Completed root canal treatment. Crown placement scheduled.', status: 'completed', cost: 8500 },
  { id: 6, dentistId: 'DEN-003', patientName: 'Maria Santos', service: 'Orthodontic Adjustment', date: '2025-09-10', notes: 'Monthly braces adjustment. Good progress noted.', status: 'completed', cost: 1500 },
];

// Prescriptions
const prescriptions = [
  { id: 1, dentistId: 'DEN-001', patientName: 'Sofia Martinez', medication: 'Amoxicillin 500mg', dosage: '3x daily for 7 days', date: '2025-12-02', reason: 'Post-extraction antibiotic' },
  { id: 2, dentistId: 'DEN-001', patientName: 'Sofia Martinez', medication: 'Mefenamic Acid 500mg', dosage: 'Every 8 hours as needed', date: '2025-12-02', reason: 'Pain management' },
  { id: 3, dentistId: 'DEN-002', patientName: 'Ana Reyes', medication: 'Ibuprofen 400mg', dosage: 'Every 6 hours as needed', date: '2025-11-15', reason: 'Post-procedure pain' },
  { id: 4, dentistId: 'DEN-001', patientName: 'Maria Santos', medication: 'Chlorhexidine Mouthwash', dosage: 'Twice daily for 2 weeks', date: '2025-11-28', reason: 'Gum health maintenance' },
];

// Follow-up Recommendations
const followUps = [
  { id: 1, dentistId: 'DEN-001', patientName: 'Maria Santos', service: 'Dental Cleaning', recommendedDate: '2026-05-28', notes: '6-month regular checkup', priority: 'routine' },
  { id: 2, dentistId: 'DEN-001', patientName: 'Sofia Martinez', service: 'Post-Extraction Checkup', recommendedDate: '2025-12-09', notes: 'Check healing progress after extraction', priority: 'high' },
  { id: 3, dentistId: 'DEN-002', patientName: 'Ana Reyes', service: 'Root Canal Continuation', recommendedDate: '2025-12-20', notes: 'Second session of root canal treatment', priority: 'high' },
  { id: 4, dentistId: 'DEN-002', patientName: 'Pedro Garcia', service: 'Crown Placement', recommendedDate: '2025-12-15', notes: 'Install permanent crown after root canal', priority: 'medium' },
  { id: 5, dentistId: 'DEN-003', patientName: 'Maria Santos', service: 'Orthodontic Adjustment', recommendedDate: '2025-12-10', notes: 'Monthly braces adjustment', priority: 'routine' },
];

// Stats
const dentistStats = [
  { title: 'Total Dentists', value: '5', icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Active Dentists', value: '4', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'Total Treatments', value: '1,765', icon: ClipboardList, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { title: 'Patients Served', value: '587', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

type DetailTab = 'overview' | 'patients' | 'treatments' | 'prescriptions' | 'followups';

export default function DentistManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<typeof dentists[0] | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  const openDetailModal = (dentist: typeof dentists[0]) => {
    setSelectedDentist(dentist);
    setDetailTab('overview');
    setShowDetailModal(true);
    setTimeout(() => setIsDetailOpen(true), 10);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedDentist(null);
    }, 200);
  };

  const filteredDentists = dentists.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSpec = specializationFilter === 'all' || d.specialization === specializationFilter;
    return matchesSearch && matchesStatus && matchesSpec;
  });

  const getDentistPatients = (dentistId: string) => assignedPatients.filter(p => p.dentistId === dentistId);
  const getDentistTreatments = (dentistId: string) => treatmentLogs.filter(t => t.dentistId === dentistId);
  const getDentistPrescriptions = (dentistId: string) => prescriptions.filter(p => p.dentistId === dentistId);
  const getDentistFollowUps = (dentistId: string) => followUps.filter(f => f.dentistId === dentistId);

  const specializations = [...new Set(dentists.map(d => d.specialization))];

  const detailTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'treatments', label: 'Treatments', icon: ClipboardList },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'followups', label: 'Follow-ups', icon: Calendar },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Stethoscope className="w-8 h-8 text-primary" />
                Dentist Management
              </CardTitle>
              <p className="text-muted-foreground">
                View dentist profiles, schedules, and treatment records
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dentistStats.map((stat, index) => (
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

      {/* Dentist List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-lg">All Dentists</CardTitle>
              <CardDescription>Click on a dentist to view full details</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search dentists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDentists.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No dentists found</p>
              </div>
            ) : (
              filteredDentists.map((dentist, index) => (
                <motion.div
                  key={dentist.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openDetailModal(dentist)}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold",
                        dentist.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        {dentist.name.split(' ').slice(1).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold group-hover:text-primary transition-colors">{dentist.name}</p>
                          <Badge variant="outline" className={cn("text-xs",
                            dentist.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          )}>
                            {dentist.status === 'active' ? 'Active' : 'On Leave'}
                          </Badge>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span className="text-xs font-medium">{dentist.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{dentist.specialization}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {dentist.totalPatients} patients
                          </span>
                          <span className="flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            {dentist.totalTreatments} treatments
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1">
                        {dentist.services.slice(0, 2).map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-muted">
                            {service}
                          </Badge>
                        ))}
                        {dentist.services.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-muted">
                            +{dentist.services.length - 2}
                          </Badge>
                        )}
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
      {showDetailModal && selectedDentist && (
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
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                    {selectedDentist.name.split(' ').slice(1).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDentist.name}</h3>
                    <p className="text-sm text-white/70">{selectedDentist.specialization}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="hover:bg-white/20 rounded p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b bg-muted/30 px-4 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto py-2">
                  {detailTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={detailTab === tab.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDetailTab(tab.id as DetailTab)}
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
                      {/* Contact Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{selectedDentist.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium">{selectedDentist.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Linked Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedDentist.services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Schedule</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedDentist.schedule.map((sched, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <Calendar className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{sched.day}</p>
                                <p className="text-xs text-muted-foreground">{sched.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Performance Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-muted-foreground">Total Patients</p>
                            <p className="text-lg font-bold text-primary">{selectedDentist.totalPatients}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            <p className="text-xs text-muted-foreground">Total Treatments</p>
                            <p className="text-lg font-bold text-cyan-500">{selectedDentist.totalTreatments}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              <p className="text-lg font-bold text-amber-500">{selectedDentist.rating}</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-muted-foreground">Since</p>
                            <p className="text-sm font-bold text-emerald-500">{new Date(selectedDentist.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patients Tab */}
                  {detailTab === 'patients' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">Assigned & Treated Patients</h4>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {getDentistPatients(selectedDentist.id).length} patients
                        </Badge>
                      </div>
                      {getDentistPatients(selectedDentist.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No patients assigned</p>
                        </div>
                      ) : (
                        getDentistPatients(selectedDentist.id).map((patient, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                  {patient.patientName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-semibold">{patient.patientName}</p>
                                  <p className="text-xs text-muted-foreground">{patient.patientId}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className={cn("text-xs",
                                  patient.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : patient.status === 'completed'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  {patient.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last: {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                {patient.nextAppointment && (
                                  <p className="text-xs text-primary">
                                    Next: {new Date(patient.nextAppointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Treatments Tab */}
                  {detailTab === 'treatments' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">Treatment Logs</h4>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500">
                          {getDentistTreatments(selectedDentist.id).length} treatments
                        </Badge>
                      </div>
                      {getDentistTreatments(selectedDentist.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No treatment logs</p>
                        </div>
                      ) : (
                        getDentistTreatments(selectedDentist.id).map((treatment, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold">{treatment.service}</p>
                                  <Badge variant="outline" className={cn("text-xs",
                                    treatment.status === 'completed' 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  )}>
                                    {treatment.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                    {treatment.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Patient: {treatment.patientName}</p>
                                <p className="text-sm text-muted-foreground mt-1">{treatment.notes}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm text-muted-foreground">
                                  {new Date(treatment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
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
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">Prescriptions Issued</h4>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                          {getDentistPrescriptions(selectedDentist.id).length} prescriptions
                        </Badge>
                      </div>
                      {getDentistPrescriptions(selectedDentist.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No prescriptions</p>
                        </div>
                      ) : (
                        getDentistPrescriptions(selectedDentist.id).map((prescription, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-purple-500" />
                                  <p className="font-semibold">{prescription.medication}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Patient: {prescription.patientName}</p>
                                <p className="text-sm mt-1">Dosage: {prescription.dosage}</p>
                                <p className="text-xs text-muted-foreground mt-1">Reason: {prescription.reason}</p>
                              </div>
                              <p className="text-sm text-muted-foreground shrink-0">
                                {new Date(prescription.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Follow-ups Tab */}
                  {detailTab === 'followups' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">Follow-up Recommendations</h4>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                          {getDentistFollowUps(selectedDentist.id).length} follow-ups
                        </Badge>
                      </div>
                      {getDentistFollowUps(selectedDentist.id).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No follow-up recommendations</p>
                        </div>
                      ) : (
                        getDentistFollowUps(selectedDentist.id).map((followUp, idx) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold">{followUp.service}</p>
                                  <Badge variant="outline" className={cn("text-xs", getPriorityColor(followUp.priority))}>
                                    {followUp.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Patient: {followUp.patientName}</p>
                                <p className="text-sm text-muted-foreground mt-1">{followUp.notes}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">Recommended</p>
                                <p className="text-sm font-medium text-primary">
                                  {new Date(followUp.recommendedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
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
