
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Activity,
    ImageIcon,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Pill,
    Download,
    Stethoscope,
    Info,
    Loader2,
    Clock,
    User,
    ClipboardList,
    FileSearch,
    Zap,
    Eye,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase';

// --- Types ---
interface EMRRecord {
    id: number;
    patient_id: number;
    date: string;
    time: string;
    chief_complaint: string;
    diagnosis: string;
    treatment: number;
    notes: string;
    dentist: number;
    status: string;
    what_was_done: string;
    medicines: any;
    home_care: any;
    service_name?: string;
    dentist_name?: string;
}

interface TreatmentPlan {
    treatment_id: number;
    patient_id: number;
    personnel_id: number;
    treatment_name: string;
    description: string;
    treatment_status: string;
    created_at: string;
    dentist_name?: string;
}

interface Prescription {
    prescription_id: number;
    medicine_id: number;
    instructions: string;
    dosage: string;
    created_at: string;
    duration: string;
    quantity: string;
    frequency: string;
    personnel_id: number;
    medicine_name?: string;
    dentist_name?: string;
}

// NEW: Dental Chart Interface based on patient_teeth table
interface ToothRecord {
    id: number;
    patient_id: number;
    tooth_number: number;
    condition_id: number | null;
    notes: string | null;
    procedure_type: string | null;
    emr_record_id: number | null;
    condition_name?: string;
    condition_description?: string;
    emr_date?: string;
}

// Tooth condition mapping based on IDs
const TOOTH_CONDITIONS: Record<number, { name: string; description: string; color: string }> = {
    1: { name: 'Healthy', description: 'Tooth is in good condition', color: 'bg-green-500' },
    2: { name: 'Missing', description: 'Tooth is missing', color: 'bg-gray-500' },
    3: { name: 'Filling', description: 'Tooth has a filling', color: 'bg-blue-500' },
    4: { name: 'Implant', description: 'Tooth has an implant', color: 'bg-purple-500' },
    5: { name: 'Crown', description: 'Tooth has a crown', color: 'bg-yellow-500' },
    6: { name: 'Root Canal', description: 'Tooth has root canal treatment', color: 'bg-red-500' },
};

export default function MedicalRecordsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
    const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [toothRecords, setToothRecords] = useState<ToothRecord[]>([]); // Replaced appointments with tooth records
    const [patientInfo, setPatientInfo] = useState<any>(null);
    const [loadingTeeth, setLoadingTeeth] = useState(false);

    useEffect(() => {
        fetchMedicalData();
    }, []);

    const fetchMedicalData = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('No user logged in', userError);
                navigate('/login');
                return;
            }

            // Fetch patient data to get patient_id and basic info
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

            setPatientInfo(patientData);

            // Fetch all data in parallel
            await Promise.all([
                fetchEMRRecords(patientData.patient_id),
                fetchTreatmentPlans(patientData.patient_id),
                fetchPrescriptions(patientData.patient_id),
                fetchToothRecords(patientData.patient_id) // Replaced appointments with tooth records
            ]);

        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEMRRecords = async (patientId: number) => {
        try {
            console.log('Fetching EMR records for patient:', patientId);
            
            const { data: simpleData, error: simpleError } = await supabase
                .schema('patient_record')
                .from('emr_records')
                .select('*')
                .eq('patient_id', patientId)
                .order('date', { ascending: false });

            if (simpleError) {
                console.error('Error fetching EMR records:', simpleError);
                setEmrRecords([]);
                return;
            }

            // Parse the data
            const parsedRecords = (simpleData || []).map((record: any) => {
                let medicines = [];
                let home_care = { whatToDo: [], whatToAvoid: [], warningSigns: [] };
                
                if (record.medicines) {
                    try {
                        medicines = typeof record.medicines === 'string' 
                            ? JSON.parse(record.medicines) 
                            : record.medicines;
                    } catch {
                        medicines = [];
                    }
                }

                if (record.home_care) {
                    try {
                        home_care = typeof record.home_care === 'string'
                            ? JSON.parse(record.home_care)
                            : record.home_care;
                    } catch {
                        home_care = { whatToDo: [], whatToAvoid: [], warningSigns: [] };
                    }
                }

                return {
                    ...record,
                    medicines,
                    home_care,
                    service_name: 'Dental Service',
                    dentist_name: 'Dentist'
                };
            });

            console.log('EMR Records found:', parsedRecords.length);
            setEmrRecords(parsedRecords);

        } catch (error) {
            console.error('Error in fetchEMRRecords:', error);
            setEmrRecords([]);
        }
    };

    const fetchTreatmentPlans = async (patientId: number) => {
        try {
            console.log('Fetching treatment plans for patient:', patientId);
            
            const { data, error } = await supabase
                .schema('dentist')
                .from('treatment_plan_tbl')
                .select(`
                    *,
                    personnel_tbl:public.personnel_tbl(f_name, l_name)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching treatment plans:', error);
                // Try simple query without join
                const { data: simpleData, error: simpleError } = await supabase
                    .schema('dentist')
                    .from('treatment_plan_tbl')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false });

                if (simpleError) {
                    console.error('Error fetching simple treatment plans:', simpleError);
                    setTreatmentPlans([]);
                    return;
                }

                const plans = (simpleData || []).map((plan: any) => ({
                    ...plan,
                    dentist_name: 'Dentist'
                }));

                setTreatmentPlans(plans);
                return;
            }

            const plans = (data || []).map((plan: any) => ({
                ...plan,
                dentist_name: plan.personnel_tbl ? 
                    `Dr. ${plan.personnel_tbl.f_name} ${plan.personnel_tbl.l_name}` : 
                    'Dentist'
            }));

            console.log('Treatment plans found:', plans.length);
            setTreatmentPlans(plans);

        } catch (error) {
            console.error('Error in fetchTreatmentPlans:', error);
            setTreatmentPlans([]);
        }
    };

    const fetchPrescriptions = async (patientId: number) => {
        try {
            console.log('Fetching prescriptions for patient:', patientId);
            
            const { data, error } = await supabase
                .schema('dentist')
                .from('prescription_tbl')
                .select(`
                    *,
                    medicine_tbl:inventory.medicine_tbl(medicine_name),
                    personnel_tbl:public.personnel_tbl(f_name, l_name)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching prescriptions:', error);
                // Try simple query
                const { data: simpleData, error: simpleError } = await supabase
                    .schema('dentist')
                    .from('prescription_tbl')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (simpleError) {
                    console.error('Error fetching simple prescriptions:', simpleError);
                    setPrescriptions([]);
                    return;
                }

                const prescriptions = (simpleData || []).map((rx: any) => ({
                    ...rx,
                    medicine_name: 'Medicine',
                    dentist_name: 'Dentist'
                }));

                setPrescriptions(prescriptions);
                return;
            }

            const prescriptions = (data || []).map((rx: any) => ({
                ...rx,
                medicine_name: rx.medicine_tbl?.medicine_name || 'Medicine',
                dentist_name: rx.personnel_tbl ? 
                    `Dr. ${rx.personnel_tbl.f_name} ${rx.personnel_tbl.l_name}` : 
                    'Dentist'
            }));

            console.log('Prescriptions found:', prescriptions.length);
            setPrescriptions(prescriptions);

        } catch (error) {
            console.error('Error in fetchPrescriptions:', error);
            setPrescriptions([]);
        }
    };

    // NEW: Fetch tooth records from patient_teeth table
    const fetchToothRecords = async (patientId: number) => {
        try {
            setLoadingTeeth(true);
            console.log('Fetching tooth records for patient:', patientId);
            
            // Fetch tooth records with condition information from tooth_conditions table
            const { data, error } = await supabase
                .schema('patient_record')
                .from('patient_teeth')
                .select(`
                    *,
                    tooth_conditions:condition_id (
                        condition_name,
                        description
                    ),
                    emr_records:emr_record_id (
                        date
                    )
                `)
                .eq('patient_id', patientId)
                .order('tooth_number', { ascending: true });

            if (error) {
                console.error('Error fetching tooth records:', error);
                
                // Try simple query without joins
                const { data: simpleData, error: simpleError } = await supabase
                    .schema('patient_record')
                    .from('patient_teeth')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('tooth_number', { ascending: true });

                if (simpleError) {
                    console.error('Error fetching simple tooth records:', simpleError);
                    setToothRecords([]);
                    return;
                }

                // Map condition_id to condition name using the TOOTH_CONDITIONS mapping
                const teethRecords = (simpleData || []).map((record: any) => {
                    const condition = TOOTH_CONDITIONS[record.condition_id] || 
                                     { name: 'Unknown', description: null, color: 'bg-gray-400' };
                    return {
                        ...record,
                        condition_name: condition.name,
                        condition_description: condition.description,
                        emr_date: null
                    };
                });

                setToothRecords(teethRecords);
                return;
            }

            // Transform the data - prioritize database values, fallback to ID mapping
            const teethRecords = (data || []).map((record: any) => {
                // Use database values if available, otherwise use ID mapping
                const conditionName = record.tooth_conditions?.condition_name || 
                                    (TOOTH_CONDITIONS[record.condition_id]?.name || 'Unknown');
                const conditionDesc = record.tooth_conditions?.description || 
                                    (TOOTH_CONDITIONS[record.condition_id]?.description || null);
                
                return {
                    ...record,
                    condition_name: conditionName,
                    condition_description: conditionDesc,
                    emr_date: record.emr_records?.date || null
                };
            });

            console.log('Tooth records found:', teethRecords.length);
            setToothRecords(teethRecords);

        } catch (error) {
            console.error('Error in fetchToothRecords:', error);
            setToothRecords([]);
        } finally {
            setLoadingTeeth(false);
        }
    };

    const formatTimeToAMPM = (timeStr: string) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${period}`;
        } catch {
            return timeStr;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return dateStr;
        }
    };

    const getTreatmentStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'completed': 'bg-green-100 text-green-800 border-green-200',
            'cancelled': 'bg-red-100 text-red-800 border-red-200',
        };
        return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Helper function to get color based on tooth condition (using ID mapping)
    const getConditionColor = (conditionId: number | null, conditionName?: string) => {
        if (conditionId && TOOTH_CONDITIONS[conditionId]) {
            return TOOTH_CONDITIONS[conditionId].color;
        }
        
        // Fallback to condition name if ID is not mapped
        const conditionMap: Record<string, string> = {
            'healthy': 'bg-green-500',
            'missing': 'bg-gray-500',
            'filling': 'bg-blue-500',
            'implant': 'bg-purple-500',
            'crown': 'bg-yellow-500',
            'root canal': 'bg-red-500',
            'decay': 'bg-red-600',
            'restoration': 'bg-blue-400',
            'caries': 'bg-red-500',
            'extracted': 'bg-gray-500',
            'impacted': 'bg-orange-500',
            'cracked': 'bg-orange-500',
            'fractured': 'bg-orange-600',
            'periodontitis': 'bg-yellow-600',
            'gingivitis': 'bg-yellow-400',
        };
        
        return conditionMap[conditionName?.toLowerCase()] || 'bg-gray-400';
    };

    // Helper to get condition name from ID
    const getConditionName = (conditionId: number | null) => {
        if (conditionId && TOOTH_CONDITIONS[conditionId]) {
            return TOOTH_CONDITIONS[conditionId].name;
        }
        return 'Unknown';
    };

    const handleDownloadFullEMR = async () => {
        try {
            const emrData = {
                patient: patientInfo,
                afterCareRecords: emrRecords,
                treatmentPlans: treatmentPlans,
                prescriptions: prescriptions,
                dentalChart: toothRecords
            };
            
            const dataStr = JSON.stringify(emrData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_records_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error downloading EMR:', error);
            alert('Error downloading medical records');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading medical records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Button 
                        variant="ghost" 
                        className="pl-0 hover:bg-transparent hover:text-primary mb-1"
                        onClick={() => navigate('/patient')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Electronic Medical Record (EMR)</h1>
                    <p className="text-muted-foreground">
                        View your complete medical history and treatment records.
                    </p>
                </div>
                <Button variant="outline" onClick={handleDownloadFullEMR}>
                    <Download className="w-4 h-4 mr-2" /> Download Full EMR
                </Button>
            </div>

            {/* Patient Info Card */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold">
                                {patientInfo ? `${patientInfo.f_name} ${patientInfo.l_name}` : 'Loading...'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Patient ID: {patientInfo?.patient_id} • Member since 2024
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="bg-white">
                                    {patientInfo?.account_status || 'Active'}
                                </Badge>
                                <Badge variant="outline" className="bg-white">
                                    {patientInfo?.city || 'City'}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Contact</p>
                            <p className="font-medium">{patientInfo?.pri_contact_no || 'No contact'}</p>
                            <p className="text-sm text-muted-foreground">{patientInfo?.email || 'No email'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="after-care" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-4">
                    <TabsTrigger value="after-care">After Care EMR</TabsTrigger>
                    <TabsTrigger value="before-care">Before Care EMR</TabsTrigger>
                </TabsList>

                {/* --- AFTER CARE EMR TAB --- */}
                <TabsContent value="after-care" className="space-y-6">
                    {emrRecords.length > 0 ? (
                        emrRecords.map((record) => {
                            // Parse data safely
                            let medicines = [];
                            let home_care = { whatToDo: [], whatToAvoid: [], warningSigns: [] };
                            
                            try {
                                medicines = Array.isArray(record.medicines) ? record.medicines : 
                                    typeof record.medicines === 'string' ? JSON.parse(record.medicines) : [];
                            } catch {
                                medicines = [];
                            }
                            
                            try {
                                home_care = record.home_care && typeof record.home_care === 'object' ? record.home_care :
                                    typeof record.home_care === 'string' ? JSON.parse(record.home_care) : 
                                    { whatToDo: [], whatToAvoid: [], warningSigns: [] };
                            } catch {
                                home_care = { whatToDo: [], whatToAvoid: [], warningSigns: [] };
                            }

                            return (
                                <Card key={record.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm">
                                    <CardHeader className="bg-muted/30 pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl text-primary">
                                                    {record.service_name || 'Treatment Record'}
                                                </CardTitle>
                                                <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" /> {formatDate(record.date)}
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" /> {formatTimeToAMPM(record.time)}
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="flex items-center gap-1">
                                                        <Stethoscope className="w-4 h-4" /> {record.dentist_name}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {record.status || 'Completed'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        
                                        {/* Chief Complaint & Diagnosis */}
                                        {(record.chief_complaint || record.diagnosis) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {record.chief_complaint && (
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
                                                            <Activity className="w-4 h-4 text-primary" /> Chief Complaint
                                                        </h4>
                                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                                            {record.chief_complaint}
                                                        </p>
                                                    </div>
                                                )}
                                                {record.diagnosis && (
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
                                                            <Activity className="w-4 h-4 text-primary" /> Diagnosis
                                                        </h4>
                                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                                            {record.diagnosis}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(record.chief_complaint || record.diagnosis) && <Separator />}

                                        {/* What Was Done */}
                                        {(record.what_was_done || record.notes) && (
                                            <div>
                                                <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
                                                    <Activity className="w-4 h-4 text-primary" /> Treatment Details
                                                </h4>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                                    {record.what_was_done || record.notes}
                                                </p>
                                            </div>
                                        )}

                                        {medicines.length > 0 && (
                                            <>
                                                <Separator />
                                                {/* Medicines */}
                                                <div>
                                                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-900">
                                                        <Pill className="w-4 h-4 text-primary" /> Medicines Prescribed
                                                    </h4>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {medicines.map((med: any, idx: number) => (
                                                            <div key={idx} className="flex flex-col p-3 rounded-lg border bg-blue-50/50 border-blue-100">
                                                                <span className="font-bold text-blue-900">{med.name || 'Medicine'}</span>
                                                                {med.howOften && (
                                                                    <div className="text-sm text-blue-700 mt-1">
                                                                        <span className="font-medium">How Often:</span> {med.howOften}
                                                                    </div>
                                                                )}
                                                                {med.howManyDays && (
                                                                    <div className="text-sm text-blue-700">
                                                                        <span className="font-medium">How Many Days:</span> {med.howManyDays}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {(home_care.whatToDo?.length > 0 || home_care.whatToAvoid?.length > 0 || home_care.warningSigns?.length > 0) && (
                                            <>
                                                <Separator />
                                                {/* Home Care */}
                                                <div>
                                                    <h4 className="font-semibold mb-4 text-gray-900">Home Care Instructions</h4>
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        {/* What To Do */}
                                                        {home_care.whatToDo?.length > 0 && (
                                                            <div className="space-y-3">
                                                                <h5 className="text-sm font-bold text-green-700 flex items-center gap-2 uppercase">
                                                                    <CheckCircle2 className="w-4 h-4" /> What to Do
                                                                </h5>
                                                                <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                                    {home_care.whatToDo.map((item: string, i: number) => (
                                                                        <li key={i}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* What To Avoid */}
                                                        {home_care.whatToAvoid?.length > 0 && (
                                                            <div className="space-y-3">
                                                                <h5 className="text-sm font-bold text-orange-700 flex items-center gap-2 uppercase">
                                                                    <XCircle className="w-4 h-4" /> What to Avoid
                                                                </h5>
                                                                <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                                    {home_care.whatToAvoid.map((item: string, i: number) => (
                                                                        <li key={i}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Warning Signs */}
                                                        {home_care.warningSigns?.length > 0 && (
                                                            <div className="space-y-3">
                                                                <h5 className="text-sm font-bold text-red-700 flex items-center gap-2 uppercase">
                                                                    <AlertTriangle className="w-4 h-4" /> Warning Signs
                                                                </h5>
                                                                <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                                    {home_care.warningSigns.map((item: string, i: number) => (
                                                                        <li key={i}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">No After Care Records Found</h3>
                                <p className="text-muted-foreground">
                                    Your treatment records will appear here after your dental visits.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* --- BEFORE CARE EMR TAB --- */}
                <TabsContent value="before-care" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Treatment Plans */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-primary" /> Treatment Plans
                                </CardTitle>
                                <CardDescription>
                                    {treatmentPlans.length > 0 
                                        ? `You have ${treatmentPlans.length} treatment plan${treatmentPlans.length !== 1 ? 's' : ''}`
                                        : 'No treatment plans'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-3">
                                        {treatmentPlans.length > 0 ? (
                                            treatmentPlans.map((plan) => (
                                                <div key={plan.treatment_id} className="p-3 border rounded-lg bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-indigo-900">{plan.treatment_name}</span>
                                                        <Badge variant="outline" className={`${getTreatmentStatusBadge(plan.treatment_status)}`}>
                                                            {plan.treatment_status || 'Pending'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {plan.description || 'No description provided'}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                        <span>By: {plan.dentist_name}</span>
                                                        <span>{formatDate(plan.created_at)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-muted-foreground">No treatment plans found</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Prescriptions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-primary" /> Prescriptions
                                </CardTitle>
                                <CardDescription>
                                    {prescriptions.length > 0 
                                        ? `You have ${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''}`
                                        : 'No prescriptions'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-3">
                                        {prescriptions.length > 0 ? (
                                            prescriptions.map((rx) => (
                                                <div key={rx.prescription_id} className="p-3 border rounded-lg bg-blue-50/50 border-blue-100 hover:bg-blue-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-blue-900">{rx.medicine_name}</span>
                                                        <Badge variant="outline" className="bg-white">
                                                            {rx.dosage}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Instructions:</span> {rx.instructions || 'Take as directed'}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-blue-700">
                                                        {rx.frequency && (
                                                            <div>
                                                                <span className="font-medium">Frequency:</span> {rx.frequency}
                                                            </div>
                                                        )}
                                                        {rx.duration && (
                                                            <div>
                                                                <span className="font-medium">Duration:</span> {rx.duration}
                                                            </div>
                                                        )}
                                                        {rx.quantity && (
                                                            <div>
                                                                <span className="font-medium">Quantity:</span> {rx.quantity}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                        <span>Prescribed by: {rx.dentist_name}</span>
                                                        <span>{formatDate(rx.created_at)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-muted-foreground">No prescriptions found</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* NEW: Dental Chart Table - Patient Teeth Records */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary" /> Dental Chart & Tooth Conditions
                            </CardTitle>
                            <CardDescription>
                                Current dental status based on patient_teeth table records
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingTeeth ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    <p>Loading dental chart...</p>
                                </div>
                            ) : toothRecords.length > 0 ? (
                                <>
                                    <div className="border rounded-lg overflow-hidden mb-4">
                                        <div className="grid grid-cols-12 bg-muted/50 border-b text-sm font-medium">
                                            <div className="col-span-1 p-3 border-r text-center">Tooth #</div>
                                            <div className="col-span-2 p-3 border-r">Condition</div>
                                            <div className="col-span-3 p-3 border-r">Notes</div>
                                            <div className="col-span-3 p-3 border-r">Procedure Type</div>
                                            <div className="col-span-3 p-3">EMR Record</div>
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            {toothRecords.map((tooth) => (
                                                <div key={tooth.id} className="grid grid-cols-12 border-b hover:bg-muted/30 transition-colors">
                                                    <div className="col-span-1 p-3 border-r text-center font-bold">
                                                        {tooth.tooth_number}
                                                    </div>
                                                    <div className="col-span-2 p-3 border-r flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getConditionColor(tooth.condition_id, tooth.condition_name)}`} />
                                                        <span className="truncate">{tooth.condition_name || getConditionName(tooth.condition_id)}</span>
                                                    </div>
                                                    <div className="col-span-3 p-3 border-r text-sm">
                                                        {tooth.notes || (
                                                            <span className="text-gray-400 italic">No notes</span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-3 p-3 border-r">
                                                        {tooth.procedure_type ? (
                                                            <Badge variant="outline" className="bg-blue-50">
                                                                {tooth.procedure_type}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-400 italic">None</span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-3 p-3">
                                                        {tooth.emr_record_id ? (
                                                            <div className="space-y-1">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    EMR-{tooth.emr_record_id}
                                                                </Badge>
                                                                {tooth.emr_date && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatDate(tooth.emr_date)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-gray-50">
                                                                Not linked
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span>Healthy (1)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                                            <span>Missing (2)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <span>Filling (3)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                                            <span>Implant (4)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <span>Crown (5)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <span>Root Canal (6)</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-semibold mb-2">No Dental Chart Records Found</h3>
                                    <p className="text-muted-foreground">
                                        Your dental chart will be updated after your oral examination.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Medical History Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSearch className="w-5 h-5 text-primary" /> Medical History
                            </CardTitle>
                            <CardDescription>
                                Allergies, health problems, and current medicines
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg bg-yellow-50/50 border-yellow-100">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-800 mb-1">Medical Information</h4>
                                            <p className="text-sm text-gray-600">
                                                Your medical history will be recorded by your dentist during your consultation.
                                                Please inform your dentist about any allergies, existing health conditions, or current medications.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center p-3 border rounded-lg">
                                        <div className="font-semibold text-gray-700">Allergies</div>
                                        <div className="text-muted-foreground mt-1">To be recorded</div>
                                    </div>
                                    <div className="text-center p-3 border rounded-lg">
                                        <div className="font-semibold text-gray-700">Health Problems</div>
                                        <div className="text-muted-foreground mt-1">To be recorded</div>
                                    </div>
                                    <div className="text-center p-3 border rounded-lg">
                                        <div className="font-semibold text-gray-700">Current Medicines</div>
                                        <div className="text-muted-foreground mt-1">To be recorded</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* AUTOMATED PROCESS INFO */}
            <Card className="bg-primary/5 border-primary/20 mt-8">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                        <Info className="w-4 h-4" /> How This Data is Updated
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>Treatment plans and prescriptions are created by your dentist.</li>
                        <li>After Care records are added immediately after each dental visit.</li>
                        <li>Dental chart data is updated during oral examinations using the patient_teeth table.</li>
                        <li>Medical history is recorded during your initial consultation.</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
