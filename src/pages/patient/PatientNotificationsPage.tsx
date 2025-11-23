import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Bell, 
    Calendar, 
    CreditCard, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    X,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types based on Notification_tbl [cite: 227-229] ---
interface Notification {
    notif_id: number; // [cite: 228]
    type: 'Appointment' | 'Billing' | 'System' | 'Reminder'; // Linked to Notification_type_tbl [cite: 230]
    title: string;
    message: string; // [cite: 229]
    time_received: string; // [cite: 229]
    is_read: boolean; // [cite: 229]
    reference_id?: string; // [cite: 229] (e.g., Appointment ID or Bill ID)
}

// --- Mock Data simulating Module 6 [cite: 82-86] ---
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        notif_id: 1,
        type: 'Appointment',
        title: 'Appointment Confirmed',
        message: 'Your request for Dental Cleaning on Nov 24 has been approved.', // [cite: 84]
        time_received: '2 hours ago',
        is_read: false,
        reference_id: 'APT-1001'
    },
    {
        notif_id: 2,
        type: 'Billing',
        title: 'Payment Received',
        message: 'We received your payment of ₱5,000 for Invoice #INV-2025-002 via PayMongo.', // [cite: 85]
        time_received: '1 day ago',
        is_read: false,
        reference_id: 'INV-2025-002'
    },
    {
        notif_id: 3,
        type: 'Reminder',
        title: 'Upcoming Visit Reminder',
        message: 'Reminder: You have a Dental Cleaning appointment tomorrow at 9:00 AM.', // [cite: 86]
        time_received: '1 day ago',
        is_read: true,
        reference_id: 'APT-1001'
    },
    {
        notif_id: 4,
        type: 'Appointment',
        title: 'Reschedule Approved',
        message: 'Your request to reschedule Dr. Santos has been processed.', // [cite: 84]
        time_received: '3 days ago',
        is_read: true,
        reference_id: 'APT-0998'
    },
    {
        notif_id: 5,
        type: 'System',
        title: 'Profile Updated',
        message: 'Your emergency contact details have been successfully updated.',
        time_received: '1 week ago',
        is_read: true
    }
];

export default function PatientNotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    // Helper to get Icon based on type
    const getIcon = (type: string) => {
        switch (type) {
            case 'Appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'Billing': return <CreditCard className="w-5 h-5 text-green-500" />;
            case 'Reminder': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'System': return <AlertCircle className="w-5 h-5 text-gray-500" />;
            default: return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    // Helper to mark as read
    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => 
            n.notif_id === id ? { ...n, is_read: true } : n
        ));
    };

    // Helper to mark all read
    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    };

    // Filter unread count
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Button 
                        variant="ghost" 
                        className="pl-0 hover:bg-transparent hover:text-primary mb-1"
                        onClick={() => navigate('/patient')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full px-2">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Updates on your appointments, payments, and account status.
                    </p>
                </div>
                <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
                    <Check className="w-4 h-4 mr-2" /> Mark all as read
                </Button>
            </div>

            {/* Notification List */}
            <Card className="border-none shadow-md">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="unread">Unread</TabsTrigger>
                            <TabsTrigger value="appointment">Appointments</TabsTrigger>
                            <TabsTrigger value="billing">Billing</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div 
                                        key={notif.notif_id} 
                                        className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                                        onClick={() => markAsRead(notif.notif_id)}
                                    >
                                        {/* Icon Column */}
                                        <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-white shadow-sm ring-1 ring-inset ring-gray-200' : 'bg-muted'}`}>
                                            {getIcon(notif.type)}
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {notif.time_received}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground pr-4">
                                                {notif.message}
                                            </p>
                                            
                                            {/* Context Badge (Simulating Reference ID link) */}
                                            {notif.reference_id && (
                                                <div className="pt-2">
                                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-white">
                                                        Ref: {notif.reference_id}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Unread Indicator Dot */}
                                        {!notif.is_read && (
                                            <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No notifications to display.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}