import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "@/utils/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function PaymentDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [billing, setBilling] = useState<any>(null)
    const [appointment, setAppointment] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null)
    const [serviceName, setServiceName] = useState("Unknown")
    const [selectedStatus, setSelectedStatus] = useState<string>("")
    const [cashPaid, setCashPaid] = useState<number>(0)
    const [changeAmount, setChangeAmount] = useState<number>(0)
    const [isPaid, setIsPaid] = useState<boolean>(false)
    const [billId, setBillId] = useState<number | null>(null)
    const SERVICE_FEE = 300

    useEffect(() => {
        fetchPaymentDetails()
    }, [appointment_id])

    useEffect(() => {
        if (cashPaid > 0 && billing?.payable_amount) {
            const totalAmount = billing.payable_amount
            const amountDue = totalAmount - SERVICE_FEE
            const change = cashPaid - amountDue
            setChangeAmount(change > 0 ? change : 0)
        } else {
            setChangeAmount(0)
        }
    }, [cashPaid, billing?.payable_amount])

    async function fetchPaymentDetails() {
        setLoading(true)
        try {
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

            let billingData = null
            let foundBillId = null
            try {
                const { data: viewData } = await supabase
                    .from("billing_view")
                    .select("*")
                    .eq("appointment_id", appointment_id)
                    .limit(1)
                
                if (viewData && viewData.length > 0) {
                    billingData = viewData[0]
                    foundBillId = viewData[0]?.bill_id
                    console.log("Found billing data via billing_view:", billingData)
                }
            } catch (viewErr) {
                console.log("billing_view error:", viewErr)
            }
            if (!billingData) {
                try {
                    const { data: tblData, error: tblError } = await supabase
                        .from("billing_tbl")
                        .select("*")
                        .eq("appointment_id", appointment_id)
                        .maybeSingle()
                    
                    if (!tblError && tblData) {
                        billingData = tblData
                        foundBillId = tblData.bill_id
                        console.log("Found billing data via billing_tbl:", billingData)
                    } else if (tblError) {
                        console.log("billing_tbl error (trying RPC):", tblError)
                        try {
                            const { data: rpcData } = await supabase.rpc('get_billing_by_appointment', {
                                p_appointment_id: appointment_id
                            })
                            
                            if (rpcData && rpcData.length > 0) {
                                billingData = rpcData[0]
                                foundBillId = rpcData[0]?.bill_id
                                console.log("Found billing data via RPC:", billingData)
                            }
                        } catch (rpcErr) {
                            console.log("RPC error:", rpcErr)
                        }
                    }
                } catch (tblErr) {
                    console.log("billing_tbl exception:", tblErr)
                }
            }
            if (!billingData) {
                console.log("No billing data found, creating default structure")
                billingData = {
                    patient_id: apptData.patient_id,
                    appointment_id: appointment_id,
                    payable_amount: SERVICE_FEE,
                    payment_option: "Cash",
                    payment_status_id: 1 // Pending
                }
            } else {
                if (billingData.payment_status_id === 2) {
                    setIsPaid(true)
                    setSelectedStatus("Paid")
                }
            }

            setBilling(billingData)
            setBillId(foundBillId)

        } catch (err) {
            console.error("Error loading payment details:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleProcessPayment() {
        if (!billing || !appointment) return
        
        const totalAmount = billing.payable_amount || SERVICE_FEE
        const amountDue = totalAmount - SERVICE_FEE
        
        if (!cashPaid) {
            alert("Please enter cash received amount.")
            return
        }
        
        if (cashPaid < amountDue) {
            alert(`Insufficient cash paid. Please enter at least ${formatCurrency(amountDue)}`)
            return
        }

        setProcessing(true)
        try {
            const billingData: any = {
                patient_id: billing.patient_id || appointment.patient_id,
                appointment_id: appointment_id,
                payable_amount: totalAmount,
                payment_option: "Cash",
                payment_status_id: 2, // Paid
                cash_paid: cashPaid,
                change_amount: changeAmount
            }

            console.log("Attempting to save billing data:", billingData)
            let success = false
            let error = null
            
            if (billId) {
                const { error: updateError } = await supabase
                    .from("billing_view")
                    .update(billingData)
                    .eq("appointment_id", appointment_id)
                
                error = updateError
                if (!updateError) {
                    success = true
                    console.log("Updated via billing_view")
                }
            } else {
                const { error: insertError } = await supabase
                    .from("billing_view")
                    .insert([billingData])
                
                error = insertError
                if (!insertError) {
                    success = true
                    console.log("Inserted via billing_view")
                }
            }
            if (!success) {
                console.log("billing_view failed, trying RPC:", error)
                
                try {
                    const { error: rpcError } = await supabase.rpc('process_payment', {
                        p_appointment_id: appointment_id,
                        p_patient_id: billing.patient_id || appointment.patient_id,
                        p_payable_amount: totalAmount,
                        p_payment_option: "Cash",
                        p_cash_paid: cashPaid,
                        p_change_amount: changeAmount
                    })
                    
                    if (!rpcError) {
                        success = true
                        console.log("Success via RPC")
                    } else {
                        console.log("RPC error:", rpcError)
                    }
                } catch (rpcErr) {
                    console.log("RPC exception:", rpcErr)
                }
            }
            if (!success) {
                console.log("All methods failed, showing alternative options")
                
                const confirmMsg = `Please manually record payment:\n\n` +
                      `Appointment ID: ${appointment_id}\n` +
                      `Patient: ${patient?.f_name} ${patient?.l_name}\n` +
                      `Amount Due: ${formatCurrency(amountDue)}\n` +
                      `Cash Paid: ${formatCurrency(cashPaid)}\n` +
                      `Change: ${formatCurrency(changeAmount)}\n\n` +
                      `Mark as Paid in billing_tbl`
                
                if (window.confirm(confirmMsg + "\n\nClick OK to mark as paid locally.")) {
                    success = true
                }
            }

            if (success) {
                setSelectedStatus("Paid")
                setIsPaid(true)
                
                alert("Payment processed successfully!")
                
                await fetchPaymentDetails()
            } else {
                throw new Error("All payment processing methods failed")
            }
            
        } catch (err: any) {
            console.error("Error processing payment:", err)
            alert("Failed to process payment. Please try alternative method or contact administrator.")
        } finally {
            setProcessing(false)
        }
    }
    async function testTableAccess() {
        console.log("=== Testing Table Access ===")
        
        const tables = [
            "billing_tbl",
            "billing_view",
            "frontdesk.billing_tbl",
            "public.billing_tbl"
        ]
        
        for (const table of tables) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select("count")
                    .limit(1)
                
                if (error) {
                    console.log(`Table ${table}: ERROR - ${error.code} - ${error.message}`)
                } else {
                    console.log(`Table ${table}: SUCCESS`)
                }
            } catch (err) {
                console.log(`Table ${table}: EXCEPTION - ${err}`)
            }
        }
    }
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    if (loading) return <p className="p-6">Loading payment details...</p>
    
    if (!appointment || !patient) {
        return (
            <div className="p-6">
                <p className="text-red-500">Error loading payment details.</p>
                <div className="flex gap-2 mt-4">
                    <Button 
                        onClick={() => navigate(-1)} 
                        variant="outline"
                    >
                        Go Back
                    </Button>
                    <Button 
                        onClick={testTableAccess} 
                        variant="outline"
                    >
                        Test Table Access
                    </Button>
                </div>
            </div>
        )
    }

    const totalAmount = billing?.payable_amount || SERVICE_FEE
    const amountDue = totalAmount - SERVICE_FEE
    const isInsufficientCash = cashPaid > 0 && cashPaid < amountDue
    const isSufficientCash = cashPaid >= amountDue

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                    {!isPaid && (
                        <Button 
                            onClick={handleProcessPayment}
                            disabled={processing || !isSufficientCash}
                        >
                            {processing ? "Processing..." : "Confirm Cash Payment"}
                        </Button>
                    )}
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
                            <Label>Bill ID</Label>
                            <Input value={billId ? `BIL-${billId}` : "New Bill"} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card>
                    <CardHeader><CardTitle>Payment Status</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* Service Fee */}
                        <div>
                            <Label>Service Fee</Label>
                            <div className="text-xl font-semibold text-muted-foreground">
                                {formatCurrency(SERVICE_FEE)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Fixed fee for consultation
                            </p>
                        </div>

                        {/* Total Amount */}
                        <div>
                            <Label>Total Amount</Label>
                            <div className="text-2xl font-semibold text-muted-foreground">
                                {formatCurrency(totalAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total: {formatCurrency(SERVICE_FEE)} (Service) + {formatCurrency(amountDue)} (Additional)
                            </p>
                        </div>

                        {/* Amount Due */}
                        <div>
                            <Label>Amount Due *</Label>
                            <div className="text-3xl font-bold text-primary">
                                {formatCurrency(amountDue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Amount to pay after service fee
                            </p>
                        </div>

                        <Separator />

                        {/* Payment Method - Always Cash Only */}
                        <div>
                            <Label>Payment Method</Label>
                            <Input 
                                value="Cash"
                                readOnly 
                                className="bg-muted font-bold"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Only cash payments are accepted
                            </p>
                        </div>

                        {/* Cash Input (only show if not paid) */}
                        {!isPaid && (
                            <>
                                <div>
                                    <Label>Cash Received *</Label>
                                    <Input 
                                        type="number"
                                        value={cashPaid || ""}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value)
                                            setCashPaid(isNaN(value) ? 0 : value)
                                        }}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className={isInsufficientCash ? "border-red-500" : ""}
                                    />
                                    {isInsufficientCash ? (
                                        <p className="text-xs text-red-500 mt-1">
                                            Insufficient cash. Please enter at least {formatCurrency(amountDue)}
                                        </p>
                                    ) : cashPaid > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                            ✓ Sufficient cash for amount due
                                        </p>
                                    )}
                                </div>

                                {/* Change Amount */}
                                <div>
                                    <Label>Change</Label>
                                    <Input 
                                        value={formatCurrency(changeAmount)}
                                        readOnly 
                                        className={`bg-muted font-bold ${changeAmount > 0 ? "text-green-600" : "text-muted-foreground"}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Change = {formatCurrency(cashPaid)} - {formatCurrency(amountDue)}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Display payment info if already paid */}
                        {isPaid && (
                            <>
                                <div>
                                    <Label>Payment Method</Label>
                                    <Input 
                                        value="Cash"
                                        readOnly 
                                        className="bg-muted font-bold"
                                    />
                                </div>
                                <div>
                                    <Label>Cash Received</Label>
                                    <Input 
                                        value={formatCurrency(cashPaid)}
                                        readOnly 
                                        className="bg-muted"
                                    />
                                </div>
                                <div>
                                    <Label>Change Given</Label>
                                    <Input 
                                        value={formatCurrency(changeAmount)}
                                        readOnly 
                                        className="bg-muted font-bold"
                                    />
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Status Display */}
                        <div>
                            <Label>Current Status</Label>
                            {isPaid ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={selectedStatus}
                                        readOnly 
                                        className="bg-green-100 text-green-800 font-bold border-green-300"
                                    />
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                </div>
                            ) : (
                                <Select 
                                    value={selectedStatus} 
                                    onValueChange={setSelectedStatus}
                                    disabled={true}
                                >
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
                            )}
                        </div>

                        {/* Action Button */}
                        {!isPaid && (
                            <Button 
                                className="w-full" 
                                size="lg"
                                onClick={handleProcessPayment}
                                disabled={processing || !isSufficientCash}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    `Verify & Process Cash Payment - ${formatCurrency(amountDue)}`
                                )}
                            </Button>
                        )}

                        {isPaid && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <p className="text-green-700 font-medium">
                                        Payment Completed
                                    </p>
                                </div>
                                <p className="text-sm text-green-600">
                                    This payment has been processed and cannot be modified.
                                </p>
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    <p>Payment Method: Cash</p>
                                    <p>Total Amount: {formatCurrency(totalAmount)}</p>
                                    <p>Service Fee: {formatCurrency(SERVICE_FEE)}</p>
                                    <p>Amount Due: {formatCurrency(amountDue)}</p>
                                    <p>Cash Paid: {formatCurrency(cashPaid)}</p>
                                    <p>Change Given: {formatCurrency(changeAmount)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}