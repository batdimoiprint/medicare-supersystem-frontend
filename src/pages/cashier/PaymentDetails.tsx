import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function PaymentDetails() {
    const { appointment_id } = useParams()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Back</Button>
                    <Button>Confirm Payment</Button>
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
                            <Input value="Alice Cooper" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value="PT-2024-001" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value="alice@example.com" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value="+63 917 555 1234" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Transaction Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Transaction ID</Label>
                            <Input value={appointment_id || "TRX-789012"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service Rendered</Label>
                            <Input value="Dental Cleaning" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input value="2025-11-20" readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value="11:00 AM" readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Input value="Credit Card" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Reference Number</Label>
                            <Input value="REF-123456789" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Payment Status & Action */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Total Amount Due</Label>
                            <div className="text-3xl font-bold text-primary">₱ 1,500.00</div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Current Status</Label>
                            <Select defaultValue="pending">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending Verification</SelectItem>
                                    <SelectItem value="processed">Processed / Paid</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cashier Notes</Label>
                            <Input placeholder="Add notes here..." />
                        </div>
                        <div className="pt-4">
                            <Button className="w-full" size="lg">
                                Verify & Process Payment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
