import { useState, useEffect, useCallback } from 'react';
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
  RotateCcw,
  Loader2,
  Trash2
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
import supabase from "@/utils/supabase";

// Subsystem types
type SubsystemType = 'all' | 'frontdesk' | 'inventory' | 'patient' | 'dentist' | 'admin' | 'cashier';

// Log entry interface matching Supabase schema
interface LogEntry {
  id: string;
  subsystem: 'frontdesk' | 'inventory' | 'patient' | 'dentist' | 'admin' | 'cashier';
  action: string;
  description: string;
  user_name?: string;
  created_at: string;
  log_type: 'info' | 'success' | 'warning' | 'error';
  icon_name: string;
  metadata?: Record<string, unknown>;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Calendar,
  CalendarCheck,
  CalendarX,
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
  Pill,
  Users,
  BadgeCheck,
  RotateCcw,
  RefreshCw
};

// Get icon component from name
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Activity;
};

// Subsystem config
const SUBSYSTEM_CONFIG = {
  frontdesk: { label: 'Front Desk', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  inventory: { label: 'Inventory', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  patient: { label: 'Patient Records', icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  dentist: { label: 'Dentist', icon: Stethoscope, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  admin: { label: 'Admin', icon: Users, color: 'text-red-500', bg: 'bg-red-500/10' },
  cashier: { label: 'Cashier', icon: CreditCard, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

export default function SystemLogs() {
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({
    frontdesk: 0,
    inventory: 0,
    patient: 0,
    dentist: 0,
    admin: 0,
    cashier: 0
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // Load logs from Supabase
  const loadLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
      setTotalLogs(data?.length || 0);

      // Calculate stats by subsystem
      const newStats: Record<string, number> = {
        frontdesk: 0,
        inventory: 0,
        patient: 0,
        dentist: 0,
        admin: 0,
        cashier: 0
      };
      
      data?.forEach(log => {
        if (newStats[log.subsystem] !== undefined) {
          newStats[log.subsystem]++;
        }
      });
      
      setStats(newStats);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    loadLogs();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('system_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_logs'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as LogEntry;
            setLogs(prev => [newLog, ...prev]);
            setTotalLogs(prev => prev + 1);
            setStats(prev => ({
              ...prev,
              [newLog.subsystem]: (prev[newLog.subsystem] || 0) + 1
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedLog = payload.old as LogEntry;
            setLogs(prev => prev.filter(log => log.id !== deletedLog.id));
            setTotalLogs(prev => prev - 1);
            setStats(prev => ({
              ...prev,
              [deletedLog.subsystem]: Math.max(0, (prev[deletedLog.subsystem] || 0) - 1)
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLogs();
    setIsRefreshing(false);
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
      setLogs([]);
      setTotalLogs(0);
      setStats({
        frontdesk: 0,
        inventory: 0,
        patient: 0,
        dentist: 0,
        admin: 0,
        cashier: 0
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getSubsystemColor = (subsystem: string) => {
    const config = SUBSYSTEM_CONFIG[subsystem as keyof typeof SUBSYSTEM_CONFIG];
    if (config) {
      return `${config.bg} ${config.color} border-${config.color.replace('text-', '')}/20`;
    }
    return 'bg-muted text-muted-foreground';
  };

  const getSubsystemLabel = (subsystem: string) => {
    return SUBSYSTEM_CONFIG[subsystem as keyof typeof SUBSYSTEM_CONFIG]?.label || subsystem;
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

  const filteredLogs = logs.filter(log => {
    const matchesSubsystem = selectedSubsystem === 'all' || log.subsystem === selectedSubsystem;
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || log.log_type === filterType;
    return matchesSubsystem && matchesSearch && matchesType;
  });

  // Create subsystem stats array for rendering
  const subsystemStatsArray = Object.entries(SUBSYSTEM_CONFIG)
    .filter(([key]) => ['frontdesk', 'inventory', 'patient', 'dentist'].includes(key))
    .map(([id, config]) => ({
      id,
      label: config.label,
      count: stats[id] || 0,
      icon: config.icon,
      color: config.color,
      bg: config.bg
    }));

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
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                isLive ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
              )}>
                <div className={cn("w-2 h-2 rounded-full", isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                {isLive ? "Live Updates" : "Paused"}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? "Pause" : "Resume"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearLogs}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subsystem Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subsystemStatsArray.map((stat, index) => (
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
                    <p className="text-xs text-muted-foreground mt-1">logs</p>
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No logs found matching your criteria</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const IconComponent = getIconComponent(log.icon_name);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.5) }}
                      className={cn(
                        "p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all border-l-4",
                        getTypeBg(log.log_type)
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn("p-2 rounded-lg shrink-0", getSubsystemColor(log.subsystem).split(' ')[0])}>
                          <IconComponent className={cn("w-5 h-5", getSubsystemColor(log.subsystem).split(' ')[1])} />
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
                                {getTypeIcon(log.log_type)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(log.created_at)}
                                </span>
                                {log.user_name && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {log.user_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {totalLogs} logs
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Refresh
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
