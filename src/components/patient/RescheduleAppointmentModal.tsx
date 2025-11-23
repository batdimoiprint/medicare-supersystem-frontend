import { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// --- Types ---
interface Appointment {
    id: number;
    treatment: string;
    doctor: string;
    date: string;
    time: string;
    status: string;
}

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
}

// --- Mock Data: Dentist Availability (Module 3.2) [cite: 190] ---
// Simulating the system checking the Dentist Subsystem for slots
const MOCK_AVAILABLE_SLOTS = [
    "09:00 AM",
    "10:30 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM"
];

export default function RescheduleAppointmentModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
    const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');

    // Reset state when modal opens/closes or appointment changes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setNewDate('');
            setNewTime('');
            setReason('');
        }
    }, [isOpen, appointment]);

    const handleSubmit = () => {
        if (!appointment) return;

        // Construct Payload for Request_Reschedule_tbl [cite: 69]
        const payload = {
            patient_id: 1, // Retrieved from auth
            appointment_id: appointment.id,
            requested_date: newDate,
            requested_time: newTime,
            reason: reason, // Optional notes often helpful for approval
            request_status: 'Pending' // Default status [cite: 70]
        };

        console.log("Submitting Reschedule Request:", payload);

        // Simulate API call
        setStep(2);
        setTimeout(() => {
            setStep(3);
        }, 1500);
    };

    if (!appointment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reschedule Appointment</DialogTitle>
                    <DialogDescription>
                        Request a new date and time for your visit. Note that this is subject to approval[cite: 195].
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-6 py-4">
                        {/* Current Appointment Summary */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Current Schedule</h4>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">{appointment.treatment}</p>
                                    <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <div className="flex items-center gap-1 justify-end text-red-500 line-through decoration-red-500/50">
                                        <Calendar className="w-3 h-3" /> {appointment.date}
                                    </div>
                                    <div className="flex items-center gap-1 justify-end text-red-500 line-through decoration-red-500/50">
                                        <Clock className="w-3 h-3" /> {appointment.time}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center -my-3 relative z-10">
                            <div className="bg-background border rounded-full p-1">
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* New Schedule Inputs */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Select New Availability</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-date">New Date</Label>
                                    <Input 
                                        id="new-date" 
                                        type="date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Time</Label>
                                    <Select value={newTime} onValueChange={setNewTime} disabled={!newDate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Slot" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* In real implementation, these filter based on Dentist Subsystem (Module 3.2) */}
                                            {MOCK_AVAILABLE_SLOTS.map((slot) => (
                                                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Reschedule (Optional)</Label>
                                <Textarea 
                                    id="reason" 
                                    placeholder="e.g. Conflict with work schedule..." 
                                    className="resize-none h-20"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle className="text-yellow-800">Policy Note</AlertTitle>
                                <AlertDescription className="text-yellow-700 text-xs">
                                    Rescheduling is only allowed up to 24 hours before your appointment time[cite: 196].
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">Submitting Request...</h3>
                            <p className="text-sm text-muted-foreground">Checking availability with dentist schedule...</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Request Sent!</h3>
                            <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                Your reschedule request has been sent to the front desk. You will be notified once it is approved[cite: 195].
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 1 && (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={!newDate || !newTime}>
                                Submit Request
                            </Button>
                        </>
                    )}
                    {step === 3 && (
                        <Button onClick={onClose} className="w-full">Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}