import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from '@/components/theme-provider'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, XCircle, Activity, ArrowRight, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useReceptionistDashboard } from '@/hooks/use-receptionist-dashboard'

// Helper to format relative time
function formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export default function Dashboard() {
    const { theme } = useTheme()
    const [isDark, setIsDark] = useState(false)

    // Fetch dashboard data from Supabase
    const {
        stats,
        appointmentsChart,
        statusDistribution,
        recentActivity,
        isLoading,
        isStatsLoading,
        isChartLoading,
        isDistributionLoading,
        isActivityLoading,
        refetchAll,
    } = useReceptionistDashboard()

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

    // Default stats when loading
    const displayStats = stats ?? {
        todaysAppointments: 0,
        pendingFollowups: 0,
        cancelRequests: 0,
        avgWaitMinutes: 0,
    }

    // Transform appointments chart data for ApexCharts
    const lineSeries = useMemo(() => [
        {
            name: 'Appointments',
            data: appointmentsChart?.map(d => d.count) ?? [0, 0, 0, 0, 0, 0, 0],
        },
    ], [appointmentsChart])

    const chartCategories = useMemo(() => 
        appointmentsChart?.map(d => d.day) ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    [appointmentsChart])

    const lineOptions: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        xaxis: {
            categories: chartCategories,
            labels: { style: { colors: isDark ? '#fff' : '#000' } },
        },
        yaxis: { labels: { style: { colors: isDark ? '#fff' : '#000' } } },
        grid: { borderColor: isDark ? '#374151' : '#e5e7eb' },
        theme: { mode: isDark ? 'dark' : 'light' },
        colors: ['#0ea5e9'],
    }

    // Transform status distribution for donut chart
    const donutSeries = useMemo(() => 
        statusDistribution?.map(d => d.count) ?? [0],
    [statusDistribution])

    const donutLabels = useMemo(() => 
        statusDistribution?.map(d => d.status) ?? ['No Data'],
    [statusDistribution])
    const donutOptions: ApexOptions = {
        chart: { type: 'donut' },
        labels: donutLabels,
        colors: ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa'],
        legend: { position: 'bottom', labels: { colors: isDark ? '#fff' : '#000' } },
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
        noData: {
            text: 'No appointments today',
            style: { color: isDark ? '#fff' : '#000' },
        },
    }

    // Calculate total appointments from chart data
    const totalAppointmentsLast7Days = lineSeries[0].data.reduce((a, b) => a + b, 0)

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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refetchAll}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            <span className="ml-2">Refresh</span>
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                                {isStatsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold">{displayStats.todaysAppointments}</p>
                                )}
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
                                {isStatsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold">{displayStats.pendingFollowups}</p>
                                )}
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
                                {isStatsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-destructive">{displayStats.cancelRequests}</p>
                                )}
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
                                {isStatsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold">{displayStats.avgWaitMinutes} min</p>
                                )}
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
                        {isChartLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <Chart options={lineOptions} series={lineSeries} type="line" height={300} />
                        )}
                        <div className="grid grid-cols-3 pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{totalAppointmentsLast7Days}</p>
                                <p className="text-sm text-muted-foreground">Total Appointments</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{displayStats.todaysAppointments}</p>
                                <p className="text-sm text-muted-foreground">Today</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{displayStats.cancelRequests}</p>
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
                        {isDistributionLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <Chart options={donutOptions} series={donutSeries} type="donut" height={250} />
                        )}
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
                        {isActivityLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : recentActivity && recentActivity.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        {activity.type === 'appointment_cancelled' ? (
                                            <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatRelativeTime(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                        )}
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
