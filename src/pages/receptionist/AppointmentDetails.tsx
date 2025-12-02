import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    useAppointment, 
    useAppointmentStatuses, 
    useUpdateAppointmentStatus,
    useAssignDoctor,
    useRescheduleAppointment,
    usePersonnel,
} from '@/hooks/use-appointments'
import { useCreateFollowup } from '@/hooks/use-followups'
import { useState, useEffect } from 'react'
import { Loader2, CalendarIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"

export default function AppointmentDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()
    const appointmentId = appointment_id ? parseInt(appointment_id, 10) : undefined
    
    const { data: appointment, isLoading, isError } = useAppointment(appointmentId)
    const { data: statuses } = useAppointmentStatuses()
    const { data: personnel } = usePersonnel()
    const updateStatusMutation = useUpdateAppointmentStatus()
    const assignDoctorMutation = useAssignDoctor()
    const rescheduleMutation = useRescheduleAppointment()
    const createFollowupMutation = useCreateFollowup()
    
    const [selectedStatus, setSelectedStatus] = useState<string>('')
    const [selectedDoctor, setSelectedDoctor] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)
    
    // Reschedule modal state
    const [rescheduleOpen, setRescheduleOpen] = useState(false)
    const [newDate, setNewDate] = useState('')
    const [newTime, setNewTime] = useState('')
    
    // Followup form state
    const [followupRequired, setFollowupRequired] = useState('no')
    const [followupReason, setFollowupReason] = useState('')
    const [followupDate, setFollowupDate] = useState('')
    
    // Set initial values when appointment loads
    useEffect(() => {
        if (appointment?.appointment_status_id) {
            setSelectedStatus(appointment.appointment_status_id.toString())
        }
        if (appointment?.personnel_id) {
            setSelectedDoctor(appointment.personnel_id.toString())
        }
    }, [appointment?.appointment_status_id, appointment?.personnel_id])
    
    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        setHasChanges(value !== appointment?.appointment_status_id?.toString() || 
                      selectedDoctor !== appointment?.personnel_id?.toString())
    }
    
    const handleDoctorChange = (value: string) => {
        setSelectedDoctor(value)
        setHasChanges(selectedStatus !== appointment?.appointment_status_id?.toString() ||
                      value !== appointment?.personnel_id?.toString())
    }
    
    const handleSave = async () => {
        if (!appointmentId) return
        
        const promises: Promise<void>[] = []
        
        // Update status if changed
        if (selectedStatus && selectedStatus !== appointment?.appointment_status_id?.toString()) {
            promises.push(updateStatusMutation.mutateAsync({
                appointmentId,
                statusId: parseInt(selectedStatus, 10)
            }))
        }
        
        // Assign doctor if changed
        if (selectedDoctor && selectedDoctor !== appointment?.personnel_id?.toString()) {
            promises.push(assignDoctorMutation.mutateAsync({
                appointmentId,
                personnelId: parseInt(selectedDoctor, 10)
            }))
        }
        
        await Promise.all(promises)
        setHasChanges(false)
        navigate('/receptionist/appointments')
    }
    
    const handleReschedule = async () => {
        if (!appointmentId || !newDate) return
        
        await rescheduleMutation.mutateAsync({
            appointmentId,
            newDate,
            newTime: newTime || undefined
        })
        
        setRescheduleOpen(false)
        setNewDate('')
        setNewTime('')
    }
    
    const handleCreateFollowup = async () => {
        if (!appointment?.patient_id || !followupDate) return
        
        await createFollowupMutation.mutateAsync({
            patient_id: appointment.patient_id,
            appointment_id: appointmentId,
            followup_date: followupDate,
            service_id: appointment.service_id ?? undefined,
            personnel_id: appointment.personnel_id ?? undefined,
            notes: followupReason || undefined,
        })
        
        // Reset form
        setFollowupRequired('no')
        setFollowupReason('')
        setFollowupDate('')
    }
    
    const isSaving = updateStatusMutation.isPending || assignDoctorMutation.isPending
    
    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }
    
    if (isError || !appointment) {
        return (
            <div className="p-6">
                <p className="text-destructive">Error loading appointment details.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Appointment Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                    
                    {/* Reschedule Dialog */}
                    <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Reschedule
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reschedule Appointment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>New Date</Label>
                                    <Input 
                                        type="date" 
                                        value={newDate} 
                                        onChange={(e) => setNewDate(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Time (optional)</Label>
                                    <Input 
                                        type="time" 
                                        value={newTime} 
                                        onChange={(e) => setNewTime(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleReschedule} 
                                    disabled={!newDate || rescheduleMutation.isPending}
                                >
                                    {rescheduleMutation.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Confirm Reschedule
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    <Button 
                        onClick={handleSave} 
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Patient Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={appointment.patient_first_name && appointment.patient_last_name 
                                ? `${appointment.patient_first_name} ${appointment.patient_last_name}` 
                                : 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value={appointment.patient_id?.toString() || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value={appointment.patient_contact || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value="See patient record for more details" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Appointment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appointment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Appointment ID</Label>
                            <Input value={appointment.appointment_id?.toString() || appointment_id || "N/A"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Input value={appointment.service_name || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Assigned Dentist</Label>
                            <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a dentist" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {personnel?.map(doc => (
                                        <SelectItem 
                                            key={doc.personnel_id} 
                                            value={doc.personnel_id.toString()}
                                        >
                                            Dr. {doc.f_name} {doc.l_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input value={appointment.appointment_date || 'N/A'} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value={appointment.appointment_time || 'N/A'} readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fee</Label>
                            <Input value={appointment.service_fee ? `₱ ${appointment.service_fee.toFixed(2)}` : 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses?.map(status => (
                                        <SelectItem 
                                            key={status.appointment_status_id} 
                                            value={status.appointment_status_id.toString()}
                                        >
                                            {status.appointment_status_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Follow-up Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule Follow-up</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Schedule Follow-up?</Label>
                            <Select value={followupRequired} onValueChange={setFollowupRequired}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {followupRequired === 'yes' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Reason for Follow-up</Label>
                                    <Input 
                                        value={followupReason} 
                                        onChange={(e) => setFollowupReason(e.target.value)}
                                        placeholder="Enter reason (optional)" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Follow-up Date</Label>
                                    <Input 
                                        type="date" 
                                        value={followupDate}
                                        onChange={(e) => setFollowupDate(e.target.value)}
                                    />
                                </div>
                                <Separator />
                                <Button 
                                    className="w-full"
                                    onClick={handleCreateFollowup}
                                    disabled={!followupDate || createFollowupMutation.isPending}
                                >
                                    {createFollowupMutation.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Create Follow-up Appointment
                                </Button>
                                {createFollowupMutation.isSuccess && (
                                    <p className="text-sm text-green-600">Follow-up created successfully!</p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
