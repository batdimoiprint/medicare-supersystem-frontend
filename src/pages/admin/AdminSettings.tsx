import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Power,
  Wifi,
  WifiOff,
  Calendar,
  MessageSquare,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  sent_to: string[];
  sent_at: string;
  sent_by: string;
  type: "info" | "warning" | "critical" | "maintenance";
}

interface MaintenanceLog {
  id: string;
  action: string;
  start_time: string;
  end_time: string | null;
  estimated_duration: string | null;
  reason: string;
  initiated_by: string;
  status: "active" | "completed" | "scheduled";
}

// Subsystem Names
const SUBSYSTEM_NAMES = [
  "Patient Portal",
  "Dentist System",
  "Inventory Management",
  "Reception/Front Desk",
  "Billing & Payments",
  "Admin Dashboard",
];

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

export default function AdminSettings() {
  // Data states
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  
  // Modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  
  // Form states
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<string>("info");
  const [selectedSubsystems, setSelectedSubsystems] = useState<string[]>([]);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Current admin user (you can get this from auth context)
  const currentAdmin = "Admin User";

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadMaintenanceLogs(),
        loadMaintenanceMode(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from("system_notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    setNotifications(data || []);
  };

  const loadMaintenanceLogs = async () => {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .order("start_time", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading maintenance logs:", error);
      return;
    }

    setMaintenanceLogs(data || []);
  };

  const loadMaintenanceMode = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "maintenance_mode")
      .single();

    if (error) {
      console.error("Error loading maintenance mode:", error);
      return;
    }

    if (data?.setting_value) {
      setMaintenanceMode(data.setting_value.enabled || false);
    }
  };

  const handleToggleMaintenanceMode = () => {
    if (!maintenanceMode) {
      setShowMaintenanceModal(true);
    } else {
      disableMaintenanceMode();
    }
  };

  const disableMaintenanceMode = async () => {
    setTogglingMaintenance(true);
    try {
      // Update maintenance mode setting
      const { error: settingsError } = await supabase
        .from("system_settings")
        .update({
          setting_value: { enabled: false, reason: null, started_at: null },
          updated_at: new Date().toISOString(),
          updated_by: currentAdmin,
        })
        .eq("setting_key", "maintenance_mode");

      if (settingsError) throw settingsError;

      // Update active maintenance log to completed
      const { error: logError } = await supabase
        .from("maintenance_logs")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
        })
        .eq("status", "active");

      if (logError) throw logError;

      setMaintenanceMode(false);
      await loadMaintenanceLogs();
    } catch (error) {
      console.error("Error disabling maintenance mode:", error);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleEnableMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const now = new Date().toISOString();

      // Update maintenance mode setting
      const { error: settingsError } = await supabase
        .from("system_settings")
        .update({
          setting_value: { enabled: true, reason: maintenanceReason, started_at: now },
          updated_at: now,
          updated_by: currentAdmin,
        })
        .eq("setting_key", "maintenance_mode");

      if (settingsError) throw settingsError;

      // Create maintenance log entry
      const { error: logError } = await supabase
        .from("maintenance_logs")
        .insert({
          action: "System Maintenance",
          reason: maintenanceReason,
          start_time: now,
          estimated_duration: scheduledTime || null,
          initiated_by: currentAdmin,
          status: "active",
        });

      if (logError) throw logError;

      // Send maintenance notification if needed
      if (maintenanceReason) {
        await supabase.from("system_notifications").insert({
          title: "Maintenance Mode Enabled",
          message: maintenanceReason,
          type: "maintenance",
          sent_to: ["All Subsystems"],
          sent_by: currentAdmin,
          sent_at: now,
        });
      }

      setMaintenanceMode(true);
      setShowMaintenanceModal(false);
      setMaintenanceReason("");
      setScheduledTime("");
      await Promise.all([loadMaintenanceLogs(), loadNotifications()]);
    } catch (error) {
      console.error("Error enabling maintenance mode:", error);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleSendNotification = async () => {
    setSendingNotification(true);
    try {
      const { error } = await supabase.from("system_notifications").insert({
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        sent_to: selectedSubsystems,
        sent_by: currentAdmin,
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowNotificationModal(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationType("info");
      setSelectedSubsystems([]);
      await loadNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("system_notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSubsystemSelection = (subsystemName: string) => {
    if (subsystemName === "All Subsystems") {
      if (selectedSubsystems.includes("All Subsystems")) {
        setSelectedSubsystems([]);
      } else {
        setSelectedSubsystems(["All Subsystems"]);
      }
    } else {
      if (selectedSubsystems.includes("All Subsystems")) {
        setSelectedSubsystems([subsystemName]);
      } else if (selectedSubsystems.includes(subsystemName)) {
        setSelectedSubsystems(selectedSubsystems.filter((s) => s !== subsystemName));
      } else {
        setSelectedSubsystems([...selectedSubsystems, subsystemName]);
      }
    }
  };

  const getNotificationTypeColor = (type: NotificationHistory["type"]) => {
    switch (type) {
      case "info":
        return "bg-blue-500/20 text-blue-400";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400";
      case "critical":
        return "bg-red-500/20 text-red-400";
      case "maintenance":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMaintenanceStatusColor = (status: MaintenanceLog["status"]) => {
    switch (status) {
      case "active":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Central control panel for managing system-wide configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              maintenanceMode
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-green-500/20 text-green-400 border-green-500/30"
            }
          >
            {maintenanceMode ? (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Maintenance Mode Active
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                System Online
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Mode Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-card border h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Power className="h-5 w-5 text-primary" />
                Maintenance Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Enable maintenance mode to temporarily disable access to all subsystems
                while performing updates, fixes, or system maintenance.
              </p>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      maintenanceMode ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                    }`}
                  />
                  <span className="text-foreground font-medium">
                    {maintenanceMode ? "Maintenance Active" : "System Operational"}
                  </span>
                </div>
                <Button
                  onClick={handleToggleMaintenanceMode}
                  disabled={togglingMaintenance}
                  className={
                    maintenanceMode
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }
                >
                  {togglingMaintenance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : maintenanceMode ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
              {maintenanceMode && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    All subsystems are currently in maintenance mode. Users cannot access
                    the system.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Notifications Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-card border h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                System Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Send system-wide notifications to inform users across all subsystems
                about important updates, maintenance schedules, or critical alerts.
              </p>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium">
                    Broadcast to All Subsystems
                  </span>
                </div>
                <Button
                  onClick={() => setShowNotificationModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg border text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {notifications.length}
                  </p>
                  <p className="text-muted-foreground text-xs">Notifications Sent</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border text-center">
                  <p className="text-2xl font-bold text-foreground">6</p>
                  <p className="text-muted-foreground text-xs">Active Subsystems</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification History */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-card border">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Notification History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications sent yet</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={listItemVariants}
                      className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getNotificationTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          <span className="text-foreground font-medium text-sm">
                            {notification.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>To: {notification.sent_to.join(", ")}</span>
                        <span>{formatDateTime(notification.sent_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Maintenance Logs */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-card border">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Maintenance Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : maintenanceLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No maintenance logs yet</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {maintenanceLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={listItemVariants}
                      className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-foreground font-medium text-sm">
                          {log.action}
                        </span>
                        <Badge className={getMaintenanceStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mb-2">{log.reason}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>By: {log.initiated_by}</span>
                        <span>
                          {formatDateTime(log.start_time)} {log.end_time ? `- ${formatDateTime(log.end_time)}` : ""}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg border w-full max-w-lg overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-[#00a8a8] p-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send System Notification
              </h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Notification Type
                </label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger className="bg-muted/50 border text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Title</label>
                <Input
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="bg-muted/50 border text-foreground"
                />
              </div>

              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Message</label>
                <Textarea
                  placeholder="Enter notification message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="bg-muted/50 border text-foreground min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Send To (Select Subsystems)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleSubsystemSelection("All Subsystems")}
                    className={`p-2 rounded-lg border text-sm text-left transition-colors ${
                      selectedSubsystems.includes("All Subsystems")
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    All Subsystems
                  </button>
                  {SUBSYSTEM_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleSubsystemSelection(name)}
                      disabled={selectedSubsystems.includes("All Subsystems")}
                      className={`p-2 rounded-lg border text-sm text-left transition-colors ${
                        selectedSubsystems.includes(name)
                          ? "bg-primary/20 border-primary text-primary"
                          : selectedSubsystems.includes("All Subsystems")
                          ? "bg-muted/50 border text-muted-foreground/50 cursor-not-allowed"
                          : "bg-muted/50 border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotificationModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={
                  sendingNotification ||
                  !notificationTitle ||
                  !notificationMessage ||
                  selectedSubsystems.length === 0
                }
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {sendingNotification ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enable Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg border w-full max-w-md overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-yellow-600 p-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Enable Maintenance Mode
              </h2>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>Warning:</strong> Enabling maintenance mode will temporarily
                  disable access to all subsystems. Users will see a maintenance notice.
                </p>
              </div>

              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Reason for Maintenance
                </label>
                <Textarea
                  placeholder="Enter reason for maintenance"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="bg-muted/50 border text-foreground min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Estimated Duration (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g., 2 hours"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-muted/50 border text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowMaintenanceModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnableMaintenance}
                disabled={togglingMaintenance || !maintenanceReason}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
              >
                {togglingMaintenance ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Enable Maintenance
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
