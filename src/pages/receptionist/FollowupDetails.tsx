import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useFollowup, useFollowupStatuses, useUpdateFollowupStatus } from '@/hooks/use-followups'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function FollowupDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()
    const followupId = appointment_id ? parseInt(appointment_id, 10) : undefined
    
    const { data: followup, isLoading, isError } = useFollowup(followupId)
    const { data: statuses } = useFollowupStatuses()
    const updateStatusMutation = useUpdateFollowupStatus()
    
    const [selectedStatus, setSelectedStatus] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)
    
    // Set initial status when followup loads
    useEffect(() => {
        if (followup?.appointment_status_id) {
            setSelectedStatus(followup.appointment_status_id.toString())
        }
    }, [followup?.appointment_status_id])
    
    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        setHasChanges(value !== followup?.appointment_status_id?.toString())
    }
    
    const handleSave = async () => {
        if (!followupId || !selectedStatus) return
        
        await updateStatusMutation.mutateAsync({
            followupId,
            statusId: parseInt(selectedStatus, 10)
        })
        setHasChanges(false)
        // Navigate back to followups list after successful update
        navigate('/receptionist/followup')
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
    
    if (isError || !followup) {
        return (
            <div className="p-6">
                <p className="text-destructive">Error loading follow-up details.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Follow-up Details</h1>
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
                            <Input value={followup.patient_first_name && followup.patient_last_name 
                                ? `${followup.patient_first_name} ${followup.patient_last_name}` 
                                : 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value={followup.patient_id?.toString() || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value={followup.patient_contact || 'N/A'} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Original Appointment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Original Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Original Appointment ID</Label>
                            <Input value={followup.appointment_id?.toString() || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service Performed</Label>
                            <Input value={followup.original_appointment_service || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date Completed</Label>
                            <Input value={followup.original_appointment_date || 'N/A'} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Follow-up Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Follow-up Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Follow-up ID</Label>
                            <Input value={followup.followup_id?.toString() || appointment_id || "N/A"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Input value={followup.service_name || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Assigned Dentist</Label>
                            <Input value={followup.personnel_first_name && followup.personnel_last_name
                                ? `Dr. ${followup.personnel_first_name} ${followup.personnel_last_name}`
                                : 'Not Assigned'} readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scheduled Date</Label>
                                <Input value={followup.followup_date || 'N/A'} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value={followup.followup_time || 'N/A'} readOnly className="bg-muted" />
                            </div>
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
            </div>
        </div>
    )
}
