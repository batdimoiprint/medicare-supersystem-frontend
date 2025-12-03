import { useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Activity, CreditCard, DollarSign, ArrowRight, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Link } from 'react-router-dom'
import supabase from '@/utils/supabase'

export default function Dashboard() {
    const { theme } = useTheme()
    const [isDark, setIsDark] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayPayments: 0,
        pendingRefunds: 0,
        totalRevenue: 0,
        processedPayments: 0,
    })
    const [recentTransactions, setRecentTransactions] = useState<any[]>([])
    const [paymentData, setPaymentData] = useState<number[]>([])

    useEffect(() => {
        const updateTheme = () => {
            if (theme === 'dark') setIsDark(true)
            else if (theme === 'light') setIsDark(false)
            else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
        updateTheme()
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = () => updateTheme()
            mediaQuery.addEventListener('change', handler)
            return () => mediaQuery.removeEventListener('change', handler)
        }
    }, [theme])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        setLoading(true)
        try {
           
            const today = new Date()
            const todayString = today.toISOString().split('T')[0] 
            const { data: allPaidPayments, error: paymentsError } = await supabase
                .from('billing_view')
                .select('*')
                .eq('payment_status_id', 2) // Paid status

            if (paymentsError) {
                console.error('Error fetching payments:', paymentsError)
            }

            let todayPaymentsCount = 0
            let totalRevenue = 0
            let processedPaymentsCount = 0
            
            if (allPaidPayments) {
                processedPaymentsCount = allPaidPayments.length
                totalRevenue = allPaidPayments.reduce((sum, payment) => 
                    sum + (parseFloat(payment.payable_amount) || 0), 0)
                todayPaymentsCount = allPaidPayments.filter(payment => {
                    const dateFields = [
                        payment.appointment_date,
                        payment.bill_date,
                        payment.date,
                        payment.created_date,
                        payment.payment_date,
                        payment.created_at,
                        payment.updated_at
                    ]
                    
                    return dateFields.some(dateField => {
                        if (!dateField) return false
                        try {
                            const dateStr = typeof dateField === 'string' 
                                ? dateField.split('T')[0]
                                : new Date(dateField).toISOString().split('T')[0]
                            return dateStr === todayString
                        } catch {
                            return false
                        }
                    })
                }).length
            }
            const pendingRefundsCount = 0
            const { data: recentTx, error: recentError } = await supabase
                .from('billing_view')
                .select('*')
                .eq('payment_status_id', 2) // Paid status
                .order('bill_id', { ascending: false }) 
                .limit(10)

            if (recentError) {
                console.error('Error fetching recent transactions:', recentError)
            }
            const lineGraphData = createLineGraphDataFromPayments(allPaidPayments || [])
            setPaymentData(lineGraphData)

            const processedRecentTx = await processRecentTransactionsWithPatientNames(recentTx || [])

            setStats({
                todayPayments: todayPaymentsCount,
                pendingRefunds: pendingRefundsCount,
                totalRevenue,
                processedPayments: processedPaymentsCount,
            })

            setRecentTransactions(processedRecentTx)

        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    async function processRecentTransactionsWithPatientNames(transactions: any[]) {
        if (transactions.length === 0) {
            return []
        }

        const patientIds = [...new Set(transactions.map(tx => tx.patient_id).filter(id => id))];
        const patientMap = new Map();
        if (patientIds.length > 0) {
            const { data: patients, error } = await supabase
                .from('patient_tbl')
                .select('patient_id, f_name, l_name')
                .in('patient_id', patientIds);
            
            if (!error && patients) {
                patients.forEach(patient => {
                    patientMap.set(patient.patient_id, patient);
                });
            }
        }
        return transactions.map(tx => {
            let patientName = 'Patient';
            const patient = patientMap.get(tx.patient_id);
            if (patient) {
                patientName = `${patient.f_name || ''} ${patient.l_name || ''}`.trim();
            } else if (tx.patient_id) {
                patientName = `Patient ${tx.patient_id}`;
            }

            return {
                id: `BIL-${tx.bill_id || tx.id || ''}`,
                patientName: patientName,
                amount: parseFloat(tx.payable_amount) || 0,
                date: formatDate(tx),
                status: 'Paid'
            };
        });
    }

    function formatDate(tx: any) {
        const dateFields = [
            tx.appointment_date,
            tx.bill_date,
            tx.date,
            tx.created_date,
            tx.payment_date,
            tx.created_at,
            tx.updated_at
        ]
        
        for (const dateField of dateFields) {
            if (dateField) {
                try {
                    const date = new Date(dateField)
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric'
                        })
                    }
                } catch {
                    continue
                }
            }
        }
        
        return 'Recent'
    }

    function createLineGraphDataFromPayments(payments: any[]) {
        if (payments.length === 0) {
            return [0, 0, 0, 0, 0, 0, 0]
        }
        const sortedPayments = [...payments]
            .sort((a, b) => (parseFloat(a.payable_amount) || 0) - (parseFloat(b.payable_amount) || 0))
        const paymentsPerGroup = Math.ceil(sortedPayments.length / 7)
        const dataPoints: number[] = []
        
        for (let i = 0; i < 7; i++) {
            const startIdx = i * paymentsPerGroup
            const endIdx = startIdx + paymentsPerGroup
            const groupPayments = sortedPayments.slice(startIdx, endIdx)
            
            if (groupPayments.length > 0) {
                const total = groupPayments.reduce((sum, payment) => 
                    sum + (parseFloat(payment.payable_amount) || 0), 0)
                dataPoints.push(Math.round(total))
            } else {
                dataPoints.push(0)
            }
        }
        
        return dataPoints
    }

    const dateSeries = [
        { 
            name: 'Payments', 
            data: paymentData
        },
    ]

    const dateOptions: ApexOptions = {
        chart: { 
            type: 'area', 
            toolbar: { show: false },
            animations: {
                enabled: true,
                speed: 800,
            }
        },
        stroke: { 
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: { 
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
            labels: { 
                style: { 
                    colors: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: '12px'
                } 
            } 
        },
        yaxis: { 
            labels: { 
                style: { 
                    colors: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: '12px'
                },
                formatter: (value) => `₱ ${value.toFixed(0)}`
            } 
        },
        grid: { 
            borderColor: isDark ? '#374151' : '#e5e7eb',
            strokeDashArray: 4
        },
        colors: ['#10b981'],
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: {
            y: {
                formatter: (value) => `₱ ${value.toFixed(2)}`
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                                <DollarSign className="w-8 h-8" />
                                Cashier Dashboard
                            </CardTitle>
                            <p className="text-muted-foreground">Overview of payments, refunds and recent transactions.</p>
                        </div>
                        <button 
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Today's Payments</p>
                                <p className="text-2xl font-bold">{stats.todayPayments}</p>
                            </div>
                            <CreditCard className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Refunds</p>
                                <p className="text-2xl font-bold text-destructive">{stats.pendingRefunds}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-destructive" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold">₱ {stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Processed</p>
                                <p className="text-2xl font-bold">{stats.processedPayments}</p>
                            </div>
                            <Activity className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Payments Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentData.length > 0 && paymentData.some(d => d > 0) ? (
                            <Chart options={dateOptions} series={dateSeries} type="area" height={300} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64">
                                <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No payment data for the last 7 days</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                        <div className="space-y-1">
                                            <div className="font-medium text-sm">{tx.patientName}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{tx.id}</span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground">{tx.date}</span>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-primary">₱ {tx.amount.toFixed(2)}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40">
                                    <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex-1" />
                        <Link to="/cashier/payments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}