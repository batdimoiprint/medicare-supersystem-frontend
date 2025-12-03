import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, X, AlertCircle, Loader2, CreditCard, CheckCircle } from 'lucide-react'; 

// FIX: Changed aliased imports (@/) to relative paths (../../) to resolve compilation error
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Field, FieldContent, FieldLabel, FieldGroup, FieldError } from '../../components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea'; // Import Textarea
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { formatCurrency } from '../../lib/utils'; 

// --- MOCK DATA ---
interface EligibleAppointment {
    id: string;
    date: string;
    service: string;
    amountPaid: number;
    patientName: string;
    status: 'paid' | 'processed';
}

interface RefundRequestForm {
    appointmentId: string;
    reason: string;
    contactNumber: string;
}

const MOCK_ELIGIBLE_APPOINTMENTS: EligibleAppointment[] = [
    { id: 'APT-1001', date: '2025-11-20', service: 'Dental Cleaning', amountPaid: 500, patientName: 'John Doe', status: 'paid' },
    { id: 'APT-1002', date: '2025-11-21', service: 'Root Canal Treatment', amountPaid: 5500, patientName: 'John Doe', status: 'paid' },
    { id: 'APT-1003', date: '2025-11-22', service: 'Orthodontic Adjustment', amountPaid: 2000, patientName: 'John Doe', status: 'paid' },
];

// --- Main Component ---

export default function RequestRefund() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // FIX: submitStatus is now used to handle error/success messages
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<'form' | 'success'>('form');

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RefundRequestForm>({
        mode: 'onBlur',
        defaultValues: {
            appointmentId: '',
            reason: '',
            contactNumber: '09171234567'
        }
    });

    const watchedAppointmentId = watch('appointmentId');
    const selectedAppointment = useMemo(() => 
        MOCK_ELIGIBLE_APPOINTMENTS.find(a => a.id === watchedAppointmentId), 
        [watchedAppointmentId]
    );

    async function onSubmit(data: RefundRequestForm) {
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setSubmitMessage('');

        const payload = {
            ...data,
            refundAmount: selectedAppointment?.amountPaid || 0,
            patientId: 101, 
            timestamp: new Date().toISOString()
        };

        console.log("Submitting Refund Request Payload:", payload);

        try {
            // --- Simulated API Call ---
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Mock error condition for testing
                    if (data.appointmentId === 'APT-1003') {
                        reject(new Error("Appointment APT-1003 is under review and cannot be refunded yet."));
                    } else {
                        resolve(null);
                    }
                }, 2000);
            });
            // --------------------------

            setSubmitStatus('success');
            setSubmitMessage("Your request has been successfully submitted.");
            setCurrentStep('success');
        } catch (error) {
            // FIX: Error status is set here
            setSubmitStatus('error');
            setSubmitMessage((error as Error).message || "An unexpected error occurred while submitting the request.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <CreditCard className="w-7 h-7 text-primary" />
                    Request Appointment Refund
                </h1>
                <Button variant="outline" onClick={() => navigate('/patient/transactions')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
                </Button>
            </div>
            
            {/* FIX: Use submitStatus to display global error/success messages */}
            {submitStatus === 'error' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Submission Failed</AlertTitle>
                    <AlertDescription>{submitMessage}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Refund Details</CardTitle>
                    <CardDescription>
                        Select the paid appointment you wish to request a refund for. 
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {currentStep === 'form' ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            
                            {MOCK_ELIGIBLE_APPOINTMENTS.length > 0 && (
                                <FieldGroup>
                                    <Field orientation="vertical">
                                        <FieldLabel>Appointment to Refund <span className="text-red-500">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={control}
                                                name="appointmentId"
                                                rules={{ required: 'Please select an appointment.' }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value} name={field.name}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Appointment ID" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MOCK_ELIGIBLE_APPOINTMENTS.map(apt => (
                                                                <SelectItem key={apt.id} value={apt.id}>
                                                                    {apt.id} - {apt.service} ({formatCurrency(apt.amountPaid)})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <FieldError errors={errors.appointmentId ? [{ message: errors.appointmentId.message }] : []} />
                                        </FieldContent>
                                    </Field>

                                    {selectedAppointment && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field orientation="vertical">
                                                    <FieldLabel>Amount to Refund</FieldLabel>
                                                    <FieldContent>
                                                        <Input 
                                                            value={formatCurrency(selectedAppointment.amountPaid)} 
                                                            readOnly 
                                                            className="bg-muted font-bold text-lg text-primary" 
                                                        />
                                                    </FieldContent>
                                                </Field>
                                                <Field orientation="vertical">
                                                    <FieldLabel>Appointment Date</FieldLabel>
                                                    <FieldContent>
                                                        <Input value={selectedAppointment.date} readOnly className="bg-muted" />
                                                    </FieldContent>
                                                </Field>
                                            </div>

                                            <Field orientation="vertical">
                                                <FieldLabel>Reason for Refund <span className="text-red-500">*</span></FieldLabel>
                                                <FieldContent>
                                                    <Textarea 
                                                        {...register('reason', { required: 'Reason is required for processing.' })} 
                                                        placeholder="Please state the detailed reason for the refund request..."
                                                        className="min-h-[120px]"
                                                    />
                                                    <FieldError errors={errors.reason ? [{ message: errors.reason.message }] : []} />
                                                </FieldContent>
                                            </Field>
                                            
                                            <Field orientation="vertical">
                                                <FieldLabel>Primary Contact No. <span className="text-red-500">*</span></FieldLabel>
                                                <FieldContent>
                                                    <Input 
                                                        {...register('contactNumber', { required: 'Contact is required for follow-up.' })} 
                                                        placeholder="e.g. 09171234567"
                                                    />
                                                    <FieldError errors={errors.contactNumber ? [{ message: errors.contactNumber.message }] : []} />
                                                </FieldContent>
                                            </Field>
                                        </div>
                                    )}
                                </FieldGroup>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate('/patient/transactions')}>
                                    <X className="w-4 h-4 mr-2" /> View Transactions
                                </Button>
                                <Button type="submit" disabled={isSubmitting || !selectedAppointment}>
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Submit Refund Request
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-6 py-12">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                            <h3 className="text-2xl font-bold">Request Submitted!</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                Your refund request for **{selectedAppointment?.service}** has been recorded and sent to our billing team for verification.
                            </p>
                            <Button onClick={() => navigate('/patient/transactions')} className="w-full sm:w-auto">
                                View History
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}