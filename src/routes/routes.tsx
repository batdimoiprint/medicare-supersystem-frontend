import LandingPage from '@/pages/public/LandingPage';
import AdminPage from '@/pages/admin/AdminPage';
import DentistPage from '@/pages/dentist/DentistPage';
import FrontDeskPage from '@/pages/receptionist/ReceptionistPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import PatientPage from '@/pages/patient/PatientPage';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '@/layout/PublicLayout';
import AdminLayout from '@/layout/AdminLayout';
import PatientLayout from '@/layout/PatientLayout';
import ReceptionistLayout from '@/layout/ReceptionistLayout';
import DentistLayout from '@/layout/DentistLayout';
import CashierLayout from '@/layout/CashierLayout';
import CashierPage from '@/pages/cashier/CashierPage';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes - Nested under LandingPage */}
            <Route path='/' element={<PublicLayout />}>
                <Route path='' element={<LandingPage />} />
                <Route path='services' element={null} />
                <Route path='contact' element={null} />
                <Route path='login' element={null} />
                <Route path='register' element={null} />
            </Route>

            {/* Patient Dashboard */}
            <Route path='/patient' element={<PatientLayout />}>
                <Route index element={<PatientPage />} />
            </Route>

            {/* Receptionist Dashboard */}
            <Route path='/receptionist' element={<ReceptionistLayout />}>
                <Route index element={<FrontDeskPage />} />
            </Route>

            {/* Cashier Dashboard */}
            <Route path='/cashier' element={<CashierLayout />}>
                <Route index element={<CashierPage />} />
            </Route>

            {/* Inventory Dashboard */}
            <Route path='/inventory' element={<InventoryPage />} />

            {/* Dentist Dashboard */}
            <Route path='/dentist' element={<DentistLayout />}>
                <Route index element={<DentistPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path='/admin' element={<AdminLayout />}>
                <Route index element={<AdminPage />} />
            </Route>
        </Routes>
    );
}
