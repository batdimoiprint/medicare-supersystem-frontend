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
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import BookAppointmentModal from '@/components/patient/BookAppointmentModal';

// --- Mock Data (Simulating Backend) ---
const PATIENT_NAME = "John Doe";

const UPCOMING_APPOINTMENTS = [
    {
        id: 1,
        treatment: "Dental Cleaning",
        doctor: "Dr. Evelyn Reyes",
        date: "2025-11-24",
        time: "09:00 AM",
        location: "Room 302",
        status: "Confirmed"
    }
];

const PAST_APPOINTMENTS = [
    { id: 101, treatment: "Root Canal", doctor: "Dr. Mark Santos", date: "2025-10-15", status: "Completed" },
    { id: 102, treatment: "Consultation", doctor: "Dr. Evelyn Reyes", date: "2025-09-01", status: "Completed" },
    { id: 103, treatment: "X-Ray", doctor: "Dr. Mark Santos", date: "2025-08-20", status: "Completed" },
];

const ACTIVE_PRESCRIPTIONS = [
    {
        id: 1,
        medication: "Amoxicillin",
        dosage: "500mg",
        instructions: "Take 1 tablet every 8 hours for 7 days",
        remaining: "5 days left"
    },
    {
        id: 2,
        medication: "Ibuprofen",
        dosage: "400mg",
        instructions: "Take as needed for pain",
        remaining: "As needed"
    }
];

const RECENT_PAYMENTS = [
    { id: 'INV-001', description: "Dental Cleaning Fee", date: "2025-11-24", amount: 500, status: "Pending" },
    { id: 'INV-002', description: "Root Canal Treatment", date: "2025-10-15", amount: 5000, status: "Paid" },
    { id: 'INV-003', description: "Consultation Fee", date: "2025-09-01", amount: 500, status: "Paid" },
];

// --- Helper Components ---
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
    const navigate = useNavigate(); // Initialize navigation hook
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className="text-muted-foreground text-sm">Overview</span>
                    </div>
                    <BlurText 
                        text={`Welcome back, ${PATIENT_NAME}`} 
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

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Visit</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Nov 24</div>
                        <p className="text-xs text-muted-foreground">09:00 AM - Cleaning</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ACTIVE_PRESCRIPTIONS.length}</div>
                        <p className="text-xs text-muted-foreground">Medications on file</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">₱500.00</div>
                        <p className="text-xs text-muted-foreground">Due on Nov 24</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (Appointments) - Spans 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Appointments Section */}
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
                                    {UPCOMING_APPOINTMENTS.length > 0 ? (
                                        UPCOMING_APPOINTMENTS.map((apt) => (
                                            <div key={apt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md h-16 w-16 min-w-[4rem]">
                                                        <span className="text-xs font-semibold uppercase">{apt.date.split('-')[1] === '11' ? 'NOV' : 'DEC'}</span>
                                                        <span className="text-xl font-bold">{apt.date.split('-')[2]}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-semibold text-lg">{apt.treatment}</h4>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time}</span>
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {apt.doctor}</span>
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {apt.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 sm:mt-0 flex gap-2 self-end sm:self-center">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>
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
                                        {PAST_APPOINTMENTS.map((apt) => (
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

                    {/* Prescriptions Summary */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Pill className="w-5 h-5 text-primary" />
                                Current Medications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {ACTIVE_PRESCRIPTIONS.map((rx) => (
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

                {/* Right Column (Sidebar) */}
                <div className="space-y-8">
                    
                    {/* Patient Profile Summary */}
                    <Card className="bg-primary/5 border-none">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary ring-offset-2">
                                    <AvatarImage src="/placeholder-avatar.jpg" />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">JD</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">{PATIENT_NAME}</h3>
                                <p className="text-sm text-muted-foreground mb-4">Member since 2024</p>
                                <div className="w-full space-y-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-between bg-background"
                                        onClick={() => navigate('/patient/profile')}
                                    >
                                        View Profile <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" className="w-full justify-between bg-background">
                                        Medical Records <FileText className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Recent Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {RECENT_PAYMENTS.map((payment) => (
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
        </div>
    );
}