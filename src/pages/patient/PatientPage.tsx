import BlurText from '@/components/ui/BlurText';
import {
    Calendar,
    Clock,
    CreditCard,
    FileText,
    MapPin,
    Pill,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    User,
    CalendarClock,
    Loader2,
    Filter,
    X,
    ChevronLeft,
    ChevronRight as ChevronRightIcon
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
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { useNavigate } from 'react-router-dom'; 

// Import Modals
import BookAppointmentModal from '@/components/patient/BookAppointmentModal';
import RescheduleAppointmentModal from '@/components/patient/RescheduleAppointmentModal';
import AppointmentCalendarModal from '@/components/patient/AppointmentCalendarModal';
import { useState, useEffect, useMemo, useRef } from 'react';

import supabase from '@/utils/supabase';

// Define types for better type safety
interface PatientData {
    patient_id: string;
    email: string;
    f_name: string;
    l_name: string;
    pri_contact_no: string;
    house_no: string;
    street: string;
    barangay: string;
    city: string;
    account_status: string;
}

interface Appointment {
    appointment_id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_status_id: number;
    service_id: string;
    personnel_id?: string;
    service_name: string;
    personnel_name: string | null;
}

interface Prescription {
    prescription_id: string;
    dosage: string;
    instructions: string;
    created_at: string;
}

interface Payment {
    bill_id: string;
    created_at: string;
    total_amount: number;
    payment_status_id: number;
}

interface AppointmentHistory {
    appointment_history_id: string;
    patient_id: string;
    appointment_id: string;
    appointment_tbl: Array<{
        appointment_date: string;
        appointment_time: string;
        appointment_status_id: number;
        service_id: string;
        personnel_id?: string;
        services_tbl?: Array<{
            service_name: string;
            service_fee: number;
        }>;
        personnel_tbl?: Array<{
            first_name: string;
            last_name: string;
            specialization: string;
        }>;
    }>;
}

// Transformed appointment type for display
interface TransformedAppointment {
    id: string;
    treatment: string;
    doctor: string;
    date: string;
    time: string;
    location: string;
    status: string;
    type: string;
    rawData: Appointment;
    statusId: number;
}

// Type for RescheduleAppointmentModal
interface RescheduleAppointmentData {
    id: number;
    treatment: string;
    doctor: string;
    date: string;
    time: string;
    status: string;
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        Confirmed: "bg-green-100 text-green-700 border-green-200",
        Completed: "bg-blue-100 text-blue-700 border-blue-200",
        Paid: "bg-green-100 text-green-700 border-green-200",
        Cancelled: "bg-red-100 text-red-700 border-red-200",
        'No Show': "bg-gray-100 text-gray-700 border-gray-200",
        Rescheduled: "bg-purple-100 text-purple-700 border-purple-200",
        Scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
        'Refund Requested': "bg-orange-100 text-orange-700 border-orange-200",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
        </span>
    );
};

// Scroll buttons component
const ScrollButtons = ({ scrollRef, itemsLength }: { scrollRef: React.RefObject<HTMLDivElement | null>, itemsLength: number }) => {
    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    if (itemsLength === 0) return null;

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={scrollLeft}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={scrollRight}
            >
                <ChevronRightIcon className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function PatientPage() {
    const navigate = useNavigate();
    const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentHistory, setAppointmentHistory] = useState<AppointmentHistory[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<RescheduleAppointmentData | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Scroll refs - initialize with proper type
    const upcomingScrollRef = useRef<HTMLDivElement>(null);
    const historyScrollRef = useRef<HTMLDivElement>(null);
    const prescriptionsScrollRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [upcomingFilter, setUpcomingFilter] = useState<string>('all');
    const [historyFilter, setHistoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Filter options
    const upcomingFilterOptions = [
        { value: 'all', label: 'All Upcoming' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Refund Requested', label: 'Refund Requested' }
    ];

    const historyFilterOptions = [
        { value: 'all', label: 'All History' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'No Show', label: 'No Show' },
        { value: 'Rescheduled', label: 'Rescheduled' },
        { value: 'Refund Requested', label: 'Refund Requested' }
    ];

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                // Get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                console.log('User object:', user);
                
                if (userError || !user) {
                    console.error('No user logged in', userError);
                    navigate('/login');
                    return;
                }

                // Fetch patient data
                const { data: patientData, error: patientError } = await supabase
                    .schema('patient_record')
                    .from('patient_tbl')
                    .select('patient_id, email, f_name, l_name, pri_contact_no, house_no, street, barangay, city, account_status')
                    .eq('email', user.email)
                    .single();

                if (patientError) {
                    console.error('Error fetching patient:', patientError);
                    return;
                }

                setCurrentPatient(patientData as PatientData);

                // Fetch data from both schemas
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
                // First get appointments
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .schema('frontdesk')
                    .from('appointment_tbl')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('appointment_date', { ascending: true });

                if (appointmentsError) throw appointmentsError;

                // Then get all services
                const { data: servicesData, error: servicesError } = await supabase
                    .schema('dentist')
                    .from('services_tbl')
                    .select('service_id, service_name');

                if (servicesError) throw servicesError;

                // Get all personnel
                const { data: personnelData, error: personnelError } = await supabase
                    .schema('public')
                    .from('personnel_tbl')
                    .select('personnel_id, f_name, l_name');

                if (personnelError) throw personnelError;

                // Create a map of service_id to service_name
                const servicesMap = servicesData?.reduce((acc: Record<string, string>, service: { service_id: string; service_name: string }) => {
                    acc[service.service_id] = service.service_name;
                    return acc;
                }, {} as Record<string, string>) || {};

                // Create a map of personnel_id to personnel name
                const personnelMap = personnelData?.reduce((acc: Record<string, string>, person: { personnel_id: string; f_name: string; l_name: string }) => {
                    acc[person.personnel_id] = `${person.f_name} ${person.l_name}`;
                    return acc;
                }, {} as Record<string, string>) || {};

                // Combine the data
                const appointmentsWithServiceNames = (appointmentsData || []).map((apt: any) => ({
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
                    console.error('Error fetching appointment history:', historyError);
                    setAppointmentHistory([]);
                } else {
                    console.log('Fetched appointment history:', historyData);
                    setAppointmentHistory(historyData || []);
                }
            } catch (error) {
                console.error('Error in fetchAppointmentHistory:', error);
                setAppointmentHistory([]);
            }
        };

        const fetchPrescriptions = async (patientId: string) => {
            try {
                // Try direct prescription table query
                const { data: prescriptionsData, error: prescriptionsError } = await supabase
                    .schema('patient_record')
                    .from('prescription_tbl')
                    .select('*')
                    .eq('patient_id', patientId);

                if (prescriptionsError) {
                    console.error('Error fetching prescriptions:', prescriptionsError);
                    setPrescriptions([]);
                } else {
                    setPrescriptions(prescriptionsData || []);
                }
            } catch (error) {
                console.error('Error in fetchPrescriptions:', error);
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
                    console.error('Error fetching payments:', paymentsError);
                    setPayments([]);
                } else {
                    setPayments(paymentsData || []);
                }
            } catch (error) {
                console.error('Error in fetchPayments:', error);
                setPayments([]);
            }
        };

        fetchPatientData();
    }, [navigate]);

    // Helper functions
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
        
        // Assuming prescription is valid for 30 days from creation
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
            4: 'Cancelled',
            5: 'No Show',
            6: 'Rescheduled',
            7: 'Scheduled',
            8: 'Refund Requested'
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

    // Function to handle refund requests
    const handleRefundRequest = async (appointmentId: string) => {
        try {
            // Show confirmation dialog
            const confirmed = window.confirm("Are you sure you want to request a refund for this appointment? This action cannot be undone.");
            
            if (!confirmed) return;
            
            // Update the appointment status to "Cancelled" (status_id = 4)
            const { error } = await supabase
                .schema('frontdesk')
                .from('appointment_tbl')
                .update({ appointment_status_id: 4 })
                .eq('appointment_id', appointmentId);
            
            if (error) {
                console.error('Error updating appointment status:', error);
                alert('Failed to request refund. Please try again.');
                return;
            }
            
            // Show success message
            alert('Refund request submitted successfully! Our team will review your request and contact you shortly.');
            
            // Refresh the appointments data
            if (currentPatient) {
                await fetchAppointments(currentPatient.patient_id);
                await fetchAppointmentHistory(currentPatient.patient_id);
            }
            
        } catch (error) {
            console.error('Error in handleRefundRequest:', error);
            alert('An error occurred. Please try again.');
        }
    };

    // Transform appointment data for upcoming appointments
    const transformedAppointments = useMemo(() => {
        if (!appointments || appointments.length === 0) return [];

        return appointments.map(apt => {
            const appointmentDate = apt.appointment_date;
            const appointmentDateTime = new Date(`${appointmentDate}T${apt.appointment_time}`);
            const now = new Date();
            
            // Get the status
            const status = getAppointmentStatus(apt.appointment_status_id);
            
            // Determine if it's upcoming or history based on status AND date
            // Only specific statuses should appear in upcoming
            const isUpcomingStatus = ['Pending', 'Scheduled', 'Confirmed', 'Refund Requested'].includes(status);
            const isFutureDate = appointmentDateTime >= now;
            
            // If it's a valid upcoming status AND the date is in the future, show as upcoming
            // Otherwise, show as history
            const type = (isUpcomingStatus && isFutureDate) ? 'upcoming' : 'history';

            return {
                id: apt.appointment_id,
                treatment: apt.service_name || 'Dental Service',
                doctor: apt.personnel_name ? `Dr. ${apt.personnel_name}` : 'No assigned Dentist',
                date: appointmentDate,
                time: formatTimeToAMPM(apt.appointment_time),
                location: "Clinic Room",
                status: status,
                type: type,
                rawData: apt,
                statusId: apt.appointment_status_id
            };
        });
    }, [appointments]);

    // Transform appointment history data
    const transformedAppointmentHistory = useMemo(() => {
        if (!appointmentHistory || appointmentHistory.length === 0) return [];

        return appointmentHistory.map(history => {
            const aptArray = history.appointment_tbl;
            if (!aptArray || aptArray.length === 0) return null;
            
            const apt = aptArray[0]; // Get first element from array
            if (!apt) return null;

            const servicesArray = apt.services_tbl;
            const serviceName = (servicesArray && servicesArray.length > 0) 
                ? servicesArray[0].service_name 
                : 'Dental Service';
            
            const personnelArray = apt.personnel_tbl;
            const personnel = personnelArray && personnelArray.length > 0 ? personnelArray[0] : null;
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
                type: 'history',
                statusId: apt.appointment_status_id
            };
        }).filter(Boolean) as Array<{
            id: string;
            appointmentId: string;
            treatment: string;
            doctor: string;
            date: string;
            time: string;
            location: string;
            status: string;
            type: string;
            statusId: number;
        }>;
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

    // Calculate outstanding balance
    const outstandingBalance = useMemo(() => {
        return payments
            .filter(payment => getPaymentStatus(payment.payment_status_id) === 'Pending')
            .reduce((total, payment) => total + (payment.total_amount || 0), 0);
    }, [payments]);

    // Filter appointments with search and filter options
    const filteredUpcomingAppointments = useMemo(() => {
        // First, filter to only show appointments that should be in "upcoming"
        let filtered = transformedAppointments
            .filter(a => a.type === 'upcoming')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Apply status filter
        if (upcomingFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === upcomingFilter);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.treatment.toLowerCase().includes(query) ||
                apt.doctor.toLowerCase().includes(query) ||
                apt.date.toLowerCase().includes(query) ||
                apt.status.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [transformedAppointments, upcomingFilter, searchQuery]);

    const filteredPastAppointments = useMemo(() => {
        // Combine both current appointments marked as history and appointment history
        const currentHistory = transformedAppointments.filter(a => a.type === 'history');
        let filtered = [...currentHistory, ...transformedAppointmentHistory]
            .filter((apt): apt is NonNullable<typeof apt> => apt !== null)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Apply status filter
        if (historyFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === historyFilter);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.treatment.toLowerCase().includes(query) ||
                apt.doctor.toLowerCase().includes(query) ||
                apt.date.toLowerCase().includes(query) ||
                apt.status.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [transformedAppointments, transformedAppointmentHistory, historyFilter, searchQuery]);

    const nextVisit = useMemo(() => {
        return filteredUpcomingAppointments.length > 0 ? filteredUpcomingAppointments[0] : null;
    }, [filteredUpcomingAppointments]);

    const handleRescheduleClick = (apt: TransformedAppointment) => {
        // Convert to modal's expected type
        const rescheduleData: RescheduleAppointmentData = {
            id: parseInt(apt.id) || 0,
            treatment: apt.treatment,
            doctor: apt.doctor,
            date: apt.date,
            time: apt.time,
            status: apt.status
        };
        setSelectedAppointment(rescheduleData);
        setIsRescheduleModalOpen(true);
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const clearFilters = () => {
        setUpcomingFilter('all');
        setHistoryFilter('all');
        setSearchQuery('');
    };

    // Function to fetch appointments (needed for handleRefundRequest)
    const fetchAppointments = async (patientId: string) => {
        try {
            // First get appointments
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .schema('frontdesk')
                .from('appointment_tbl')
                .select('*')
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: true });

            if (appointmentsError) throw appointmentsError;

            // Then get all services
            const { data: servicesData, error: servicesError } = await supabase
                .schema('dentist')
                .from('services_tbl')
                .select('service_id, service_name');

            if (servicesError) throw servicesError;

            // Get all personnel
            const { data: personnelData, error: personnelError } = await supabase
                .schema('public')
                .from('personnel_tbl')
                .select('personnel_id, f_name, l_name');

            if (personnelError) throw personnelError;

            // Create a map of service_id to service_name
            const servicesMap = servicesData?.reduce((acc: Record<string, string>, service: { service_id: string; service_name: string }) => {
                acc[service.service_id] = service.service_name;
                return acc;
            }, {} as Record<string, string>) || {};

            // Create a map of personnel_id to personnel name
            const personnelMap = personnelData?.reduce((acc: Record<string, string>, person: { personnel_id: string; f_name: string; l_name: string }) => {
                acc[person.personnel_id] = `${person.f_name} ${person.l_name}`;
                return acc;
            }, {} as Record<string, string>) || {};

            // Combine the data
            const appointmentsWithServiceNames = (appointmentsData || []).map((apt: any) => ({
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

    // Function to fetch appointment history (needed for handleRefundRequest)
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
                console.error('Error fetching appointment history:', historyError);
                setAppointmentHistory([]);
            } else {
                console.log('Fetched appointment history:', historyData);
                setAppointmentHistory(historyData || []);
            }
        } catch (error) {
            console.error('Error in fetchAppointmentHistory:', error);
            setAppointmentHistory([]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading patient data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground text-sm">Overview</span>
                    </div>
                    <BlurText 
                        text={`Welcome back, ${currentPatient ? `${currentPatient.f_name} ${currentPatient.l_name}` : 'Loading...'}`} 
                        delay={100} 
                        className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100" 
                    />
                    <p className="text-muted-foreground mt-2">
                        Here's what's happening with your dental health today.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="shadow-lg" 
                    onClick={() => setIsBookingModalOpen(true)}
                >
                    <Calendar className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
            </div>
        
            <div className="grid gap-4 md:grid-cols-3">
                <Card 
                    className="cursor-pointer hover:bg-accent/40 transition-all hover:shadow-md relative overflow-hidden"
                    onClick={() => setIsCalendarOpen(true)}
                    title="Click to view full calendar"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Visit</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transformedPrescriptions.length}</div>
                        <p className="text-xs text-muted-foreground">Medications on file</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            ₱{outstandingBalance.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {outstandingBalance > 0 ? 'Payment due' : 'No outstanding balance'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Appointments
                                    </CardTitle>
                                    <CardDescription>
                                        {filteredUpcomingAppointments.length > 0 
                                            ? `You have ${filteredUpcomingAppointments.length} upcoming appointment${filteredUpcomingAppointments.length > 1 ? 's' : ''}`
                                            : 'No upcoming appointments'
                                        }
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Input
                                            placeholder="Search appointments..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full sm:w-48 pl-9"
                                        />
                                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchQuery('')}
                                            className="h-9 px-2"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="upcoming" className="w-full">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                        <TabsTrigger value="history">History</TabsTrigger>
                                    </TabsList>
                                    
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <TabsContent value="upcoming" className="w-full sm:w-auto m-0">
                                            <Select value={upcomingFilter} onValueChange={setUpcomingFilter}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {upcomingFilterOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TabsContent>
                                        
                                        <TabsContent value="history" className="w-full sm:w-auto m-0">
                                            <Select value={historyFilter} onValueChange={setHistoryFilter}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {historyFilterOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TabsContent>
                                        
                                        {(upcomingFilter !== 'all' || historyFilter !== 'all' || searchQuery) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFilters}
                                                className="h-9 text-xs"
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                <TabsContent value="upcoming" className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {filteredUpcomingAppointments.length} appointment{filteredUpcomingAppointments.length !== 1 ? 's' : ''}
                                        </div>
                                        <ScrollButtons scrollRef={upcomingScrollRef} itemsLength={filteredUpcomingAppointments.length} />
                                    </div>
                                    
                                    <div 
                                        ref={upcomingScrollRef}
                                        className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                                    >
                                        {filteredUpcomingAppointments.length > 0 ? (
                                            filteredUpcomingAppointments.map((apt) => (
                                                <div key={apt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-w-0">
                                                    <div className="flex gap-4 min-w-0">
                                                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md h-16 w-16 min-w-[4rem] shrink-0">
                                                            <span className="text-xs font-semibold uppercase">
                                                                {new Date(apt.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                                                            </span>
                                                            <span className="text-xl font-bold">
                                                                {new Date(apt.date).getDate()}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <h4 className="font-semibold text-lg truncate">{apt.treatment}</h4>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" /> {apt.time}</span>
                                                                <span className="flex items-center gap-1 truncate"><User className="w-3 h-3" /> {apt.doctor}</span>
                                                                {apt.location && <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" /> {apt.location}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 sm:mt-0 flex gap-2 self-end sm:self-center">
                                                        <StatusBadge status={apt.status} />
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            {apt.status !== 'Cancelled' && apt.status !== 'Completed' && apt.status !== 'No Show' && apt.status !== 'Refund Requested' && (
                                                                <>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="h-7 text-xs whitespace-nowrap"
                                                                        onClick={() => handleRescheduleClick(apt)}
                                                                    >
                                                                        <CalendarClock className="w-3 h-3 mr-1" /> Reschedule
                                                                    </Button>
                                                                    {/* Add Request Refund button for Pending appointments (statusId = 1) */}
                                                                    {apt.statusId === 1 && (
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost" 
                                                                            className="h-7 text-xs whitespace-nowrap text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                            onClick={() => handleRefundRequest(apt.id)}
                                                                        >
                                                                            <CreditCard className="w-3 h-3 mr-1" /> Request Refund
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {apt.status === 'Refund Requested' && (
                                                                <div className="text-xs text-orange-600 italic">
                                                                    Refund requested
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>No upcoming appointments found.</p>
                                                <Button 
                                                    variant="outline" 
                                                    className="mt-2"
                                                    onClick={() => {
                                                        clearFilters();
                                                        setIsBookingModalOpen(true);
                                                    }}
                                                >
                                                    Book Your First Appointment
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="history">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {filteredPastAppointments.length} appointment{filteredPastAppointments.length !== 1 ? 's' : ''}
                                            </div>
                                            <ScrollButtons scrollRef={historyScrollRef} itemsLength={filteredPastAppointments.length} />
                                        </div>
                                        
                                        <div 
                                            ref={historyScrollRef}
                                            className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                                        >
                                            {filteredPastAppointments.length > 0 ? (
                                                filteredPastAppointments.map((apt) => apt && (
                                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 min-w-0">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="bg-muted p-2 rounded-full shrink-0">
                                                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate">{apt.treatment}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{formatDate(apt.date)} • {apt.doctor}</p>
                                                            </div>
                                                        </div>
                                                        <StatusBadge status={apt.status} />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                    <p>No appointment history found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-primary" />
                                    Current Medications
                                </CardTitle>
                                <ScrollButtons scrollRef={prescriptionsScrollRef} itemsLength={transformedPrescriptions.length} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div 
                                ref={prescriptionsScrollRef}
                                className="grid gap-4 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                            >
                                {transformedPrescriptions.length > 0 ? (
                                    transformedPrescriptions.map((rx) => (
                                        <div key={rx.id} className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-2 min-w-0">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold truncate">{rx.medication}</h4>
                                                    <Badge variant="secondary" className="shrink-0">{rx.dosage}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{rx.instructions}</p>
                                            </div>
                                            <div className="pt-2 mt-2 border-t flex items-center gap-2 text-xs text-amber-600 font-medium">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{rx.remaining}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground col-span-2">
                                        <Pill className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>No active prescriptions.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="bg-primary/5 border-none">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary ring-offset-2">
                                    <AvatarImage src="/placeholder-avatar.jpg" />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                        {currentPatient ? `${currentPatient.f_name[0]}${currentPatient.l_name[0]}` : 'JD'}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">
                                    {currentPatient ? `${currentPatient.f_name} ${currentPatient.l_name}` : 'Loading...'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">Member since 2024</p>
                                <div className="w-full space-y-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-between bg-background"
                                        onClick={() => navigate('/patient/profile')}
                                    >
                                        View Profile <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-between bg-background"
                                        onClick={() => navigate('/patient/records')}
                                    >
                                        Medical Records <FileText className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Recent Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {transformedPayments.length > 0 ? (
                                    transformedPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{payment.description}</p>
                                                <p className="text-xs text-muted-foreground">{payment.date}</p>
                                            </div>
                                            <div className="text-right space-y-1 shrink-0">
                                                <p className="text-sm font-bold">₱{payment.amount.toLocaleString()}</p>
                                                <StatusBadge status={payment.status} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No recent payments</p>
                                    </div>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                className="w-full mt-4 text-primary"
                                onClick={() => navigate('/patient/transactions')}
                            >
                                View All Transactions
                            </Button>
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
                appointments={transformedAppointments.map(apt => ({
                    id: parseInt(apt.id) || 0,
                    treatment: apt.treatment,
                    doctor: apt.doctor,
                    date: apt.date,
                    time: apt.time,
                    location: apt.location,
                    status: apt.status,
                    type: apt.type
                }))}
            />
        </div>
    );
}
