import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AlertTriangle, Calendar, TrendingUp, Package } from 'lucide-react'
import Chart from 'react-apexcharts'
import { useTheme } from '@/components/theme-provider'
import type { ApexOptions } from 'apexcharts'
import type { FC } from 'react'

const StatCard: FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; desc?: string }> = ({ title, value, icon, desc }) => {
    return (
        <Card>
            <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold text-primary">{value}</p>
                    </div>
                    <div className="text-muted-foreground text-2xl">{icon}</div>
                </div>
                {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
            </CardContent>
        </Card>
    );
}

function InventoryDashboard() {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const updateTheme = () => {
            if (theme === 'dark') setIsDark(true);
            else if (theme === 'light') setIsDark(false);
            else setIsDark(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        };
        updateTheme();
        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => updateTheme();
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    const chartSeries = [
        { name: 'Gloves', data: [45, 52, 48, 61, 55, 68] },
        { name: 'Masks', data: [28, 32, 30, 38, 35, 42] },
        { name: 'Anesthetics', data: [15, 18, 16, 22, 20, 25] },
    ];

    const chartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            stacked: true,
            toolbar: { show: true },
            zoom: { enabled: true },
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0,
                    },
                },
            },
        ],
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 10,
                dataLabels: {
                    total: {
                        enabled: true,
                        style: {
                            fontSize: '13px',
                            fontWeight: 900,
                            color: isDark ? '#fff' : '#000',
                        },
                    },
                },
            },
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            labels: { style: { colors: isDark ? '#fff' : '#000' } },
        },
        yaxis: {
            labels: { style: { colors: isDark ? '#fff' : '#000' } },
        },
        legend: {
            position: 'top',
            offsetY: 0,
            labels: { colors: isDark ? '#fff' : '#000' },
        },
        fill: { opacity: 1 },
        colors: ['#3b82f6', '#60a5fa', '#ef4444'],
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: function (val: number) {
                    return val + ' records';
                },
            },
        },
        grid: { borderColor: isDark ? '#374151' : '#e5e7eb' },
    };
    return (
        <div className="px-6 md:px-12">
            <div className="w-full max-w-screen-2xl mx-auto space-y-6">
                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                                    <Package className="w-7 h-7 text-cyan-300" />
                                    Inventory Dashboard
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Welcome back! Here's your clinic's inventory overview.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="space-y-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Low Stock Items" value={<span>12</span>} icon={<AlertTriangle className="w-8 h-8 text-amber-500" />} desc="Total low stock items" />
                            <StatCard title="Expiring Soon" value={<span>5</span>} icon={<Calendar className="w-8 h-8 text-sky-500" />} desc="Next 30 days" />
                            <StatCard title="Inventory Value" value={<span>₱23,000</span>} icon={<TrendingUp className="w-8 h-8 text-emerald-400" />} desc="Total inventory value from last month" />
                            <StatCard title="Pending Orders" value={<span>5</span>} icon={<Package className="w-8 h-8 text-gray-600" />} desc="2 arriving today" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" /> Monthly Usage Trend
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">Last 6 months</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary">
                                                    {chartSeries[0].data.reduce((a, b) => a + b, 0)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Gloves</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary/80">
                                                    {chartSeries[1].data.reduce((a, b) => a + b, 0)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Masks</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-destructive/80">
                                                    {chartSeries[2].data.reduce((a, b) => a + b, 0)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Anesthetics</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Stock Alerts</CardTitle>
                                            <p className="text-sm text-muted-foreground">Critical items that need attention</p>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-destructive/10 text-destructive">Alerts</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Separator />
                                    <div className="h-56 overflow-auto">
                                        <div className="space-y-3 p-3">
                                            {[ 
                                                { name: 'Latex Gloves (Medium)', current: 45, minimum: 100 },
                                                { name: 'Surgical Mask (Box)', current: 12, minimum: 50 },
                                                { name: 'Anesthetic Cartridge', current: 6, minimum: 30 },
                                                { name: 'Sterile Gauze (Pack)', current: 20, minimum: 60 },
                                            ].map((item) => {
                                                const pct = Math.max(0, Math.round((item.current / item.minimum) * 100));
                                                const barColor = pct < 25 ? 'bg-red-500' : pct < 60 ? 'bg-amber-400' : 'bg-emerald-400';
                                                return (
                                                    <div key={item.name} className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm font-medium">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.current} / {item.minimum}</div>
                                                        </div>
                                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className={cn('h-2 rounded-full transition-all', barColor, 'w-[var(--w)]')} style={{ ['--w' as any]: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InventoryDashboard;