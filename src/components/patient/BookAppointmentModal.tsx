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
import { User, Loader2, Info, CheckCircle, Clock } from "lucide-react";
import supabase from "@/utils/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Map service category and service tables properly
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

// Utility functions for duration conversion
const formatDurationToTime = (minutes: string | number) => {
  const mins = typeof minutes === 'string' ? parseInt(minutes) : minutes;
  if (isNaN(mins)) return '00:30:00';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
};

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

/**
 * Generate appointment slots based on service duration for 24-hour availability
 * @param durationMinutes - service duration in minutes
 * @param start - clinic start time "HH:MM" (default 00:00 for 24 hours)
 * @param end - clinic end time "HH:MM" (default 23:59 for 24 hours)
 */
const generateTimeSlots = (
  durationMinutes: number,
  start = "00:00",
  end = "23:59"
) => {
  const slots: { start: string; end: string; display: string }[] = [];

  if (durationMinutes <= 0) {
    console.error("Invalid duration:", durationMinutes);
    durationMinutes = 30; // Default to 30 minutes
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMin, 0, 0);

  const clinicEnd = new Date();
  clinicEnd.setHours(endHour, endMin, 0, 0);

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const formatTimeTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  while (current.getTime() + durationMinutes * 60 * 1000 <= clinicEnd.getTime()) {
    const slotStart = current.toTimeString().slice(0, 5); // "HH:MM"
    const slotEndDate = new Date(current.getTime() + durationMinutes * 60 * 1000);
    const slotEnd = slotEndDate.toTimeString().slice(0, 5); // "HH:MM"
    
    // Create display format with AM/PM
    const display = `${formatTimeTo12Hour(slotStart)} - ${formatTimeTo12Hour(slotEnd)}`;

    slots.push({ 
      start: slotStart, 
      end: slotEnd,
      display 
    });

    // Move to next slot
    current.setMinutes(current.getMinutes() + durationMinutes);
  }

  console.log(`Generated ${slots.length} slots for ${durationMinutes}min duration`);
  return slots;
};

export default function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  // Filter services based on selected category
  const filteredServices = services.filter(
    (s) => s.service_category_id === formData.service_category_id
  );

  // Calculate selected service fee and duration
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
        console.log("AUTH USER:", user);

        if (user?.email) {
          const { data: patient, error } = await supabase
            .schema("patient_record")
            .from("patient_tbl")
            .select("*")
            .eq("email", user.email)
            .single();

          if (error) console.error("Error fetching patient:", error.message);
          else if (patient) {
            const addressParts = [patient.house_no, patient.street, patient.barangay, patient.city].filter(Boolean);
            setFormData({
              full_name: `${patient.f_name || ""} ${patient.l_name || ""}`.trim(),
              contact_number: patient.pri_contact_no || "",
              address: addressParts.join(" "),
              email: patient.email || "",
              service_category_id: "",
              service_id: "",
              dentist_id: "",
              date: "",
              time: "",
              notes: "",
            });
          }
        }

        // Fetch service categories from dentist schema
        const { data: categories, error: catErr } = await supabase
          .schema("dentist")
          .from("service_category_tbl")
          .select("*");
        if (catErr) console.error("Error fetching categories:", catErr.message);
        else setServiceCategories(categories || []);

        // Fetch services from dentist schema
        const { data: serviceData, error: servErr } = await supabase
          .schema("dentist")
          .from("services_tbl")
          .select("*");
        if (servErr) console.error("Error fetching services:", servErr.message);
        else setServices(serviceData || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const resetAndClose = () => {
    setStep(1);
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
    setStep(2);
    // Simulate processing
    setTimeout(() => {
      setStep(3);
    }, 2000);
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
          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading patient details...</p>
            </div>
          ) : (
            step === 1 && (
              <div className="space-y-6 pb-6">
                {/* SECTION 1: Patient Snapshot */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <User className="w-4 h-4" /> Patient Details (Snapshot)
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

                {/* SECTION 2: Service Details */}
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

                  {/* SECTION 3: Scheduling */}
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

                  {/* SECTION 4: Notes */}
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