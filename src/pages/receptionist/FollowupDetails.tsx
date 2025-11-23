import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function FollowupDetails() {
    const { appointment_id } = useParams()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Follow-up Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Back</Button>
                    <Button>Save Changes</Button>
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
                            <Input value="Maria Santos" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value="maria@example.com" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value="+63 917 123 4567" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input value="Female" readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Birthdate</Label>
                                <Input value="1995-05-20" readOnly className="bg-muted" />
                            </div>
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
                            <Input value="APT-1001" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service Performed</Label>
                            <Input value="Root Canal Treatment" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Dentist</Label>
                            <Input value="Dr. Mark Santos" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date Completed</Label>
                            <Input value="2024-01-15" readOnly className="bg-muted" />
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
                            <Input value={appointment_id || "FLP-56789"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input value="Post-treatment Checkup" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scheduled Date</Label>
                                <Input value="2024-02-20" readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value="2:00 PM" readOnly className="bg-muted" />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select defaultValue="PENDING_APPROVAL">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
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
