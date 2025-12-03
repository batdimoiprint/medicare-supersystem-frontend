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
  ChevronDown,
  Loader2,
  Save
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
import {
  useAdminAppointmentStats,
  useAdminPendingAppointments,
  useAdminCompletedAppointments,
  useAdminRescheduledAppointments,
  useAdminCancelledAppointments,
  useApproveAppointment,
  useDeclineAppointment,
  useRescheduleAppointmentAdmin,
} from "@/hooks/use-admin-appointments";
import type {
  AdminPendingAppointment,
} from "@/types/frontdesk";

// Tab types
type TabType = 'pending' | 'completed' | 'rescheduled' | 'cancelled';

export default function AdminAppointments() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AdminPendingAppointment | null>(null);
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data from API
  const { data: stats } = useAdminAppointmentStats();
  const { data: pendingAppointments = [], isLoading: pendingLoading } = useAdminPendingAppointments();
  const { data: completedAppointments = [], isLoading: completedLoading } = useAdminCompletedAppointments();
  const { data: rescheduledAppointments = [], isLoading: rescheduledLoading } = useAdminRescheduledAppointments();
  const { data: cancelledAppointments = [], isLoading: cancelledLoading } = useAdminCancelledAppointments();

  // Mutations
  const approveMutation = useApproveAppointment();
  const declineMutation = useDeclineAppointment();
  const rescheduleMutation = useRescheduleAppointmentAdmin();

  // Stats for the cards
  const appointmentStats = [
    { title: "Pending Requests", value: stats?.pendingRequests ?? 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Approved Today", value: stats?.approvedToday ?? 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Rescheduled", value: stats?.rescheduledCount ?? 0, icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Cancelled", value: stats?.cancelledCount ?? 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const openDetailModal = (appointment: AdminPendingAppointment) => {
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

  const openRescheduleModal = (appointment: AdminPendingAppointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.date || '');
    setRescheduleTime(appointment.time || '');
    setRescheduleReason('');
    setShowRescheduleModal(true);
    setTimeout(() => setIsRescheduleOpen(true), 10);
  };

  const closeRescheduleModal = () => {
    setIsRescheduleOpen(false);
    setTimeout(() => {
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
    }, 200);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000); // Auto-hide after 4 seconds
  };

  const handleApprove = async (appointmentId: number) => {
    try {
      await approveMutation.mutateAsync(appointmentId);
      closeDetailModal();
      showSuccess('Appointment approved successfully!');
    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
  };

  const handleDecline = async (appointmentId: number) => {
    try {
      await declineMutation.mutateAsync({ appointmentId, reason: 'Declined by admin' });
      closeDetailModal();
      showSuccess('Appointment declined successfully!');
    } catch (error) {
      console.error('Failed to decline appointment:', error);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate) return;
    
    try {
      await rescheduleMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        newDate: rescheduleDate,
        newTime: rescheduleTime || null,
        reason: rescheduleReason || undefined,
      });
      closeRescheduleModal();
      closeDetailModal();
      showSuccess('Appointment rescheduled successfully!');
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    }
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

  const isLoading = activeTab === 'pending' ? pendingLoading :
    activeTab === 'completed' ? completedLoading :
    activeTab === 'rescheduled' ? rescheduledLoading :
    cancelledLoading;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 hover:bg-white/20 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

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
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
              <p>Loading appointments...</p>
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && !isLoading && (
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
                              {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                            </span>
                            {apt.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </span>
                            )}
                            <span>{apt.dentist}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto lg:ml-0">
                        <Button variant="outline" size="sm" onClick={() => openDetailModal(apt)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(apt.id)}
                          disabled={approveMutation.isPending}
                        >
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
                            <DropdownMenuItem 
                              className="text-blue-500"
                              onClick={() => openRescheduleModal(apt)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDecline(apt.id)}
                            >
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
          {activeTab === 'completed' && !isLoading && (
            <div className="space-y-3">
              {completedAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No completed appointments found</p>
                </div>
              ) : (
                completedAppointments.map((apt, index) => (
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
                              {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                            </span>
                            {apt.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </span>
                            )}
                            <span>{apt.dentist}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Completed
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Rescheduled Tab */}
          {activeTab === 'rescheduled' && !isLoading && (
            <div className="space-y-3">
              {rescheduledAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rescheduled appointments found</p>
                </div>
              ) : (
                rescheduledAppointments.map((apt, index) => (
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
                            {apt.originalDate && (
                              <span className="text-muted-foreground line-through">
                                {new Date(apt.originalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <span className="text-blue-500 font-medium">
                              → {apt.newDate ? new Date(apt.newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                            </span>
                            <span className="text-muted-foreground">{apt.dentist}</span>
                          </div>
                          {apt.reason && (
                            <p className="text-xs text-muted-foreground mt-1">Reason: {apt.reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Rescheduled
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Cancelled Tab */}
          {activeTab === 'cancelled' && !isLoading && (
            <div className="space-y-3">
              {cancelledAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No cancelled appointments found</p>
                </div>
              ) : (
                cancelledAppointments.map((apt, index) => (
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
                              {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                            </span>
                            <span>{apt.dentist}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {apt.reason && <span className="text-destructive">Reason: {apt.reason}</span>}
                            <span className="text-muted-foreground">• Cancelled by {apt.cancelledBy}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        Cancelled
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
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
                      {selectedAppointment.date 
                        ? new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                        : 'No date set'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium mt-1">{selectedAppointment.time ?? 'No time set'}</p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium mt-1">{selectedAppointment.notes}</p>
                  </div>
                )}

                {selectedAppointment.reservationFee && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Reservation Fee</p>
                    <p className="font-medium mt-1">₱{selectedAppointment.reservationFee.toFixed(2)}</p>
                  </div>
                )}

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
                <Button 
                  variant="outline" 
                  className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                  onClick={() => {
                    closeDetailModal();
                    setTimeout(() => openRescheduleModal(selectedAppointment), 250);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleDecline(selectedAppointment.id)}
                  disabled={declineMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(selectedAppointment.id)}
                  disabled={approveMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isRescheduleOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={closeRescheduleModal}
          />
          <div
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isRescheduleOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-lg overflow-hidden bg-card shadow-2xl m-4 border">
              {/* Modal Header */}
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
                    <p className="text-xs text-white/70">Update date and time</p>
                  </div>
                </div>
                <button
                  onClick={closeRescheduleModal}
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
                    <p className="text-sm text-muted-foreground">{selectedAppointment.service}</p>
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
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      New Date <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      New Time
                    </label>
                    <Input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Reason for Rescheduling
                    </label>
                    <Input
                      type="text"
                      placeholder="Optional: Enter reason..."
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <p className="text-sm text-blue-500 font-medium">Rescheduling</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Original: {selectedAppointment.date 
                      ? new Date(selectedAppointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No date'} {selectedAppointment.time ?? ''}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={closeRescheduleModal}>
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleReschedule}
                  disabled={rescheduleMutation.isPending || !rescheduleDate}
                >
                  {rescheduleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
