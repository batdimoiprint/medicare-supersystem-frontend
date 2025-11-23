import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from '@/components/theme-provider'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, XCircle, Activity, ArrowRight } from 'lucide-react'

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

    // Mock stats for receptionist
    const stats = {
        todaysAppointments: 18,
        pendingFollowups: 4,
        cancelRequests: 2,
        avgWaitMinutes: 12,
    }

    // Appointments last 7 days
    const lineSeries = [
        {
            name: 'Appointments',
            data: [2, 4, 6, 5, 3, 7, 8],
        },
    ]

    const lineOptions: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        xaxis: {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            labels: { style: { colors: isDark ? '#fff' : '#000' } },
        },
        yaxis: { labels: { style: { colors: isDark ? '#fff' : '#000' } } },
        grid: { borderColor: isDark ? '#374151' : '#e5e7eb' },
        theme: { mode: isDark ? 'dark' : 'light' },
        colors: ['#0ea5e9'],
    }

    // Appointment status donut
    const donutSeries = [12, 5, 2] // confirmed, completed, cancelled
    const donutOptions: ApexOptions = {
        chart: { type: 'donut' },
        labels: ['Confirmed', 'Completed', 'Cancelled'],
        colors: ['#34d399', '#60a5fa', '#f87171'],
        legend: { position: 'bottom', labels: { colors: isDark ? '#fff' : '#000' } },
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                                <Activity className="w-8 h-8" />
                                Receptionist Dashboard
                            </CardTitle>
                            <p className="text-muted-foreground">Welcome! Here are today's snapshots and quick actions for reception.</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                                <p className="text-2xl font-bold">{stats.todaysAppointments}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Followups</p>
                                <p className="text-2xl font-bold">{stats.pendingFollowups}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Cancel Requests</p>
                                <p className="text-2xl font-bold text-destructive">{stats.cancelRequests}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-destructive" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                                <p className="text-2xl font-bold">{stats.avgWaitMinutes} min</p>
                            </div>
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Appointments (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Chart options={lineOptions} series={lineSeries} type="line" height={300} />
                        <div className="grid grid-cols-3 pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{lineSeries[0].data.reduce((a, b) => a + b, 0)}</p>
                                <p className="text-sm text-muted-foreground">Total Appointments</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.todaysAppointments}</p>
                                <p className="text-sm text-muted-foreground">Today</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{stats.cancelRequests}</p>
                                <p className="text-sm text-muted-foreground">Cancellations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Chart options={donutOptions} series={donutSeries} type="donut" height={250} />
                    </CardContent>
                    <CardFooter>
                        <div className="flex-1" />
                        <Link to="/receptionist/appointments">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Appointment #5222 confirmed</p>
                                    <p className="text-xs text-muted-foreground">Alice - 1 hour ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Cancel request #1121</p>
                                    <p className="text-xs text-muted-foreground">Bob - 4 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Link to="/receptionist/appointments">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-semibold">Open Appointments</p>
                                            <p className="text-xs text-muted-foreground">View or create appointments</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </Link>
                            <Link to="/receptionist/followup">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-semibold">Manage Followups</p>
                                            <p className="text-xs text-muted-foreground">View followup schedule</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
