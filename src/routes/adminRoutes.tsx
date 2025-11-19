import AdminLayout from "@/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPage from "@/pages/admin/AdminPage";
import { Route } from "react-router-dom";

export const adminRouteData = [
    { index: true, element: <AdminDashboard />, title: 'Admin Dashboard' },
    { path: 'appointments', element: <AdminPage />, title: 'Appointments' }
];

export const adminRoutes = (
    <Route path='/dentist' element={<AdminLayout />}>
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