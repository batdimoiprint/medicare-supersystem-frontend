import AdminLayout from "@/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPage from "@/pages/admin/AdminPage";
import UserManagement from "@/pages/admin/UserManagement";
import ServiceManagement from "@/pages/admin/ServiceManagement";
import { Route } from "react-router-dom";

export const adminRouteData = [
    { index: true, element: <AdminDashboard />, title: 'Admin Dashboard' },
    { path: 'users', element: <UserManagement />, title: 'User Management' },
    { path: 'services', element: <ServiceManagement />, title: 'Service Management' },
    { path: 'appointments', element: <AdminPage />, title: 'Appointments' }
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