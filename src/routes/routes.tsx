import AdminLayout from '@/layout/AdminLayout';
import CashierLayout from '@/layout/CashierLayout';
import DentistLayout from '@/layout/DentistLayout';
import PatientLayout from '@/layout/PatientLayout';
import PublicLayout from '@/layout/PublicLayout';
import ReceptionistLayout from '@/layout/ReceptionistLayout';
import AdminPage from '@/pages/admin/AdminPage';
import CashierPage from '@/pages/cashier/CashierPage';
import DentistPage from '@/pages/dentist/DentistPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import PatientPage from '@/pages/patient/PatientPage';
import AboutUs from '@/pages/public/AboutUs';
import ContactPage from '@/pages/public/ContactPage';
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import OurDentistPage from '@/pages/public/OurDentistPage';
import RegisterPage from '@/pages/public/RegisterPage';
import ServicesPage from '@/pages/public/ServicesPage';
import FrontDeskPage from '@/pages/receptionist/ReceptionistPage';
import { Route, Routes } from 'react-router-dom';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes - Nested under LandingPage */}
            <Route path='/' element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path='services' element={<ServicesPage />} />
                <Route path='our-dentist' element={<OurDentistPage />} />
                <Route path='about-us' element={<AboutUs />} />
                <Route path='contact' element={<ContactPage />} />
                <Route path='login' element={<LoginPage />} />
                <Route path='register' element={<RegisterPage />} />

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
