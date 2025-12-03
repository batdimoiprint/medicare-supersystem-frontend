import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";
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
  sentTo: string[];
  sentAt: string;
  sentBy: string;
  type: "info" | "warning" | "critical" | "maintenance";
}

interface MaintenanceLog {
  id: string;
  action: string;
  startTime: string;
  endTime: string | null;
  reason: string;
  initiatedBy: string;
  status: "active" | "completed" | "scheduled";
}

// Mock Data
const mockSubsystemNames = [
  "Patient Portal",
  "Dentist System",
  "Inventory Management",
  "Reception/Front Desk",
  "Billing & Payments",
  "Admin Dashboard",
];

const mockNotificationHistory: NotificationHistory[] = [
  {
    id: "NOT001",
    title: "Scheduled Maintenance Notice",
    message: "System will undergo maintenance on Dec 5, 2025 from 2:00 AM to 4:00 AM.",
    sentTo: ["All Subsystems"],
    sentAt: "2025-12-02 03:00 PM",
    sentBy: "Admin User",
    type: "maintenance",
  },
  {
    id: "NOT002",
    title: "New Feature Update",
    message: "New patient scheduling features are now available across all subsystems.",
    sentTo: ["Patient Portal", "Reception/Front Desk", "Dentist System"],
    sentAt: "2025-12-01 09:00 AM",
    sentBy: "System Admin",
    type: "info",
  },
  {
    id: "NOT003",
    title: "Security Alert",
    message: "Please update your passwords within the next 7 days as per security policy.",
    sentTo: ["All Subsystems"],
    sentAt: "2025-11-28 11:30 AM",
    sentBy: "Security Team",
    type: "warning",
  },
  {
    id: "NOT004",
    title: "Critical System Update",
    message: "Emergency patch applied to fix payment processing issue.",
    sentTo: ["Billing & Payments"],
    sentAt: "2025-11-25 06:45 PM",
    sentBy: "Admin User",
    type: "critical",
  },
];

const mockMaintenanceLogs: MaintenanceLog[] = [
  {
    id: "MAINT001",
    action: "System-wide Maintenance",
    startTime: "2025-12-01 02:00 AM",
    endTime: "2025-12-01 03:45 AM",
    reason: "Database optimization and security patches",
    initiatedBy: "Admin User",
    status: "completed",
  },
  {
    id: "MAINT002",
    action: "Scheduled Maintenance",
    startTime: "2025-12-05 02:00 AM",
    endTime: null,
    reason: "Monthly system updates and backups",
    initiatedBy: "System Admin",
    status: "scheduled",
  },
  {
    id: "MAINT003",
    action: "Emergency Maintenance",
    startTime: "2025-11-25 06:00 PM",
    endTime: "2025-11-25 07:30 PM",
    reason: "Payment gateway connection issue",
    initiatedBy: "Admin User",
    status: "completed",
  },
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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<string>("info");
  const [selectedSubsystems, setSelectedSubsystems] = useState<string[]>([]);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleToggleMaintenanceMode = () => {
    if (!maintenanceMode) {
      setShowMaintenanceModal(true);
    } else {
      setMaintenanceMode(false);
    }
  };

  const handleEnableMaintenance = () => {
    setMaintenanceMode(true);
    setShowMaintenanceModal(false);
    setMaintenanceReason("");
    setScheduledTime("");
  };

  const handleSendNotification = () => {
    console.log({
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      recipients: selectedSubsystems,
    });
    setShowNotificationModal(false);
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationType("info");
    setSelectedSubsystems([]);
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
                  className={
                    maintenanceMode
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }
                >
                  {maintenanceMode ? (
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
                    {mockNotificationHistory.length}
                  </p>
                  <p className="text-muted-foreground text-xs">Notifications Sent (30d)</p>
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
                <div className="space-y-3">
                  {mockNotificationHistory.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={listItemVariants}
                      className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
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
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>To: {notification.sentTo.join(", ")}</span>
                        <span>{notification.sentAt}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {mockMaintenanceLogs.map((log, index) => (
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
                        <span>By: {log.initiatedBy}</span>
                        <span>
                          {log.startTime} {log.endTime ? `- ${log.endTime}` : ""}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                  {mockSubsystemNames.map((name) => (
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
                  !notificationTitle ||
                  !notificationMessage ||
                  selectedSubsystems.length === 0
                }
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
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
                disabled={!maintenanceReason}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
              >
                <Power className="h-4 w-4 mr-2" />
                Enable Maintenance
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
