import React from 'react';
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
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// --- Types based on PDF EMR Contents ---

// BEFORE CARE [cite: 222-248]
interface MedicalProfile {
    allergies: string[]; // [cite: 233]
    healthProblems: string[]; // [cite: 234]
    currentMedicines: string[]; // [cite: 235]
}

interface TestResult {
    id: string;
    type: 'Panoramic X-ray' | 'Periapical X-ray' | 'Blood Test'; // [cite: 238, 241, 244]
    date: string;
    fileName: string; // [cite: 240, 243]
}

interface PlannedService {
    id: number;
    category: string; // [cite: 246]
    serviceSelected: string; // [cite: 247]
    remarks: string; // [cite: 248]
    status: 'Pending' | 'Scheduled';
}

// AFTER CARE [cite: 249-276]
interface TreatmentRecord {
    id: number;
    dateOfVisit: string; // [cite: 253]
    dentistName: string; // [cite: 259]
    
    // Treatment Done
    serviceGiven: string; // [cite: 255]
    whatWasDone: string; // 

    // Medicines [cite: 260-263]
    medicines: {
        name: string;
        howOften: string; // [cite: 262]
        howManyDays: string; // [cite: 263]
    }[];

    // Home Care 
    homeCare: {
        whatToDo: string[];   // [cite: 265]
        whatToAvoid: string[]; // [cite: 269]
        warningSigns: string[]; // [cite: 273]
    };
}

// --- Mock Data Matching PDF Examples ---

const MEDICAL_PROFILE: MedicalProfile = {
    allergies: ["Penicillin"], // [cite: 233]
    healthProblems: ["None"],  // [cite: 234]
    currentMedicines: ["None"] // [cite: 235]
};

const TEST_RESULTS: TestResult[] = [
    {
        id: 'XR-001',
        type: 'Panoramic X-ray',
        date: '2025-10-01',
        fileName: 'panoramic_xray_jmreyes.pdf' // [cite: 240]
    },
    {
        id: 'XR-002',
        type: 'Periapical X-ray',
        date: '2025-10-01',
        fileName: 'periapical_xray_jmreyes.pdf' // [cite: 243]
    }
];

const PLANNED_SERVICES: PlannedService[] = [
    {
        id: 1,
        category: "Orthodontics",
        serviceSelected: "Metallic Braces Initial Placement",
        remarks: "Patient cleared for installation next week.",
        status: "Scheduled"
    }
];

const TREATMENT_HISTORY: TreatmentRecord[] = [
    {
        id: 101,
        dateOfVisit: "November 1, 2025", // [cite: 253]
        dentistName: "Dr. Patricia Gomez, DMD", // [cite: 259]
        serviceGiven: "General Consultation and Cleaning / Oral Prophylaxis", // [cite: 255]
        whatWasDone: "Conducted full oral examination and teeth cleaning. The patient was advised to return for orthodontic fitting after one week. Discussed oral hygiene and proper brushing techniques.", // [cite: 256-258]
        medicines: [
            {
                name: "Paracetamol 500mg", // [cite: 261]
                howOften: "Every 6 hours as needed", // [cite: 262]
                howManyDays: "2 days" // [cite: 263]
            }
        ],
        homeCare: {
            whatToDo: [ // [cite: 265-268]
                "Brush teeth twice daily using fluoride toothpaste.",
                "Rinse your mouth gently after meals.",
                "Maintain regular dental check-ups."
            ],
            whatToAvoid: [ // [cite: 269-272]
                "Avoid sticky and hard foods after cleaning.",
                "Do not skip brushing before sleeping.",
                "Avoid smoking and excessive coffee intake."
            ],
            warningSigns: [ // [cite: 273-276]
                "Persistent bleeding gums",
                "Pain lasting more than 48 hours",
                "Swelling or infection at treated areas"
            ]
        }
    }
];

export default function MedicalRecordsPage() {
    const navigate = useNavigate();

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
                        View your Before Care and After Care records.
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Download Full EMR
                </Button>
            </div>

            <Tabs defaultValue="after-care" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-4">
                    <TabsTrigger value="after-care">After Care EMR</TabsTrigger>
                    <TabsTrigger value="before-care">Before Care EMR</TabsTrigger>
                </TabsList>

                {/* --- AFTER CARE EMR TAB [cite: 249] --- */}
                <TabsContent value="after-care" className="space-y-6">
                    {TREATMENT_HISTORY.map((record) => (
                        <Card key={record.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl text-primary">{record.serviceGiven}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4" /> {record.dateOfVisit}
                                            <span className="text-gray-300">|</span>
                                            <Stethoscope className="w-4 h-4" /> {record.dentistName}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Completed
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                
                                {/* 2.2 What Was Done  */}
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
                                        <Activity className="w-4 h-4 text-primary" /> What Was Done
                                    </h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                        {record.whatWasDone}
                                    </p>
                                </div>

                                <Separator />

                                {/* 3. Medicines [cite: 260] */}
                                {record.medicines.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-900">
                                            <Pill className="w-4 h-4 text-primary" /> Medicines Prescribed
                                        </h4>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {record.medicines.map((med, idx) => (
                                                <div key={idx} className="flex flex-col p-3 rounded-lg border bg-blue-50/50 border-blue-100">
                                                    <span className="font-bold text-blue-900">{med.name}</span>
                                                    <div className="text-sm text-blue-700 mt-1">
                                                        <span className="font-medium">How Often:</span> {med.howOften}
                                                    </div>
                                                    <div className="text-sm text-blue-700">
                                                        <span className="font-medium">How Many Days:</span> {med.howManyDays}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* 4. Home Care [cite: 264] */}
                                <div>
                                    <h4 className="font-semibold mb-4 text-gray-900">Home Care Instructions</h4>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* What To Do [cite: 265] */}
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-bold text-green-700 flex items-center gap-2 uppercase">
                                                <CheckCircle2 className="w-4 h-4" /> What to Do
                                            </h5>
                                            <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                {record.homeCare.whatToDo.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* What To Avoid [cite: 269] */}
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-bold text-orange-700 flex items-center gap-2 uppercase">
                                                <XCircle className="w-4 h-4" /> What to Avoid
                                            </h5>
                                            <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                {record.homeCare.whatToAvoid.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Warning Signs [cite: 273] */}
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-bold text-red-700 flex items-center gap-2 uppercase">
                                                <AlertTriangle className="w-4 h-4" /> Warning Signs
                                            </h5>
                                            <ul className="text-sm space-y-2 text-gray-600 list-disc pl-4">
                                                {record.homeCare.warningSigns.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* --- BEFORE CARE EMR TAB [cite: 222] --- */}
                <TabsContent value="before-care" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 2. Medical History [cite: 232] */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" /> Medical History
                                </CardTitle>
                                <CardDescription>Allergies and existing conditions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Allergies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {MEDICAL_PROFILE.allergies.map(a => (
                                            <Badge key={a} variant="destructive">{a}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Health Problems</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {MEDICAL_PROFILE.healthProblems.map(p => (
                                            <Badge key={p} variant="outline">{p}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Medicines</h4>
                                    <p className="text-sm text-gray-900">
                                        {MEDICAL_PROFILE.currentMedicines.length > 0 
                                            ? MEDICAL_PROFILE.currentMedicines.join(", ") 
                                            : "None recorded"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Tests (X-Rays) [cite: 236] */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary" /> Tests & Imaging
                                </CardTitle>
                                <CardDescription>X-rays and lab results.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-3">
                                        {TEST_RESULTS.map((test) => (
                                            <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 p-2 rounded-md">
                                                        <FileText className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{test.type}</p>
                                                        <p className="text-xs text-muted-foreground">{test.fileName}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-8">
                                                    Download
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Planned Service [cite: 245] */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Planned Services (Treatment Plan)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {PLANNED_SERVICES.map((plan) => (
                                    <div key={plan.id} className="flex flex-col sm:flex-row justify-between items-start p-4 border rounded-lg bg-yellow-50/50 border-yellow-100">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-white">{plan.category}</Badge>
                                                <h4 className="font-semibold text-gray-900">{plan.serviceSelected}</h4>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">
                                                <span className="font-medium">Remarks:</span> {plan.remarks}
                                            </p>
                                        </div>
                                        <Badge className="mt-2 sm:mt-0 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                                            {plan.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* AUTOMATED PROCESS INFO  */}
            <Card className="bg-primary/5 border-primary/20 mt-8">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                        <Info className="w-4 h-4" /> How This Data is Updated
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>You submit personal and medical forms directly through the online portal.</li>
                        <li>Data is automatically stored and synced with the clinic's database.</li>
                        <li>The Dentist receives instant access to your EMR for review before every appointment.</li>
                        <li>Treatment updates (After Care) are added by the dentist immediately after your visit.</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}