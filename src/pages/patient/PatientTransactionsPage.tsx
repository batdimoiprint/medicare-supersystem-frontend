import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CreditCard,
    Download,
    Search,
    FileText,
    Calendar,
    Clock,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import PaymentModal from '@/components/patient/PaymentModal';
import supabase from '@/utils/supabase';
import { useAuth } from '@/context/userContext';

// --- Interface based on actual database schema ---
interface Transaction {
    bill_id: number;
    reference_no: string;
    date: string;
    description: string;
    total_amount: number;
    payable_amount: number | null;
    cash_paid: number | null;
    change_amount: number | null;
    payment_option: string;
    payment_status: string;
    paymongo_id?: string;
    appointment_date?: string;
    appointment_time?: string;
    service_name?: string;
    has_reservation_fee?: boolean;
    reservation_fee_status?: string;
    has_refund?: boolean;
    refund_amount?: number;
    refund_status?: string;
}

export default function PatientTransactionsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPatientId, setCurrentPatientId] = useState<string>('');

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<any>(null);

    // Format time to AM/PM
    const formatTimeToAMPM = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    // Format date to readable format
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Set current patient from auth context
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentPatientId(user.id.toString());
    }, [navigate, user]);

    // Fetch transactions when patient ID is available
    useEffect(() => {
        if (!currentPatientId) return;

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const patientIdNum = parseInt(currentPatientId);

                if (isNaN(patientIdNum)) {
                    console.error('Invalid patient ID format');
                    setTransactions([]);
                    return;
                }

                // Fetch billing data
                const { data: billingData, error: billingError } = await supabase
                    .schema('frontdesk')
                    .from('billing_tbl')
                    .select(`
                        bill_id,
                        patient_id,
                        appointment_id,
                        total_amount,
                        payable_amount,
                        cash_paid,
                        change_amount,
                        payment_option,
                        payment_status_id,
                        paymongo_payment_id
                    `)
                    .eq('patient_id', patientIdNum)
                    .order('bill_id', { ascending: false });

                if (billingError) {
                    console.error('Error fetching billing data:', billingError.message);
                    setTransactions([]);
                    return;
                }

                if (!billingData || billingData.length === 0) {
                    console.log('No billing records found for patient');
                    setTransactions([]);
                    return;
                }

                // Get payment status names from payment_status_table
                const { data: statusData, error: statusError } = await supabase
                    .schema('frontdesk')
                    .from('payment_status_table')
                    .select('appointment_status_id, appointment_status');

                // Handle status errors - show warning but continue
                if (statusError) {
                    console.warn('Warning: Could not fetch payment statuses. Using default status mapping.');
                }

                // Create status mapping with defaults
                const statusMap = new Map();
                statusData?.forEach(status => {
                    statusMap.set(status.appointment_status_id, status.appointment_status);
                });

                // Add default status mappings for common IDs
                const defaultStatusMap = new Map([
                    [1, 'Pending'],
                    [2, 'Paid'],
                    [3, 'Overdue'],
                    [4, 'Partially Paid'],
                    [5, 'Refunded']
                ]);

                // Get appointment details for each billing record
                const transformedTransactions: Transaction[] = [];

                for (const bill of billingData) {
                    // Generate reference number
                    const referenceNo = `INV-${bill.bill_id}`;

                    // Use current date as transaction date
                    const transactionDate = new Date().toISOString().split('T')[0];

                    // Fetch appointment details if appointment_id exists
                    let appointmentDate = '';
                    let appointmentTime = '';
                    let serviceName = 'General Consultation';

                    if (bill.appointment_id) {
                        const { data: appointmentData } = await supabase
                            .schema('frontdesk')
                            .from('appointment_tbl')
                            .select('appointment_date, appointment_time, service_id')
                            .eq('appointment_id', bill.appointment_id)
                            .single();

                        if (appointmentData) {
                            appointmentDate = appointmentData.appointment_date || '';
                            appointmentTime = appointmentData.appointment_time || '';

                            // Fetch service name from clinic.service_tbl
                            if (appointmentData.service_id) {
                                const { data: serviceData } = await supabase
                                    .schema('clinic')
                                    .from('service_tbl')
                                    .select('service_name')
                                    .eq('service_id', appointmentData.service_id)
                                    .single();

                                if (serviceData) {
                                    serviceName = serviceData.service_name;
                                }
                            }
                        }
                    }

                    // Get payment status from mapping with fallbacks
                    let paymentStatus = 'Pending'; // Default
                    if (bill.payment_status_id) {
                        // First try the actual status table
                        paymentStatus = statusMap.get(bill.payment_status_id) ||
                            // Then try default mapping
                            defaultStatusMap.get(bill.payment_status_id) ||
                            // Finally use payment_option to infer status
                            (bill.cash_paid && bill.cash_paid > 0 ? 'Paid' : 'Pending');
                    } else {
                        // If no status_id, infer from cash_paid
                        paymentStatus = bill.cash_paid && bill.cash_paid > 0 ? 'Paid' : 'Pending';
                    }

                    transformedTransactions.push({
                        bill_id: bill.bill_id,
                        reference_no: referenceNo,
                        date: transactionDate,
                        description: serviceName,
                        total_amount: bill.total_amount || 0,
                        payable_amount: bill.payable_amount,
                        cash_paid: bill.cash_paid,
                        change_amount: bill.change_amount,
                        payment_option: bill.payment_option || 'Not Specified',
                        payment_status: paymentStatus,
                        paymongo_id: bill.paymongo_payment_id,
                        appointment_date: appointmentDate,
                        appointment_time: appointmentTime,
                        service_name: serviceName,
                        has_reservation_fee: false,
                        has_refund: false,
                    });
                }

                console.log(`Loaded ${transformedTransactions.length} transactions`);
                setTransactions(transformedTransactions);

            } catch (error) {
                console.error('Error processing transactions:', error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [currentPatientId]);

    // Handler to open Payment Modal
    const handlePayClick = (bill: Transaction) => {
        const billDetails = {
            bill_id: bill.bill_id,
            reference_no: bill.reference_no,
            description: bill.description,
            total_amount: bill.total_amount,
            payable_amount: bill.payable_amount,
            due_date: bill.date,
            status: bill.payment_status as 'Pending' | 'Overdue'
        };
        setSelectedBill(billDetails);
        setIsPaymentModalOpen(true);
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.reference_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Helper for Status Colors
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            case 'partially paid': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Get payment method display
    const getPaymentMethodDisplay = (transaction: Transaction) => {
        if (transaction.payment_status === 'Pending' || transaction.payment_status === 'Overdue') {
            return <span className="text-xs italic text-muted-foreground">Unpaid</span>;
        }

        if (transaction.payment_option?.toLowerCase().includes('cash')) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs">Cash</span>
                </div>
            );
        }

        if (transaction.payment_option?.toLowerCase().includes('online') || transaction.paymongo_id) {
            return (
                <div className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">Online</span>
                </div>
            );
        }

        return <span className="text-xs">{transaction.payment_option || 'Not Specified'}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 max-w-6xl mx-auto">

            {/* Header with Back Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        className="pl-0 hover:bg-transparent hover:text-primary mb-1"
                        onClick={() => navigate('/patient')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
                    <p className="text-muted-foreground">
                        {transactions.length > 0
                            ? `You have ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
                            : 'No transactions found'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={transactions.length === 0}>
                        <Download className="w-4 h-4 mr-2" /> Export Statement
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice # or description..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                <SelectItem value="Refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Scrollable Transactions Container */}
            <Card className="border-none shadow-md">
                <CardHeader className="bg-muted/30 border-b sticky top-0 z-10">
                    <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider items-center">
                        <div className="col-span-2">Invoice #</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Appointment</div>
                        <div className="col-span-2">Method</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-1 text-right">Status</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[500px] overflow-y-auto">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t) => (
                                <div
                                    key={t.bill_id}
                                    className="grid grid-cols-12 items-center p-4 border-b hover:bg-muted/20 transition-colors text-sm min-h-[80px]"
                                >
                                    <div className="col-span-2">
                                        <div className="font-medium text-gray-900 font-mono">
                                            {t.reference_no}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Bill ID: {t.bill_id}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="font-medium text-gray-900 line-clamp-2">
                                            {t.description}
                                        </div>
                                        {t.appointment_date && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Date: {formatDate(t.date)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        {t.appointment_date ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(t.appointment_date)}</span>
                                                </div>
                                                {t.appointment_time && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{formatTimeToAMPM(t.appointment_time)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-muted-foreground">No appointment</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        {getPaymentMethodDisplay(t)}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="font-bold">
                                            ₱{t.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        {t.payable_amount && t.payable_amount !== t.total_amount && (
                                            <div className="text-xs text-muted-foreground">
                                                Payable: ₱{t.payable_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                        {t.cash_paid && t.cash_paid > 0 && (
                                            <div className="text-xs text-green-600">
                                                Paid: ₱{t.cash_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                        {t.change_amount && t.change_amount > 0 && (
                                            <div className="text-xs text-blue-600">
                                                Change: ₱{t.change_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        {t.payment_status === 'Pending' || t.payment_status === 'Overdue' ? (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                onClick={() => handlePayClick(t)}
                                            >
                                                Pay Now
                                            </Button>
                                        ) : (
                                            <Badge variant="outline" className={getStatusColor(t.payment_status)}>
                                                {t.payment_status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No transactions found matching your criteria.</p>
                                {transactions.length === 0 && (
                                    <p className="text-sm mt-1">You don't have any billing records yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Modal Integration */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                bill={selectedBill}
            />
        </div>
    );
}