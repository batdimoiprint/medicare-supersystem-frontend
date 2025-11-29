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
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useNavigate } from 'react-router-dom'; 

// Import Modals
import BookAppointmentModal from '@/components/patient/BookAppointmentModal';
import RescheduleAppointmentModal from '@/components/patient/RescheduleAppointmentModal';
import AppointmentCalendarModal from '@/components/patient/AppointmentCalendarModal';
import { useState, useEffect, useMemo } from 'react';

import supabase from '@/utils/supabase';

// Status Badge Component
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
    const [currentPatient, setCurrentPatient] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                // Get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
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

                setCurrentPatient(patientData);

                // Fetch appointments from frontdesk schema
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .schema('frontdesk')
                    .from('appointment_tbl')
                    .select(`
                        appointment_id,
                        appointment_date,
                        appointment_time,
                        appointment_status_id,
                        services_tbl(service_name, service_fee),
                        personnel_tbl(first_name, last_name)
                    `)
                    .eq('patient_id', patientData.patient_id)
                    .order('appointment_date', { ascending: true });

                if (appointmentsError) {
                    console.error('Error fetching appointments:', appointmentsError);
                } else {
                    setAppointments(appointmentsData || []);
                }

                // Fetch prescriptions through history_records_tbl
                const { data: prescriptionsData, error: prescriptionsError } = await supabase
                    .schema('patient_record')
                    .from('history_records_tbl')
                    .select(`
                        prescription_tbl(
                            prescription_id,
                            instructions,
                            dosage,
                            created_at,
                            medicine_tbl(medicine_name)
                        )
                    `)
                    .eq('patient_id', patientData.patient_id)
                    .not('prescription_id', 'is', null);

                if (prescriptionsError) {
                    console.error('Error fetching prescriptions:', prescriptionsError);
                } else {
                    // Flatten the prescription data
                    const flattenedPrescriptions = prescriptionsData
                        ?.filter(record => record.prescription_tbl)
                        .map(record => record.prescription_tbl) || [];
                    setPrescriptions(flattenedPrescriptions);
                }

                // Fetch payments/billing information
                const { data: paymentsData, error: paymentsError } = await supabase
                    .schema('frontdesk')
                    .from('billing_tbl')
                    .select(`
                        bill_id,
                        total_amount,
                        payment_status_id,
                        created_at,
                        appointment_tbl(appointment_id),
                        bill_service_id(
                            service_id,
                            billed_quantity,
                            billed_unit_price,
                            sub_total,
                            services_tbl(service_name)
                        )
                    `)
                    .eq('patient_id', patientData.patient_id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (paymentsError) {
                    console.error('Error fetching payments:', paymentsError);
                } else {
                    setPayments(paymentsData || []);
                }

            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
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

    // Transform data
    const transformedAppointments = useMemo(() => {
        return appointments.map(apt => ({
            id: apt.appointment_id,
            treatment: apt.services_tbl?.service_name || 'Dental Service',
            doctor: apt.personnel_tbl ? `Dr. ${apt.personnel_tbl.first_name} ${apt.personnel_tbl.last_name}` : 'Dentist',
            date: apt.appointment_date,
            time: formatTimeToAMPM(apt.appointment_time),
            location: "Clinic Room",
            status: getAppointmentStatus(apt.appointment_status_id),
            type: new Date(apt.appointment_date) >= new Date() ? 'upcoming' : 'history'
        }));
    }, [appointments]);

    const transformedPrescriptions = useMemo(() => {
        return prescriptions.map(rx => ({
            id: rx.prescription_id,
            medication: rx.medicine_tbl?.medicine_name || 'Medication',
            dosage: rx.dosage || 'N/A',
            instructions: rx.instructions || 'Take as directed',
            remaining: calculateRemainingDays(rx.created_at)
        }));
    }, [prescriptions]);

    const transformedPayments = useMemo(() => {
        return payments.map(payment => ({
            id: `INV-${payment.bill_id}`,
            description: payment.bill_service_id?.services_tbl?.service_name || 'Dental Service',
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

    // Use transformed data
    const upcomingAppointments = transformedAppointments.filter(a => a.type === 'upcoming');
    const pastAppointments = transformedAppointments.filter(a => a.type === 'history');
    const nextVisit = useMemo(() => {
        if (upcomingAppointments.length === 0) return null;
        const sorted = [...upcomingAppointments].sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        return sorted[0];
    }, [upcomingAppointments]);

    const handleRescheduleClick = (apt: any) => {
        setSelectedAppointment(apt);
        setIsRescheduleModalOpen(true);
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Appointments
                            </CardTitle>
                            <CardDescription>Manage your upcoming visits and view history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="upcoming" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="upcoming" className="space-y-4">
                                    {upcomingAppointments.length > 0 ? (
                                        upcomingAppointments.map((apt) => (
                                            <div key={apt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md h-16 w-16 min-w-[4rem]">
                                                        <span className="text-xs font-semibold uppercase">
                                                            {new Date(apt.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                                                        </span>
                                                        <span className="text-xl font-bold">
                                                            {new Date(apt.date).getDate()}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-semibold text-lg">{apt.treatment}</h4>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time}</span>
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {apt.doctor}</span>
                                                            {apt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {apt.location}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 sm:mt-0 flex gap-2 self-end sm:self-center">
                                                    <StatusBadge status={apt.status} />
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-7 text-xs"
                                                        onClick={() => handleRescheduleClick(apt)}
                                                    >
                                                        <CalendarClock className="w-3 h-3 mr-1" /> Reschedule
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>No upcoming appointments.</p>
                                        </div>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="history">
                                    <div className="space-y-4">
                                        {pastAppointments.map((apt) => (
                                            <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-muted p-2 rounded-full">
                                                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{apt.treatment}</p>
                                                        <p className="text-xs text-muted-foreground">{apt.date} • {apt.doctor}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={apt.status} />
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Pill className="w-5 h-5 text-primary" />
                                Current Medications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {transformedPrescriptions.map((rx) => (
                                    <div key={rx.id} className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-semibold">{rx.medication}</h4>
                                                <Badge variant="secondary">{rx.dosage}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{rx.instructions}</p>
                                        </div>
                                        <div className="pt-2 mt-2 border-t flex items-center gap-2 text-xs text-amber-600 font-medium">
                                            <AlertCircle className="w-3 h-3" />
                                            {rx.remaining}
                                        </div>
                                    </div>
                                ))}
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
                            <div className="space-y-4">
                                {transformedPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{payment.description}</p>
                                            <p className="text-xs text-muted-foreground">{payment.date}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-sm font-bold">₱{payment.amount.toLocaleString()}</p>
                                            <StatusBadge status={payment.status} />
                                        </div>
                                    </div>
                                ))}
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
                appointments={transformedAppointments}
            />
        </div>
    );
}