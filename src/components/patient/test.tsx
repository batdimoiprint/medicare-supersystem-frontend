import { useState} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Loader2, CheckCircle, Info } from "lucide-react";

// --- Mock Database Data ---
const SERVICE_CATEGORIES = [
    { id: '1', name: 'General Dentistry' },
    { id: '2', name: 'Cosmetic Dentistry' },
    { id: '3', name: 'Orthodontics' },
];

const SERVICES = [
    { id: '101', categoryId: '1', name: 'Dental Cleaning', fee: 500 },
    { id: '102', categoryId: '1', name: 'Comprehensive Checkup', fee: 300 },
    { id: '201', categoryId: '2', name: 'Teeth Whitening', fee: 5000 },
    { id: '202', categoryId: '2', name: 'Veneers', fee: 15000 },
    { id: '301', categoryId: '3', name: 'Braces Adjustment', fee: 1000 },
];

const DENTISTS = [
    { id: '1', name: 'Dr. Evelyn Reyes' },
    { id: '2', name: 'Dr. Mark Santos' },
];

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

// --- Types matching tbl_appointments ---
interface AppointmentFormData {
    // Patient Snapshot Data (Required by schema)
    full_name: string;
    contact_number: string;
    address: string;
    email: string;
    
    // Clinical Data
    service_category_id: string;
    service_id: string;
    dentist_id: string; // Nullable in schema, but usually required in UI
    
    // Scheduling
    date: string; // Combined later for appointment_datetime
    time: string;
    
    // Extras
    notes: string; // Nullable in schema
}

interface BookAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
    const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success
    
    // Initialize with "Logged In" user data (Simulating the Patient ID fetch)
    const [formData, setFormData] = useState<AppointmentFormData>({
        full_name: 'John Doe', // Pre-filled from Auth Context
        contact_number: '09123456789',
        address: '123 Main St, Quezon City',
        email: 'johndoe@example.com',
        service_category_id: '',
        service_id: '',
        dentist_id: '',
        date: '',
        time: '',
        notes: ''
    });

    // Filter services based on selected category
    const filteredServices = SERVICES.filter(s => s.categoryId === formData.service_category_id);
    const selectedServiceFee = SERVICES.find(s => s.id === formData.service_id)?.fee || 0;

    const handleSubmit = async () => {
        // Construct the final object to match tbl_appointments structure
        const payload = {
            patient_id: 1, // Retrieved from session/auth
            full_name: formData.full_name,
            contact_number: formData.contact_number,
            address: formData.address,
            email: formData.email,
            service_category_id: parseInt(formData.service_category_id),
            service_id: parseInt(formData.service_id),
            dentist_id: formData.dentist_id ? parseInt(formData.dentist_id) : null,
            appointment_datetime: `${formData.date} ${formData.time}`,
            notes: formData.notes,
            payment_status_id: 1 // Default to Pending (1)
        };

        console.log("Submitting Payload to tbl_appointments:", payload);

        setStep(2);
        setTimeout(() => {
            setStep(3);
        }, 2000);
    };

    const resetAndClose = () => {
        setStep(1);
        setFormData(prev => ({
            ...prev,
            service_category_id: '',
            service_id: '',
            dentist_id: '',
            date: '',
            time: '',
            notes: ''
        }));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Book an Appointment</DialogTitle>
                    <DialogDescription>
                        Complete the details below to schedule your visit.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-2">
                    {step === 1 && (
                        <div className="space-y-6 pb-6">
                            
                            {/* SECTION 1: Patient Snapshot Details */}
                            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <User className="w-4 h-4" /> Patient Details (Snapshot)
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input 
                                            id="full_name" 
                                            value={formData.full_name} 
                                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact">Contact Number</Label>
                                        <Input 
                                            id="contact" 
                                            value={formData.contact_number} 
                                            onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input 
                                            id="email" 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input 
                                            id="address" 
                                            value={formData.address} 
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Service Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Service Category</Label>
                                        <Select 
                                            value={formData.service_category_id} 
                                            onValueChange={(val) => setFormData({...formData, service_category_id: val, service_id: ''})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SERVICE_CATEGORIES.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Specific Service</Label>
                                        <Select 
                                            value={formData.service_id} 
                                            onValueChange={(val) => setFormData({...formData, service_id: val})}
                                            disabled={!formData.service_category_id}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select service" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredServices.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.name} (₱{s.fee})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Assigned Dentist</Label>
                                    <Select 
                                        value={formData.dentist_id} 
                                        onValueChange={(val) => setFormData({...formData, dentist_id: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select dentist (Optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DENTISTS.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* SECTION 3: Scheduling */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Date</Label>
                                        <Input 
                                            type="date" 
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Time</Label>
                                        <Select 
                                            value={formData.time} 
                                            onValueChange={(val) => setFormData({...formData, time: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: Notes */}
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea 
                                    id="notes" 
                                    placeholder="Any special requests or symptoms?" 
                                    value={formData.notes}
                                    // 👇 ADD THE TYPE DEFINITION HERE
                                    className='resize-none'
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>

                            {/* Fee Summary */}
                            {selectedServiceFee > 0 && (
                                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <span className="text-sm font-medium text-primary flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Estimated Fee
                                    </span>
                                    <span className="text-lg font-bold text-primary">₱{selectedServiceFee.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <div>
                                <h3 className="font-semibold text-lg">Processing Booking...</h3>
                                <p className="text-sm text-muted-foreground">Saving appointment details...</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Success!</h3>
                                <p className="text-sm text-muted-foreground max-w-[300px]">
                                    Your appointment has been successfully recorded.
                                </p>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 pt-2">
                    {step === 1 && (
                        <>
                            <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={!formData.service_id || !formData.date || !formData.time || !formData.full_name}
                            >
                                Confirm Booking
                            </Button>
                        </>
                    )}
                    {step === 3 && (
                        <Button onClick={resetAndClose} className="w-full">Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}