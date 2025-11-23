import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    CreditCard, 
    Download, 
    Filter, 
    Search,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

// --- Mock Data based on Billing_tbl & Payment_status_tbl ---
interface Transaction {
    bill_id: number;
    reference_no: string; // e.g., INV-001
    date: string; // created_at
    description: string; // inferred from linked services
    total_amount: number;
    payment_option: 'Cash' | 'PayMongo QR' | 'Insurance';
    payment_status: 'Pending' | 'Paid' | 'Overdue' | 'Refunded'; // payment_status_name
    paymongo_id?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        bill_id: 101,
        reference_no: "INV-2025-001",
        date: "2025-11-24",
        description: "Dental Cleaning (Prophylaxis)",
        total_amount: 500.00,
        payment_option: "Cash",
        payment_status: "Pending"
    },
    {
        bill_id: 98,
        reference_no: "INV-2025-002",
        date: "2025-10-15",
        description: "Root Canal Treatment - Session 1",
        total_amount: 5000.00,
        payment_option: "PayMongo QR",
        payment_status: "Paid",
        paymongo_id: "pay_12345xyz"
    },
    {
        bill_id: 85,
        reference_no: "INV-2025-003",
        date: "2025-09-01",
        description: "Initial Consultation & X-Ray",
        total_amount: 1500.00,
        payment_option: "Cash",
        payment_status: "Paid"
    },
    {
        bill_id: 72,
        reference_no: "INV-2025-004",
        date: "2025-08-10",
        description: "Cavity Filling (Composite)",
        total_amount: 1200.00,
        payment_option: "Insurance",
        payment_status: "Refunded"
    }
];

export default function PatientTransactionsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Filter Logic
    const filteredTransactions = MOCK_TRANSACTIONS.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.reference_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Helper for Status Colors
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

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
                    <p className="text-muted-foreground">View your billing statements and payment records.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
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
                                <SelectItem value="Refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card className="border-none shadow-md">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Reference</div>
                        <div className="col-span-2">Method</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-1 text-right">Status</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((t) => (
                            <div 
                                key={t.bill_id} 
                                className="grid grid-cols-12 items-center p-4 border-b last:border-0 hover:bg-muted/20 transition-colors text-sm"
                            >
                                <div className="col-span-2 font-medium text-muted-foreground">
                                    {t.date}
                                </div>
                                <div className="col-span-3 font-medium text-gray-900">
                                    {t.description}
                                </div>
                                <div className="col-span-2 font-mono text-xs text-muted-foreground">
                                    {t.reference_no}
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <CreditCard className="w-3 h-3 text-muted-foreground" /> {t.payment_option}
                                </div>
                                <div className="col-span-2 font-bold">
                                    ₱{t.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Badge variant="outline" className={getStatusColor(t.payment_status)}>
                                        {t.payment_status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No transactions found matching your criteria.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}