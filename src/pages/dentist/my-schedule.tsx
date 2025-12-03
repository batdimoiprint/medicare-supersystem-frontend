import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Save,
  X,
  CheckCircle,
  XCircle,
  Printer,
  TrendingUp,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dentistClient } from '@/utils/supabase';

// --- Type Definitions ---
interface TimeSlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ScheduleDay {
  day: string;
  isWorking: boolean;
  slots: TimeSlot[];
}

interface DentistSchedule {
  schedule_id?: number;
  personnel_id: string;
  day_of_week: string;
  date: string;
  time_in: string;
  time_out: string;
}

// --- Constants ---
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

// --- Main Component ---
const MySchedule = () => {
  // Get personnel_id from sessionStorage (adjust based on your auth implementation)
  const getPersonnelId = (): string | null => {
    // Check sessionStorage for user_id (as stored in LoginPage.tsx)
    const userId = sessionStorage.getItem('user_id');
    if (userId) {
      return userId;
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

  const [personnelId, setPersonnelId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    return DAYS_OF_WEEK.map((day) => ({
      day,
      isWorking: false,
      slots: TIME_SLOTS.map((time, index) => ({
        id: index,
        day,
        startTime: time,
        endTime: TIME_SLOTS[index + 1] || '6:00 PM',
        isAvailable: false,
      })),
    }));
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ startTime: string; endTime: string }>({
    startTime: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Convert time from "9:00 AM" to "HH:MM:SS" format
  const convertTimeTo24Hour = (time12: string): string => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  };

  // Convert time from "HH:MM:SS" to "9:00 AM" format
  const convertTimeTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes} ${period}`;
  };

  // Load schedules from database
  useEffect(() => {
    const loadSchedules = async () => {
      const pid = getPersonnelId();
      if (!pid) {
        console.warn('No personnel_id found. Please ensure you are logged in.');
        console.warn('sessionStorage user_id:', sessionStorage.getItem('user_id'));
        setLoading(false);
        return;
      }

      console.log('Loaded personnel_id:', pid);
      setPersonnelId(pid);
      setLoading(true);

      try {
        // Get today's date to find schedules for the current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

        const { data, error } = await dentistClient
          .from('dentist_schedule_tbl')
          .select('*')
          .eq('personnel_id', String(pid))
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .lte('date', endOfWeek.toISOString().split('T')[0])
          .order('day_of_week', { ascending: true })
          .order('time_in', { ascending: true });

        if (error) throw error;

        // Initialize schedule with default values
        const newSchedule = DAYS_OF_WEEK.map((day) => ({
          day,
          isWorking: false,
          slots: TIME_SLOTS.map((time, index) => ({
            id: index,
            day,
            startTime: time,
            endTime: TIME_SLOTS[index + 1] || '6:00 PM',
            isAvailable: false,
          })),
        }));

        // Process database schedules
        if (data && data.length > 0) {
          data.forEach((dbSchedule: DentistSchedule) => {
            const dayIndex = DAYS_OF_WEEK.indexOf(dbSchedule.day_of_week);
            if (dayIndex !== -1) {
              const daySchedule = newSchedule[dayIndex];
              daySchedule.isWorking = true;

              const timeIn12 = convertTimeTo12Hour(dbSchedule.time_in);
              const timeOut12 = convertTimeTo12Hour(dbSchedule.time_out);

              const startIndex = TIME_SLOTS.indexOf(timeIn12);
              const endIndex = TIME_SLOTS.indexOf(timeOut12);

              if (startIndex !== -1 && endIndex !== -1) {
                daySchedule.slots.forEach((slot, index) => {
                  slot.isAvailable = index >= startIndex && index <= endIndex;
                });
              }
            }
          });
        }

        setSchedule(newSchedule);
      } catch (err) {
        console.error('Failed to load schedules:', err);
        alert('Failed to load schedule. Using default schedule.');
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [personnelId]);

  const toggleDayWorking = (day: string) => {
    setSchedule(schedule.map(d =>
      d.day === day
        ? { ...d, isWorking: !d.isWorking, slots: d.slots.map(s => ({ ...s, isAvailable: !d.isWorking })) }
        : d
    ));
  };

  const toggleSlotAvailability = (day: string, slotId: number) => {
    setSchedule(schedule.map(d =>
      d.day === day
        ? {
          ...d,
          slots: d.slots.map(s => s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s),
        }
        : d
    ));
  };

  const handleBulkEdit = (day: string) => {
    setSelectedDay(day);
    setIsEditing(true);
    const daySchedule = schedule.find(d => d.day === day);
    if (daySchedule) {
      const availableSlots = daySchedule.slots.filter(s => s.isAvailable);
      setEditForm({
        startTime: availableSlots[0]?.startTime || '9:00 AM',
        endTime: availableSlots[availableSlots.length - 1]?.endTime || '5:00 PM',
      });
    }
  };

  const handleSaveBulkEdit = () => {
    if (!selectedDay) return;

    const startIndex = TIME_SLOTS.indexOf(editForm.startTime);
    const endIndex = TIME_SLOTS.indexOf(editForm.endTime);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      alert('Please select valid start and end times');
      return;
    }

    setSchedule(schedule.map(d =>
      d.day === selectedDay
        ? {
          ...d,
          slots: d.slots.map((s, index) => ({
            ...s,
            isAvailable: index >= startIndex && index <= endIndex,
          })),
        }
        : d
    ));

    setIsEditing(false);
    setSelectedDay(null);
  };

  const getAvailableCount = (day: string) => {
    const daySchedule = schedule.find(d => d.day === day);
    return daySchedule?.slots.filter(s => s.isAvailable).length || 0;
  };

  const handleSaveSchedule = async () => {
    // Try to get personnelId if not set
    let pid = personnelId;
    if (!pid) {
      pid = getPersonnelId();
      if (!pid) {
        alert('No personnel ID found. Please ensure you are logged in and refresh the page.');
        console.error('personnelId is null. sessionStorage user_id:', sessionStorage.getItem('user_id'));
        return;
      }
      setPersonnelId(pid);
    }

    setSaving(true);
    try {
      // Get today's date to determine the week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

      // Prepare schedules to save
      const schedulesToSave: Omit<DentistSchedule, 'schedule_id'>[] = [];

      schedule.forEach((daySchedule) => {
        if (daySchedule.isWorking) {
          const availableSlots = daySchedule.slots.filter(s => s.isAvailable);
          if (availableSlots.length > 0) {
            const firstSlot = availableSlots[0];
            const lastSlot = availableSlots[availableSlots.length - 1];

            const dayIndex = DAYS_OF_WEEK.indexOf(daySchedule.day);
            const scheduleDate = new Date(startOfWeek);
            scheduleDate.setDate(startOfWeek.getDate() + dayIndex);

            schedulesToSave.push({
              personnel_id: pid,
              day_of_week: daySchedule.day,
              date: scheduleDate.toISOString().split('T')[0],
              time_in: convertTimeTo24Hour(firstSlot.startTime),
              time_out: convertTimeTo24Hour(lastSlot.endTime),
            });
          }
        }
      });

      // Delete existing schedules for this week and personnel
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      await dentistClient
        .from('dentist_schedule_tbl')
        .delete()
        .eq('personnel_id', String(pid))
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      // Insert new schedules
      if (schedulesToSave.length > 0) {
        const { error } = await dentistClient
          .from('dentist_schedule_tbl')
          .insert(schedulesToSave);

        if (error) throw error;
      }

      alert('Schedule saved successfully!');
    } catch (err) {
      console.error('Failed to save schedule:', err);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalAvailableSlots = schedule.reduce((sum, d) => sum + getAvailableCount(d.day), 0);
  const workingDays = schedule.filter(d => d.isWorking).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Loading schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                My Availability Schedule
              </CardTitle>
              <p className="text-muted-foreground">
                Set your working hours and availability for appointments
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={handleSaveSchedule} 
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Working Days</p>
                <p className="text-2xl font-bold">{workingDays} / {DAYS_OF_WEEK.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Slots</p>
                <p className="text-2xl font-bold">{totalAvailableSlots}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Slots/Day</p>
                <p className="text-2xl font-bold">
                  {workingDays > 0 ? Math.round(totalAvailableSlots / workingDays) : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Edit Modal */}
      {isEditing && selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Availability - {selectedDay}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field orientation="vertical">
                <FieldLabel>Start Time</FieldLabel>
                <FieldContent>
                  <Select
                    value={editForm.startTime}
                    onValueChange={(value) => setEditForm({ ...editForm, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>End Time</FieldLabel>
                <FieldContent>
                  <Select
                    value={editForm.endTime}
                    onValueChange={(value) => setEditForm({ ...editForm, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); setSelectedDay(null); }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveBulkEdit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Days */}
      <div className="space-y-4">
        {schedule.map((daySchedule) => (
          <Card key={daySchedule.day}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{daySchedule.day}</h3>
                    <button
                      onClick={() => toggleDayWorking(daySchedule.day)}
                      className={`p-1 rounded ${daySchedule.isWorking
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                    >
                      {daySchedule.isWorking ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {daySchedule.isWorking ? 'Working' : 'Not Working'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getAvailableCount(daySchedule.day)} slots available
                  </span>
                </div>
                {daySchedule.isWorking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkEdit(daySchedule.day)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {daySchedule.isWorking ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {daySchedule.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => toggleSlotAvailability(daySchedule.day, slot.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${slot.isAvailable
                          ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                          : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-600 dark:border-gray-700'
                        }`}
                    >
                      <div className="text-xs font-medium">{slot.startTime}</div>
                      {slot.isAvailable ? (
                        <CheckCircle className="w-4 h-4 mx-auto mt-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Not working on this day</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Link to Appointments */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">View Appointments</p>
              <p className="text-sm text-muted-foreground">
                See how your schedule affects appointment availability
              </p>
            </div>
            <Button asChild>
              <Link to="/dentist/appointments">
                View Appointments
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default MySchedule;

