import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar"; 
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Calendar as CalendarIcon, User } from 'lucide-react';

interface Appointment {
    id: number;
    treatment: string;
    doctor: string;
    date: string; // Format: YYYY-MM-DD
    time: string;
    location: string;
    status: string;
    type: string;
}

interface AppointmentCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: Appointment[];
}

export default function AppointmentCalendarModal({ isOpen, onClose, appointments }: AppointmentCalendarModalProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Helper: Find appointments for the selected date
    const getAppointmentsForDate = (day: Date) => {
        const dateStr = day.toLocaleDateString('en-CA'); // en-CA outputs YYYY-MM-DD
        return appointments.filter(apt => apt.date === dateStr);
    };

    // Helper: Create an array of Dates that have appointments (for highlighting dots)
    const appointmentDays = appointments.map(apt => new Date(apt.date));

    const selectedDayAppointments = date ? getAppointmentsForDate(date) : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] w-full p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl">Appointment Calendar</DialogTitle>
                    <DialogDescription>
                        Select a highlighted date to view your schedule details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-8 h-full">
                    
                    {/* LEFT COLUMN: Calendar (Now Bigger) */}
                    <div className="flex justify-center items-start">
                        <div className="border rounded-xl p-6 shadow-sm bg-card">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="p-2" 
                                // 👇 THIS MAKES IT BIGGER
                                classNames={{
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center mb-4",
                                    caption_label: "text-xl font-bold", // Bigger Title
                                    head_cell: "text-muted-foreground rounded-md w-12 font-normal text-base", // Wider headers
                                    day: "h-12 w-12 p-0 font-normal text-lg aria-selected:opacity-100 hover:bg-accent rounded-md", // Bigger day cells (48px) & text
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground font-bold",
                                }}
                                modifiers={{
                                    booked: appointmentDays
                                }}
                                modifiersStyles={{
                                    booked: { 
                                        fontWeight: '900', 
                                        color: 'var(--primary)',
                                        border: '2px solid var(--primary)',
                                        borderRadius: '6px' 
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Details */}
                    <div className="flex flex-col h-full bg-muted/20 rounded-xl border p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">
                                    {date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : 'Details'}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                                </p>
                            </div>
                        </div>
                        
                        <ScrollArea className="flex-1 h-[320px] pr-4">
                            {selectedDayAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDayAppointments.map((apt) => (
                                        <div key={apt.id} className="bg-background p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow group animate-in slide-in-from-right-2 duration-300">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-base text-gray-800 line-clamp-1">{apt.treatment}</span>
                                                <Badge variant={apt.status === 'Confirmed' ? 'default' : 'secondary'}>
                                                    {apt.status}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-primary" /> 
                                                    <span className="font-medium text-gray-700">{apt.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" /> 
                                                    <span>{apt.doctor}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-primary" /> 
                                                    <span>{apt.location || 'Main Clinic'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-60">
                                    <CalendarIcon className="w-16 h-16 stroke-1" />
                                    <p className="text-lg">No appointments scheduled.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}