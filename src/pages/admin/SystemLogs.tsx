import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CreditCard,
  Package,
  AlertTriangle,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Bell,
  FileText,
  DollarSign,
  CalendarCheck,
  CalendarX,
  Pill,
  Users,
  BadgeCheck,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Subsystem types
type SubsystemType = 'all' | 'frontdesk' | 'inventory' | 'patient' | 'dentist';

// Log entry interface
interface LogEntry {
  id: number;
  subsystem: 'frontdesk' | 'inventory' | 'patient' | 'dentist';
  action: string;
  description: string;
  user?: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: any;
}

// Dummy log data
const systemLogs: LogEntry[] = [
  // Front Desk Logs
  { id: 1, subsystem: 'frontdesk', action: 'Appointment Approved', description: 'Appointment #APT-2025-1234 for Maria Santos has been approved', user: 'Reception Staff', timestamp: '2 mins ago', type: 'success', icon: CalendarCheck },
  { id: 2, subsystem: 'frontdesk', action: 'Follow-up Scheduled', description: 'Follow-up appointment created for Juan Dela Cruz on Dec 10, 2025', user: 'Reception Staff', timestamp: '5 mins ago', type: 'info', icon: Calendar },
  { id: 3, subsystem: 'frontdesk', action: 'Payment Received', description: 'Payment of ₱2,500.00 received for invoice #INV-2025-0892', user: 'Cashier', timestamp: '12 mins ago', type: 'success', icon: CreditCard },
  { id: 4, subsystem: 'frontdesk', action: 'Refund Approved', description: 'Refund of ₱500.00 approved for patient Ana Reyes', user: 'Admin', timestamp: '18 mins ago', type: 'warning', icon: RotateCcw },
  { id: 5, subsystem: 'frontdesk', action: 'Appointment Cancelled', description: 'Appointment #APT-2025-1230 cancelled by patient request', user: 'Reception Staff', timestamp: '25 mins ago', type: 'error', icon: CalendarX },
  
  // Inventory Logs
  { id: 6, subsystem: 'inventory', action: 'Low Stock Alert', description: 'Lidocaine Injection is running low (15 vials remaining, min: 50)', timestamp: '8 mins ago', type: 'warning', icon: AlertTriangle },
  { id: 7, subsystem: 'inventory', action: 'Expiration Warning', description: 'Composite Resin Batch #CR-2024-05 expires in 30 days', timestamp: '15 mins ago', type: 'warning', icon: Clock },
  { id: 8, subsystem: 'inventory', action: 'Stock Restocked', description: 'Dental Floss restocked: +100 boxes added to inventory', user: 'Inventory Staff', timestamp: '32 mins ago', type: 'success', icon: Package },
  { id: 9, subsystem: 'inventory', action: 'Critical Stock', description: 'Composite Resin is critically low (3 tubes remaining)', timestamp: '45 mins ago', type: 'error', icon: AlertTriangle },
  { id: 10, subsystem: 'inventory', action: 'Item Expired', description: 'Anesthetic Cartridges Batch #AC-2024-02 has expired and removed', timestamp: '1 hour ago', type: 'error', icon: Pill },
  
  // Patient Records Logs
  { id: 11, subsystem: 'patient', action: 'Reservation Fee Paid', description: 'Sofia Martinez paid ₱500.00 reservation fee for appointment on Dec 8', timestamp: '3 mins ago', type: 'success', icon: DollarSign },
  { id: 12, subsystem: 'patient', action: 'Appointment Booked', description: 'New appointment booked by Carlos Mendoza for Teeth Whitening', timestamp: '10 mins ago', type: 'info', icon: CalendarCheck },
  { id: 13, subsystem: 'patient', action: 'Reschedule Request', description: 'Pedro Garcia requested to reschedule appointment from Dec 6 to Dec 12', timestamp: '22 mins ago', type: 'warning', icon: RefreshCw },
  { id: 14, subsystem: 'patient', action: 'Refund Request', description: 'Lisa Wong requested refund for cancelled appointment #APT-2025-1225', timestamp: '35 mins ago', type: 'warning', icon: RotateCcw },
  { id: 15, subsystem: 'patient', action: 'Patient Registered', description: 'New patient Mark Rivera registered in the system', user: 'System', timestamp: '50 mins ago', type: 'info', icon: Users },
  
  // Dentist Logs
  { id: 16, subsystem: 'dentist', action: 'Treatment Completed', description: 'Dr. Smith completed Root Canal treatment for Emma Cruz', timestamp: '7 mins ago', type: 'success', icon: BadgeCheck },
  { id: 17, subsystem: 'dentist', action: 'Treatment Completed', description: 'Dr. Johnson completed Dental Cleaning for David Tan', timestamp: '28 mins ago', type: 'success', icon: BadgeCheck },
  { id: 18, subsystem: 'dentist', action: 'Treatment Notes Added', description: 'Dr. Lee added treatment notes for patient Grace Lim', timestamp: '40 mins ago', type: 'info', icon: FileText },
  { id: 19, subsystem: 'dentist', action: 'Prescription Issued', description: 'Dr. Smith issued prescription for Michael Sy', timestamp: '55 mins ago', type: 'info', icon: FileText },
  { id: 20, subsystem: 'dentist', action: 'Treatment Completed', description: 'Dr. Johnson completed Orthodontic Adjustment for Nicole Reyes', timestamp: '1 hour ago', type: 'success', icon: BadgeCheck },
];

// Stats by subsystem
const subsystemStats = [
  { id: 'frontdesk', label: 'Front Desk', count: 28, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'inventory', label: 'Inventory', count: 15, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'patient', label: 'Patient Records', count: 42, icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'dentist', label: 'Dentist', count: 19, icon: Stethoscope, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export default function SystemLogs() {
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getSubsystemColor = (subsystem: string) => {
    switch (subsystem) {
      case 'frontdesk': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'inventory': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'patient': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'dentist': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSubsystemLabel = (subsystem: string) => {
    switch (subsystem) {
      case 'frontdesk': return 'Front Desk';
      case 'inventory': return 'Inventory';
      case 'patient': return 'Patient Records';
      case 'dentist': return 'Dentist';
      default: return subsystem;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-emerald-500';
      case 'warning': return 'border-l-amber-500';
      case 'error': return 'border-l-destructive';
      default: return 'border-l-blue-500';
    }
  };

  const filteredLogs = systemLogs.filter(log => {
    const matchesSubsystem = selectedSubsystem === 'all' || log.subsystem === selectedSubsystem;
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSubsystem && matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary" />
                System Logs
              </CardTitle>
              <p className="text-muted-foreground">
                Real-time activity logs and updates from all subsystems
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Updates
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subsystem Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subsystemStats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedSubsystem === stat.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedSubsystem(selectedSubsystem === stat.id ? 'all' : stat.id as SubsystemType)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">logs today</p>
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

      {/* Logs Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Feed
              </CardTitle>
              <CardDescription>
                {selectedSubsystem === 'all' 
                  ? 'Showing all system activities' 
                  : `Filtered by ${getSubsystemLabel(selectedSubsystem)}`
                }
              </CardDescription>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No logs found matching your criteria</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all border-l-4",
                      getTypeBg(log.type)
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn("p-2 rounded-lg shrink-0", getSubsystemColor(log.subsystem).split(' ')[0])}>
                        <log.icon className={cn("w-5 h-5", getSubsystemColor(log.subsystem).split(' ')[1])} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{log.action}</p>
                              <Badge variant="outline" className={cn("text-xs", getSubsystemColor(log.subsystem))}>
                                {getSubsystemLabel(log.subsystem)}
                              </Badge>
                              {getTypeIcon(log.type)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.timestamp}
                              </span>
                              {log.user && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {log.user}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {systemLogs.length} logs
            </p>
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">Info</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Error</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
