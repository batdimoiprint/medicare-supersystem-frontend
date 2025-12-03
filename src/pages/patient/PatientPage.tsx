import BlurText from '@/components/ui/BlurText';
import {
    Calendar,
    Clock,
    CreditCard,
    FileText,
    Pill,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    User,
    CalendarClock,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import BookAppointmentModal from '@/components/patient/BookAppointmentModal';
import RescheduleAppointmentModal from '@/components/patient/RescheduleAppointmentModal';
import AppointmentCalendarModal from '@/components/patient/AppointmentCalendarModal';
import { useState, useEffect, useMemo } from 'react';
import supabase from '@/utils/supabase';
import { useAuth } from '@/context/userContext';

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Confirmed: "bg-green-100 text-green-700 border-green-200",
        Completed: "bg-blue-100 text-blue-700 border-blue-200",
        Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        Paid: "bg-green-100 text-green-700 border-green-200",
        Cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
        </span>
    );
};

export default function PatientPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentPatient, setCurrentPatient] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [upcomingStatusFilter, setUpcomingStatusFilter] = useState<string>("All");
    const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("All");

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                if (!user) {
                    navigate('/login');
                    return;
                }
                const { data: patientData, error: patientError } = await supabase
                    .schema('patient_record')
                    .from('patient_tbl')
                    .select('patient_id, email, f_name, l_name, pri_contact_no, house_no, street, barangay, city, account_status')
                    .eq('patient_id', user.id)
                    .single();
                if (patientError) return;
                setCurrentPatient(patientData);
                await fetchAppointments(patientData.patient_id);
                await fetchAppointmentHistory(patientData.patient_id);
                await fetchPrescriptions(patientData.patient_id);
                await fetchPayments(patientData.patient_id);
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAppointments = async (patientId: string) => {
            try {
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .schema('frontdesk')
                    .from('appointment_tbl')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('appointment_date', { ascending: true });
                if (appointmentsError) throw appointmentsError;
                const { data: servicesData, error: servicesError } = await supabase
                    .schema('dentist')
                    .from('services_tbl')
                    .select('service_id, service_name');
                if (servicesError) throw servicesError;
                const { data: personnelData, error: personnelError } = await supabase
                    .schema('public')
                    .from('personnel_tbl')
                    .select('personnel_id, f_name, l_name');
                if (personnelError) throw personnelError;
                const servicesMap = servicesData.reduce((acc: Record<string, string>, service: { service_id: string; service_name: string }) => {
                    acc[service.service_id] = service.service_name;
                    return acc;
                }, {} as Record<string, string>);
                const personnelMap = personnelData.reduce((acc: Record<string, string>, person: { personnel_id: string; f_name: string; l_name: string }) => {
                    acc[person.personnel_id] = `${person.f_name} ${person.l_name}`;
                    return acc;
                }, {} as Record<string, string>);
                const appointmentsWithServiceNames = appointmentsData.map((apt: { service_id: string; personnel_id?: string }) => ({
                    ...apt,
                    service_name: servicesMap[apt.service_id] || 'Dental Service',
                    personnel_name: apt.personnel_id ? personnelMap[apt.personnel_id] : null
                }));
                setAppointments(appointmentsWithServiceNames);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                setAppointments([]);
            }
        };

        const fetchAppointmentHistory = async (patientId: string) => {
            try {
                const { data: historyData, error: historyError } = await supabase
                    .schema('patient_record')
                    .from('appointment_history_tbl')
                    .select(`
                        appointment_history_id,
                        patient_id,
                        appointment_id,
                        appointment_tbl (
                            appointment_date,
                            appointment_time,
                            appointment_status_id,
                            service_id,
                            personnel_id,
                            services_tbl(service_name, service_fee),
                            personnel_tbl(first_name, last_name, specialization)
                        )
                    `)
                    .eq('patient_id', patientId)
                    .order('appointment_history_id', { ascending: false });
                if (historyError) {
                    setAppointmentHistory([]);
                } else {
                    setAppointmentHistory(historyData || []);
                }
            } catch (error) {
                setAppointmentHistory([]);
            }
        };

        const fetchPrescriptions = async (patientId: string) => {
            try {
                const { data: emrData, error: emrError } = await supabase
                    .schema('patient_record')
                    .from('emr_records')
                    .select(`
                        id,
                        patient_id,
                        date,
                        time,
                        chief_complaint,
                        diagnosis,
                        treatment,
                        notes,
                        dentist,
                        status
                    `)
                    .eq('patient_id', patientId)
                    .not('diagnosis', 'is', null)
                    .eq('status', 'Active')
                    .order('date', { ascending: false });
                if (emrError) throw emrError;
                if (!emrData || emrData.length === 0) {
                    setPrescriptions([]);
                    return;
                }
                const treatmentIds = emrData
                    .map(record => record.treatment)
                    .filter((id): id is number => id !== null && id !== undefined);
                let servicesMap: Record<number, string> = {};
                if (treatmentIds.length > 0) {
                    const { data: servicesData, error: servicesError } = await supabase
                        .schema('dentist')
                        .from('services_tbl')
                        .select('service_id, service_name')
                        .in('service_id', treatmentIds);
                    if (!servicesError && servicesData) {
                        servicesMap = servicesData.reduce((acc, service) => {
                            acc[service.service_id] = service.service_name;
                            return acc;
                        }, {} as Record<number, string>);
                    }
                }
                const prescriptions = emrData.map(record => ({
                    prescription_id: record.id,
                    medication: servicesMap[record.treatment!] || record.diagnosis || 'Medical Treatment',
                    dosage: 'As prescribed',
                    instructions: record.notes || (record.chief_complaint ? `For: ${record.chief_complaint}` : 'Take as directed'),
                    created_at: record.date,
                    status: record.status
                }));
                setPrescriptions(prescriptions);
            } catch (error) {
                setPrescriptions([]);
            }
        };

        const fetchPayments = async (patientId: string) => {
            try {
                const { data: paymentsData, error: paymentsError } = await supabase
                    .schema('frontdesk')
                    .from('billing_tbl')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (paymentsError) {
                    setPayments([]);
                } else {
                    setPayments(paymentsData || []);
                }
            } catch (error) {
                setPayments([]);
            }
        };

        fetchPatientData();
    }, [navigate, user]);

    const formatTimeToAMPM = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
    };

    const calculateRemainingDays = (createdAt: string) => {
        if (!createdAt) return 'As needed';
        const created = new Date(createdAt);
        const today = new Date();
        const diffTime = today.getTime() - created.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 30 - diffDays;
        if (remaining <= 0) return 'Expired';
        if (remaining === 1) return '1 day left';
        return `${remaining} days left`;
    };

    const getAppointmentStatus = (statusId: number) => {
        const statusMap: Record<number, string> = {
            1: 'Pending',
            2: 'Confirmed',
            3: 'Completed',
            4: 'Cancelled'
        };
        return statusMap[statusId] || 'Pending';
    };

    const getPaymentStatus = (statusId: number) => {
        const statusMap: Record<number, string> = {
            1: 'Pending',
            2: 'Paid',
            3: 'Overdue'
        };
        return statusMap[statusId] || 'Pending';
    };

    const transformedAppointments = useMemo(() => {
        if (!appointments || appointments.length === 0) return [];
        return appointments.map(apt => {
            const appointmentDate = apt.appointment_date;
            const isUpcoming = new Date(appointmentDate) >= new Date();
            return {
                id: apt.appointment_id,
                treatment: apt.service_name || 'Dental Service',
                doctor: apt.personnel_name ? `Dr. ${apt.personnel_name}` : 'No assigned Dentist',
                date: appointmentDate,
                time: formatTimeToAMPM(apt.appointment_time),
                location: "Clinic Room",
                status: getAppointmentStatus(apt.appointment_status_id),
                type: isUpcoming ? 'upcoming' : 'history',
                rawData: apt
            };
        });
    }, [appointments]);

    const transformedAppointmentHistory = useMemo(() => {
        if (!appointmentHistory || appointmentHistory.length === 0) return [];
        return appointmentHistory.map(history => {
            const apt = history.appointment_tbl;
            if (!apt) return null;
            const serviceName = apt.services_tbl?.service_name || 'Dental Service';
            const personnel = apt.personnel_tbl;
            const doctorName = personnel
                ? `Dr. ${personnel.first_name || ''} ${personnel.last_name || ''}`.trim()
                : 'Dentist';
            return {
                id: history.appointment_history_id,
                appointmentId: history.appointment_id,
                treatment: serviceName,
                doctor: doctorName,
                date: apt.appointment_date,
                time: formatTimeToAMPM(apt.appointment_time),
                location: "Clinic Room",
                status: getAppointmentStatus(apt.appointment_status_id),
                type: 'history'
            };
        }).filter(Boolean);
    }, [appointmentHistory]);

    const transformedPrescriptions = useMemo(() => {
        return prescriptions.map(rx => ({
            id: rx.prescription_id,
            medication: 'Medication',
            dosage: rx.dosage || 'N/A',
            instructions: rx.instructions || 'Take as directed',
            remaining: calculateRemainingDays(rx.created_at)
        }));
    }, [prescriptions]);

    const transformedPayments = useMemo(() => {
        return payments.map(payment => ({
            id: `INV-${payment.bill_id}`,
            description: 'Dental Service',
            date: formatDate(payment.created_at),
            amount: payment.total_amount || 0,
            status: getPaymentStatus(payment.payment_status_id)
        }));
    }, [payments]);

    const outstandingBalance = useMemo(() => {
        return payments
            .filter(payment => getPaymentStatus(payment.payment_status_id) === 'Pending')
            .reduce((total, payment) => total + (payment.total_amount || 0), 0);
    }, [payments]);

    const upcomingAppointments = useMemo(() => {
        return transformedAppointments
            .filter(a => a.type === 'upcoming')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transformedAppointments]);

    const pastAppointments = useMemo(() => {
        const currentHistory = transformedAppointments.filter(a => a.type === 'history');
        return [...currentHistory, ...transformedAppointmentHistory]
            .filter((apt): apt is NonNullable<typeof apt> => apt !== null)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transformedAppointments, transformedAppointmentHistory]);

    const nextVisit = useMemo(() => {
        return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    }, [upcomingAppointments]);

    const handleRescheduleClick = (apt: any) => {
        setSelectedAppointment(apt);
        setIsRescheduleModalOpen(true);
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get first 5 items for display
    const displayUpcomingAppointments = useMemo(() => {
        return upcomingAppointments.slice(0, 5);
    }, [upcomingAppointments]);

    const displayPastAppointments = useMemo(() => {
        return pastAppointments.slice(0, 5);
    }, [pastAppointments]);

    const filteredUpcomingAppointments = useMemo(() => {
        if (upcomingStatusFilter === "All") return displayUpcomingAppointments;
        return displayUpcomingAppointments.filter(apt => apt.status === upcomingStatusFilter);
    }, [displayUpcomingAppointments, upcomingStatusFilter]);

    const filteredHistoryAppointments = useMemo(() => {
        if (historyStatusFilter === "All") return displayPastAppointments;
        return displayPastAppointments.filter(apt => apt.status === historyStatusFilter);
    }, [displayPastAppointments, historyStatusFilter]);

    const displayPrescriptions = useMemo(() => {
        return transformedPrescriptions.slice(0, 5);
    }, [transformedPrescriptions]);

    const hasMorePrescriptions = transformedPrescriptions.length > 5;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading patient data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 p-4 md:p-6 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground text-sm">Overview</span>
                    </div>
                    <BlurText
                        text={`Welcome back, ${currentPatient ? `${currentPatient.f_name} ${currentPatient.l_name}` : 'Loading...'}`}
                        delay={100}
                        className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
                    />
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Here's what's happening with your dental health today.
                    </p>
                </div>
                <Button
                    size="lg"
                    className="shadow-lg w-full md:w-auto"
                    onClick={() => setIsBookingModalOpen(true)}
                >
                    <Calendar className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card
                    className="cursor-pointer hover:bg-accent/40 transition-all hover:shadow-md relative overflow-hidden"
                    onClick={() => setIsCalendarOpen(true)}
                    title="Click to view full calendar"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Next Visit</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {nextVisit ? (
                            <>
                                <div className="text-2xl font-bold text-primary">{formatDisplayDate(nextVisit.date)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {nextVisit.time} - {nextVisit.treatment}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-medium text-gray-500">No Upcoming</div>
                                <p className="text-xs text-muted-foreground">Book a new appointment</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{transformedPrescriptions.length}</div>
                        <p className="text-xs text-muted-foreground">Medications on file</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-orange-600">
                            ₱{outstandingBalance.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {outstandingBalance > 0 ? 'Payment due' : 'No outstanding balance'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Appointments Card */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-3 p-5">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Appointments
                            </CardTitle>
                            <CardDescription>
                                {upcomingAppointments.length > 0
                                    ? `You have ${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length > 1 ? 's' : ''}`
                                    : 'No upcoming appointments'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Tabs defaultValue="upcoming" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                </TabsList>

                                {/* Upcoming Appointments - Fixed height with 5 items */}
                                <TabsContent value="upcoming" className="m-0 p-0">
                                    <div className="mb-4">
                                        <Select value={upcomingStatusFilter} onValueChange={setUpcomingStatusFilter}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Statuses</SelectItem>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="h-[360px] overflow-y-auto pr-2">
                                        {filteredUpcomingAppointments.length > 0 ? (
                                            <>
                                                {filteredUpcomingAppointments.map((apt) => (
                                                    <div key={apt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors mb-3 last:mb-0">
                                                        <div className="flex gap-3">
                                                            <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md h-14 w-14 min-w-[3.5rem] flex-shrink-0">
                                                                <span className="text-xs font-semibold uppercase">
                                                                    {new Date(apt.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                                                                </span>
                                                                <span className="text-lg font-bold">
                                                                    {new Date(apt.date).getDate()}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1 min-w-0">
                                                                <h4 className="font-semibold text-base truncate">{apt.treatment}</h4>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3 flex-shrink-0" /> {apt.time}</span>
                                                                    <span className="flex items-center gap-1 truncate"><User className="w-3 h-3 flex-shrink-0" /> {apt.doctor}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0 flex gap-2 self-end sm:self-center">
                                                            <StatusBadge status={apt.status} />
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 text-xs whitespace-nowrap"
                                                                onClick={() => handleRescheduleClick(apt)}
                                                            >
                                                                <CalendarClock className="w-3 h-3 mr-1" /> Reschedule
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground h-full flex flex-col items-center justify-center">
                                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>No upcoming appointments.</p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-2 text-sm"
                                                    onClick={() => setIsBookingModalOpen(true)}
                                                >
                                                    Book Your First Appointment
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Past Appointments - Fixed height with 5 items */}
                                <TabsContent value="history" className="m-0 p-0">
                                    <div className="mb-4">
                                        <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Statuses</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="h-[360px] overflow-y-auto pr-2">
                                        {filteredHistoryAppointments.length > 0 ? (
                                            <>
                                                {filteredHistoryAppointments.map((apt) => apt && (
                                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 mb-2 last:mb-0">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="bg-muted p-1.5 rounded-full flex-shrink-0">
                                                                <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate text-sm">{apt.treatment}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{apt.date} • {apt.doctor}</p>
                                                            </div>
                                                        </div>
                                                        <StatusBadge status={apt.status} />
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground h-full flex flex-col items-center justify-center">
                                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>No appointment history.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Medications Card */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-3 p-5">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Pill className="w-5 h-5 text-primary" />
                                Current Medications
                            </CardTitle>
                            <CardDescription>
                                {transformedPrescriptions.length > 0
                                    ? `${transformedPrescriptions.length} active prescription${transformedPrescriptions.length > 1 ? 's' : ''}`
                                    : 'No current medications'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="h-[280px] overflow-y-auto pr-2">
                                {displayPrescriptions.length > 0 ? (
                                    <>
                                        <div className="grid gap-3">
                                            {displayPrescriptions.map((rx) => (
                                                <div key={rx.id} className="p-3 rounded-lg border bg-card flex flex-col justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="flex justify-between items-start mb-1 gap-2">
                                                            <h4 className="font-semibold truncate text-sm">{rx.medication}</h4>
                                                            <Badge variant="secondary" className="whitespace-nowrap text-xs">{rx.dosage}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{rx.instructions}</p>
                                                    </div>
                                                    <div className="pt-2 mt-1 border-t flex items-center gap-2 text-xs text-amber-600 font-medium">
                                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{rx.remaining}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {hasMorePrescriptions && (
                                            <div className="text-center mt-4 pt-3 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing 5 of {transformedPrescriptions.length} prescriptions
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2 text-xs"
                                                    onClick={() => navigate('/patient/prescriptions')}
                                                >
                                                    <ChevronDown className="w-4 h-4 mr-1" /> View All Medications
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground h-full flex flex-col items-center justify-center">
                                        <Pill className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>No current medications.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card className="bg-primary/5 border-none">
                        <CardContent className="pt-6 p-4">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-16 w-16 md:h-20 md:w-20 mb-3 ring-2 ring-primary ring-offset-2">
                                    <AvatarImage src="/placeholder-avatar.jpg" />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                        {currentPatient ? `${currentPatient.f_name[0]}${currentPatient.l_name[0]}` : 'JD'}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-lg md:text-xl font-bold truncate w-full">
                                    {currentPatient ? `${currentPatient.f_name} ${currentPatient.l_name}` : 'Loading...'}
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground mb-3">Member since 2024</p>
                                <div className="w-full space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-background text-sm"
                                        onClick={() => navigate('/patient/profile')}
                                    >
                                        View Profile <ChevronRight className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-background text-sm"
                                        onClick={() => navigate('/patient/records')}
                                    >
                                        Medical Records <FileText className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Payments Card */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-3 p-5">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Recent Payments
                            </CardTitle>
                            <CardDescription>
                                Last 5 transactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="h-[280px] overflow-y-auto pr-2">
                                <div className="space-y-3">
                                    {transformedPayments.length > 0 ? (
                                        transformedPayments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{payment.description}</p>
                                                    <p className="text-xs text-muted-foreground">{payment.date}</p>
                                                </div>
                                                <div className="text-right space-y-1 ml-2 flex-shrink-0">
                                                    <p className="text-sm font-bold whitespace-nowrap">₱{payment.amount.toLocaleString()}</p>
                                                    <StatusBadge status={payment.status} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>No recent payments.</p>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full mt-4 text-primary text-sm"
                                    onClick={() => navigate('/patient/transactions')}
                                >
                                    <ChevronDown className="w-4 h-4 mr-1" /> View All Transactions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <BookAppointmentModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
            />

            <RescheduleAppointmentModal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                appointment={selectedAppointment}
            />

            <AppointmentCalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                appointments={transformedAppointments}
            />
        </div>
    );
}