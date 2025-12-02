import React, { useState, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  User,
  Coins,
  ClipboardCheck,
  Zap,
  Check,
  X,
  Loader2,
  List,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import supabase, { dentistClient } from '@/utils/supabase';

// --- Type Definitions ---
interface Service {
  service_id: number;
  service_name: string;
  service_fee: number;
}

interface Dentist {
  personnel_id: string;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface StatusHistoryItem {
  step: number;
  label: string;
  timestamp: Date;
  completed: boolean;
}

interface Appointment {
  id: number;
  service: string;
  dentist: string;
  date: string;
  time: string;
  fee: number;
  patient: string;
  status: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'CANCELLED';
  statusHistory: StatusHistoryItem[];
  approvedBy?: string;
}

type AppointmentAction =
  | { type: 'CREATE_APPOINTMENT'; payload: Omit<Appointment, 'id' | 'status' | 'statusHistory'> }
  | { type: 'CONFIRM_PAYMENT'; payload: { id: number } }
  | { type: 'APPROVE_APPOINTMENT'; payload: { id: number } }
  | { type: 'CANCEL_APPOINTMENT'; payload: { id: number } }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] };

// Available time slots for appointments
const AVAILABLE_TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

const INITIAL_APPOINTMENTS: Appointment[] = [];

// Helper to get dentist full name
const getDentistName = (dentist: Dentist): string => {
  return `Dr. ${dentist.f_name ?? ''} ${dentist.m_name ?? ''} ${dentist.l_name ?? ''}`.trim();
};

// --- Reducer for State Management (Simulating Database) ---

const appointmentReducer = (state: Appointment[], action: AppointmentAction): Appointment[] => {
  switch (action.type) {
    case 'SET_APPOINTMENTS':
      return action.payload;

    case 'CREATE_APPOINTMENT':
      return [
        ...state,
        {
          id: Date.now(),
          ...action.payload,
          status: 'PENDING_PAYMENT',
          statusHistory: [
            { step: 1, label: 'Service & Schedule Selected (Patient)', timestamp: new Date(), completed: true },
          ],
        },
      ];

    case 'CONFIRM_PAYMENT':
      return state.map((app: Appointment) =>
        app.id === action.payload.id
          ? {
              ...app,
              status: 'PENDING_APPROVAL',
              statusHistory: [
                ...app.statusHistory,
                { step: 2, label: 'Dentist Availability Confirmed (System)', timestamp: new Date(), completed: true },
                { step: 3, label: 'PayMongo Payment Initiated (Patient)', timestamp: new Date(), completed: true },
                { step: 4, label: 'Payment Confirmed / Record Created (Webhook)', timestamp: new Date(), completed: true },
              ],
            }
          : app
      );

    case 'APPROVE_APPOINTMENT':
      return state.map((app: Appointment) =>
        app.id === action.payload.id
          ? {
              ...app,
              status: 'CONFIRMED',
              approvedBy: 'Front Desk',
              statusHistory: [
                ...app.statusHistory,
                { step: 3, label: 'Front Desk Approved (Group 1)', timestamp: new Date(), completed: true },
                { step: 4, label: 'Patient Dashboard & Records Updated (Core/Group 3)', timestamp: new Date(), completed: true },
              ],
            }
          : app
      );

    case 'CANCEL_APPOINTMENT':
      return state.map((app: Appointment) =>
        app.id === action.payload.id
          ? { ...app, status: 'CANCELLED', statusHistory: [...app.statusHistory, { step: 5, label: 'Cancelled', timestamp: new Date(), completed: true }] }
          : app
      );

    default:
      return state;
  }
};

// --- Helper Component for Card with Title ---
interface CardWithTitleProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const CardWithTitle = ({ title, children, className = '' }: CardWithTitleProps) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// --- Component: Appointment Stepper (Step 6 Visualization) ---

interface AppointmentStepperProps {
  appointment: Appointment;
}

const AppointmentStepper = ({ appointment }: AppointmentStepperProps) => {
  const steps = [
    { id: '1', label: 'Service & Schedule Selected (Patient)', icon: CalendarIcon },
    { id: '2', label: 'Dentist Availability Confirmed (System)', icon: CheckCircle },
    { id: '3', label: 'PayMongo Payment Initiated (Patient)', icon: Coins },
    { id: '4', label: 'Payment Confirmed / Record Created (Webhook)', icon: Zap },
    { id: '5', label: 'Front Desk Approval (Group 1)', icon: ClipboardCheck },
    { id: '6', label: 'Status Synced (Core & Group 3)', icon: List },
  ];

  let currentStepIndex = appointment.statusHistory.length > 0 ? steps.findIndex(s => s.label.includes(appointment.statusHistory[appointment.statusHistory.length - 1].label)) : -1;

  if (appointment.status === 'CONFIRMED') {
    currentStepIndex = 5; // All steps completed
  } else if (appointment.status === 'PENDING_APPROVAL') {
    currentStepIndex = 3;
  } else if (appointment.status === 'PENDING_PAYMENT') {
    currentStepIndex = 0;
  }

  return (
    <div className="space-y-4 pt-4">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isActive = index === currentStepIndex + 1 && appointment.status !== 'CONFIRMED';
        
        // Define status icons based on the actual status flow
        let icon: LucideIcon = step.icon;
        let iconColor = 'text-muted-foreground';
        let borderColor = 'border-muted';
        let ringColor = 'ring-muted';
        let bgColor = 'bg-card';

        if (isCompleted || index < currentStepIndex) {
          icon = Check;
          iconColor = 'text-green-600 dark:text-green-400';
          borderColor = 'border-green-600 dark:border-green-400';
          ringColor = 'ring-green-600/20 dark:ring-green-400/20';
        } else if (isActive) {
          iconColor = 'text-primary';
          borderColor = 'border-primary';
          ringColor = 'ring-primary/20';
        } else if (appointment.status === 'CANCELLED') {
          icon = X;
          iconColor = 'text-destructive';
          borderColor = 'border-destructive';
          ringColor = 'ring-destructive/20';
        }

        if (index === 3 && appointment.status === 'PENDING_APPROVAL') {
             icon = Zap; // Special status for webhook
             iconColor = 'text-yellow-600 dark:text-yellow-400';
        }

        const StatusIcon = icon;

        return (
          <div key={step.id} className="relative flex">
            <div className="flex flex-col items-center mr-4">
              <div className={`h-10 w-10 flex items-center justify-center rounded-full border-2 ${borderColor} ${bgColor} ring-4 ${ringColor} transition-all`}>
                <StatusIcon className={`w-5 h-5 ${iconColor}`} />
              </div>
              {index < steps.length - 1 && (
                <div className={`h-full w-0.5 mt-2 ${isCompleted ? 'bg-green-600 dark:bg-green-400' : 'bg-muted'}`} />
              )}
            </div>
            <div className={`flex-1 pb-4 pt-2 transition-all ${isCompleted ? '' : 'text-muted-foreground'}`}>
              <p className="font-medium text-sm">{step.label}</p>
              {appointment.statusHistory.map((history: StatusHistoryItem, i: number) => 
                (history.label === step.label || (step.id === '6' && history.label.includes('Updated'))) && (
                  <p key={i} className="text-xs text-muted-foreground mt-1">
                    {history.timestamp.toLocaleTimeString()}
                  </p>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Component: Patient Dashboard (Core) ---

interface PatientDashboardProps {
  appointments: Appointment[];
  dispatch: React.Dispatch<AppointmentAction>;
  services: Service[];
  dentists: Dentist[];
}

const PatientDashboard = ({ appointments, dispatch, services, dentists }: PatientDashboardProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pendingAppointmentRef = useRef<{ patient: string; date: string; time: string; dentist: string; service: string } | null>(null);

  // Set defaults when data loads
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(String(services[0].service_id));
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (dentists.length > 0 && !selectedDentistId) {
      setSelectedDentistId(String(dentists[0].dentist_info_id));
    }
  }, [dentists, selectedDentistId]);

  const service = services.find(s => String(s.service_id) === selectedServiceId);
  const dentist = dentists.find(d => String(d.dentist_info_id) === selectedDentistId);
  const fee = service?.service_fee || 0;
  const dentistName = dentist ? getDentistName(dentist) : '';

  // Check dentist availability for selected date and dentist (Step 2)
  const getAvailableTimeSlots = useCallback((date: string, dentistId: string): string[] => {
    // Get all booked appointments for this dentist and date
    const selectedDentist = dentists.find(d => String(d.dentist_info_id) === dentistId);
    const dentistFullName = selectedDentist ? getDentistName(selectedDentist) : '';
    
    const bookedSlots = appointments
      .filter((app: Appointment) => 
        app.dentist === dentistFullName &&
        app.date === date &&
        app.status !== 'CANCELLED'
      )
      .map((app: Appointment) => app.time);

    // Return available slots (not booked)
    return AVAILABLE_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));
  }, [appointments, dentists]);

  // Get available time slots for current selection
  const availableTimeSlots = getAvailableTimeSlots(selectedDate, selectedDentistId);

  // Reset selected time slot when date or dentist changes
  useEffect(() => {
    if (!availableTimeSlots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(availableTimeSlots[0] || '');
    }
  }, [selectedDate, selectedDentistId, availableTimeSlots, selectedTimeSlot]);

  // Check if a specific time slot is available
  const isTimeSlotAvailable = useCallback((date: string, timeSlot: string, dentistId: string): boolean => {
    return getAvailableTimeSlots(date, dentistId).includes(timeSlot);
  }, [getAvailableTimeSlots]);

  const handleBooking = async () => {
    setError('');
    setMessage('');
    setIsBooking(true);

    // Step 1: Validate selections
    if (!service || !dentist) {
      setError('Please select a service and dentist.');
      setIsBooking(false);
      return;
    }

    if (!selectedTimeSlot) {
      setError('Please select a time slot.');
      setIsBooking(false);
      return;
    }

    // Step 2: System checks dentist availability
    setIsCheckingAvailability(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    if (!isTimeSlotAvailable(selectedDate, selectedTimeSlot, selectedDentistId)) {
      setError('Selected time slot is no longer available. Please choose another slot.');
      setIsBooking(false);
      setIsCheckingAvailability(false);
      return;
    }
    setIsCheckingAvailability(false);

    // Step 1 & 2: Create appointment with PENDING_PAYMENT status
    const newAppointment = {
      service: service.service_name,
      dentist: dentistName,
      date: selectedDate,
      time: selectedTimeSlot,
      fee: fee,
      patient: 'Current Patient',
    };

    // Step 1 & 2: Create appointment with PENDING_PAYMENT status
    // The appointment is created immediately with PENDING_PAYMENT status
    pendingAppointmentRef.current = newAppointment;
    
    // Create appointment record (Step 1 & 2 complete)
    dispatch({ type: 'CREATE_APPOINTMENT', payload: newAppointment });
    setMessage('✓ Availability confirmed (Step 2). Appointment slot reserved. Redirecting to PayMongo for payment (Step 3)...');

    // Step 3: Simulate PayMongo Payment
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing
    setMessage('Processing payment with PayMongo...');

    // Step 4: Simulate PayMongo Webhook - automatically confirms payment and creates record
    // Wait for React state to update with the new appointment
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the appointment we just created
    // The webhook automatically finds and confirms the appointment by matching details
    const createdAppointment = [...appointments]
      .sort((a, b) => b.id - a.id)
      .find((app: Appointment) => 
        pendingAppointmentRef.current &&
        app.patient === pendingAppointmentRef.current.patient && 
        app.date === pendingAppointmentRef.current.date &&
        app.time === pendingAppointmentRef.current.time &&
        app.dentist === pendingAppointmentRef.current.dentist &&
        app.service === pendingAppointmentRef.current.service &&
        app.status === 'PENDING_PAYMENT'
      ) || [...appointments]
        .sort((a, b) => b.id - a.id)
        .find((app: Appointment) => app.status === 'PENDING_PAYMENT');

    if (createdAppointment) {
      // Webhook confirms payment and updates status to PENDING_APPROVAL
      // The webhook automatically creates the appointment record and confirms payment
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate webhook processing time
      dispatch({ type: 'CONFIRM_PAYMENT', payload: { id: createdAppointment.id } });
      setMessage(`✓ Payment confirmed via PayMongo webhook (Step 4)! Appointment #${createdAppointment.id} has been automatically created and sent to Front Desk for approval (Step 5).`);
      pendingAppointmentRef.current = null;
    } else {
      setMessage('Payment processed. Waiting for webhook confirmation...');
    }

    setIsBooking(false);
  };

  const patientAppointments = appointments.filter((a: Appointment) => a.patient === 'Current Patient');

  return (
    <div className="space-y-6">
      <CardWithTitle title="Book New Appointment" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Field orientation="vertical">
          <FieldLabel>1. Select Service (Step 1)</FieldLabel>
          <FieldContent>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={services.length === 0 ? "Loading services..." : "Select a service"} />
              </SelectTrigger>
              <SelectContent>
                {services.length === 0 ? (
                  <SelectItem value="none" disabled>No services available</SelectItem>
                ) : (
                  services.map(s => (
                    <SelectItem key={s.service_id} value={String(s.service_id)}>
                      {s.service_name} (Fee: {formatCurrency(s.service_fee || 0)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>2. Select Dentist</FieldLabel>
          <FieldContent>
            <Select value={selectedDentistId} onValueChange={setSelectedDentistId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={dentists.length === 0 ? "Loading dentists..." : "Select a dentist"} />
              </SelectTrigger>
              <SelectContent>
                {dentists.length === 0 ? (
                  <SelectItem value="none" disabled>No dentists available</SelectItem>
                ) : (
                  dentists.map(d => (
                    <SelectItem key={d.dentist_info_id} value={String(d.dentist_info_id)}>
                      {getDentistName(d)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>3. Select Date</FieldLabel>
          <FieldContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>
            4. Select Time Slot {isCheckingAvailability && <Loader2 className="w-3 h-3 inline ml-2 animate-spin" />}
          </FieldLabel>
          <FieldContent>
            {availableTimeSlots.length === 0 ? (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No available time slots for this dentist on {selectedDate}
              </div>
            ) : (
              <Select 
                value={selectedTimeSlot} 
                onValueChange={setSelectedTimeSlot}
                disabled={isCheckingAvailability}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {slot}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {availableTimeSlots.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {availableTimeSlots.length} slot{availableTimeSlots.length !== 1 ? 's' : ''} available
              </p>
            )}
          </FieldContent>
        </Field>
        <div className="lg:col-span-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Reservation Fee</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">{formatCurrency(fee)}</span>
              </p>
            </div>
            <Button
              onClick={handleBooking}
              disabled={isBooking || !selectedTimeSlot || availableTimeSlots.length === 0 || isCheckingAvailability}
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Proceed to PayMongo
                </>
              )}
            </Button>
          </div>
        </div>
        {(message || error) && (
          <div className={`lg:col-span-4 p-4 rounded-lg text-sm font-medium border ${error ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {error || message}
          </div>
        )}
      </CardWithTitle>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Appointments</h2>
        {patientAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No appointments booked yet</p>
                <p className="text-sm mt-2">Book your first appointment using the form above</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {patientAppointments.sort((a: Appointment, b: Appointment) => b.id - a.id).map((app: Appointment) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3">{app.service}</CardTitle>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {app.dentist}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {app.date} at {app.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        app.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        app.status === 'PENDING_PAYMENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-4">Workflow Status</h3>
                    <AppointmentStepper appointment={app} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Component: Front Desk View (Group 1) ---

interface FrontDeskViewProps {
  appointments: Appointment[];
  dispatch: React.Dispatch<AppointmentAction>;
}

const FrontDeskView = ({ appointments, dispatch }: FrontDeskViewProps) => {
  const pendingAppointments = appointments.filter((a: Appointment) => a.status === 'PENDING_APPROVAL');
  
  const handleApprove = (id: number) => {
    dispatch({ type: 'APPROVE_APPOINTMENT', payload: { id } });
  };

  const handleCancel = (id: number) => {
    dispatch({ type: 'CANCEL_APPOINTMENT', payload: { id } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Appointments Pending Approval</h2>
        <p className="text-muted-foreground text-sm">Review and approve appointment requests from patients</p>
      </div>
      <div className="space-y-4">
        {pendingAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No appointments awaiting approval</p>
                <p className="text-sm mt-2">All pending appointments have been processed</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingAppointments.map((app: Appointment) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-3">{app.service} with {app.dentist}</CardTitle>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Patient:</span> {app.patient}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Date:</span> {app.date} at {app.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Fee:</span> {formatCurrency(app.fee)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleApprove(app.id)} size="lg">
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleCancel(app.id)} size="lg">
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// --- Component: Patient Records View (Group 3) ---

interface PatientRecordsViewProps {
  appointments: Appointment[];
}

const PatientRecordsView = ({ appointments }: PatientRecordsViewProps) => {
    const sortedAppointments = appointments.slice().sort((a: Appointment, b: Appointment) => b.id - a.id);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Complete Patient Records</h2>
                <p className="text-muted-foreground text-sm">View all appointment records across the system</p>
            </div>
            {sortedAppointments.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No records found</p>
                            <p className="text-sm mt-2">Appointment records will appear here once created</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient / Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dentist</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date / Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {sortedAppointments.map((app: Appointment) => (
                                        <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{app.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium">{app.patient}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{app.service}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{app.dentist}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{app.date} @ {app.time}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                                    app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    app.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    app.status === 'PENDING_PAYMENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {app.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [appointments, dispatch] = useReducer(appointmentReducer, INITIAL_APPOINTMENTS);
  const [activeView, setActiveView] = useState('patient'); // 'patient', 'frontdesk', 'records'
  const [services, setServices] = useState<Service[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);

  // Load services from dentist.services_tbl
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await dentistClient
          .from('services_tbl')
          .select('service_id, service_name, service_fee')
          .not('service_id', 'is', null)
          .order('service_name', { ascending: true });

        if (error) {
          console.error('Failed to load services:', error);
          return;
        }
        setServices(data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    loadServices();
  }, []);

  // Load dentists from dentist.dentist_info_tbl
  useEffect(() => {
    const loadDentists = async () => {
      try {
        const { data, error } = await dentistClient
          .from('dentist_info_tbl')
          .select('dentist_info_id, f_name, m_name, l_name')
          .order('l_name', { ascending: true });

        if (error) {
          console.error('Failed to load dentists:', error);
          return;
        }
        setDentists(data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    loadDentists();
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'frontdesk':
        return <FrontDeskView appointments={appointments} dispatch={dispatch} />;
      case 'records':
        return <PatientRecordsView appointments={appointments} />;
      case 'patient':
      default:
        return <PatientDashboard appointments={appointments} dispatch={dispatch} services={services} dentists={dentists} />;
    }
  };

  interface NavItemProps {
    view: string;
    label: string;
    icon: LucideIcon;
  }

  const NavItem = ({ view, label, icon: Icon }: NavItemProps) => (
    <Button 
      variant={activeView === view ? 'default' : 'secondary'}
      onClick={() => setActiveView(view)}
      className={`!py-3 ${activeView === view ? 'shadow-lg' : ''}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                  <CalendarIcon className="w-8 h-8" />
                  Dentist Appointment System
                </CardTitle>
                
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <NavItem view="patient" label="Patient Dashboard" icon={User} />
              <NavItem view="frontdesk" label="Front Desk Approval" icon={ClipboardCheck} />
              <NavItem view="records" label="Patient Records" icon={List} />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <main>
          {renderView()}
        </main>
      </div>
    </div>
  );
};


export default App;