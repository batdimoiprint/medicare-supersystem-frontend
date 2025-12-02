import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppointment, useAppointmentStatuses, useUpdateAppointmentStatus } from '@/hooks/use-appointments'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function AppointmentDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()
    const appointmentId = appointment_id ? parseInt(appointment_id, 10) : undefined
    
    const { data: appointment, isLoading, isError } = useAppointment(appointmentId)
    const { data: statuses } = useAppointmentStatuses()
    const updateStatusMutation = useUpdateAppointmentStatus()
    
    const [selectedStatus, setSelectedStatus] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)
    
    // Set initial status when appointment loads
    useEffect(() => {
        if (appointment?.appointment_status_id) {
            setSelectedStatus(appointment.appointment_status_id.toString())
        }
    }, [appointment?.appointment_status_id])
    
    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        setHasChanges(value !== appointment?.appointment_status_id?.toString())
    }
    
    const handleSave = async () => {
        if (!appointmentId || !selectedStatus) return
        
        await updateStatusMutation.mutateAsync({
            appointmentId,
            statusId: parseInt(selectedStatus, 10)
        })
        setHasChanges(false)
        // Navigate back to appointments list after successful update
        navigate('/receptionist/appointments')
    }
    
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
                    <Button 
                        onClick={handleSave} 
                        disabled={!hasChanges || updateStatusMutation.isPending}
                    >
                        {updateStatusMutation.isPending && (
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
                            <Label>Dentist</Label>
                            <Input value={appointment.personnel_first_name && appointment.personnel_last_name
                                ? `Dr. ${appointment.personnel_first_name} ${appointment.personnel_last_name}`
                                : 'Not Assigned'} readOnly className="bg-muted" />
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
                        <CardTitle>Follow-up Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Follow-up Required?</Label>
                            <Select defaultValue="yes">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Follow-up</Label>
                            <Input value="Routine Checkup" placeholder="Enter reason" />
                        </div>
                        <div className="space-y-2">
                            <Label>Preferred Date</Label>
                            <Input type="date" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Follow-up Status</Label>
                            <Select defaultValue="PENDING">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending Scheduling</SelectItem>
                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
