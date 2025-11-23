import { useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Activity, CreditCard, DollarSign, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Link } from 'react-router-dom'
import samplePayments from '@/components/cashier/mockData'

export default function Dashboard() {
    const { theme } = useTheme()
    const [isDark, setIsDark] = useState(false)

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

    // Mock stats
    const stats = {
        todayPayments: 12,
        pendingRefunds: samplePayments.filter(p => p.status === 'pending').length,
        totalRevenue: samplePayments.reduce((a, b) => a + b.amount, 0),
        processedPayments: samplePayments.filter(p => p.status === 'processed').length,
    }

    const dateSeries = [
        { name: 'Payments', data: [12, 7, 10, 14, 11, 16, 9] },
    ]

    const dateOptions: ApexOptions = {
        chart: { type: 'area', toolbar: { show: false } },
        stroke: { curve: 'smooth' },
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], labels: { style: { colors: isDark ? '#fff' : '#000' } } },
        yaxis: { labels: { style: { colors: isDark ? '#fff' : '#000' } } },
        grid: { borderColor: isDark ? '#374151' : '#e5e7eb' },
        colors: ['#10b981'],
        theme: { mode: isDark ? 'dark' : 'light' },
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
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <Card>
                    <CardContent>
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
                    <CardContent>
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
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold">₱ {stats.totalRevenue.toFixed(2)}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
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
                        <CardTitle className="flex items-center gap-2">Payments (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Chart options={dateOptions} series={dateSeries} type="area" height={300} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {samplePayments.slice(0, 4).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium">{tx.patientName}</div>
                                        <div className="text-sm text-muted-foreground">{tx.id}</div>
                                    </div>
                                    <div className="font-semibold">₱ {tx.amount.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex-1" />
                        <Link to="/cashier/payments">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}
