import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AlertTriangle, Calendar, TrendingUp, Package } from 'lucide-react'
import Chart from 'react-apexcharts'
import { useTheme } from '@/components/theme-provider'
import type { ApexOptions } from 'apexcharts'
import type { FC } from 'react'
import supabase from '@/utils/supabase'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const StatCard: FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; desc?: string; tooltipContent?: React.ReactNode }> = ({ title, value, icon, desc, tooltipContent }) => {
    const cardContent = (
        <Card className="h-full transition-all hover:shadow-md">
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

    if (tooltipContent) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="cursor-help h-full">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4">
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return cardContent;
}

function InventoryDashboard() {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);
    
    // Dashboard State
    const [lowStockCount, setLowStockCount] = useState(0);
    const [inventoryValue, setInventoryValue] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [stockAlerts, setStockAlerts] = useState<any[]>([]);
    const [expiringSoonCount, setExpiringSoonCount] = useState(0);
    const [expiringItems, setExpiringItems] = useState<string[]>([]);
    const [usageSeries, setUsageSeries] = useState<{ name: string; data: number[] }[]>([]);
    const [categoryTotals, setCategoryTotals] = useState<{ Consumables: number; Medicines: number; Equipment: number }>({ Consumables: 0, Medicines: 0, Equipment: 0 });
    const [monthLabels, setMonthLabels] = useState<string[]>([]);

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

    useEffect(() => {
        fetchDashboardData();
        fetchUsageData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Pending Orders Count
            const { count: pendingCount, error: pendingError } = await supabase
                .schema('inventory')
                .from('stock_in')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pending');
            
            if (!pendingError) {
                setPendingOrdersCount(pendingCount || 0);
            }

            // 2. Fetch Inventory Data (Consumables, Medicine, Equipment)
            // We need to fetch quantity and unit_cost to calculate value and check low stock
            const [consumables, medicines, equipment] = await Promise.all([
                supabase.schema('inventory').from('consumables_tbl').select('consumable_name, quantity, unit_cost, expiry_date'),
                supabase.schema('inventory').from('medicine_tbl').select('medicine_name, quantity, unit_cost, expiry_date'),
                supabase.schema('inventory').from('equipment_tbl').select('equipment_name, quantity, unit_cost, expiry_date')
            ]);

            let totalValue = 0;
            let lowStock = 0;
            let alerts: any[] = [];
            let expiringCount = 0;
            let expiringList: string[] = [];

            const processItems = (items: any[], nameKey: string, type: string) => {
                if (!items) return;
                items.forEach(item => {
                    const qty = item.quantity || 0;
                    const cost = item.unit_cost || 0;
                    
                    // Calculate Value
                    totalValue += qty * cost;

                    // Check Low Stock (Threshold: 10)
                    if (qty === 0) {
                        lowStock++;
                        alerts.push({
                            name: item[nameKey],
                            category: type.toLowerCase(),
                            status: 'Critical',
                            quantity: qty
                        });
                    } else if (qty < 10) {
                        lowStock++;
                        alerts.push({
                            name: item[nameKey],
                            category: type.toLowerCase(),
                            status: 'Low Stock',
                            quantity: qty
                        });
                    }

                    // Check Expiration (7 days)
                    if (item.expiry_date) {
                        const expDate = new Date(item.expiry_date);
                        const today = new Date();
                        const diffTime = expDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 7) {
                            expiringCount++;
                            const status = diffDays < 0 ? 'Expired' : `Expires in ${diffDays} days`;
                            expiringList.push(`${item[nameKey]} (${status})`);
                        }
                    }
                });
            };

            processItems(consumables.data || [], 'consumable_name', 'Consumables');
            processItems(medicines.data || [], 'medicine_name', 'Medicines');
            processItems(equipment.data || [], 'equipment_name', 'Equipment');

            setInventoryValue(totalValue);
            setLowStockCount(lowStock);
            setStockAlerts(alerts);
            setExpiringSoonCount(expiringCount);
            setExpiringItems(expiringList);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const getLastNMonths = (n = 6) => {
        const months: string[] = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toLocaleString(undefined, { month: 'short' }));
        }
        return months;
    }

    async function fetchUsageData() {
        try {
            const n = 6;
            const labels = getLastNMonths(n);
            setMonthLabels(labels);

            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - (n - 1));
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .schema('inventory')
                .from('stock_out')
                .select('item_name, quantity, created_at, category')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            // build map of item_name -> monthly sums
            const map: Record<string, number[]> = {};
            // Reset category totals each run
            const totals = { Consumables: 0, Medicines: 0, Equipment: 0 };
            (data || []).forEach((r: any) => {
                const itemName = r.item_name || 'Unknown';
                const qty = parseInt(r.quantity) || 0;
                const d = new Date(r.created_at);
                const monthIdx = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
                if (monthIdx < 0 || monthIdx >= n) return; // out of range
                if (!map[itemName]) map[itemName] = Array(n).fill(0);
                map[itemName][monthIdx] += qty;
                // sum by category
                const cat = (r.category || '').toLowerCase();
                if (cat.includes('consum') || cat === 'consumables') totals.Consumables += qty;
                else if (cat.includes('medi') || cat === 'medicines' || cat === 'medicine') totals.Medicines += qty;
                else if (cat.includes('equip') || cat === 'equipment') totals.Equipment += qty;
            });

            // sort by total usage descending and pick top 3
            const items = Object.keys(map).map(name => ({ name, total: map[name].reduce((a, b) => a + b, 0), data: map[name] }));
            items.sort((a, b) => b.total - a.total);
            const top = items.slice(0, 3);

            // fill with zero-series if less than 3
            const zeroArr = Array(n).fill(0);
            while (top.length < 3) {
                top.push({ name: `Item ${top.length + 1}`, total: 0, data: zeroArr.slice() });
            }

            setUsageSeries(top.map(t => ({ name: t.name, data: t.data })));
            setCategoryTotals(totals);
        } catch (err) {
            console.error('Failed to fetch usage data', err);
            setUsageSeries([]);
        }
    }

    const chartSeries = usageSeries.length > 0 ? usageSeries : [
        { name: 'No Data', data: Array(6).fill(0) }
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
            categories: monthLabels.length > 0 ? monthLabels : ['Mon-5', 'Mon-4', 'Mon-3', 'Mon-2', 'Mon-1', 'Current'],
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
                            <StatCard title="Low Stock Items" value={<span>{lowStockCount}</span>} icon={<AlertTriangle className="w-8 h-8 text-amber-500" />} desc="Total low stock items" />
                            <StatCard 
                                title="Expiring Soon" 
                                value={<span>{expiringSoonCount}</span>} 
                                icon={<Calendar className="w-8 h-8 text-sky-500" />} 
                                desc="Next 7 days" 
                                tooltipContent={
                                    expiringItems.length > 0 ? (
                                        <ul className="list-disc pl-4 space-y-1">
                                            {expiringItems.map((item, i) => (
                                                <li key={i} className="text-xs">{item}</li>
                                            ))}
                                        </ul>
                                    ) : "No items expiring soon"
                                }
                            />
                            <StatCard 
                                title="Inventory Value" 
                                value={<span>₱{inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>} 
                                icon={<TrendingUp className="w-8 h-8 text-emerald-400" />} 
                                desc="Total inventory value" 
                            />
                            <StatCard title="Pending Orders" value={<span>{pendingOrdersCount}</span>} icon={<Package className="w-8 h-8 text-gray-600" />} desc="Orders waiting for delivery" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" /> Monthly Usage Trend
                                            </CardTitle>
                                            {/* Removed 'Last 6 months' per request */}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <Chart options={{ ...chartOptions, xaxis: { ...chartOptions.xaxis, categories: monthLabels.length > 0 ? monthLabels : chartOptions.xaxis?.categories } }} series={chartSeries} type="bar" height={350} />

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary">{categoryTotals.Consumables.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">Total Consumables</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary/80">{categoryTotals.Medicines.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">Total Medicines</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-destructive/80">{categoryTotals.Equipment.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">Total Equipment</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <div className="p-1.5 bg-red-100 rounded-md"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                                                Stock Alerts
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</div>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Stock</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    <div className="h-56 overflow-auto pr-2">
                                        <div className="space-y-3">
                                            {stockAlerts.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No stock alerts</p>
                                            ) : (
                                                stockAlerts.map((item, index) => (
                                                    <div key={`${item.name}-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
                                                        <span className={cn("mt-1.5 w-2.5 h-2.5 rounded-full shrink-0", item.status === 'Critical' ? "bg-red-500" : "bg-amber-500")} />
                                                        <div>
                                                            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                                                {item.name} <span className="text-slate-500 font-normal">({item.category})</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                {item.status} - {item.quantity} units
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
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