import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  CalendarClock,
  Users,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Dummy Data
const appointmentStats = [
  { title: "Pending Requests", value: 24, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Approved Today", value: 18, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Rescheduled", value: 6, icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Cancelled", value: 3, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
];

const pendingAppointments = [
  { id: 1, patient: "Maria Santos", service: "Dental Cleaning", date: "2025-12-05", time: "09:00 AM", dentist: "Dr. Smith", type: "new", status: "pending" },
  { id: 2, patient: "Juan Dela Cruz", service: "Root Canal", date: "2025-12-05", time: "10:30 AM", dentist: "Dr. Johnson", type: "followup", status: "pending" },
  { id: 3, patient: "Ana Reyes", service: "Tooth Extraction", date: "2025-12-05", time: "02:00 PM", dentist: "Dr. Smith", type: "reschedule", status: "pending" },
  { id: 4, patient: "Pedro Garcia", service: "Dental Filling", date: "2025-12-06", time: "09:30 AM", dentist: "Dr. Lee", type: "new", status: "pending" },
  { id: 5, patient: "Sofia Martinez", service: "Orthodontic Consultation", date: "2025-12-06", time: "11:00 AM", dentist: "Dr. Johnson", type: "followup", status: "pending" },
  { id: 6, patient: "Carlos Mendoza", service: "Teeth Whitening", date: "2025-12-06", time: "03:00 PM", dentist: "Dr. Smith", type: "new", status: "pending" },
];

const completedAppointments = [
  { id: 101, patient: "Lisa Wong", service: "Dental Cleaning", date: "2025-12-02", time: "09:00 AM", dentist: "Dr. Smith", status: "completed" },
  { id: 102, patient: "Mark Rivera", service: "Check-up", date: "2025-12-02", time: "10:00 AM", dentist: "Dr. Johnson", status: "completed" },
  { id: 103, patient: "Emma Cruz", service: "Dental Filling", date: "2025-12-02", time: "02:00 PM", dentist: "Dr. Lee", status: "completed" },
];

const rescheduledAppointments = [
  { id: 201, patient: "David Tan", service: "Root Canal", originalDate: "2025-12-01", newDate: "2025-12-08", dentist: "Dr. Smith", reason: "Patient request" },
  { id: 202, patient: "Grace Lim", service: "Tooth Extraction", originalDate: "2025-12-02", newDate: "2025-12-10", dentist: "Dr. Johnson", reason: "Dentist unavailable" },
];

const cancelledAppointments = [
  { id: 301, patient: "Michael Sy", service: "Dental Cleaning", date: "2025-12-01", dentist: "Dr. Lee", reason: "No show", cancelledBy: "System" },
  { id: 302, patient: "Nicole Reyes", service: "Orthodontic Adjustment", date: "2025-12-02", dentist: "Dr. Johnson", reason: "Personal emergency", cancelledBy: "Patient" },
];

// Tab types
type TabType = 'pending' | 'completed' | 'rescheduled' | 'cancelled';

export default function AdminAppointments() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const openDetailModal = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
    setTimeout(() => setIsDetailOpen(true), 10);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedAppointment(null);
    }, 200);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'followup': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'reschedule': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredPendingAppointments = pendingAppointments.filter(apt => {
    const matchesSearch = apt.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || apt.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingAppointments.length, icon: Clock },
    { id: 'completed', label: 'Completed', count: completedAppointments.length, icon: CheckCircle2 },
    { id: 'rescheduled', label: 'Rescheduled', count: rescheduledAppointments.length, icon: RefreshCw },
    { id: 'cancelled', label: 'Cancelled', count: cancelledAppointments.length, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <CalendarClock className="w-8 h-8 text-primary" />
                Appointments Management
              </CardTitle>
              <p className="text-muted-foreground">
                Oversee all appointment-related activities within the system
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-4 h-4 mr-2" />
                {pendingAppointments.length} Pending Review
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {appointmentStats.map((stat, index) => (
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
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
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

      {/* Tabs & Content */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Search & Filter */}
            {activeTab === 'pending' && (
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="reschedule">Reschedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {filteredPendingAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending appointments found</p>
                </div>
              ) : (
                filteredPendingAppointments.map((apt, index) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{apt.patient}</p>
                            <Badge variant="outline" className={cn("text-xs", getTypeColor(apt.type))}>
                              {apt.type === 'new' ? 'New' : apt.type === 'followup' ? 'Follow-up' : 'Reschedule'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{apt.service}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.time}
                            </span>
                            <span>{apt.dentist}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto lg:ml-0">
                        <Button variant="outline" size="sm" onClick={() => openDetailModal(apt)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-blue-500">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <X className="w-4 h-4 mr-2" />
                              Decline
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div className="space-y-3">
              {completedAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold">{apt.patient}</p>
                        <p className="text-sm text-muted-foreground mt-1">{apt.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.time}
                          </span>
                          <span>{apt.dentist}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Completed
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Rescheduled Tab */}
          {activeTab === 'rescheduled' && (
            <div className="space-y-3">
              {rescheduledAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold">{apt.patient}</p>
                        <p className="text-sm text-muted-foreground mt-1">{apt.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-muted-foreground line-through">
                            {new Date(apt.originalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-blue-500 font-medium">
                            → {new Date(apt.newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-muted-foreground">{apt.dentist}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Reason: {apt.reason}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Rescheduled
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Cancelled Tab */}
          {activeTab === 'cancelled' && (
            <div className="space-y-3">
              {cancelledAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <XCircle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold">{apt.patient}</p>
                        <p className="text-sm text-muted-foreground mt-1">{apt.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span>{apt.dentist}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-destructive">Reason: {apt.reason}</span>
                          <span className="text-muted-foreground">• Cancelled by {apt.cancelledBy}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      Cancelled
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isDetailOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={closeDetailModal}
          />
          <div
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isDetailOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-lg overflow-hidden bg-card shadow-2xl m-4 border">
              {/* Modal Header */}
              <div className="bg-[#00a8a8] px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Appointment Details</h3>
                    <p className="text-xs text-white/70">Review appointment information</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="hover:bg-white/20 rounded p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedAppointment.patient}</p>
                    <Badge variant="outline" className={cn("text-xs", getTypeColor(selectedAppointment.type))}>
                      {selectedAppointment.type === 'new' ? 'New Appointment' : selectedAppointment.type === 'followup' ? 'Follow-up' : 'Reschedule Request'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="font-medium mt-1">{selectedAppointment.service}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Dentist</p>
                    <p className="font-medium mt-1">{selectedAppointment.dentist}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium mt-1">
                      {new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium mt-1">{selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-500 font-medium">Pending Approval</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This appointment is waiting for your review and approval.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={closeDetailModal}>
                  Close
                </Button>
                <Button variant="outline" className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
                <Button variant="destructive">
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
