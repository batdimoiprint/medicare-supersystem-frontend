// CLEANED + LINT-FREE VERSION — READY TO USE

import { useState, useEffect, useCallback } from "react";
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
import {
    Calendar,
    Clock,
    AlertCircle,
    ArrowRight,
    Loader2,
    CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import supabase from "@/utils/supabase";

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

interface Slot {
    start: string;
    end: string;
    display: string;
}

/* -------------------------
    Utility Functions
-------------------------- */

const parseTimeToDuration = (timeStr: string): number => {
    if (!timeStr) return 30;
    try {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    } catch {
        return 30;
    }
};

const formatDurationDisplay = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} hr${h > 1 ? "s" : ""} ${m} mins`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${m} mins`;
};

const generateTimeSlots = (
    durationMinutes: number,
    start = "00:00",
    end = "23:59"
): Slot[] => {
    const slots: Slot[] = [];

    if (durationMinutes <= 0) durationMinutes = 30;

    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    const current = new Date();
    current.setHours(startHour, startMin, 0, 0);

    const clinicEnd = new Date();
    clinicEnd.setHours(endHour, endMin, 0, 0);

    const formatTimeTo12Hour = (time24: string): string => {
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    while (
        current.getTime() + durationMinutes * 60 * 1000 <=
        clinicEnd.getTime()
    ) {
        const slotStart = current.toTimeString().slice(0, 5);
        const slotEndDate = new Date(
            current.getTime() + durationMinutes * 60 * 1000
        );
        const slotEnd = slotEndDate.toTimeString().slice(0, 5);

        slots.push({
            start: slotStart,
            end: slotEnd,
            display: `${formatTimeTo12Hour(slotStart)} - ${formatTimeTo12Hour(
                slotEnd
            )}`,
        });

        current.setMinutes(current.getMinutes() + durationMinutes);
    }

    return slots;
};

/* -------------------------
    COMPONENT
-------------------------- */

export default function RescheduleAppointmentModal({
    isOpen,
    onClose,
    appointment,
}: RescheduleModalProps) {
    const [step, setStep] = useState(1);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [reason, setReason] = useState("");
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serviceDuration, setServiceDuration] = useState<number>(30);

    /* --------------------------------------
        Helpers
    -------------------------------------- */

    const getCurrentDateInPH = useCallback((): string => {
        const now = new Date();
        const phDate = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        return phDate.toISOString().split("T")[0];
    }, []);

    /* --------------------------------------
        Fetch Service Duration
    -------------------------------------- */

    const fetchServiceDuration = useCallback(async () => {
        if (!appointment) return;

        try {
            const { data: appointmentDetails, error: aptError } = await supabase
                .schema("frontdesk")
                .from("appointment_tbl")
                .select("service_id")
                .eq("appointment_id", appointment.id)
                .single();

            if (aptError || !appointmentDetails?.service_id) {
                setServiceDuration(30);
                return;
            }

            const { data: service, error: serviceError } = await supabase
                .schema("dentist")
                .from("services_tbl")
                .select("service_duration")
                .eq("service_id", appointmentDetails.service_id)
                .single();

            if (serviceError || !service?.service_duration) {
                setServiceDuration(30);
                return;
            }

            const [hours, minutes] = service.service_duration
                .split(":")
                .map(Number);

            setServiceDuration(hours * 60 + minutes);
        } catch {
            setServiceDuration(30);
        }
    }, [appointment]);

    useEffect(() => {
        if (isOpen && appointment) fetchServiceDuration();
    }, [isOpen, appointment, fetchServiceDuration]);

    /* --------------------------------------
        Fetch Available Slots
    -------------------------------------- */

    const fetchAvailableSlots = useCallback(async () => {
        if (!newDate) {
            setAvailableSlots([]);
            return;
        }

        setLoadingSlots(true);
        setAvailableSlots([]);
        setNewTime("");

        try {
            const { data: bookedAppointments, error: fetchError } =
                await supabase
                    .schema("frontdesk")
                    .from("appointment_tbl")
                    .select("appointment_time")
                    .eq("appointment_date", newDate)
                    .eq("appointment_status_id", 1);

            if (fetchError) {
                setAvailableSlots(generateTimeSlots(serviceDuration));
                return;
            }

            const allSlots = generateTimeSlots(serviceDuration);

            const bookedTimes =
                bookedAppointments?.map((apt) =>
                    apt.appointment_time.substring(0, 5)
                ) ?? [];

            const freeSlots = allSlots.filter(
                (slot) => !bookedTimes.includes(slot.start)
            );

            setAvailableSlots(freeSlots);
        } catch {
            setAvailableSlots(generateTimeSlots(30));
        } finally {
            setLoadingSlots(false);
        }
    }, [newDate, serviceDuration]);

    useEffect(() => {
        fetchAvailableSlots();
    }, [newDate, fetchAvailableSlots]);

    /* --------------------------------------
        Reset Modal on Open
    -------------------------------------- */

    useEffect(() => {
        if (isOpen && appointment) {
            setStep(1);
            setNewDate("");
            setNewTime("");
            setReason("");
            setAvailableSlots([]);
            setError(null);
        }
    }, [isOpen, appointment]);

    /* --------------------------------------
        Submit Request
    -------------------------------------- */

    const handleSubmit = useCallback(async () => {
        if (!appointment) return;

        setLoadingSubmit(true);
        setError(null);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user?.email) throw new Error("User not authenticated.");

            const { data: patient, error: patientError } = await supabase
                .schema("patient_record")
                .from("patient_tbl")
                .select("patient_id")
                .eq("email", user.email)
                .single();

            if (patientError || !patient)
                throw new Error("Patient record not found.");

            const [startTime] = newTime.split("-");

            if (!startTime) throw new Error("Invalid time slot selected.");

            const requestData = {
                patient_id: patient.patient_id,
                appointment_id: appointment.id,
                request_status: "Pending",
                requested_date: newDate,
                requested_time: `${startTime}:00`,
                reason: reason || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
                .schema("patient_record")
                .from("request_reschedule_tbl")
                .insert([requestData]);

            if (insertError) throw new Error(insertError.message);

            setStep(2);
            setTimeout(() => setStep(3), 1500);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unexpected error occurred."
            );
        } finally {
            setLoadingSubmit(false);
        }
    }, [appointment, newDate, newTime, reason]);

    /* --------------------------------------
        Close Handler
    -------------------------------------- */

    const handleClose = useCallback(() => {
        if (step === 1 || step === 3) onClose();
    }, [onClose, step]);

    if (!appointment) return null;

    /* --------------------------------------
        JSX
    -------------------------------------- */

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reschedule Appointment</DialogTitle>
                    <DialogDescription>
                        Request a new date and time for your visit (subject to approval).
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* STEP 1: FORM */}
                {step === 1 && (
                    <div className="space-y-6 py-4">
                        {/* Current Appointment */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                Current Schedule
                            </h4>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {appointment.treatment}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.doctor}
                                    </p>
                                </div>

                                <div className="text-right text-sm">
                                    <div className="flex items-center gap-1 justify-end text-red-500 line-through decoration-red-500/50">
                                        <Calendar className="w-3 h-3" />{" "}
                                        {appointment.date}
                                    </div>
                                    <div className="flex items-center gap-1 justify-end text-red-500 line-through decoration-red-500/50">
                                        <Clock className="w-3 h-3" />{" "}
                                        {appointment.time}
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
                            <h4 className="text-sm font-medium">
                                Select New Availability
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="new-date">New Date</Label>

                                    <Input
                                        id="new-date"
                                        type="date"
                                        min={getCurrentDateInPH()}
                                        value={newDate}
                                        onChange={(e) =>
                                            setNewDate(e.target.value)
                                        }
                                        disabled={
                                            loadingSlots || loadingSubmit
                                        }
                                    />
                                </div>

                                {/* Time */}
                                <div className="space-y-2">
                                    <Label>New Time</Label>

                                    <Select
                                        value={newTime}
                                        onValueChange={setNewTime}
                                        disabled={
                                            !newDate ||
                                            loadingSlots ||
                                            loadingSubmit ||
                                            availableSlots.length === 0
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    loadingSlots
                                                        ? "Loading..."
                                                        : !newDate
                                                        ? "Select date first"
                                                        : availableSlots.length ===
                                                          0
                                                        ? "No slots available"
                                                        : "Select Slot"
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {availableSlots.map((slot) => (
                                                <SelectItem
                                                    key={slot.start}
                                                    value={`${slot.start}-${slot.end}`}
                                                >
                                                    {slot.display}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {loadingSlots && (
                                        <p className="text-xs text-muted-foreground">
                                            Checking available slots...
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label htmlFor="reason">
                                    Reason (Optional)
                                </Label>
                                <Textarea
                                    id="reason"
                                    placeholder="e.g. Conflict with work schedule..."
                                    className="resize-none h-20"
                                    value={reason}
                                    onChange={(e) =>
                                        setReason(e.target.value)
                                    }
                                    disabled={loadingSubmit}
                                />
                            </div>

                            {/* Policy Note */}
                            <Alert
                                variant="default"
                                className="bg-yellow-50 border-yellow-200"
                            >
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle className="text-yellow-800">
                                    Policy Note
                                </AlertTitle>
                                <AlertDescription className="text-yellow-700 text-xs">
                                    Rescheduling is only allowed up to 24 hours
                                    before your appointment time.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}

                {/* STEP 2: PROCESSING */}
                {step === 2 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">
                                Submitting Request...
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Processing your reschedule request...
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg">
                                Request Sent!
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                Your reschedule request has been sent to the
                                front desk. You will be notified once it is
                                approved.
                            </p>
                        </div>
                    </div>
                )}

                {/* FOOTER BUTTONS */}
                <DialogFooter>
                    {step === 1 && (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={loadingSubmit}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    !newDate ||
                                    !newTime ||
                                    loadingSubmit
                                }
                            >
                                {loadingSubmit ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </Button>
                        </>
                    )}

                    {step === 3 && (
                        <Button onClick={onClose} className="w-full">
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
