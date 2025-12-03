import PublicLayout from '@/layout/PublicLayout';
import AboutUs from '@/pages/public/AboutUs';
import ContactPage from '@/pages/public/ContactPage';
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import OurDentistPage from '@/pages/public/OurDentistPage';
import Privacy from '@/pages/public/Privacy';
import RegisterPage from '@/pages/public/RegisterPage';
import ServicesPage from '@/pages/public/ServicesPage';
import Support from '@/pages/public/Support';
import Terms from '@/pages/public/Terms';
import { Route, Routes } from 'react-router-dom';
import VerifyPage from "@/pages/public/VerifyPage";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';
import PatientLayout from '@/layout/PatientLayout';
import ReceptionistLayout from '@/layout/ReceptionistLayout';
import CashierLayout from '@/layout/CashierLayout';
import InventoryLayout from '@/layout/InventoryLayout';
import DentistLayout from '@/layout/DentistLayout';
import AdminLayout from '@/layout/AdminLayout';
import { patientRouteData } from './patientRoutes';
import { receptionistRouteData } from './receptionistRoutes';
import { cashierRouteData } from './cashierRoutes';
import { inventoryRouteData } from './inventoryRoutes';
import { dentistRouteData } from './dentistRoutes';
import { adminRouteData } from './adminRoutes';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes - Nested under PublicLayout */}
            <Route path='/' element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path='services' element={<ServicesPage />} />
                <Route path='our-dentist' element={<OurDentistPage />} />
                <Route path='about-us' element={<AboutUs />} />
                <Route path='privacy' element={<Privacy />} />
                <Route path='terms' element={<Terms />} />
                <Route path='support' element={<Support />} />
                <Route path='contact' element={<ContactPage />} />

                {/* Auth pages - accessible even when logged in */}
                <Route path='login' element={<LoginPage />} />
                <Route path='register' element={<RegisterPage />} />
                <Route path='verify' element={<VerifyPage />} />
            </Route>

            {/* Patient Dashboard - Protected */}
            <Route path='/patient' element={
                <ProtectedRoute allowedRoles={[UserRole.Patient]}>
                    <PatientLayout />
                </ProtectedRoute>
            }>
                {patientRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>

            {/* Receptionist Dashboard - Protected */}
            <Route path='/receptionist' element={
                <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
                    <ReceptionistLayout />
                </ProtectedRoute>
            }>
                {receptionistRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>

            {/* Cashier Dashboard - Protected */}
            <Route path='/cashier' element={
                <ProtectedRoute allowedRoles={[UserRole.Cashier]}>
                    <CashierLayout />
                </ProtectedRoute>
            }>
                {cashierRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>

            {/* Inventory Dashboard - Protected */}
            <Route path='/inventory' element={
                <ProtectedRoute allowedRoles={[UserRole.Inventory]}>
                    <InventoryLayout />
                </ProtectedRoute>
            }>
                {inventoryRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>

            {/* Dentist Dashboard - Protected */}
            <Route path='/dentist' element={
                <ProtectedRoute allowedRoles={[UserRole.Dentist]}>
                    <DentistLayout />
                </ProtectedRoute>
            }>
                {dentistRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>

            {/* Admin Dashboard - Protected */}
            <Route path='/admin' element={
                <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                {adminRouteData.map((route, idx) => (
                    <Route
                        key={idx}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                    />
                ))}
            </Route>
        </Routes>
    );
}
