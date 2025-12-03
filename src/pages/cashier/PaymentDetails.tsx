import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "@/utils/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function PaymentDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [billing, setBilling] = useState<any>(null)
    const [appointment, setAppointment] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null)
    const [serviceName, setServiceName] = useState("Unknown")
    const [selectedStatus, setSelectedStatus] = useState<string>("") 

    useEffect(() => {
        fetchPaymentDetails()
    }, [appointment_id])

    async function fetchPaymentDetails() {
        setLoading(true)
        try {
            const { data: billingData, error: billingError } = await supabase
                .from("billing_view")
                .select("*")
                .eq("appointment_id", appointment_id)
                .single()

            if (billingError) throw billingError
            setBilling(billingData)

            const { data: apptData, error: apptError } = await supabase
                .from("appointment_tbl")
                .select("*")
                .eq("appointment_id", appointment_id)
                .single()

            if (apptError) throw apptError
            setAppointment(apptData)

  
            const { data: patientData, error: patientError } = await supabase
                .from("patient_tbl")
                .select("*")
                .eq("patient_id", apptData.patient_id)
                .single()

            if (patientError) throw patientError
            setPatient(patientData)

            if (apptData?.service_id) {
                const { data: serviceData } = await supabase
                    .from("service_tbl")
                    .select("service_name")
                    .eq("service_id", apptData.service_id)
                    .single()

                setServiceName(serviceData?.service_name ?? "Unknown")
            }

            if (billingData?.payment_status_id) {
                const { data: statusData } = await supabase
                    .from("pm_status_view")
                    .select("appointment_status_id, appointment_status_name")
                    .eq("appointment_status_id", billingData.payment_status_id)
                    .single()
     
                setSelectedStatus(statusData?.appointment_status_name?.trim() || "Pending")

            }

        } catch (err) {
            console.error("Error loading payment details:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <p className="p-6">Loading payment details...</p>
    if (!billing || !appointment || !patient) return <p>Error loading details.</p>

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                    <Button>Confirm Payment</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Patient Info */}
                <Card>
                    <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input value={`${patient.f_name} ${patient.l_name}`} readOnly className="bg-muted" />
                        </div>
                        <div>
                            <Label>Patient ID</Label>
                            <Input value={patient.patient_id} readOnly className="bg-muted" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={patient.email || "N/A"} readOnly className="bg-muted" />
                        </div>
                        <div>
                            <Label>Contact Number</Label>
                            <Input value={patient.pri_contact_no || "N/A"} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction Info */}
                <Card>
                    <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Appointment ID</Label>
                            <Input value={appointment.appointment_id} readOnly className="bg-muted" />
                        </div>
                        <div>
                            <Label>Service</Label>
                            <Input value={serviceName} readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date</Label>
                                <Input value={appointment.appointment_date || "N/A"} readOnly className="bg-muted" />
                            </div>
                            <div>
                                <Label>Time</Label>
                                <Input value={appointment.appointment_time || "N/A"} readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div>
                            <Label>Payment Option</Label>
                            <Input value={billing.payment_option || "N/A"} readOnly className="bg-muted" />
                        </div>

                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card>
                    <CardHeader><CardTitle>Payment Status</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Total Amount</Label>
                            <div className="text-3xl font-bold text-primary">
                                ₱ {billing.payable_amount?.toLocaleString()}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <Label>Current Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                    <SelectItem value="Refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Notes</Label>
                            <Textarea placeholder="Add notes..."></Textarea>
                        </div>

                        <Button className="w-full" size="lg">
                            Verify & Process Payment
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
