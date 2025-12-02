import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "@/utils/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function RefundDetails() {
  const { appointment_id } = useParams()

  const [loading, setLoading] = useState(true)
  const [refund, setRefund] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [serviceName, setServiceName] = useState<string>("Unknown")

  // Controlled refund status state
  const [refundStatus, setRefundStatus] = useState<string>("pending")

  useEffect(() => {
    fetchRefundDetails()
  }, [appointment_id])

  async function fetchRefundDetails() {
    setLoading(true)
    try {
      const { data: refundData, error: refundError } = await supabase
        .from("refund_tbl")
        .select("*")
        .eq("appointment_id", appointment_id)
        .single()

      if (refundError) throw refundError
      setRefund(refundData)

      // Set refund status from fetched refund data
      setRefundStatus(refundData?.refund_status ?? "pending")

      const { data: apptData, error: apptError } = await supabase
        .from("appointment_tbl")
        .select("*, patient_id")
        .eq("appointment_id", appointment_id)
        .single()

      if (apptError) throw apptError
      setAppointment(apptData)

      let serviceName = "Unknown"
      if (apptData?.service_id) {
        const { data: serviceData, error: serviceError } = await supabase
          .from("service_tbl")
          .select("service_name")
          .eq("service_id", apptData.service_id)
          .single()

        if (serviceError) console.warn("Could not fetch service:", serviceError)
        else serviceName = serviceData?.service_name ?? "Unknown"
      }
      setServiceName(serviceName)

      const { data: patientData, error: patientError } = await supabase
        .from("patient_tbl")
        .select("*")
        .eq("patient_id", apptData.patient_id)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

    } catch (err) {
      console.error("Error loading refund details:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="p-6">Loading refund details...</p>
  if (!refund || !appointment || !patient) return <p>Error loading details.</p>

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

        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
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

        {/* Original Transaction */}
        <Card>
          <CardHeader>
            <CardTitle>Original Transaction</CardTitle>
          </CardHeader>
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
                <Label>Payment Date</Label>
                <Input value={appointment.payment_date || "N/A"} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Input value={appointment.payment_method || "N/A"} readOnly className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Original Amount</Label>
              <Input value={`₱ ${appointment.amount_paid?.toLocaleString()}`} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Refund Info */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Processing</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label>Refund Amount</Label>
              <div className="text-3xl font-bold text-destructive">
                ₱ {refund.refund_amount?.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Requested refund</p>
            </div>

            <Separator />

            <div>
              <Label>Reason</Label>
              <Textarea 
                value={refund.reason || "No reason provided"}
                readOnly
                className="bg-muted min-h-20"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={refundStatus} onValueChange={setRefundStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="destructive" className="w-full" size="lg">
              Approve & Issue Refund
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
