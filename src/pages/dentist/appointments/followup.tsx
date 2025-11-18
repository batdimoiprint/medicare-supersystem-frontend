import React, { useState, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  User,
  DollarSign,
  ClipboardCheck,
  Zap,
  Check,
  X,
  Loader2,
  List,
  Clock,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// --- Type Definitions ---
interface Service {
  id: string;
  name: string;
  fee: number;
  timeSlot: string;
}

interface Dentist {
  id: string;
  name: string;
}

interface StatusHistoryItem {
  step: number;
  label: string;
  timestamp: Date;
  completed: boolean;
}

interface FollowupAppointment {
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
  originalAppointmentId?: number;
  followupReason?: string;
}

type FollowupAction =
  | { type: 'CREATE_FOLLOWUP'; payload: Omit<FollowupAppointment, 'id' | 'status' | 'statusHistory'> }
  | { type: 'CONFIRM_PAYMENT'; payload: { id: number } }
  | { type: 'APPROVE_FOLLOWUP'; payload: { id: number } }
  | { type: 'CANCEL_FOLLOWUP'; payload: { id: number } };

// --- Constants and Initial State ---
const SERVICES: Service[] = [
  { id: 'clean', name: 'Dental Cleaning', fee: 500, timeSlot: '9:00 AM' },
  { id: 'checkup', name: 'Comprehensive Checkup', fee: 300, timeSlot: '10:00 AM' },
  { id: 'filling', name: 'Tooth Filling', fee: 1500, timeSlot: '1:00 PM' },
  { id: 'followup', name: 'Follow-up Consultation', fee: 200, timeSlot: '9:00 AM' },
];

const DENTISTS: Dentist[] = [
  { id: 'dr_a', name: 'Dr. Evelyn Reyes' },
  { id: 'dr_b', name: 'Dr. Mark Santos' },
];

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

const FOLLOWUP_REASONS = [
  'Post-treatment check',
  'Progress review',
  'Complication follow-up',
  'Routine follow-up',
  'Other',
];

// Mock confirmed appointments for followup selection
const MOCK_CONFIRMED_APPOINTMENTS: FollowupAppointment[] = [
  {
    id: 1001,
    service: 'Dental Cleaning',
    dentist: 'Dr. Evelyn Reyes',
    date: '2024-01-15',
    time: '9:00 AM',
    fee: 500,
    patient: 'Current Patient',
    status: 'CONFIRMED',
    statusHistory: [
      { step: 1, label: 'Service & Schedule Selected (Patient)', timestamp: new Date('2024-01-10'), completed: true },
      { step: 2, label: 'Dentist Availability Confirmed (System)', timestamp: new Date('2024-01-10'), completed: true },
      { step: 3, label: 'PayMongo Payment Initiated (Patient)', timestamp: new Date('2024-01-10'), completed: true },
      { step: 4, label: 'Payment Confirmed / Record Created (Webhook)', timestamp: new Date('2024-01-10'), completed: true },
      { step: 5, label: 'Front Desk Approved (Group 1)', timestamp: new Date('2024-01-10'), completed: true },
      { step: 6, label: 'Status Synced (Core & Group 3)', timestamp: new Date('2024-01-10'), completed: true },
    ],
  },
];

const INITIAL_FOLLOWUPS: FollowupAppointment[] = [];

// --- Reducer for State Management (Simulating Database) ---

const followupReducer = (state: FollowupAppointment[], action: FollowupAction): FollowupAppointment[] => {
  switch (action.type) {
    case 'CREATE_FOLLOWUP':
      return [
        ...state,
        {
          id: Date.now(),
          ...action.payload,
          status: 'PENDING_PAYMENT',
          statusHistory: [
            { step: 1, label: 'Follow-up Service & Schedule Selected (Patient)', timestamp: new Date(), completed: true },
          ],
        },
      ];

    case 'CONFIRM_PAYMENT':
      return state.map((app: FollowupAppointment) =>
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

    case 'APPROVE_FOLLOWUP':
      return state.map((app: FollowupAppointment) =>
        app.id === action.payload.id
          ? {
              ...app,
              status: 'CONFIRMED',
              approvedBy: 'Front Desk',
              statusHistory: [
                ...app.statusHistory,
                { step: 5, label: 'Front Desk Approved (Group 1)', timestamp: new Date(), completed: true },
                { step: 6, label: 'Patient Dashboard & Records Updated (Core/Group 3)', timestamp: new Date(), completed: true },
              ],
            }
          : app
      );

    case 'CANCEL_FOLLOWUP':
      return state.map((app: FollowupAppointment) =>
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

// --- Component: Followup Stepper ---

interface FollowupStepperProps {
  appointment: FollowupAppointment;
}

const FollowupStepper = ({ appointment }: FollowupStepperProps) => {
  const steps = [
    { id: '1', label: 'Follow-up Service & Schedule Selected (Patient)', icon: CalendarIcon },
    { id: '2', label: 'Dentist Availability Confirmed (System)', icon: CheckCircle },
    { id: '3', label: 'PayMongo Payment Initiated (Patient)', icon: DollarSign },
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
             icon = Zap;
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

// --- Component: Patient Followup Dashboard ---

interface PatientFollowupDashboardProps {
  followups: FollowupAppointment[];
  dispatch: React.Dispatch<FollowupAction>;
}

const PatientFollowupDashboard = ({ followups, dispatch }: PatientFollowupDashboardProps) => {
  const [selectedOriginalAppointment, setSelectedOriginalAppointment] = useState<number | ''>('');
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICES.find(s => s.id === 'followup')?.id || SERVICES[0].id);
  const [selectedDentistId, setSelectedDentistId] = useState(DENTISTS[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [followupReason, setFollowupReason] = useState(FOLLOWUP_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pendingFollowupRef = useRef<{ patient: string; date: string; time: string; dentist: string; service: string; originalAppointmentId?: number; followupReason?: string } | null>(null);

  const service = SERVICES.find(s => s.id === selectedServiceId);
  const dentist = DENTISTS.find(d => d.id === selectedDentistId);
  const fee = service?.fee || 0;
  const originalAppointment = selectedOriginalAppointment 
    ? MOCK_CONFIRMED_APPOINTMENTS.find(a => a.id === Number(selectedOriginalAppointment))
    : null;

  // Check dentist availability for selected date and dentist (Step 2)
  const getAvailableTimeSlots = useCallback((date: string, dentistId: string): string[] => {
    const bookedSlots = followups
      .filter((app: FollowupAppointment) => 
        app.dentist === DENTISTS.find(d => d.id === dentistId)?.name &&
        app.date === date &&
        app.status !== 'CANCELLED'
      )
      .map((app: FollowupAppointment) => app.time);

    return AVAILABLE_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));
  }, [followups]);

  const availableTimeSlots = getAvailableTimeSlots(selectedDate, selectedDentistId);

  useEffect(() => {
    if (!availableTimeSlots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(availableTimeSlots[0] || '');
    }
  }, [selectedDate, selectedDentistId, availableTimeSlots, selectedTimeSlot]);

  // Auto-select dentist from original appointment
  useEffect(() => {
    if (originalAppointment) {
      const dentist = DENTISTS.find(d => d.name === originalAppointment.dentist);
      if (dentist) {
        setSelectedDentistId(dentist.id);
      }
    }
  }, [originalAppointment]);

  const isTimeSlotAvailable = useCallback((date: string, timeSlot: string, dentistId: string): boolean => {
    return getAvailableTimeSlots(date, dentistId).includes(timeSlot);
  }, [getAvailableTimeSlots]);

  const handleBooking = async () => {
    setError('');
    setMessage('');
    setIsBooking(true);

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

    if (!selectedOriginalAppointment) {
      setError('Please select the original appointment for this follow-up.');
      setIsBooking(false);
      return;
    }

    setIsCheckingAvailability(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!isTimeSlotAvailable(selectedDate, selectedTimeSlot, selectedDentistId)) {
      setError('Selected time slot is no longer available. Please choose another slot.');
      setIsBooking(false);
      setIsCheckingAvailability(false);
      return;
    }
    setIsCheckingAvailability(false);

    const newFollowup = {
      service: service.name,
      dentist: dentist.name,
      date: selectedDate,
      time: selectedTimeSlot,
      fee: fee,
      patient: 'Current Patient',
      originalAppointmentId: Number(selectedOriginalAppointment),
      followupReason: followupReason === 'Other' ? customReason : followupReason,
    };

    pendingFollowupRef.current = newFollowup;
    dispatch({ type: 'CREATE_FOLLOWUP', payload: newFollowup });
    setMessage('✓ Availability confirmed (Step 2). Follow-up appointment slot reserved. Redirecting to PayMongo for payment (Step 3)...');

    await new Promise(resolve => setTimeout(resolve, 2000));
    setMessage('Processing payment with PayMongo...');

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const createdFollowup = [...followups]
      .sort((a, b) => b.id - a.id)
      .find((app: FollowupAppointment) => 
        pendingFollowupRef.current &&
        app.patient === pendingFollowupRef.current.patient && 
        app.date === pendingFollowupRef.current.date &&
        app.time === pendingFollowupRef.current.time &&
        app.dentist === pendingFollowupRef.current.dentist &&
        app.service === pendingFollowupRef.current.service &&
        app.status === 'PENDING_PAYMENT'
      ) || [...followups]
        .sort((a, b) => b.id - a.id)
        .find((app: FollowupAppointment) => app.status === 'PENDING_PAYMENT');

    if (createdFollowup) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      dispatch({ type: 'CONFIRM_PAYMENT', payload: { id: createdFollowup.id } });
      setMessage(`✓ Payment confirmed via PayMongo webhook (Step 4)! Follow-up appointment #${createdFollowup.id} has been automatically created and sent to Front Desk for approval (Step 5).`);
      pendingFollowupRef.current = null;
    } else {
      setMessage('Payment processed. Waiting for webhook confirmation...');
    }

    setIsBooking(false);
  };

  const patientFollowups = followups.filter((a: FollowupAppointment) => a.patient === 'Current Patient');

  return (
    <div className="space-y-6">
      <CardWithTitle title="Schedule Follow-up Appointment" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Field orientation="vertical" className="lg:col-span-2">
          <FieldLabel>1. Select Original Appointment</FieldLabel>
          <FieldContent>
            <Select 
              value={selectedOriginalAppointment.toString()} 
              onValueChange={(value) => setSelectedOriginalAppointment(value === '' ? '' : Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select the original appointment" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CONFIRMED_APPOINTMENTS.map(app => (
                  <SelectItem key={app.id} value={app.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{app.service}</span>
                      <span className="text-xs text-muted-foreground">
                        {app.date} at {app.time} with {app.dentist}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {originalAppointment && (
              <p className="text-xs text-muted-foreground mt-1">
                Original: {originalAppointment.service} on {originalAppointment.date}
              </p>
            )}
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>2. Follow-up Reason</FieldLabel>
          <FieldContent>
            <Select value={followupReason} onValueChange={setFollowupReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLLOWUP_REASONS.map(reason => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        {followupReason === 'Other' && (
          <Field orientation="vertical">
            <FieldLabel>Custom Reason</FieldLabel>
            <FieldContent>
              <Input
                value={customReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomReason(e.target.value)}
                placeholder="Enter follow-up reason"
              />
            </FieldContent>
          </Field>
        )}
        <Field orientation="vertical">
          <FieldLabel>3. Select Service</FieldLabel>
          <FieldContent>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Fee: ₱{s.fee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>4. Select Dentist</FieldLabel>
          <FieldContent>
            <Select value={selectedDentistId} onValueChange={setSelectedDentistId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DENTISTS.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field orientation="vertical">
          <FieldLabel>5. Select Date</FieldLabel>
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
            6. Select Time Slot {isCheckingAvailability && <Loader2 className="w-3 h-3 inline ml-2 animate-spin" />}
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
              <p className="text-sm text-muted-foreground mb-1">Total Follow-up Fee</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">₱{fee.toLocaleString()}</span>
              </p>
            </div>
            <Button
              onClick={handleBooking}
              disabled={isBooking || !selectedTimeSlot || availableTimeSlots.length === 0 || isCheckingAvailability || !selectedOriginalAppointment}
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
                  <DollarSign className="w-4 h-4 mr-2" />
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
        <h2 className="text-2xl font-bold">Your Follow-up Appointments</h2>
        {patientFollowups.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No follow-up appointments scheduled yet</p>
                <p className="text-sm mt-2">Schedule a follow-up using the form above</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {patientFollowups.sort((a: FollowupAppointment, b: FollowupAppointment) => b.id - a.id).map((app: FollowupAppointment) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3">
                        {app.service}
                        {app.originalAppointmentId && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            (Follow-up to #{app.originalAppointmentId})
                          </span>
                        )}
                      </CardTitle>
                      <div className="space-y-2">
                        {app.followupReason && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Reason:</span> {app.followupReason}
                          </p>
                        )}
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
                    <FollowupStepper appointment={app} />
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

// --- Component: Front Desk Followup View (Group 1) ---

interface FrontDeskFollowupViewProps {
  followups: FollowupAppointment[];
  dispatch: React.Dispatch<FollowupAction>;
}

const FrontDeskFollowupView = ({ followups, dispatch }: FrontDeskFollowupViewProps) => {
  const pendingFollowups = followups.filter((a: FollowupAppointment) => a.status === 'PENDING_APPROVAL');
  
  const handleApprove = (id: number) => {
    dispatch({ type: 'APPROVE_FOLLOWUP', payload: { id } });
  };

  const handleCancel = (id: number) => {
    dispatch({ type: 'CANCEL_FOLLOWUP', payload: { id } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Follow-up Appointments Pending Approval</h2>
        <p className="text-muted-foreground text-sm">Review and approve follow-up appointment requests from patients</p>
      </div>
      <div className="space-y-4">
        {pendingFollowups.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No follow-up appointments awaiting approval</p>
                <p className="text-sm mt-2">All pending follow-up appointments have been processed</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingFollowups.map((app: FollowupAppointment) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-3">
                      {app.service} with {app.dentist}
                      {app.originalAppointmentId && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          (Follow-up to #{app.originalAppointmentId})
                        </span>
                      )}
                    </CardTitle>
                    <div className="space-y-2">
                      {app.followupReason && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Follow-up Reason:</span> {app.followupReason}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Patient:</span> {app.patient}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Date:</span> {app.date} at {app.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Fee:</span> ₱{app.fee.toLocaleString()}
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

// --- Component: Patient Records Followup View (Group 3) ---

interface PatientRecordsFollowupViewProps {
  followups: FollowupAppointment[];
}

const PatientRecordsFollowupView = ({ followups }: PatientRecordsFollowupViewProps) => {
    const sortedFollowups = followups.slice().sort((a: FollowupAppointment, b: FollowupAppointment) => b.id - a.id);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Complete Follow-up Appointment Records</h2>
                <p className="text-muted-foreground text-sm">View all follow-up appointment records across the system</p>
            </div>
            {sortedFollowups.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No follow-up records found</p>
                            <p className="text-sm mt-2">Follow-up appointment records will appear here once created</p>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Original Appt</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dentist</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date / Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {sortedFollowups.map((app: FollowupAppointment) => (
                                        <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{app.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium">{app.patient}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{app.service}</p>
                                                {app.followupReason && (
                                                  <p className="text-xs text-muted-foreground mt-1">Reason: {app.followupReason}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                              {app.originalAppointmentId ? `#${app.originalAppointmentId}` : '-'}
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

// --- Main Followup App Component ---

const FollowupApp = () => {
  const [followups, dispatch] = useReducer(followupReducer, INITIAL_FOLLOWUPS);
  const [activeView, setActiveView] = useState('patient'); // 'patient', 'frontdesk', 'records'

  const renderView = () => {
    switch (activeView) {
      case 'frontdesk':
        return <FrontDeskFollowupView followups={followups} dispatch={dispatch} />;
      case 'records':
        return <PatientRecordsFollowupView followups={followups} />;
      case 'patient':
      default:
        return <PatientFollowupDashboard followups={followups} dispatch={dispatch} />;
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
                  <Repeat className="w-8 h-8" />
                  Follow-up Appointment System
                </CardTitle>
                <p className="text-muted-foreground">
                  Schedule and manage follow-up appointments based on previous confirmed appointments.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <NavItem view="patient" label="Patient Dashboard" icon={User} />
              <NavItem view="frontdesk" label="Front Desk Approval" icon={ClipboardCheck} />
              <NavItem view="records" label="Follow-up Records" icon={List} />
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

export default FollowupApp;

