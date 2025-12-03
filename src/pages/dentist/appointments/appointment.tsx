import React, { useState, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  User,
  Coins,
  Zap,
  Check,
  X,
  List,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const dentistClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'dentist' } });
const frontdeskClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'frontdesk' } });
const patientRecordClient = createClient(supabaseUrl, supabaseKey, { db: { schema: 'patient_record' } });

// --- Type Definitions ---
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
  status: 'Pending' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show' | 'Rescheduled';
  statusHistory: StatusHistoryItem[];
  approvedBy?: string;
  appointment_status_id?: number; // Store the status ID from database
}

type AppointmentAction =
  | { type: 'CREATE_APPOINTMENT'; payload: Omit<Appointment, 'id' | 'status' | 'statusHistory'> }
  | { type: 'CONFIRM_PAYMENT'; payload: { id: number } }
  | { type: 'APPROVE_APPOINTMENT'; payload: { id: number } }
  | { type: 'CANCEL_APPOINTMENT'; payload: { id: number } }
  | { type: 'ACCEPT_APPOINTMENT'; payload: { id: number } }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] };

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
          status: 'Pending',
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
              status: 'Scheduled',
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
              status: 'Confirmed',
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
          ? { ...app, status: 'Cancelled', statusHistory: [...app.statusHistory, { step: 5, label: 'Cancelled', timestamp: new Date(), completed: true }] }
          : app
      );

    default:
      return state;
  }
};

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
    { id: '5', label: 'Front Desk Approval (Group 1)', icon: CheckCircle },
    { id: '6', label: 'Status Synced (Core & Group 3)', icon: List },
  ];

  let currentStepIndex = appointment.statusHistory.length > 0 ? steps.findIndex(s => s.label.includes(appointment.statusHistory[appointment.statusHistory.length - 1].label)) : -1;

  if (appointment.status === 'Confirmed' || appointment.status === 'Completed') {
    currentStepIndex = 5; // All steps completed
  } else if (appointment.status === 'Scheduled') {
    currentStepIndex = 3;
  } else if (appointment.status === 'Pending') {
    currentStepIndex = 0;
  }

  return (
    <div className="space-y-4 pt-4">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isActive = index === currentStepIndex + 1 && appointment.status !== 'Confirmed' && appointment.status !== 'Completed';
        
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
        } else if (appointment.status === 'Cancelled' || appointment.status === 'No Show') {
          icon = X;
          iconColor = 'text-destructive';
          borderColor = 'border-destructive';
          ringColor = 'ring-destructive/20';
        }

        if (index === 3 && appointment.status === 'Scheduled') {
             icon = Zap; // Special status for scheduled
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
  appointmentStatuses: { appointment_status_id: number; appointment_status_name: string }[];
}

const PatientDashboard = ({ appointments, dispatch, appointmentStatuses }: PatientDashboardProps) => {
  const navigate = useNavigate();
  // All appointments are already filtered by dentist in loadAppointments
  const dentistAppointments = appointments;

  const handleAcceptAppointment = async (appointmentId: number) => {
    try {
      // Debug: Log available statuses
      console.log('Available appointment statuses:', appointmentStatuses);
      
      // Find CONFIRMED status ID (status_id = 3)
      // Try multiple methods: exact match, case-insensitive, trimmed, or by ID
      let confirmedStatus = appointmentStatuses.find(s => 
        s.appointment_status_name === 'Confirmed'
      );
      
      // If not found, try case-insensitive match
      if (!confirmedStatus) {
        confirmedStatus = appointmentStatuses.find(s => 
          s.appointment_status_name?.trim().toLowerCase() === 'confirmed'
        );
      }
      
      // If still not found, try by status_id = 3
      if (!confirmedStatus) {
        confirmedStatus = appointmentStatuses.find(s => 
          s.appointment_status_id === 3
        );
      }

      if (!confirmedStatus) {
        console.error('Available statuses:', appointmentStatuses);
        alert(`Confirmed status not found in database. Available statuses: ${appointmentStatuses.map(s => s.appointment_status_name).join(', ')}`);
        return;
      }
      
      console.log('Found confirmed status:', confirmedStatus);

      // Update appointment status in database
      const { error } = await frontdeskClient
        .from('appointment_tbl')
        .update({ appointment_status_id: confirmedStatus.appointment_status_id })
        .eq('appointment_id', appointmentId);

      if (error) {
        throw error;
      }

      // Update local state
      dispatch({ type: 'ACCEPT_APPOINTMENT', payload: { id: appointmentId } });
      
      // Navigate to workflow with the appointment ID
      navigate(`/dentist/patient/workflow?appointment=${appointmentId}`);
    } catch (err: any) {
      console.error('Error accepting appointment:', err);
      alert('Failed to accept appointment. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Appointments</h2>
        {dentistAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No appointments booked yet</p>
                <p className="text-sm mt-2">No appointments assigned to you</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {dentistAppointments.sort((a: Appointment, b: Appointment) => b.id - a.id).map((app: Appointment) => (
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
                        app.status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        app.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        app.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        app.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        app.status === 'No Show' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        app.status === 'Rescheduled' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {app.status}
                      </span>
                      {(app.status === 'Pending' || app.status === 'Scheduled') && (
                        <Button
                          onClick={() => handleAcceptAppointment(app.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      )}
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
                                                    app.status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    app.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    app.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    app.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    app.status === 'No Show' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    app.status === 'Rescheduled' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {app.status}
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

const AppointmentWorkflow = () => {
  const [appointments, dispatch] = useReducer(appointmentReducer, INITIAL_APPOINTMENTS);
  const [activeView, setActiveView] = useState('patient'); // 'patient', 'frontdesk', 'records'
  const [appointmentStatuses, setAppointmentStatuses] = useState<{ appointment_status_id: number; appointment_status_name: string }[]>([]);

  // Load appointment statuses
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const { data, error } = await frontdeskClient
          .from('appointment_status_tbl')
          .select('appointment_status_id, appointment_status_name')
          .order('appointment_status_id', { ascending: true });

        if (error) {
          console.error('Failed to load appointment statuses:', error);
          return;
        }
        
        console.log('Loaded appointment statuses from database:', data);
        setAppointmentStatuses(data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    loadStatuses();
  }, []);

  // Get current dentist ID
  const getPersonnelId = (): string | null => {
    // Check localStorage first (as used by auth system)
    const userId = localStorage.getItem('user_id');
    if (userId) {
      return userId;
    }
    // Fallback: check sessionStorage
    const sessionUserId = sessionStorage.getItem('user_id');
    if (sessionUserId) {
      return sessionUserId;
    }
    // Fallback: try to get from user object
    const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.personnel_id || user.id || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Load appointments from database
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const personnelId = getPersonnelId();
        
        if (!personnelId) {
          console.warn('No personnel_id found. Please ensure you are logged in.');
          dispatch({ type: 'SET_APPOINTMENTS', payload: [] });
          return;
        }

        console.log('Loading appointments for dentist personnel_id:', personnelId);

        // Filter appointments by the logged-in dentist's personnel_id
        // Try both string and number formats since database might store it as either
        let data, error;
        
        // Try string match first
        const stringResult = await frontdeskClient
          .from('appointment_tbl')
          .select(`
            appointment_id,
            patient_id,
            service_id,
            appointment_date,
            appointment_time,
            appointment_status_id,
            personnel_id,
            created_at
          `)
          .eq('personnel_id', personnelId)
          .order('created_at', { ascending: false });
        
        data = stringResult.data;
        error = stringResult.error;
        
        // If no results and no error, try number format
        if ((!data || data.length === 0) && !error) {
          const numPersonnelId = Number(personnelId);
          if (!isNaN(numPersonnelId)) {
            console.log('Trying number format for personnel_id:', numPersonnelId);
            const numResult = await frontdeskClient
              .from('appointment_tbl')
              .select(`
                appointment_id,
                patient_id,
                service_id,
                appointment_date,
                appointment_time,
                appointment_status_id,
                personnel_id,
                created_at
              `)
              .eq('personnel_id', numPersonnelId)
              .order('created_at', { ascending: false });
            
            if (!numResult.error && numResult.data) {
              data = numResult.data;
              error = numResult.error;
            }
          }
        }

        if (error) {
          console.error('Failed to load appointments:', error);
          return;
        }

        if (!data || data.length === 0) {
          dispatch({ type: 'SET_APPOINTMENTS', payload: [] });
          return;
        }

        // Fetch related data
        const serviceIds = [...new Set(data.map(a => a.service_id).filter(Boolean))];
        const personnelIds = [...new Set(data.map(a => a.personnel_id).filter(Boolean))];
        const patientIds = [...new Set(data.map(a => a.patient_id))];

        // Load services
        const { data: servicesData } = await dentistClient
          .from('services_tbl')
          .select('service_id, service_name')
          .in('service_id', serviceIds);

        // Load personnel
        const { data: personnelData } = await supabase
          .from('personnel_tbl')
          .select('personnel_id, f_name, m_name, l_name')
          .in('personnel_id', personnelIds);

        // Load patients
        const { data: patientsData } = await patientRecordClient
          .from('patient_tbl')
          .select('patient_id, f_name, l_name')
          .in('patient_id', patientIds);

        const serviceMap = new Map(servicesData?.map(s => [s.service_id, s.service_name]) ?? []);
        const personnelMap = new Map(personnelData?.map(p => [p.personnel_id, getDentistName({ personnel_id: p.personnel_id, f_name: p.f_name, m_name: p.m_name, l_name: p.l_name })]) ?? []);
        const patientMap = new Map(patientsData?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []);
        const statusMap = new Map(appointmentStatuses.map(s => [s.appointment_status_id, s.appointment_status_name]));

        // Map status names to our internal status format
        const statusNameToStatus: Record<string, 'Pending' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show' | 'Rescheduled'> = {
          'Pending': 'Pending',
          'Scheduled': 'Scheduled',
          'Confirmed': 'Confirmed',
          'Completed': 'Completed',
          'Cancelled': 'Cancelled',
          'No Show': 'No Show',
          'Rescheduled': 'Rescheduled',
        };

        // Convert database appointments to our format
        const mappedAppointments: Appointment[] = data.map((app: any) => {
          const statusName = statusMap.get(app.appointment_status_id) || 'Pending';
          const status = (statusNameToStatus[statusName as keyof typeof statusNameToStatus] || 'Pending') as 'Pending' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show' | 'Rescheduled';

          return {
            id: app.appointment_id,
            service: serviceMap.get(app.service_id) || 'Unknown Service',
            dentist: personnelMap.get(app.personnel_id) || 'Unassigned',
            date: app.appointment_date || '',
            time: app.appointment_time || '',
            fee: 0, // We'll need to load this from services
            patient: patientMap.get(app.patient_id) || `Patient #${app.patient_id}`,
            status: status,
            statusHistory: [
              { step: 1, label: 'Service & Schedule Selected (Patient)', timestamp: new Date(app.created_at || Date.now()), completed: true },
              ...(status !== 'Pending' ? [
                { step: 2, label: 'Dentist Availability Confirmed (System)', timestamp: new Date(app.created_at || Date.now()), completed: true },
                { step: 3, label: 'Appointment Scheduled', timestamp: new Date(app.created_at || Date.now()), completed: true },
              ] : []),
              ...(status === 'Confirmed' || status === 'Completed' ? [
                { step: 4, label: 'Appointment Accepted by Dentist', timestamp: new Date(app.created_at || Date.now()), completed: true },
                { step: 5, label: 'Appointment Confirmed', timestamp: new Date(app.created_at || Date.now()), completed: true },
              ] : []),
            ],
            appointment_status_id: app.appointment_status_id,
          };
        });

        dispatch({ type: 'SET_APPOINTMENTS', payload: mappedAppointments });
      } catch (err) {
        console.error('Error loading appointments:', err);
      }
    };

    if (appointmentStatuses.length > 0) {
      loadAppointments();
    }
  }, [appointmentStatuses]);

  const renderView = () => {
    switch (activeView) {
      case 'records':
        return <PatientRecordsView appointments={appointments} />;
      case 'patient':
      default:
        return <PatientDashboard appointments={appointments} dispatch={dispatch} appointmentStatuses={appointmentStatuses} />;
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


export default AppointmentWorkflow;