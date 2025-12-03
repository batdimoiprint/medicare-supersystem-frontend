import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bell, AlertTriangle, Calendar, Package, Check } from 'lucide-react'
import supabase from '@/utils/supabase'

interface Alert {
    id: string;
    title: string;
    type: 'stock' | 'expiry' | 'general';
    message: string;
    priority: 'low' | 'medium' | 'high';
    isRead: boolean;
    createdAt: Date;
    itemName?: string;
    quantity?: number;
    unit?: string;
}

type TabType = 'all' | 'unread' | 'expiry' | 'stock';

export default function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            // Fetch low stock items
            const stockAlerts: Alert[] = [];

            // Fetch from consumables
            const { data: consumables } = await supabase
                .schema('inventory')
                .from('consumables_tbl')
                .select('*')
                .lt('quantity', 10);

            consumables?.forEach(item => {
                stockAlerts.push({
                    id: `consumable-stock-${item.consumables_id}`,
                    title: `${item.consumable_name} Low Stock`,
                    type: 'stock',
                    message: `Low Stock - ${item.quantity} units`,
                    priority: item.quantity === 0 ? 'high' : item.quantity < 5 ? 'high' : 'medium',
                    isRead: false,
                    createdAt: new Date(item.updated_at || item.created_at || Date.now()),
                    itemName: item.consumable_name,
                    quantity: item.quantity,
                    unit: 'units'
                });
            });

            // Fetch from medicines
            const { data: medicines } = await supabase
                .schema('inventory')
                .from('medicine_tbl')
                .select('*')
                .lt('quantity', 10);

            medicines?.forEach(item => {
                stockAlerts.push({
                    id: `medicine-stock-${item.medicine_id}`,
                    title: `${item.medicine_name} Low Stock`,
                    type: 'stock',
                    message: `Low Stock - ${item.quantity} units`,
                    priority: item.quantity === 0 ? 'high' : item.quantity < 5 ? 'high' : 'medium',
                    isRead: false,
                    createdAt: new Date(item.updated_at || item.created_at || Date.now()),
                    itemName: item.medicine_name,
                    quantity: item.quantity,
                    unit: 'units'
                });
            });

            // Fetch from equipment
            const { data: equipment } = await supabase
                .schema('inventory')
                .from('equipment_tbl')
                .select('*')
                .lt('quantity', 10);

            equipment?.forEach(item => {
                stockAlerts.push({
                    id: `equipment-stock-${item.equipment_id}`,
                    title: `${item.equipment_name} Low Stock`,
                    type: 'stock',
                    message: `Low Stock - ${item.quantity} units`,
                    priority: item.quantity === 0 ? 'high' : item.quantity < 5 ? 'high' : 'medium',
                    isRead: false,
                    createdAt: new Date(item.updated_at || item.created_at || Date.now()),
                    itemName: item.equipment_name,
                    quantity: item.quantity,
                    unit: 'units'
                });
            });

            // Fetch expiring items (within 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expiryAlerts: Alert[] = [];

            // Check stock_in for expiring batches
            const { data: expiringBatches } = await supabase
                .schema('inventory')
                .from('stock_in')
                .select('*')
                .not('expiry_date', 'is', null)
                .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

            expiringBatches?.forEach(batch => {
                const expiryDate = new Date(batch.expiry_date);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                expiryAlerts.push({
                    id: `expiry-${batch.id}`,
                    title: `${batch.item_name} Expiring Soon`,
                    type: 'expiry',
                    message: daysUntilExpiry <= 0 
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago` 
                        : `Expires in ${daysUntilExpiry} days`,
                    priority: daysUntilExpiry <= 0 ? 'high' : daysUntilExpiry <= 7 ? 'high' : 'medium',
                    isRead: false,
                    createdAt: new Date(batch.created_at || Date.now()),
                    itemName: batch.item_name,
                    quantity: batch.quantity,
                    unit: batch.units || 'units'
                });
            });

            // Combine and sort alerts by date (newest first)
            const allAlerts = [...stockAlerts, ...expiryAlerts].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            setAlerts(allAlerts);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    };

    const markAsRead = (id: string) => {
        setAlerts(prev => prev.map(alert => 
            alert.id === id ? { ...alert, isRead: true } : alert
        ));
    };

    // Filter alerts based on active tab
    const filteredAlerts = alerts.filter(alert => {
        switch (activeTab) {
            case 'unread':
                return !alert.isRead;
            case 'expiry':
                return alert.type === 'expiry';
            case 'stock':
                return alert.type === 'stock';
            default:
                return true;
        }
    });

    // Group alerts by date
    const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const alertDate = new Date(alert.createdAt);
        alertDate.setHours(0, 0, 0, 0);

        let groupKey: string;
        if (alertDate.getTime() === today.getTime()) {
            groupKey = 'Today';
        } else if (alertDate.getTime() === yesterday.getTime()) {
            groupKey = 'Yesterday';
        } else {
            groupKey = alertDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(alert);
        return groups;
    }, {} as Record<string, Alert[]>);

    // Count alerts by type
    const totalAlerts = alerts.length;
    const unreadCount = alerts.filter(a => !a.isRead).length;
    const expiryCount = alerts.filter(a => a.type === 'expiry').length;
    const stockCount = alerts.filter(a => a.type === 'stock').length;

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'all', label: 'All Alerts', count: totalAlerts },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'expiry', label: 'Expiry', count: expiryCount },
        { key: 'stock', label: 'Stock', count: stockCount },
    ];

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'medium':
                return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            default:
                return 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'expiry':
                return <Calendar className="w-5 h-5" />;
            case 'stock':
                return <Package className="w-5 h-5" />;
            default:
                return <Bell className="w-5 h-5" />;
        }
    };

    return (
        <div className="px-6 md:px-12">
            <div className="w-full max-w-screen-2xl mx-auto space-y-6">
                {/* Header Card */}
                <Card className="w-full py-3 -mt-2">
                    <CardHeader className="px-6 py-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl mb-0 flex items-center gap-3">
                                    <Bell className="w-8 h-8 text-cyan-500" />
                                    Alerts
                                </CardTitle>
                                <p className="text-muted-foreground">Monitor stock levels and expiry dates</p>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                                className="border-slate-300 dark:border-slate-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Mark All as Read
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-teal-500 dark:border-teal-600">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Alerts</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAlerts}</p>
                            </div>
                            <Bell className="w-6 h-6 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-2",
                    unreadCount > 0 
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" 
                        : "border-teal-500 dark:border-teal-600"
                )}>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Unread</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-teal-500 dark:border-teal-600">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Expiry Alerts</p>
                                <p className={cn(
                                    "text-3xl font-bold",
                                    expiryCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                                )}>{expiryCount}</p>
                            </div>
                            <Calendar className="w-6 h-6 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-teal-500 dark:border-teal-600">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Stock Alerts</p>
                                <p className={cn(
                                    "text-3xl font-bold",
                                    stockCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                                )}>{stockCount}</p>
                            </div>
                            <Package className="w-6 h-6 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 gap-0 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "py-3 px-4 text-sm font-medium rounded-md transition-all",
                            activeTab === tab.key
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                            <Bell className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No alerts</p>
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {Object.entries(groupedAlerts).map(([dateGroup, groupAlerts]) => (
                                <div key={dateGroup}>
                                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
                                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {dateGroup} ({groupAlerts.length})
                                        </h3>
                                    </div>
                                    {groupAlerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            onClick={() => markAsRead(alert.id)}
                                            className={cn(
                                                "flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors",
                                                alert.isRead 
                                                    ? "bg-white dark:bg-slate-900/50 opacity-60" 
                                                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                {getTypeIcon(alert.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                                                    {alert.title}
                                                </h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                    {alert.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs text-slate-500 dark:text-slate-500">
                                                        {alert.createdAt.toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })} at {alert.createdAt.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                        getPriorityStyles(alert.priority)
                                                    )}>
                                                        {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)} Priority
                                                    </span>
                                                </div>
                                            </div>
                                            {!alert.isRead && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-teal-500"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
