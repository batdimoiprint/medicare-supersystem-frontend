import AdminLayout from "@/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAppointments from "@/pages/admin/AdminAppointments";
import UserManagement from "@/pages/admin/UserManagement";
import ServiceManagement from "@/pages/admin/ServiceManagement";
import SystemLogs from "@/pages/admin/SystemLogs";
import BillingPayment from "@/pages/admin/BillingPayment";
import PatientRecords from "@/pages/admin/PatientRecords";
import DentistManagement from "@/pages/admin/DentistManagement";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminSettings from "@/pages/admin/AdminSettings";
import { Route } from "react-router-dom";

export const adminRouteData = [
    { index: true, element: <AdminDashboard />, title: 'Admin Dashboard' },
    { path: 'logs', element: <SystemLogs />, title: 'System Logs' },
    { path: 'users', element: <UserManagement />, title: 'User Management' },
    { path: 'appointments', element: <AdminAppointments />, title: 'Appointments' },
    { path: 'billing', element: <BillingPayment />, title: 'Billing & Payment' },
    { path: 'patients', element: <PatientRecords />, title: 'Patient Records' },
    { path: 'dentists', element: <DentistManagement />, title: 'Dentists' },
    { path: 'inventory', element: <AdminInventory />, title: 'Inventory' },
    { path: 'services', element: <ServiceManagement />, title: 'Service Management' },
    { path: 'settings', element: <AdminSettings />, title: 'System Settings' },
];

export const adminRoutes = (
    <Route path='/admin' element={<AdminLayout />}>
        {adminRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default adminRoutes;