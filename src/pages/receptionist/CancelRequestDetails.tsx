import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function CancelRequestDetails() {
    const { appointment_id } = useParams()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Cancel Request Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Back</Button>
                    <Button variant="destructive">Approve Cancellation</Button>
                    <Button>Reject Request</Button>
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
                            <Input value="Pedro Penduko" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value="pedro@example.com" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value="+63 999 888 7777" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Appointment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appointment to Cancel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Appointment ID</Label>
                            <Input value={appointment_id || "APT-99999"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Input value="Tooth Extraction" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Dentist</Label>
                            <Input value="Dr. Evelyn Reyes" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scheduled Date</Label>
                                <Input value="2024-03-01" readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value="3:00 PM" readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fee Paid</Label>
                            <Input value="₱ 1,500.00" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Cancellation Info (Follow-up) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cancellation Request</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Request Date</Label>
                            <Input value="2024-02-28" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Cancellation</Label>
                            <Textarea 
                                value="Emergency family matter, need to reschedule." 
                                readOnly 
                                className="bg-muted min-h-[100px]" 
                            />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Request Status</Label>
                            <Select defaultValue="PENDING">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending Review</SelectItem>
                                    <SelectItem value="APPROVED">Approved (Cancelled)</SelectItem>
                                    <SelectItem value="REJECTED">Rejected (Kept)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Refund Status</Label>
                            <Select defaultValue="PENDING">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                                    <SelectItem value="PENDING">Pending Refund</SelectItem>
                                    <SelectItem value="PROCESSED">Refund Processed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
