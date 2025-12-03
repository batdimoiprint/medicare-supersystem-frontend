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
import { User, Loader2, Info, CheckCircle, Clock, AlertCircle, CalendarX, CalendarOff } from "lucide-react";
import supabase from "@/utils/supabase";
import { useAuth } from '@/context/userContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface TimeSlot {
  start: string;
  end: string;
  display: string;
  isAvailable: boolean;
  conflictWith?: string;
}

// Philippine Holidays 2024-2025 (Fixed and Regular Holidays)
const PHILIPPINE_HOLIDAYS = [
  // Fixed Date Holidays
  "2024-01-01", // New Year's Day
  "2024-04-09", // Araw ng Kagitingan
  "2024-05-01", // Labor Day
  "2024-06-12", // Independence Day
  "2024-08-26", // National Heroes Day (last Monday of August)
  "2024-08-30", // Bonifacio Day (moved to Friday)
  "2024-11-30", // Bonifacio Day
  "2024-12-25", // Christmas Day
  "2024-12-30", // Rizal Day
  "2025-01-01", // New Year's Day
  "2025-04-09", // Araw ng Kagitingan
  "2025-05-01", // Labor Day
  "2025-06-12", // Independence Day
  "2025-08-25", // National Heroes Day (last Monday of August)
  "2025-11-30", // Bonifacio Day
  "2025-12-25", // Christmas Day
  "2025-12-30", // Rizal Day

  // Special Non-Working Holidays (Common)
  "2024-02-09", // Chinese New Year
  "2024-02-25", // EDSA Revolution Anniversary
  "2024-03-28", // Maundy Thursday
  "2024-03-29", // Good Friday
  "2024-03-30", // Black Saturday
  "2024-04-10", // Eid'l Fitr (estimated)
  "2024-11-01", // All Saints' Day
  "2024-12-08", // Immaculate Conception Day
  "2024-12-31", // Last Day of the Year
  "2025-01-29", // Chinese New Year
  "2025-02-25", // EDSA Revolution Anniversary
  "2025-04-17", // Maundy Thursday
  "2025-04-18", // Good Friday
  "2025-04-19", // Black Saturday
  "2025-03-31", // Eid'l Fitr (estimated)
  "2025-11-01", // All Saints' Day
  "2025-12-08", // Immaculate Conception Day
  "2025-12-31", // Last Day of the Year
];

// Clinic Working Days (Monday-Friday)
const CLINIC_WORKING_DAYS = [1, 2, 3, 4, 5]; // Monday = 1, Sunday = 0

// Clinic Hours (8 AM - 5 PM)
const CLINIC_START_HOUR = 8;
const CLINIC_END_HOUR = 17;

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

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Check if date is a holiday
const isHoliday = (dateString: string): boolean => {
  return PHILIPPINE_HOLIDAYS.includes(dateString);
};

// Check if date is a weekend
const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

// Check if date is a working day for the clinic
const isClinicWorkingDay = (dateString: string): boolean => {
  const date = new Date(dateString);
  const day = date.getDay();

  // Check if it's a weekend
  if (isWeekend(dateString)) return false;

  // Check if it's a holiday
  if (isHoliday(dateString)) return false;

  // Check if it's in clinic working days
  return CLINIC_WORKING_DAYS.includes(day);
};

// Get holiday name if date is a holiday
const getHolidayName = (dateString: string): string | null => {
  // Map of holidays with their names
  const holidayNames: Record<string, string> = {
    "2024-01-01": "New Year's Day",
    "2024-04-09": "Araw ng Kagitingan",
    "2024-05-01": "Labor Day",
    "2024-06-12": "Independence Day",
    "2024-08-26": "National Heroes Day",
    "2024-08-30": "Bonifacio Day (Special Non-Working Holiday)",
    "2024-11-30": "Bonifacio Day",
    "2024-12-25": "Christmas Day",
    "2024-12-30": "Rizal Day",
    "2025-01-01": "New Year's Day",
    "2025-04-09": "Araw ng Kagitingan",
    "2025-05-01": "Labor Day",
    "2025-06-12": "Independence Day",
    "2025-08-25": "National Heroes Day",
    "2025-11-30": "Bonifacio Day",
    "2025-12-25": "Christmas Day",
    "2025-12-30": "Rizal Day",
    "2024-02-09": "Chinese New Year",
    "2024-02-25": "EDSA Revolution Anniversary",
    "2024-03-28": "Maundy Thursday",
    "2024-03-29": "Good Friday",
    "2024-03-30": "Black Saturday",
    "2024-04-10": "Eid'l Fitr",
    "2024-11-01": "All Saints' Day",
    "2024-12-08": "Immaculate Conception Day",
    "2024-12-31": "Last Day of the Year",
    "2025-01-29": "Chinese New Year",
    "2025-02-25": "EDSA Revolution Anniversary",
    "2025-04-17": "Maundy Thursday",
    "2025-04-18": "Good Friday",
    "2025-04-19": "Black Saturday",
    "2025-03-31": "Eid'l Fitr",
    "2025-11-01": "All Saints' Day",
    "2025-12-08": "Immaculate Conception Day",
    "2025-12-31": "Last Day of the Year",
  };

  return holidayNames[dateString] || null;
};

// Fetch existing confirmed appointments for availability checking
const fetchConfirmedAppointments = async (date: string) => {
  try {
    // Get CONFIRMED appointments (status_id: 2 = Confirmed/Paid)
    const { data, error } = await supabase
      .schema("frontdesk")
      .from("appointment_tbl")
      .select(`
        appointment_id,
        appointment_date,
        appointment_time,
        appointment_status_id,
        service_id,
        services_tbl:service_id (service_duration)
      `)
      .eq("appointment_date", date)
      .in("appointment_status_id", [2]) // Only check confirmed/paid appointments
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchConfirmedAppointments:", err);
    return [];
  }
};

// Check if time slot overlaps with existing confirmed appointments
const checkTimeSlotAvailability = (
  startTime: string,
  duration: number,
  existingAppointments: any[]
): { isAvailable: boolean; conflictWith?: string } => {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = slotStart + duration;

  for (const appointment of existingAppointments) {
    const appointmentStart = timeToMinutes(appointment.appointment_time);
    const appointmentDuration = appointment.services_tbl?.service_duration
      ? parseTimeToDuration(appointment.services_tbl.service_duration)
      : 30;
    const appointmentEnd = appointmentStart + appointmentDuration;

    // Check for overlap
    if (
      (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
      (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
      (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
    ) {
      return {
        isAvailable: false,
        conflictWith: `${appointment.appointment_time} (${appointment.services_tbl?.service_duration || '30 mins'})`
      };
    }
  }

  return { isAvailable: true };
};

export default function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState<any[]>([]);
  const [isDateValid, setIsDateValid] = useState(true);
  const [dateValidationMessage, setDateValidationMessage] = useState<string>("");

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

  // Validate selected date
  const validateDate = (dateString: string) => {
    if (!dateString) {
      setIsDateValid(true);
      setDateValidationMessage("");
      return;
    }

    const today = new Date();
    const selectedDate = new Date(dateString);

    // Reset time for accurate comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (selectedDate < today) {
      setIsDateValid(false);
      setDateValidationMessage("Cannot select a past date.");
      return;
    }

    // Check if date is a weekend
    if (isWeekend(dateString)) {
      setIsDateValid(false);
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      setDateValidationMessage(`Clinic is closed on ${dayName}s.`);
      return;
    }

    // Check if date is a holiday
    if (isHoliday(dateString)) {
      setIsDateValid(false);
      const holidayName = getHolidayName(dateString) || "a holiday";
      setDateValidationMessage(`Clinic is closed for ${holidayName}.`);
      return;
    }

    // Check if date is a clinic working day
    if (!isClinicWorkingDay(dateString)) {
      setIsDateValid(false);
      setDateValidationMessage("Clinic is not open on this day.");
      return;
    }

    // All checks passed
    setIsDateValid(true);
    setDateValidationMessage("");
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date, time: "" });
    validateDate(date);
  };

  const { user: authUser } = useAuth();

  // Fetch patient data & service data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patient using auth context user id
        if (authUser) {
          const { data: patient, error } = await supabase
            .schema("patient_record")
            .from("patient_tbl")
            .select("*")
            .eq("patient_id", authUser.id)
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
        setSubmitError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, authUser]);  // Generate time slots when date or service changes
  useEffect(() => {
    const generateAvailableTimeSlots = async () => {
      if (!formData.date || !selectedServiceDuration || selectedServiceDuration <= 0 || !isDateValid) {
        setTimeSlots([]);
        return;
      }

      setLoadingAvailability(true);
      setAvailabilityError(null);

      try {
        // Fetch confirmed appointments for the selected date
        const appointments = await fetchConfirmedAppointments(formData.date);
        setConfirmedAppointments(appointments);

        // Generate time slots from clinic hours
        const slots: TimeSlot[] = [];
        const startHour = CLINIC_START_HOUR;
        const endHour = CLINIC_END_HOUR;

        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            const startTime = minutesToTime(hour * 60 + minute);
            const endTime = minutesToTime(hour * 60 + minute + selectedServiceDuration);

            // Check if slot goes beyond clinic hours
            if (timeToMinutes(endTime) <= endHour * 60) {
              const availability = checkTimeSlotAvailability(startTime, selectedServiceDuration, appointments);

              const period = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              const display = `${hour12}:${minute.toString().padStart(2, '0')} ${period} - ${endTime}`;

              slots.push({
                start: startTime,
                end: endTime,
                display,
                isAvailable: availability.isAvailable,
                conflictWith: availability.conflictWith
              });
            }
          }
        }

        // Filter for sensible slots (not too close to current time if today)
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const filteredSlots = slots.filter(slot => {
          if (formData.date === today) {
            const slotTime = new Date();
            const [hours, minutes] = slot.start.split(':').map(Number);
            slotTime.setHours(hours, minutes, 0, 0);
            // Only show slots at least 30 minutes from now
            return slotTime.getTime() - now.getTime() >= 30 * 60 * 1000;
          }
          return true;
        });

        setTimeSlots(filteredSlots);

        if (filteredSlots.length === 0) {
          setAvailabilityError("No available time slots for this date. Please choose another date.");
        }

      } catch (error) {
        console.error("Error generating time slots:", error);
        setAvailabilityError("Unable to check availability. Please try again.");
      } finally {
        setLoadingAvailability(false);
      }
    };

    generateAvailableTimeSlots();
  }, [formData.date, selectedServiceDuration, isDateValid]);

  const resetAndClose = () => {
    setStep(1);
    setSubmitError(null);
    setAvailabilityError(null);
    setTimeSlots([]);
    setConfirmedAppointments([]);
    setIsDateValid(true);
    setDateValidationMessage("");
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
    // Double-check date validity before submission
    if (formData.date) {
      validateDate(formData.date);
      if (!isDateValid) {
        setSubmitError(dateValidationMessage);
        return;
      }
    }

    setLoading(true);
    setSubmitError(null);
    setStep(2);

    try {
      // Use auth context user
      if (!authUser) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Use patient_id from auth context
      const patient = { patient_id: authUser.id };

      // Parse the time slot
      const [startTimeStr] = formData.time?.split(' - ') || [];

      if (!startTimeStr) {
        throw new Error("Invalid time slot selected.");
      }

      // Convert time to 24-hour format
      const [timePart, period] = startTimeStr.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const startTime24 = minutesToTime(hours * 60 + minutes);

      // Validate service exists
      if (!selectedService) {
        throw new Error("Selected service not found. Please select a valid service.");
      }

      // Double-check availability before booking
      const selectedSlot = timeSlots.find(slot => slot.display === formData.time);
      if (selectedSlot && !selectedSlot.isAvailable) {
        throw new Error("This time slot is no longer available. Please select another time.");
      }

      // Prepare appointment data - STATUS 1 = PENDING (default)
      const appointmentData = {
        patient_id: patient.patient_id,
        service_id: formData.service_id,
        appointment_date: formData.date,
        appointment_time: startTime24,
        appointment_status_id: 1, // PENDING status
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

  // Get available slots count
  const availableSlotsCount = timeSlots.filter(slot => slot.isAvailable).length;

  // Calculate min date (tomorrow if today is weekend/holiday)
  const getMinDate = () => {
    const today = new Date();
    let nextValidDate = new Date(today);

    // Find next valid working day
    for (let i = 0; i < 30; i++) { // Look ahead 30 days max
      nextValidDate = new Date(today);
      nextValidDate.setDate(today.getDate() + i);
      const dateString = nextValidDate.toISOString().split('T')[0];

      if (isClinicWorkingDay(dateString)) {
        break;
      }
    }

    return nextValidDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b shrink-0">
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Complete the details below to schedule your visit. Appointments are PENDING until payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
                        <Label>Date</Label>
                        <Input
                          type="date"
                          min={getMinDate()}
                          value={formData.date}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className={!isDateValid ? "border-red-300 bg-red-50" : ""}
                        />
                        {!isDateValid && formData.date && (
                          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                            <CalendarOff className="w-4 h-4" />
                            <span>{dateValidationMessage}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Time</Label>
                        <Select
                          value={formData.time}
                          onValueChange={(val) => setFormData({ ...formData, time: val })}
                          disabled={!formData.service_id || !formData.date || !isDateValid || loadingAvailability}
                        >
                          <SelectTrigger className={!isDateValid ? "border-red-300 bg-red-50" : ""}>
                            <SelectValue placeholder={
                              loadingAvailability
                                ? "Checking availability..."
                                : !isDateValid
                                  ? "Select a valid date first"
                                  : "Select time"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((slot) => (
                              <SelectItem
                                key={slot.start}
                                value={slot.display}
                                disabled={!slot.isAvailable}
                                className="relative"
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span>{slot.display}</span>
                                  {!slot.isAvailable ? (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                      Booked
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                      Available
                                    </Badge>
                                  )}
                                </div>
                                {!slot.isAvailable && slot.conflictWith && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Conflicts with: {slot.conflictWith}
                                  </div>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date Information Banner */}
                    {formData.date && (
                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CalendarX className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">
                              {new Date(formData.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-xs text-blue-600">
                            {isDateValid ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Clinic Open
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-red-200">
                                Clinic Closed
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isHoliday(formData.date) && (
                          <div className="mt-2 text-sm text-amber-700">
                            <span className="font-medium">Holiday: </span>
                            {getHolidayName(formData.date)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Availability Status */}
                    {formData.date && selectedServiceDuration > 0 && isDateValid && (
                      <div>
                        {loadingAvailability ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-700">
                              Checking availability for {formData.date}...
                            </span>
                          </div>
                        ) : availabilityError ? (
                          <Alert variant="destructive">
                            <CalendarX className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {availabilityError}
                            </AlertDescription>
                          </Alert>
                        ) : timeSlots.length > 0 && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700">
                                <strong>{availableSlotsCount} time slot{availableSlotsCount !== 1 ? 's' : ''}</strong> available
                              </span>
                            </div>
                            <span className="text-xs text-green-600">
                              {confirmedAppointments.length} confirmed appointment{confirmedAppointments.length !== 1 ? 's' : ''} on this date
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Duration Info */}
                    {selectedServiceDuration > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Service duration: <strong>{formatDurationDisplay(selectedServiceDuration)}</strong>
                        </span>
                      </div>
                    )}

                    {/* Clinic Hours Information */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Clinic Hours: <strong>{CLINIC_START_HOUR}:00 AM - {CLINIC_END_HOUR}:00 PM</strong>
                        <span className="text-xs text-gray-500 ml-2">Monday-Friday only</span>
                      </span>
                    </div>

                    {/* Notes */}
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special requests or symptoms?"
                        value={formData.notes}
                        className='resize-none'
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    {/* Fee & Status Summary */}
                    <div className="space-y-3">
                      {selectedServiceFee > 0 && (
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <span className="text-sm font-medium text-primary flex items-center gap-2">
                            <Info className="w-4 h-4" /> Estimated Fee
                          </span>
                          <span className="text-lg font-bold text-primary">₱{selectedServiceFee.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Status Information */}
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <Info className="w-4 h-4 text-amber-600" />
                        <div className="text-sm text-amber-700">
                          <span className="font-medium">Status after booking: </span>
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                            PENDING
                          </Badge>
                          <p className="text-xs mt-1">Your appointment will be confirmed after payment is received.</p>
                        </div>
                      </div>
                    </div>
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
                  <h3 className="font-semibold text-lg">Appointment Booked Successfully!</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    Your appointment is now <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-300">PENDING</Badge>.
                    Please proceed to payment to confirm your booking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t shrink-0">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={resetAndClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.service_id ||
                  !formData.date ||
                  !formData.time ||
                  !formData.full_name ||
                  loading ||
                  loadingAvailability ||
                  !isDateValid
                }
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Book Appointment
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