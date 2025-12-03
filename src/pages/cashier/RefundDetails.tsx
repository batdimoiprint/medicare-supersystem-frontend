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
import { useNavigate } from "react-router-dom"

export default function RefundDetails() {
  const { appointment_id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [refund, setRefund] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [serviceName, setServiceName] = useState<string>("Unknown")
  const [refundStatus, setRefundStatus] = useState<string>("pending")
  const [isApproved, setIsApproved] = useState<boolean>(false)

  useEffect(() => {
    fetchRefundDetails()
  }, [appointment_id])

  useEffect(() => {
    setIsApproved(refundStatus === "Approved")
  }, [refundStatus])

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
      const status = refundData?.refund_status || "pending"
      setRefundStatus(status)
      setIsApproved(status === "Approved")

      const { data: apptData, error: apptError } = await supabase
        .from("appointment_tbl")
        .select("*, patient_id")
        .eq("appointment_id", appointment_id)
        .single()

      if (apptError) throw apptError
      setAppointment(apptData)

      let serviceName = "Unknown"
      if (apptData?.service_id) {
        const { data: serviceData } = await supabase
          .from("service_tbl")
          .select("service_name")
          .eq("service_id", apptData.service_id)
          .single()

        serviceName = serviceData?.service_name ?? "Unknown"
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

  async function handleApproveRefund() {
    setProcessing(true)
    try {
      console.log("Current refund data:", refund)
      
      const updateData: any = {
        refund_status: "Approved"
      }
      
      if (refund.updated_at !== undefined) {
        updateData.updated_at = new Date().toISOString()
      }
      if (refund.updated_by !== undefined) {
        updateData.updated_by = "Cashier"
      }
      
      if (refund.approved_at !== undefined) {
        updateData.approved_at = new Date().toISOString()
      }
      
      if (refund.approved_by !== undefined) {
        updateData.approved_by = "Cashier"
      }

      console.log("Updating with data:", updateData)
      const { error: updateError } = await supabase
        .from("refund_tbl")
        .update(updateData)
        .eq("appointment_id", appointment_id)

      if (updateError) {
        console.error("Update error details:", updateError)
        const { error: simpleError } = await supabase
          .from("refund_tbl")
          .update({ refund_status: "Approved" })
          .eq("appointment_id", appointment_id)
          
        if (simpleError) throw simpleError
      }
      setRefundStatus("Approved")
      setIsApproved(true)
      alert("Refund approved successfully!")
      await fetchRefundDetails()
      
    } catch (err: any) {
      console.error("Error approving refund:", err)
      if (err.code === 'PGRST204') {
        console.log("Column doesn't exist. Checking table structure...")
        try {
          const { error: statusError } = await supabase
            .from("refund_tbl")
            .update({ refund_status: "Approved" })
            .eq("appointment_id", appointment_id)
            
          if (statusError) throw statusError
          setRefundStatus("Approved")
          setIsApproved(true)
          alert("Refund approved successfully!")
          await fetchRefundDetails()
        } catch (innerErr) {
          alert("Failed to update refund status. Please check your table structure.")
        }
      } else {
        alert("Failed to approve refund. Please try again.")
      }
    } finally {
      setProcessing(false)
    }
  }
  const getLastUpdated = () => {
    if (refund.updated_at) return new Date(refund.updated_at).toLocaleString()
    if (refund.approved_at) return new Date(refund.approved_at).toLocaleString()
    if (refund.created_at) return new Date(refund.created_at).toLocaleString()
    return "N/A"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  if (loading) return <p className="p-6">Loading refund details...</p>
  if (!refund || !appointment || !patient) return <p>Error loading details.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Refund Request Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          {!isApproved && (
            <Button 
              variant="destructive" 
              onClick={handleApproveRefund}
              disabled={processing}
            >
              {processing ? "Approving..." : "Approve Refund"}
            </Button>
          )}
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
                <Label>Appointment Date</Label>
                <Input value={appointment.appointment_date || "N/A"} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Appointment Time</Label>
                <Input value={appointment.appointment_time || "N/A"} readOnly className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Original Amount</Label>
              <Input value={formatCurrency(appointment.amount_paid)} readOnly className="bg-muted" />
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
                {formatCurrency(refund.refund_amount)}
              </div>
              <p className="text-xs text-muted-foreground">Requested refund</p>
            </div>

            <Separator />

            <div>
              <Label>Refund Request Date</Label>
              <Input 
                value={refund.requested_at ? new Date(refund.requested_at).toLocaleDateString() : "N/A"} 
                readOnly 
                className="bg-muted" 
              />
            </div>

            <div>
              <Label>Reason for Refund</Label>
              <Textarea 
                value={refund.reason || "No reason provided"}
                readOnly
                className="bg-muted min-h-20"
              />
            </div>

            <div>
              <Label>Refund Status</Label>
              {isApproved ? (
                <div className="space-y-2">
                  <Input 
                    value={refundStatus}
                    readOnly 
                    className="bg-green-100 text-green-800 font-bold border-green-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Last updated: {getLastUpdated()}
                  </p>
                </div>
              ) : (
                <Select 
                  value={refundStatus} 
                  onValueChange={setRefundStatus}
                  disabled={isApproved}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Requested">Requested</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {isApproved ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-green-700 font-medium">
                    Refund Approved
                  </p>
                </div>
                <p className="text-sm text-green-600">
                  This refund has been approved and cannot be modified.
                </p>
              </div>
            ) : (
              <Button 
                variant="destructive" 
                className="w-full" 
                size="lg"
                onClick={handleApproveRefund}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Approving...
                  </span>
                ) : (
                  "Approve Refund"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}