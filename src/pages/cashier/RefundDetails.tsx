import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function RefundDetails() {
    const { appointment_id } = useParams()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Refund Request Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Back</Button>
                    <Button variant="destructive">Process Refund</Button>
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
                            <Input value="Bob Johnson" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value="PT-2024-045" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value="bob.j@example.com" readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value="+63 918 222 3333" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Original Transaction Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Original Transaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Original Transaction ID</Label>
                            <Input value={appointment_id || "TRX-555123"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Input value="Tooth Extraction" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input value="2025-11-18" readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Method</Label>
                                <Input value="Credit Card" readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Original Amount Paid</Label>
                            <Input value="₱ 1,500.00" readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Refund Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Refund Processing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Refund Amount</Label>
                            <div className="text-3xl font-bold text-destructive">₱ 1,500.00</div>
                            <p className="text-xs text-muted-foreground">Full refund requested</p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Reason for Refund</Label>
                            <Textarea 
                                value="Service cancelled by patient due to emergency." 
                                readOnly 
                                className="bg-muted min-h-20" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Refund Status</Label>
                            <Select defaultValue="pending">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="processed">Processed / Refunded</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="pt-4">
                            <Button variant="destructive" className="w-full" size="lg">
                                Approve & Issue Refund
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
