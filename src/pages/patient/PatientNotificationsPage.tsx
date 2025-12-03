import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Bell, 
    Calendar, 
    CreditCard, 
    AlertCircle, 
    Clock, 
    Check,
    Loader2,
    FileText,
    Stethoscope,
    Pill
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import supabase from '@/utils/supabase';

// --- Database Types ---
interface Appointment {
    appointment_id: number;
    patient_id: number;
    service_id?: number;
    appointment_time?: string;
    appointment_date?: string;
    appointment_status_id?: number;
    created_at?: string;
    personnel_id?: number;
    reservation_fee?: number;
    payment_receipt_url?: string;
    notes?: string;
    reference_number?: string;
    payment_date?: string;
    verified_by?: number;
    verified_at?: string;
    payment_method?: string;
    updated_at?: string;
}

interface EMRRecord {
    id: number;
    patient_id?: number;
    date?: string;
    time?: string;
    chief_complaint?: string;
    diagnosis?: string;
    treatment?: number;
    notes?: string;
    dentist?: number;
    status?: string;
    what_was_done?: string;
    medicines?: any;
    home_care?: any;
}

interface Prescription {
    prescription_id: number;
    medicine_id: number;
    instructions?: string;
    dosage?: string;
    created_at?: string;
    duration?: string;
    quantity?: string;
    frequency?: string;
    personnel_id?: number;
    patient_id?: number;
}

interface TreatmentPlan {
    treatment_id: number;
    patient_id: number;
    personnel_id?: number;
    treatment_name?: string;
    description?: string;
    treatment_status?: string;
    created_at?: string;
}

interface Patient {
    patient_id: number;
    f_name: string;
    l_name: string;
    m_name?: string;
    suffix?: string;
    birthdate: string;
    gender: string;
    email?: string;
    pri_contact_no: string;
    account_status: string;
}

// Notification interface for our generated notifications
interface GeneratedNotification {
    id: string;
    type: 'Appointment' | 'Billing' | 'System' | 'Reminder' | 'Medical' | 'Prescription';
    title: string;
    message: string;
    timestamp: string;
    is_read: boolean;
    reference_id?: string;
    data?: any;
}

// Appointment status mapping
const APPOINTMENT_STATUS: Record<number, string> = {
    1: 'Scheduled',
    2: 'Confirmed',
    3: 'Completed',
    4: 'Cancelled',
    5: 'Rescheduled'
};

// Philippine time formatter
const formatPHTime = (dateString: string) => {
    try {
        const date = new Date(dateString);
        
        // Convert to Philippine Time (UTC+8)
        const phTime = new Date(date.getTime());
        
        // Format date
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Manila'
        };
        
        // Format time
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        };
        
        const formattedDate = phTime.toLocaleDateString('en-PH', dateOptions);
        const formattedTime = phTime.toLocaleTimeString('en-PH', timeOptions);
        
        return { date: formattedDate, time: formattedTime, fullDateTime: `${formattedDate} at ${formattedTime}` };
    } catch (e) {
        console.error('Error formatting date:', e);
        return { date: 'Invalid date', time: '', fullDateTime: 'Invalid date' };
    }
};

// Format date to Philippine date only
const formatPHDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const phTime = new Date(date.getTime());
        
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Manila'
        };
        
        return phTime.toLocaleDateString('en-PH', options);
    } catch (e) {
        return 'Invalid date';
    }
};

// Format time to Philippine time only
const formatPHTimeOnly = (timeString?: string) => {
    if (!timeString) return 'Time not set';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hourNum = parseInt(hours, 10);
        const minuteNum = parseInt(minutes || '0', 10);
        
        if (isNaN(hourNum) || isNaN(minuteNum)) {
            return timeString;
        }
        
        const today = new Date();
        today.setHours(hourNum, minuteNum, 0);
        
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        };
        
        return today.toLocaleTimeString('en-PH', options);
    } catch (e) {
        return timeString;
    }
};

// Helper to generate a stable notification ID
const generateNotificationId = (
    type: string, 
    sourceId: number | string, 
    subType?: string
) => {
    return `${type}-${sourceId}${subType ? `-${subType}` : ''}`;
};

export default function PatientNotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<GeneratedNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [patientId, setPatientId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [markingReadId, setMarkingReadId] = useState<string | null>(null);
    
    // Store fetched data
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});

  
    // Fetch all data on component mount
    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            if (isMounted) {
                await fetchAllData();
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch read status from Supabase
    const fetchReadStatus = async (currentPatientId: number) => {
        try {
            const { data, error } = await supabase
                .from('notification_read_status')
                .select('notification_id, is_read')
                .eq('patient_id', currentPatientId);
            
            if (error) {
                console.warn('Could not fetch read status:', error);
                return {};
            }
            
            // Convert array to object for easy lookup
            const statusObj: Record<string, boolean> = {};
            data?.forEach(item => {
                statusObj[item.notification_id] = item.is_read;
            });
            
            return statusObj;
        } catch (err) {
            console.error('Error fetching read status:', err);
            return {};
        }
    };

    // Save read status to Supabase
    const saveReadStatus = async (
        notificationId: string, 
        isRead: boolean, 
        patientId: number
    ) => {
        try {
            const { error } = await supabase
                .from('notification_read_status')
                .upsert({
                    patient_id: patientId,
                    notification_id: notificationId,
                    is_read: isRead,
                    read_at: isRead ? new Date().toISOString() : null
                }, {
                    onConflict: 'patient_id,notification_id'
                });
            
            if (error) {
                console.error('Error saving read status:', error);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('Error saving read status:', err);
            return false;
        }
    };

    // Save multiple read statuses
    const saveAllReadStatus = async (notificationIds: string[], patientId: number) => {
        try {
            const records = notificationIds.map(notificationId => ({
                patient_id: patientId,
                notification_id: notificationId,
                is_read: true,
                read_at: new Date().toISOString()
            }));
            
            const { error } = await supabase
                .from('notification_read_status')
                .upsert(records, {
                    onConflict: 'patient_id,notification_id'
                });
            
            if (error) {
                console.error('Error saving all read status:', error);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('Error saving all read status:', err);
            return false;
        }
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 1. Get current authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('User not authenticated. Please log in.');
            }
            
            // 2. Fetch patient data from patient_record schema
            const { data: patientData, error: patientError } = await supabase
                .schema('patient_record')
                .from('patient_tbl')
                .select('patient_id, f_name, l_name, m_name, suffix, birthdate, gender, email, pri_contact_no, account_status')
                .eq('email', user.email)
                .single();
            
            if (patientError) {
                console.error('Error fetching patient data:', patientError);
                throw new Error(`Failed to load patient data: ${patientError.message}`);
            }
            
            if (!patientData) {
                throw new Error('Patient record not found. Please contact support.');
            }
            
            setPatient(patientData);
            const currentPatientId = patientData.patient_id;
            setPatientId(currentPatientId);
            
            // 3. Fetch read status
            const readStatusData = await fetchReadStatus(currentPatientId);
            setReadStatus(readStatusData);
            
            // 4. Fetch data in parallel
            const [
                appointmentsData,
                emrData,
                prescriptionsData,
                treatmentData
            ] = await Promise.all([
                // Fetch appointments
                supabase
                    .schema('frontdesk')
                    .from('appointment_tbl')
                    .select('*')
                    .eq('patient_id', currentPatientId)
                    .order('appointment_date', { ascending: false }),
                
                // Fetch EMR records
                supabase
                    .schema('patient_record')
                    .from('emr_records')
                    .select('*')
                    .eq('patient_id', currentPatientId)
                    .order('date', { ascending: false }),
                
                // Fetch prescriptions
                supabase
                    .schema('dentist')
                    .from('prescription_tbl')
                    .select('*')
                    .eq('patient_id', currentPatientId)
                    .order('created_at', { ascending: false }),
                
                // Fetch treatment plans
                supabase
                    .schema('dentist')
                    .from('treatment_plan_tbl')
                    .select('*')
                    .eq('patient_id', currentPatientId)
                    .order('created_at', { ascending: false })
            ]);
            
            // Handle fetched data
            setAppointments(appointmentsData.data || []);
            setEmrRecords(emrData.data || []);
            setPrescriptions(prescriptionsData.data || []);
            setTreatmentPlans(treatmentData.data || []);
            
            // 5. Generate notifications from fetched data
            const generatedNotifications = generateNotifications(
                appointmentsData.data || [],
                emrData.data || [],
                prescriptionsData.data || [],
                treatmentData.data || [],
                readStatusData
            );
            
            setNotifications(generatedNotifications);
            
        } catch (error: any) {
            console.error('Error in fetchAllData:', error);
            setError(error.message || 'Failed to load data. Please try again later.');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // Generate notifications from existing data with read status
    const generateNotifications = (
        appointments: Appointment[],
        emrRecords: EMRRecord[],
        prescriptions: Prescription[],
        treatmentPlans: TreatmentPlan[],
        readStatus: Record<string, boolean>
    ): GeneratedNotification[] => {
        const notifications: GeneratedNotification[] = [];
        const now = new Date();
        
        // Generate notifications from appointments
        appointments.forEach((apt) => {
            const aptDate = apt.appointment_date ? new Date(apt.appointment_date) : null;
            
            // Appointment status notifications
            if (apt.appointment_status_id) {
                const status = APPOINTMENT_STATUS[apt.appointment_status_id] || 'Updated';
                const phDate = aptDate ? formatPHDate(apt.appointment_date!) : '';
                const phTime = apt.appointment_time ? formatPHTimeOnly(apt.appointment_time) : '';
                const notificationId = generateNotificationId('apt', apt.appointment_id);
                
                notifications.push({
                    id: notificationId,
                    type: 'Appointment',
                    title: `Appointment ${status}`,
                    message: `Your appointment${phDate ? ` on ${phDate}` : ''} has been ${status.toLowerCase()}.`,
                    timestamp: apt.updated_at || apt.created_at || now.toISOString(),
                    is_read: readStatus[notificationId] || false,
                    reference_id: apt.reference_number || `APT-${apt.appointment_id}`,
                    data: apt
                });
            }
            
            // Upcoming appointment reminders (within next 3 days)
            if (aptDate && apt.appointment_status_id === 2) { // Confirmed
                const daysUntil = Math.ceil((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntil >= 0 && daysUntil <= 3) {
                    const phDate = formatPHDate(apt.appointment_date!);
                    const phTime = apt.appointment_time ? formatPHTimeOnly(apt.appointment_time) : '';
                    const notificationId = generateNotificationId('reminder', apt.appointment_id);
                    
                    let timeMessage = '';
                    if (phTime) {
                        timeMessage = ` at ${phTime}`;
                    }
                    
                    let daysMessage = '';
                    if (daysUntil === 0) {
                        daysMessage = 'today';
                    } else if (daysUntil === 1) {
                        daysMessage = 'tomorrow';
                    } else {
                        daysMessage = `in ${daysUntil} days`;
                    }
                    
                    notifications.push({
                        id: notificationId,
                        type: 'Reminder',
                        title: 'Upcoming Appointment',
                        message: `You have an appointment on ${phDate}${timeMessage} ${daysMessage}.`,
                        timestamp: apt.created_at || now.toISOString(),
                        is_read: readStatus[notificationId] || false,
                        reference_id: apt.reference_number || `APT-${apt.appointment_id}`,
                        data: apt
                    });
                }
            }
            
            // Payment notifications
            if (apt.payment_date) {
                const phPaymentDate = formatPHTime(apt.payment_date);
                const notificationId = generateNotificationId('payment', apt.appointment_id);
                
                notifications.push({
                    id: notificationId,
                    type: 'Billing',
                    title: 'Payment Received',
                    message: `Payment of ₱${apt.reservation_fee?.toFixed(2) || '0.00'} ${apt.payment_method ? `via ${apt.payment_method}` : ''} was processed on ${phPaymentDate.date}.`,
                    timestamp: apt.payment_date,
                    is_read: readStatus[notificationId] || false,
                    reference_id: apt.reference_number || `APT-${apt.appointment_id}`,
                    data: apt
                });
            }
        });
        
        // Generate notifications from EMR records
        emrRecords.forEach((emr) => {
            if (emr.date) {
                const phDate = formatPHDate(emr.date);
                const notificationId = generateNotificationId('emr', emr.id);
                
                notifications.push({
                    id: notificationId,
                    type: 'Medical',
                    title: 'Medical Record Updated',
                    message: `Your dental record has been updated on ${phDate}${emr.chief_complaint ? ` for: ${emr.chief_complaint}` : ''}.`,
                    timestamp: emr.date,
                    is_read: readStatus[notificationId] || false,
                    reference_id: `EMR-${emr.id}`,
                    data: emr
                });
            }
        });
        
        // Generate notifications from prescriptions
        prescriptions.forEach((prescription) => {
            const phDate = prescription.created_at ? formatPHDate(prescription.created_at) : '';
            const notificationId = generateNotificationId('rx', prescription.prescription_id);
            
            notifications.push({
                id: notificationId,
                type: 'Prescription',
                title: 'New Prescription',
                message: `A new prescription has been issued${phDate ? ` on ${phDate}` : ''}${prescription.instructions ? `: ${prescription.instructions}` : ''}.`,
                timestamp: prescription.created_at || new Date().toISOString(),
                is_read: readStatus[notificationId] || false,
                reference_id: `RX-${prescription.prescription_id}`,
                data: prescription
            });
        });
        
        // Generate notifications from treatment plans
        treatmentPlans.forEach((plan) => {
            const phDate = plan.created_at ? formatPHDate(plan.created_at) : '';
            const notificationId = generateNotificationId('tp', plan.treatment_id);
            
            notifications.push({
                id: notificationId,
                type: 'Medical',
                title: 'Treatment Plan Update',
                message: `Your treatment plan${plan.treatment_name ? ` for ${plan.treatment_name}` : ''} has been ${plan.treatment_status || 'updated'}${phDate ? ` on ${phDate}` : ''}.`,
                timestamp: plan.created_at || new Date().toISOString(),
                is_read: readStatus[notificationId] || false,
                reference_id: `TP-${plan.treatment_id}`,
                data: plan
            });
        });
        
        // Sort by timestamp (newest first)
        return notifications.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    };

    // Helper to get Icon based on type
    const getIcon = (type: string) => {
        switch (type) {
            case 'Appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'Billing': return <CreditCard className="w-5 h-5 text-green-500" />;
            case 'Reminder': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'Medical': return <Stethoscope className="w-5 h-5 text-purple-500" />;
            case 'Prescription': return <Pill className="w-5 h-5 text-red-500" />;
            case 'System': return <AlertCircle className="w-5 h-5 text-gray-500" />;
            default: return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    // Mark notification as read
    const markAsRead = async (id: string) => {
        if (!patientId) return;
        
        setMarkingReadId(id);
        
        try {
            // Update local state immediately for better UX
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            
            // Save to Supabase
            const success = await saveReadStatus(id, true, patientId);
            
            if (!success) {
                // Revert if save failed
                setNotifications(prev => prev.map(n => 
                    n.id === id ? { ...n, is_read: false } : n
                ));
                setError('Failed to save read status. Please try again.');
            }
        } catch (error) {
            console.error('Error marking as read:', error);
            setError('Failed to mark as read. Please try again.');
        } finally {
            setMarkingReadId(null);
        }
    };

    // Mark all notifications as read
    const markAllRead = async () => {
        if (!patientId || notifications.length === 0) return;
        
        setUpdating(true);
        
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            const unreadIds = unreadNotifications.map(n => n.id);
            
            if (unreadIds.length === 0) return;
            
            // Update local state immediately
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            
            // Save to Supabase
            const success = await saveAllReadStatus(unreadIds, patientId);
            
            if (!success) {
                // Revert if save failed
                setNotifications(prev => prev.map(n => ({
                    ...n, 
                    is_read: unreadIds.includes(n.id) ? false : n.is_read
                })));
                setError('Failed to save read status. Please try again.');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            setError('Failed to mark all as read. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(notif => {
        switch (activeTab) {
            case 'all':
                return true;
            case 'unread':
                return !notif.is_read;
            case 'appointment':
                return notif.type === 'Appointment' || notif.type === 'Reminder';
            case 'billing':
                return notif.type === 'Billing';
            case 'medical':
                return notif.type === 'Medical' || notif.type === 'Prescription';
            default:
                return true;
        }
    });

    // Filter unread count
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Format date relative to now (in Philippine time)
    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            
            // Use Intl.RelativeTimeFormat for better formatting
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
            
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
                return 'Just now';
            } else if (diffMins < 60) {
                return rtf.format(-diffMins, 'minute');
            } else if (diffHours < 24) {
                return rtf.format(-diffHours, 'hour');
            } else if (diffDays < 30) {
                return rtf.format(-diffDays, 'day');
            } else {
                // Show actual date for older notifications
                return formatPHTime(dateString).date;
            }
        } catch (e) {
            return 'Recently';
        }
    };

    // Get appointment details for notification
    const getAppointmentDetails = (notification: GeneratedNotification) => {
        if (notification.data && 'appointment_date' in notification.data) {
            const apt = notification.data as Appointment;
            const phDate = apt.appointment_date ? formatPHDate(apt.appointment_date) : '';
            const phTime = apt.appointment_time ? formatPHTimeOnly(apt.appointment_time) : '';
            
            return {
                date: phDate,
                time: phTime,
                fee: apt.reservation_fee,
                status: apt.appointment_status_id ? APPOINTMENT_STATUS[apt.appointment_status_id] : 'Unknown',
                rawDate: apt.appointment_date,
                rawTime: apt.appointment_time
            };
        }
        return null;
    };

    // Handle notification click
    const handleNotificationClick = (notif: GeneratedNotification) => {
        if (!notif.is_read) {
            markAsRead(notif.id);
        }
        
        // Optional: Navigate to relevant page based on notification type
        switch (notif.type) {
            case 'Appointment':
            case 'Reminder':
                navigate('/patient/appointments');
                break;
            case 'Medical':
            case 'Prescription':
                navigate('/patient/records');
                break;
            case 'Billing':
                navigate('/patient/billing');
                break;
            // Add more cases as needed
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <Button 
                            variant="ghost" 
                            className="pl-0 hover:bg-transparent hover:text-primary mb-1"
                            onClick={() => navigate('/patient')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">
                            Loading your notifications...
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Fetching your data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Button 
                        variant="ghost" 
                        className="pl-0 hover:bg-transparent hover:text-primary mb-1"
                        onClick={() => navigate('/patient')}
                        disabled={updating}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full px-2">
                                {unreadCount} New
                            </Badge>
                        )}
                        {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    <p className="text-muted-foreground">
                        Updates from your appointments, medical records, and prescriptions.
                    </p>
                    {patient && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Patient: {patient.f_name} {patient.l_name}
                        </p>
                    )}
                    {error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                            <Button 
                                variant="link" 
                                className="p-0 h-auto text-xs text-red-600" 
                                onClick={fetchAllData}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
                <Button 
                    variant="outline" 
                    onClick={markAllRead} 
                    disabled={unreadCount === 0 || updating}
                >
                    {updating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4 mr-2" />
                    )}
                    Mark all as read
                </Button>
            </div>

            {/* Notification List */}
            <Card className="border-none shadow-md">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="appointment">
                                Appointments ({notifications.filter(n => n.type === 'Appointment' || n.type === 'Reminder').length})
                            </TabsTrigger>
                            <TabsTrigger value="billing">
                                Billing ({notifications.filter(n => n.type === 'Billing').length})
                            </TabsTrigger>
                            <TabsTrigger value="medical">
                                Medical ({notifications.filter(n => n.type === 'Medical' || n.type === 'Prescription').length})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y">
                            {filteredNotifications.length > 0 ? (
                                filteredNotifications.map((notif) => {
                                    const aptDetails = getAppointmentDetails(notif);
                                    const isMarking = markingReadId === notif.id;
                                    
                                    return (
                                        <div 
                                            key={notif.id} 
                                            className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 cursor-pointer ${!notif.is_read ? 'bg-primary/5' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            {/* Icon Column */}
                                            <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-white shadow-sm ring-1 ring-inset ring-gray-200' : 'bg-muted'}`}>
                                                {isMarking ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                ) : (
                                                    getIcon(notif.type)
                                                )}
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {notif.type}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                        {formatRelativeTime(notif.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground pr-4">
                                                    {notif.message}
                                                </p>
                                                
                                                {/* Additional appointment details */}
                                                {aptDetails && (
                                                    <div className="pt-2 space-y-1">
                                                        {aptDetails.date && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>
                                                                    Date: {aptDetails.date}
                                                                    {aptDetails.time && ` at ${aptDetails.time}`}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {aptDetails.status && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Status: {aptDetails.status}
                                                            </div>
                                                        )}
                                                        {aptDetails.fee && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Fee: ₱{aptDetails.fee.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Context Badge */}
                                                {notif.reference_id && (
                                                    <div className="pt-2">
                                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-white">
                                                            Ref: {notif.reference_id}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Unread Indicator Dot */}
                                            {!notif.is_read && !isMarking && (
                                                <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No notifications to display.</p>
                                    <p className="text-sm mt-1">
                                        {activeTab === 'unread' 
                                            ? 'All notifications are read.' 
                                            : activeTab === 'appointment'
                                            ? 'No appointment notifications.'
                                            : activeTab === 'billing'
                                            ? 'No billing notifications.'
                                            : activeTab === 'medical'
                                            ? 'No medical notifications.'
                                            : 'Try selecting a different category.'}
                                    </p>
                                    {error && !notifications.length && (
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={fetchAllData}
                                        >
                                            Retry Loading
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            
            {/* Data Summary */}
            {notifications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Appointments: {appointments.length}</span>
                        </div>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Medical Records: {emrRecords.length}</span>
                        </div>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            <span>Prescriptions: {prescriptions.length}</span>
                        </div>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            <span>Treatment Plans: {treatmentPlans.length}</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Timezone Note */}
            <div className="text-xs text-muted-foreground text-center italic">
                All times are displayed in Philippine Standard Time (PHT)
            </div>
            
            {/* Refresh Button */}
            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={fetchAllData}
                    disabled={loading || updating}
                    className="flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        <>
                            Refresh Notifications
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}