import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Banknote,
  Receipt,
  BadgeCheck,
  RotateCcw,
  Download,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn, formatCurrency } from "@/lib/utils";

// Tab types
type TabType = 'reservation' | 'transactions' | 'refunds' | 'reports';

// Payment status types
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Dummy Data - Reservation Fee Payments (PayMongo)
const reservationPayments = [
  { id: 'PAY-001', patient: 'Maria Santos', appointmentId: 'APT-2025-1234', amount: 500, status: 'paid' as PaymentStatus, paymongoRef: 'pm_12345abcde', date: '2025-12-03', time: '09:15 AM', appointmentDate: '2025-12-05', verified: true },
  { id: 'PAY-002', patient: 'Juan Dela Cruz', appointmentId: 'APT-2025-1235', amount: 500, status: 'paid' as PaymentStatus, paymongoRef: 'pm_12346bcdef', date: '2025-12-03', time: '10:30 AM', appointmentDate: '2025-12-06', verified: true },
  { id: 'PAY-003', patient: 'Ana Reyes', appointmentId: 'APT-2025-1236', amount: 500, status: 'pending' as PaymentStatus, paymongoRef: 'pm_12347cdefg', date: '2025-12-03', time: '11:45 AM', appointmentDate: '2025-12-07', verified: false },
  { id: 'PAY-004', patient: 'Pedro Garcia', appointmentId: 'APT-2025-1237', amount: 500, status: 'failed' as PaymentStatus, paymongoRef: 'pm_12348defgh', date: '2025-12-02', time: '02:00 PM', appointmentDate: '2025-12-08', verified: false },
  { id: 'PAY-005', patient: 'Sofia Martinez', appointmentId: 'APT-2025-1238', amount: 500, status: 'paid' as PaymentStatus, paymongoRef: 'pm_12349efghi', date: '2025-12-02', time: '03:30 PM', appointmentDate: '2025-12-09', verified: true },
  { id: 'PAY-006', patient: 'Carlos Mendoza', appointmentId: 'APT-2025-1239', amount: 500, status: 'pending' as PaymentStatus, paymongoRef: 'pm_12350fghij', date: '2025-12-02', time: '04:15 PM', appointmentDate: '2025-12-10', verified: false },
];

// Billing Transactions (PayMongo + Cash)
const billingTransactions = [
  { id: 'TXN-001', patient: 'Lisa Wong', service: 'Dental Cleaning', amount: 2500, method: 'paymongo', status: 'completed', paymongoRef: 'pm_txn_001', date: '2025-12-03', dentist: 'Dr. Smith' },
  { id: 'TXN-002', patient: 'Mark Rivera', service: 'Root Canal', amount: 8500, method: 'cash', status: 'completed', date: '2025-12-03', dentist: 'Dr. Johnson' },
  { id: 'TXN-003', patient: 'Emma Cruz', service: 'Dental Filling', amount: 3000, method: 'paymongo', status: 'completed', paymongoRef: 'pm_txn_002', date: '2025-12-02', dentist: 'Dr. Lee' },
  { id: 'TXN-004', patient: 'David Tan', service: 'Tooth Extraction', amount: 2000, method: 'cash', status: 'completed', date: '2025-12-02', dentist: 'Dr. Smith' },
  { id: 'TXN-005', patient: 'Grace Lim', service: 'Teeth Whitening', amount: 5000, method: 'paymongo', status: 'completed', paymongoRef: 'pm_txn_003', date: '2025-12-01', dentist: 'Dr. Johnson' },
  { id: 'TXN-006', patient: 'Michael Sy', service: 'Orthodontic Adjustment', amount: 1500, method: 'cash', status: 'completed', date: '2025-12-01', dentist: 'Dr. Lee' },
];

// Refund Requests
const refundRequests = [
  { id: 'REF-001', patient: 'Nicole Reyes', appointmentId: 'APT-2025-1220', amount: 500, reason: 'Cancelled due to emergency', status: 'pending', paymongoRef: 'pm_ref_001', requestDate: '2025-12-02', paymentVerified: true },
  { id: 'REF-002', patient: 'Robert Santos', appointmentId: 'APT-2025-1218', amount: 500, reason: 'Double booking', status: 'approved', paymongoRef: 'pm_ref_002', requestDate: '2025-12-01', paymentVerified: true },
  { id: 'REF-003', patient: 'Angela Cruz', appointmentId: 'APT-2025-1215', amount: 500, reason: 'Changed schedule', status: 'rejected', paymongoRef: 'pm_ref_003', requestDate: '2025-11-30', paymentVerified: false },
];

// Revenue Chart Data
const revenueData = [
  { name: 'Week 1', paymongo: 45000, cash: 32000 },
  { name: 'Week 2', paymongo: 52000, cash: 38000 },
  { name: 'Week 3', paymongo: 48000, cash: 35000 },
  { name: 'Week 4', paymongo: 58000, cash: 42000 },
];

// Stats
const paymentStats = [
  { title: 'Total Revenue', value: '₱350,000', change: '+12.5%', trend: 'up', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'PayMongo', value: '₱203,000', change: '+8.3%', trend: 'up', icon: CreditCard, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { title: 'Cash Payments', value: '₱147,000', change: '+15.2%', trend: 'up', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'Pending Refunds', value: '₱2,500', change: '5 requests', trend: 'neutral', icon: RotateCcw, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export default function BillingPayment() {
  const [activeTab, setActiveTab] = useState<TabType>('reservation');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const openDetailModal = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
    setTimeout(() => setIsDetailOpen(true), 10);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedPayment(null);
    }, 200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'failed':
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'reservation', label: 'Reservation Fees', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'refunds', label: 'Refund Requests', icon: RotateCcw },
    { id: 'reports', label: 'Revenue Reports', icon: FileText },
  ];

  const filteredReservations = reservationPayments.filter(p => {
    const matchesSearch = p.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymongoRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.appointmentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = billingTransactions.filter(t => {
    const matchesSearch = t.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === 'all' || t.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-primary" />
                Billing & Payment
              </CardTitle>
              <p className="text-muted-foreground">
                Monitor payments, verify transactions, and manage refunds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-medium mt-1",
                      stat.trend === 'up' ? "text-emerald-500" : stat.trend === 'down' ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {stat.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {stat.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs & Content */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Search & Filters */}
            {activeTab !== 'reports' && (
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab === 'reservation' && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {activeTab === 'transactions' && (
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="paymongo">PayMongo</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Reservation Fees Tab */}
          {activeTab === 'reservation' && (
            <div className="space-y-3">
              {filteredReservations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reservation payments found</p>
                </div>
              ) : (
                filteredReservations.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", payment.status === 'paid' ? 'bg-emerald-500/10' : payment.status === 'pending' ? 'bg-amber-500/10' : 'bg-destructive/10')}>
                          <CreditCard className={cn("w-5 h-5", payment.status === 'paid' ? 'text-emerald-500' : payment.status === 'pending' ? 'text-amber-500' : 'text-destructive')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{payment.patient}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(payment.status))}>
                              {getStatusIcon(payment.status)}
                              <span className="ml-1 capitalize">{payment.status}</span>
                            </Badge>
                            {payment.verified && (
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Appointment: {payment.appointmentId} • {new Date(payment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>PayMongo Ref: {payment.paymongoRef}</span>
                            <span>{payment.date} at {payment.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-primary">{formatCurrency(payment.amount)}</p>
                        <Button variant="outline" size="sm" onClick={() => openDetailModal(payment)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {!payment.verified && payment.status === 'paid' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <BadgeCheck className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", txn.method === 'paymongo' ? 'bg-cyan-500/10' : 'bg-emerald-500/10')}>
                          {txn.method === 'paymongo' ? (
                            <CreditCard className="w-5 h-5 text-cyan-500" />
                          ) : (
                            <Banknote className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{txn.patient}</p>
                            <Badge variant="outline" className={cn("text-xs", txn.method === 'paymongo' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}>
                              {txn.method === 'paymongo' ? 'PayMongo' : 'Cash'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{txn.service}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{txn.dentist}</span>
                            <span>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {txn.paymongoRef && <span>Ref: {txn.paymongoRef}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-primary">{formatCurrency(txn.amount)}</p>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Refunds Tab */}
          {activeTab === 'refunds' && (
            <div className="space-y-3">
              {refundRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No refund requests found</p>
                </div>
              ) : (
                refundRequests.map((refund, index) => (
                  <motion.div
                    key={refund.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", refund.status === 'approved' ? 'bg-emerald-500/10' : refund.status === 'pending' ? 'bg-amber-500/10' : 'bg-destructive/10')}>
                          <RotateCcw className={cn("w-5 h-5", refund.status === 'approved' ? 'text-emerald-500' : refund.status === 'pending' ? 'text-amber-500' : 'text-destructive')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{refund.patient}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(refund.status))}>
                              {getStatusIcon(refund.status)}
                              <span className="ml-1 capitalize">{refund.status}</span>
                            </Badge>
                            {refund.paymentVerified && (
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Payment Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Appointment: {refund.appointmentId} • Reason: {refund.reason}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Requested: {new Date(refund.requestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>PayMongo Ref: {refund.paymongoRef}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-amber-500">{formatCurrency(refund.amount)}</p>
                        {refund.status === 'pending' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Revenue Chart */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Revenue Overview</h3>
                    <p className="text-sm text-muted-foreground">Monthly revenue by payment method</p>
                  </div>
                  <Select defaultValue="month">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorPaymongoReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCashReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area type="monotone" dataKey="paymongo" name="PayMongo" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPaymongoReport)" />
                      <Area type="monotone" dataKey="cash" name="Cash" stroke="#10b981" fillOpacity={1} fill="url(#colorCashReport)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-sm text-muted-foreground">PayMongo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Cash</span>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total This Month</p>
                        <p className="text-3xl font-bold text-primary mt-1">₱350,000</p>
                        <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          +12.5% from last month
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-primary/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">PayMongo Revenue</p>
                        <p className="text-3xl font-bold text-cyan-500 mt-1">₱203,000</p>
                        <p className="text-xs text-muted-foreground mt-1">58% of total revenue</p>
                      </div>
                      <CreditCard className="w-10 h-10 text-cyan-500/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Revenue</p>
                        <p className="text-3xl font-bold text-emerald-500 mt-1">₱147,000</p>
                        <p className="text-xs text-muted-foreground mt-1">42% of total revenue</p>
                      </div>
                      <Banknote className="w-10 h-10 text-emerald-500/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isDetailOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={closeDetailModal}
          />
          <div
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isDetailOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-lg overflow-hidden bg-card shadow-2xl m-4 border">
              {/* Modal Header */}
              <div className="bg-[#00a8a8] px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Payment Details</h3>
                    <p className="text-xs text-white/70">Reservation fee payment record</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="hover:bg-white/20 rounded p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-semibold text-lg">{selectedPayment.patient}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-sm", getStatusColor(selectedPayment.status))}>
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-1 capitalize">{selectedPayment.status}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Payment ID</p>
                    <p className="font-medium mt-1">{selectedPayment.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium mt-1 text-primary">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Appointment ID</p>
                    <p className="font-medium mt-1">{selectedPayment.appointmentId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Appointment Date</p>
                    <p className="font-medium mt-1">
                      {new Date(selectedPayment.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-xs text-cyan-500 font-medium">PayMongo Reference</p>
                  <p className="font-mono mt-1">{selectedPayment.paymongoRef}</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Payment Date & Time</p>
                  <p className="font-medium mt-1">{selectedPayment.date} at {selectedPayment.time}</p>
                </div>

                {selectedPayment.verified ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-emerald-500">Payment Verified</p>
                        <p className="text-xs text-muted-foreground">This payment has been verified with PayMongo records</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-amber-500">Pending Verification</p>
                        <p className="text-xs text-muted-foreground">This payment needs to be verified with PayMongo records</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={closeDetailModal}>
                  Close
                </Button>
                {!selectedPayment.verified && selectedPayment.status === 'paid' && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Verify Payment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
