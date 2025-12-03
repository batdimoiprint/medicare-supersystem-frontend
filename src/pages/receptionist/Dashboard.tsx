import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from '@/components/theme-provider'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Activity,
    ArrowRight,
    RefreshCw,
    Loader2,
    CalendarCheck,
    CalendarX,
    Receipt,
    TrendingUp,
    AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
        },
        stroke: { curve: 'smooth', width: 3 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        markers: { size: 4, hover: { size: 6 } },
        xaxis: {
            categories: chartCategories,
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' } },
            min: 0,
        },
        grid: {
            borderColor: isDark ? '#334155' : '#e2e8f0',
            strokeDashArray: 4,
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        colors: ['#0ea5e9'],
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: { formatter: (val) => `${val} appointments` }
        },
    }

    // Transform status distribution for donut chart
    const donutSeries = useMemo(() =>
        statusDistribution?.map(d => d.count) ?? [],
        [statusDistribution])

    const donutLabels = useMemo(() =>
        statusDistribution?.map(d => d.status) ?? [],
        [statusDistribution])

    const donutOptions: ApexOptions = {
        chart: { type: 'donut' },
        labels: donutLabels,
        colors: ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
        legend: {
            position: 'bottom',
            labels: { colors: isDark ? '#e2e8f0' : '#334155' },
            fontSize: '13px',
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '14px' },
                        value: { show: true, fontSize: '22px', fontWeight: 600 },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '14px',
                            color: isDark ? '#94a3b8' : '#64748b',
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        noData: {
            text: 'No appointments today',
            style: { color: isDark ? '#94a3b8' : '#64748b', fontSize: '14px' },
        },
    }

    // Calculate total appointments from chart data
    const totalAppointmentsLast7Days = lineSeries[0].data.reduce((a, b) => a + b, 0)

    // Calculate trend (compare today with yesterday if available)
    const todayCount = lineSeries[0].data[lineSeries[0].data.length - 1] ?? 0
    const yesterdayCount = lineSeries[0].data[lineSeries[0].data.length - 2] ?? 0
    const trendPercentage = yesterdayCount > 0
        ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
        : 0

    return (
        <div className="space-y-6 ">
            {/* Header Section */}
            <Card >
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                </div>
                                Receptionist Dashboard
                            </CardTitle>
                            <CardDescription className="mt-2 text-base">
                                Welcome back! Here's an overview of today's appointments and activities.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refetchAll}
                            disabled={isLoading}
                            className="shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Refresh Data
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                                {isStatsLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold">{displayStats.todaysAppointments}</p>
                                        {trendPercentage !== 0 && (
                                            <span className={`text-xs font-medium flex items-center ${trendPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                <TrendingUp className={`w-3 h-3 mr-0.5 ${trendPercentage < 0 ? 'rotate-180' : ''}`} />
                                                {Math.abs(trendPercentage)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <CalendarCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Cancellation Requests</p>
                                {isStatsLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    <p className="text-3xl font-bold text-destructive">{displayStats.cancelRequests}</p>
                                )}
                            </div>
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                                <CalendarX className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Avg. Wait Time</p>
                                {isStatsLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    <p className="text-3xl font-bold">{displayStats.avgWaitMinutes}<span className="text-lg font-normal text-muted-foreground ml-1">min</span></p>
                                )}
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointments Trend Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Appointments Trend</CardTitle>
                                <CardDescription>Last 7 days overview</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                                {totalAppointmentsLast7Days} total
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isChartLoading ? (
                            <Skeleton className="h-[280px] w-full" />
                        ) : (
                            <Chart options={lineOptions} series={lineSeries} type="area" height={280} />
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                        <div className="grid grid-cols-3 gap-4 w-full">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{totalAppointmentsLast7Days}</p>
                                <p className="text-xs text-muted-foreground">Total This Week</p>
                            </div>
                            <div className="text-center border-x">
                                <p className="text-2xl font-bold">{displayStats.todaysAppointments}</p>
                                <p className="text-xs text-muted-foreground">Today</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{displayStats.cancelRequests}</p>
                                <p className="text-xs text-muted-foreground">Cancelled</p>
                            </div>
                        </div>
                    </CardFooter>
                </Card>

                {/* Status Distribution Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Today's Status</CardTitle>
                                <CardDescription>Appointment distribution</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isDistributionLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : donutSeries.length > 0 ? (
                            <Chart options={donutOptions} series={donutSeries} type="donut" height={250} />
                        ) : (
                            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">No appointments today</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                        <Button variant="ghost" className="w-full" asChild>
                            <Link to="/receptionist/appointments">
                                View All Appointments
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Activity & Quick Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Recent Activity
                                </CardTitle>
                                <CardDescription>Latest appointment updates</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isActivityLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : recentActivity && recentActivity.length > 0 ? (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className={`p-2 rounded-full shrink-0 ${activity.type === 'appointment_cancelled'
                                            ? 'bg-red-100 dark:bg-red-900/30'
                                            : 'bg-green-100 dark:bg-green-900/30'
                                            }`}>
                                            {activity.type === 'appointment_cancelled' ? (
                                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatRelativeTime(activity.timestamp)}
                                            </p>
                                        </div>
                                        <Badge variant={activity.type === 'appointment_cancelled' ? 'destructive' : 'default'} className="shrink-0 text-xs">
                                            {activity.type === 'appointment_cancelled' ? 'Cancelled' : 'Confirmed'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Common tasks and navigation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <Link to="/receptionist/appointments">
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Manage Appointments</p>
                                            <p className="text-xs text-muted-foreground">View, create, or update appointments</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>

                            <Link to="/receptionist/cancel-requests">
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform">
                                            <CalendarX className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Cancellation Requests</p>
                                            <p className="text-xs text-muted-foreground">Process patient cancellation requests</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
