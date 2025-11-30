import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { User, Loader2, Info, CheckCircle, Clock, AlertCircle } from "lucide-react";
import supabase from "@/utils/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentFormData {
  full_name: string;
  contact_number: string;
  address: string;
  email: string;
  service_category_id?: string;
  service_id?: string;
  dentist_id?: string;
  date?: string;
  time?: string;
  notes?: string;
}

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceCategory {
  service_category_id: string;
  category_name: string;
  category_code: string;
  category_description: string;
}

interface Service {
  service_id: string;
  service_category_id: string;
  service_name: string;
  service_description: string;
  service_fee: number;
  service_duration: string;
}

// Utility functions
const parseTimeToDuration = (timeStr: string) => {
  if (!timeStr) return 30;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  } catch (e) {
    return 30;
  }
};

const formatDurationDisplay = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  
  if (h > 0 && m > 0) return `${h} hr${h > 1 ? 's' : ''} ${m} mins`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} mins`;
};

const generateTimeSlots = (
  durationMinutes: number,
  start = "00:00",
  end = "23:59"
) => {
  const slots: { start: string; end: string; display: string }[] = [];

  if (durationMinutes <= 0) {
    durationMinutes = 30;
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMin, 0, 0);

  const clinicEnd = new Date();
  clinicEnd.setHours(endHour, endMin, 0, 0);

  const formatTimeTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  while (current.getTime() + durationMinutes * 60 * 1000 <= clinicEnd.getTime()) {
    const slotStart = current.toTimeString().slice(0, 5);
    const slotEndDate = new Date(current.getTime() + durationMinutes * 60 * 1000);
    const slotEnd = slotEndDate.toTimeString().slice(0, 5);
    
    const display = `${formatTimeTo12Hour(slotStart)} - ${formatTimeTo12Hour(slotEnd)}`;

    slots.push({ 
      start: slotStart, 
      end: slotEnd,
      display 
    });

    current.setMinutes(current.getMinutes() + durationMinutes);
  }

  return slots;
};

export default function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    full_name: "",
    contact_number: "",
    address: "",
    email: "",
    service_category_id: "",
    service_id: "",
    dentist_id: "",
    date: "",
    time: "",
    notes: "",
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const filteredServices = services.filter(
    (s) => s.service_category_id === formData.service_category_id
  );

  const selectedService = formData.service_id 
    ? filteredServices.find(s => s.service_id === formData.service_id)
    : null;
  
  const selectedServiceFee = selectedService?.service_fee || 0;
  const selectedServiceDuration = selectedService 
    ? parseTimeToDuration(selectedService.service_duration)
    : 0;

  // Fetch patient data & service data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patient
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email) {
          const { data: patient, error } = await supabase
            .schema("patient_record")
            .from("patient_tbl")
            .select("*")
            .eq("email", user.email)
            .single();

          if (!error && patient) {
            const addressParts = [patient.house_no, patient.street, patient.barangay, patient.city].filter(Boolean);
            setFormData(prev => ({
              ...prev,
              full_name: `${patient.f_name || ""} ${patient.l_name || ""}`.trim(),
              contact_number: patient.pri_contact_no || "",
              address: addressParts.join(" "),
              email: patient.email || "",
            }));
          }
        }

        // Fetch service categories
        const { data: categories, error: catErr } = await supabase
          .schema("dentist")
          .from("service_category_tbl")
          .select("*");
        
        if (!catErr) {
          setServiceCategories(categories || []);
        }

        // Fetch services
        const { data: serviceData, error: servErr } = await supabase
          .schema("dentist")
          .from("services_tbl")
          .select("*");
        
        if (!servErr) {
          setServices(serviceData || []);
        }
      } catch (err) {
        // Silent error handling for production
        setSubmitError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const resetAndClose = () => {
    setStep(1);
    setSubmitError(null);
    setFormData({
      full_name: "",
      contact_number: "",
      address: "",
      email: "",
      service_category_id: "",
      service_id: "",
      dentist_id: "",
      date: "",
      time: "",
      notes: "",
    });
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    setStep(2);
    
    try {
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error("Authentication error. Please log in again.");
      }
      
      if (!user?.email) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Fetch patient details to get patient_id
      const { data: patient, error: patientError } = await supabase
        .schema("patient_record")
        .from("patient_tbl")
        .select("patient_id")
        .eq("email", user.email)
        .single();

      if (patientError || !patient) {
        throw new Error("Patient record not found. Please complete your profile.");
      }

      // Parse the time slot
      const [startTime] = formData.time?.split('-') || [];
      
      if (!startTime) {
        throw new Error("Invalid time slot selected.");
      }

      // Validate service exists
      if (!selectedService) {
        throw new Error("Selected service not found. Please select a valid service.");
      }

      // Prepare appointment data
      const appointmentData = {
        patient_id: patient.patient_id,
        service_id: formData.service_id,
        appointment_date: formData.date,
        appointment_time: startTime + ":00",
        appointment_status_id: 1,
        created_at: new Date().toISOString(),
        personnel_id: null,
      };

      // Insert into frontdesk.appointment_tbl
      const { data, error } = await supabase
        .schema("frontdesk")
        .from("appointment_tbl")
        .insert([appointmentData])
        .select();

      if (error) {
        // Handle specific error cases with user-friendly messages
        if (error.code === '42501') {
          throw new Error("Permission denied. Please contact support.");
        } else if (error.code === '23503') {
          throw new Error("Invalid service reference. Please select a different service.");
        } else if (error.code === '23505') {
          throw new Error("Appointment conflict. This time slot may already be booked.");
        } else {
          throw new Error("Booking failed. Please try again.");
        }
      }

      if (!data || data.length === 0) {
        throw new Error("Appointment creation failed. Please try again.");
      }

      // Move to success step
      setStep(3);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setSubmitError(errorMessage);
      setStep(1);
    } finally {
      setLoading(false);
    }
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
          {loading && step === 1 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading patient details...</p>
            </div>
          ) : (
            step === 1 && (
              <div className="space-y-6 pb-6">
                {/* Error Alert */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Patient Details */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <User className="w-4 h-4" /> Patient Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" value={formData.full_name || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input id="contact" value={formData.contact_number || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={formData.email || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={formData.address || ""} readOnly />
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Service Category</Label>
                      <Select
                        value={formData.service_category_id}
                        onValueChange={(val) =>
                          setFormData({ ...formData, service_category_id: val, service_id: "" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.map((c) => (
                            <SelectItem key={c.service_category_id} value={c.service_category_id}>
                              {c.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Specific Service</Label>
                      <Select
                        value={formData.service_id}
                        onValueChange={(val) => setFormData({ ...formData, service_id: val })}
                        disabled={!formData.service_category_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredServices.map((s) => {
                            const durationMinutes = parseTimeToDuration(s.service_duration);
                            const durationDisplay = formatDurationDisplay(durationMinutes);
                            return (
                              <SelectItem key={s.service_id} value={s.service_id}>
                                <div className="flex flex-col">
                                  <span>{s.service_name}</span>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>₱{s.service_fee} • {durationDisplay}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Time</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(val) => setFormData({ ...formData, time: val })}
                        disabled={!formData.service_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.service_id && selectedServiceDuration > 0 &&
                            (() => {
                              const slots = generateTimeSlots(selectedServiceDuration);
                              return slots.map((slot) => (
                                <SelectItem key={slot.start} value={`${slot.start}-${slot.end}`}>
                                  {slot.display}
                                </SelectItem>
                              ));
                            })()}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Service Duration Info */}
                  {selectedServiceDuration > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Service duration: <strong>{formatDurationDisplay(selectedServiceDuration)}</strong>
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Any special requests or symptoms?" 
                      value={formData.notes}
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
              </div>
            )
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
                <h3 className="font-semibold text-lg">Appointment Booked!</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Your appointment has been successfully scheduled.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={resetAndClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.service_id || !formData.date || !formData.time || !formData.full_name || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Booking
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={resetAndClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}