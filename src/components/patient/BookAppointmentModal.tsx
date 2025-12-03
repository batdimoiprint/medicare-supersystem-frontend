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
import { Label } from "@/components/ui/label";
import { 
  User, 
  Loader2, 
  Info, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  QrCode, 
  Mail, 
  Calendar,
  FileText,
  CreditCard,
  ExternalLink
} from "lucide-react";
import supabase from "@/utils/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  reference_number?: string;
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

// Reservation fee constant
const RESERVATION_FEE = 300;

// Helper function to check for double booking
const checkDoubleBooking = async (
  appointmentDate: string,
  startTime: string,
  serviceDuration: number
): Promise<{ hasConflict: boolean; message: string }> => {
  try {
    // Parse the appointment time
    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentStart = new Date(appointmentDate);
    appointmentStart.setHours(hours, minutes, 0, 0);
    
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + serviceDuration);

    // Fetch confirmed appointments for this date
    const { data: confirmedAppointments, error } = await supabase
      .schema('frontdesk')
      .from('appointment_tbl')
      .select('appointment_id, appointment_time, appointment_status_id')
      .eq('appointment_date', appointmentDate);

    if (error) {
      console.error('Error checking bookings:', error);
      return { hasConflict: false, message: '' };
    }

    // Get confirmed status IDs (typically status_id for confirmed appointments)
    const { data: statuses } = await supabase
      .schema('frontdesk')
      .from('appointment_status_tbl')
      .select('appointment_status_id, appointment_status_name')
      .ilike('appointment_status_name', '%confirmed%');

    const confirmedStatusIds = statuses?.map(s => s.appointment_status_id) || [];

    // Check for conflicts with confirmed appointments
    for (const apt of confirmedAppointments || []) {
      // Only check against confirmed appointments
      if (!confirmedStatusIds.includes(apt.appointment_status_id)) {
        continue;
      }

      const existingTime = apt.appointment_time;
      if (!existingTime) continue;

      const [existHours, existMinutes] = existingTime.split(':').map(Number);
      const existingStart = new Date(appointmentDate);
      existingStart.setHours(existHours, existMinutes, 0, 0);

      // Check if times overlap
      if (appointmentStart < existingStart && appointmentEnd > existingStart) {
        return {
          hasConflict: true,
          message: `This time slot conflicts with a confirmed appointment at ${existingTime}. Please select a different time.`
        };
      }

      if (appointmentStart >= existingStart && appointmentStart < new Date(existingStart.getTime() + 30 * 60 * 1000)) {
        return {
          hasConflict: true,
          message: `This time slot conflicts with a confirmed appointment. Please select a different time.`
        };
      }
    }

    return { hasConflict: false, message: '' };
  } catch (error) {
    console.error('Error in checkDoubleBooking:', error);
    return { hasConflict: false, message: '' };
  }
};

// Utility functions
const parseTimeToDuration = (timeStr: string) => {
  if (!timeStr) return 30;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  } catch {
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
  start = "08:00",
  end = "17:00"
) => {
  const slots: { start: string; end: string; display: string }[] = [];

  if (durationMinutes <= 0) {
    durationMinutes = 30;
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const current = new Date();
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
    reference_number: "",
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [bookedTimesForDate, setBookedTimesForDate] = useState<string[]>([]);

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

  // Fetch booked times for a specific date
  const fetchBookedTimesForDate = async (date: string) => {
    try {
      // Fetch all confirmed appointments for this date
      const { data: appointmentsOnDate } = await supabase
        .schema('frontdesk')
        .from('appointment_tbl')
        .select('appointment_time, appointment_status_id')
        .eq('appointment_date', date);

      if (!appointmentsOnDate) {
        setBookedTimesForDate([]);
        return;
      }

      // Get confirmed status IDs
      const { data: statuses } = await supabase
        .schema('frontdesk')
        .from('appointment_status_tbl')
        .select('appointment_status_id')
        .ilike('appointment_status_name', '%confirmed%');

      const confirmedStatusIds = statuses?.map(s => s.appointment_status_id) || [];

      // Collect booked times for confirmed appointments
      const bookedTimes = appointmentsOnDate
        .filter(apt => confirmedStatusIds.includes(apt.appointment_status_id))
        .map(apt => apt.appointment_time)
        .filter(Boolean);

      setBookedTimesForDate(bookedTimes);
    } catch (error) {
      console.error('Error fetching booked times:', error);
      setBookedTimesForDate([]);
    }
  };

  // Fetch booked dates where confirmed appointments exist
  const fetchBookedDates = async () => {
    try {
      // Fetch all confirmed appointments
      const { data: confirmedAppointments } = await supabase
        .schema('frontdesk')
        .from('appointment_tbl')
        .select('appointment_date, appointment_time, appointment_status_id');

      if (!confirmedAppointments) return;

      // Get confirmed status IDs
      const { data: statuses } = await supabase
        .schema('frontdesk')
        .from('appointment_status_tbl')
        .select('appointment_status_id')
        .ilike('appointment_status_name', '%confirmed%');

      const confirmedStatusIds = statuses?.map(s => s.appointment_status_id) || [];

      // Collect all dates that have ANY confirmed appointment
      const datesWithConfirmedAppointments = new Set<string>();
      (confirmedAppointments || []).forEach(apt => {
        if (confirmedStatusIds.includes(apt.appointment_status_id)) {
          datesWithConfirmedAppointments.add(apt.appointment_date);
        }
      });

      // Convert to array for state
      setBookedDates(Array.from(datesWithConfirmedAppointments));
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    }
  };

  // Fetch patient data & service data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch booked dates
        await fetchBookedDates();

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
      } catch {
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
      reference_number: "",
    });
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    
    try {
      // Validate inputs
      if (!formData.date || !formData.time || !selectedService) {
        throw new Error("Please complete all required fields.");
      }

      // Parse the time slot
      const [startTime] = formData.time?.split('-') || [];
      
      if (!startTime) {
        throw new Error("Invalid time slot selected.");
      }

      // Check for double booking with confirmed appointments
      const bookingCheck = await checkDoubleBooking(
        formData.date,
        startTime,
        selectedServiceDuration
      );

      if (bookingCheck.hasConflict) {
        setSubmitError(bookingCheck.message);
        setLoading(false);
        return;
      }

      setStep(2); // Move to payment instructions step

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

      // Validate service exists
      if (!selectedService) {
        throw new Error("Selected service not found. Please select a valid service.");
      }

      // Prepare appointment data with PENDING status
      const appointmentData = {
        patient_id: patient.patient_id,
        service_id: formData.service_id,
        appointment_date: formData.date,
        appointment_time: startTime + ":00",
        appointment_status_id: 1, // Default status
        created_at: new Date().toISOString(),
        reservation_fee: RESERVATION_FEE,
        reference_number: formData.reference_number || null,
        notes: formData.notes || "Awaiting payment confirmation",
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setSubmitError(errorMessage);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const createMailToLink = () => {
    const subject = encodeURIComponent(`Payment Receipt for Appointment - ${formData.full_name}`);
    const body = encodeURIComponent(
      `Patient Details:\n` +
      `Name: ${formData.full_name}\n` +
      `Email: ${formData.email}\n` +
      `Contact: ${formData.contact_number}\n` +
      `Appointment Date: ${formData.date}\n` +
      `Appointment Time: ${formData.time}\n` +
      `Service: ${selectedService?.service_name}\n\n` +
      `I have completed the ₱${RESERVATION_FEE} reservation fee payment via GCash.\n\n` +
      `Please find my receipt attached.`
    );
    
    return `mailto:medicare.dental.ph@gmail.com?subject=${subject}&body=${body}`;
  };

  const copyGCashNumber = () => {
    navigator.clipboard.writeText("09123456789");
    alert("GCash number copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0 border-b">
          <DialogTitle>
            {step === 1 && "Book an Appointment"}
            {step === 2 && "Complete Reservation Payment"}
            {step === 3 && "Appointment Booked Successfully"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Complete the details below to schedule your visit."}
            {step === 2 && "Follow the instructions to secure your appointment."}
            {step === 3 && "Your appointment is now pending payment confirmation."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-6 py-4">
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
                      <div className="flex items-center justify-between">
                        <Label>Date</Label>
                        {formData.date && bookedDates.includes(formData.date) && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                            Cannot Book
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value });
                          if (e.target.value) {
                            fetchBookedTimesForDate(e.target.value);
                          } else {
                            setBookedTimesForDate([]);
                          }
                        }}
                        className={formData.date && bookedDates.includes(formData.date) ? "border-red-300 bg-red-50/50" : ""}
                      />
                      {formData.date && bookedDates.includes(formData.date) && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> This date has confirmed appointments and cannot be booked. Please select another date.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Time</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(val) => setFormData({ ...formData, time: val })}
                        disabled={!formData.service_id || (formData.date ? bookedDates.includes(formData.date) : false)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.date && bookedDates.includes(formData.date) ? "Date cannot be booked" : "Select time"} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.service_id && selectedServiceDuration > 0 && !bookedDates.includes(formData.date || '') &&
                            (() => {
                              const slots = generateTimeSlots(selectedServiceDuration);
                              return slots.map((slot) => {
                                const isBooked = bookedTimesForDate.some(bookedTime => 
                                  bookedTime?.startsWith(slot.start)
                                );
                                return (
                                  <SelectItem 
                                    key={slot.start} 
                                    value={`${slot.start}-${slot.end}`}
                                    disabled={isBooked}
                                  >
                                    <span className="flex items-center gap-2">
                                      {slot.display}
                                      {isBooked ? (
                                        <span className="text-xs text-red-600 font-medium">(Booked)</span>
                                      ) : (
                                        <span className="text-xs text-green-600 font-medium">(Available)</span>
                                      )}
                                    </span>
                                  </SelectItem>
                                );
                              });
                            })()}
                        </SelectContent>
                      </Select>
                      {formData.date && bookedTimesForDate.length > 0 && !bookedDates.includes(formData.date) && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {bookedTimesForDate.length} time slot(s) booked on this date
                        </p>
                      )}
                      {formData.date && bookedTimesForDate.length === 0 && !bookedDates.includes(formData.date) && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> All time slots are available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Service Duration Info */}
                  {selectedServiceDuration > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Service duration: <strong>{formatDurationDisplay(selectedServiceDuration)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-700">
                          <strong>Clinic Hours:</strong> 8:00 AM - 5:00 PM
                        </span>
                      </div>
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

                  {/* Reference Number */}
                  <div className="grid gap-2">
                    <Label htmlFor="reference_number">Reference Number (Optional)</Label>
                    <Input 
                      id="reference_number" 
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter numeric reference (e.g., 1234567890)" 
                      value={formData.reference_number || ""}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, reference_number: numericValue});
                      }}
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">Numbers only • Max 20 digits</p>
                  </div>

                  {/* Fee Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-sm font-medium text-primary flex items-center gap-2">
                        <Info className="w-4 h-4" /> Estimated Service Fee
                      </span>
                      <span className="text-lg font-bold text-primary">₱{selectedServiceFee.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <span className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Required Reservation Fee
                        </span>
                        <p className="text-xs text-yellow-600 mt-1">
                          Pay ₱{RESERVATION_FEE} to secure your appointment
                        </p>
                      </div>
                      <span className="text-lg font-bold text-yellow-700">₱{RESERVATION_FEE}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Step 2: Payment Instructions */}
          {step === 2 && (
            <div className="space-y-6 pb-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your appointment slot has been reserved. Complete the payment to secure it.
                </AlertDescription>
              </Alert>

              {/* Payment Summary */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Appointment Summary
                  </h3>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pending Payment
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formData.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{formData.time?.replace('-', ' to ')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{selectedService?.service_name}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-semibold">Reservation Fee:</p>
                    <p className="text-lg font-bold text-primary">₱{RESERVATION_FEE}</p>
                  </div>
                </div>
              </div>

              {/* GCash QR Code Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Pay via GCash</h3>
                </div>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code Placeholder */}
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">GCash QR Code</p>
                      <p className="text-xs text-gray-400">0912 345 6789</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Scan QR Code or send to:</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyGCashNumber}
                      className="gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      0912 345 6789
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground">Click to copy GCash number</p>
                  </div>
                </div>
              </div>

              {/* Email Instructions */}
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-blue-800">Final Step: Send Receipt</h3>
                </div>
                
                <ol className="space-y-3 text-sm text-blue-700 list-decimal pl-5">
                  <li>Complete the ₱{RESERVATION_FEE} payment via GCash</li>
                  <li>Take a screenshot of your payment receipt</li>
                  <li>
                    Click the button below to email your receipt to our front desk
                  </li>
                  <li>Our team will verify your payment within 24 hours</li>
                  <li>You'll receive confirmation once payment is verified</li>
                </ol>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.href = createMailToLink()}
                    className="w-full gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Receipt to Front Desk
                  </Button>
                  <p className="text-xs text-blue-600 text-center mt-2">
                    medicare.dental.ph@gmail.com
                  </p>
                </div>
              </div>

              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <span className="font-medium">Important:</span> Your appointment will be cancelled if payment is not verified within 24 hours.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Success Confirmation */}
          {step === 3 && (
            <div className="space-y-6 pb-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl">Appointment Reserved!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your appointment slot has been reserved.
                  </p>
                </div>

                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Status: Pending Payment Verification
                </Badge>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Next Steps
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                  <li>Check your email for appointment details</li>
                  <li>Complete the ₱{RESERVATION_FEE} payment via GCash</li>
                  <li>Send your receipt to <span className="font-medium text-primary">medicare.dental.ph@gmail.com</span></li>
                  <li>Our team will verify your payment within 24 hours</li>
                  <li>You'll receive a confirmation email once verified</li>
                </ul>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  For any questions, contact our front desk at{" "}
                  <a 
                    href="mailto:medicare.dental.ph@gmail.com" 
                    className="font-medium text-primary underline"
                  >
                    medicare.dental.ph@gmail.com
                  </a>{" "}
                  or call (02) 1234-5678.
                </AlertDescription>
              </Alert>
            </div>
          )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 border-t flex-shrink-0">
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
                Reserve Appointment
              </Button>
            </>
          )}
          {step === 2 && (
            <div className="flex flex-col w-full space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  I've Sent the Receipt
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={resetAndClose}
              >
                Cancel Appointment
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="flex w-full gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = createMailToLink()}
                className="flex-1 gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Receipt
              </Button>
              <Button 
                onClick={resetAndClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}