import AdminLayout from '@/layout/AdminLayout';
import PublicLayout from '@/layout/PublicLayout';
import AdminPage from '@/pages/admin/AdminPage';
import AboutUs from '@/pages/public/AboutUs';
import Terms from '@/pages/public/Terms';
import Privacy from '@/pages/public/Privacy';
import Careers from '@/pages/public/Careers';
import Support from '@/pages/public/Support';
import ContactPage from '@/pages/public/ContactPage';
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import OurDentistPage from '@/pages/public/OurDentistPage';
import RegisterPage from '@/pages/public/RegisterPage';
import ServicesPage from '@/pages/public/ServicesPage';
import { Route, Routes } from 'react-router-dom';
import { dentistRoutes } from './dentistRoutes';
import { patientRoutes } from './patientRoutes';
import { receptionistRoutes } from './receptionistRoutes';
import { cashierRoutes } from './cashierRoutes';
import { inventoryRoutes } from './inventoryRoutes';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes - Nested under LandingPage */}
            <Route path='/' element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path='services' element={<ServicesPage />} />
                <Route path='our-dentist' element={<OurDentistPage />} />
                <Route path='about-us' element={<AboutUs />} />
                <Route path='careers' element={<Careers />} />
                <Route path='privacy' element={<Privacy />} />
                <Route path='terms' element={<Terms />} />
                <Route path='support' element={<Support />} />
                <Route path='contact' element={<ContactPage />} />
                <Route path='login' element={<LoginPage />} />
                <Route path='register' element={<RegisterPage />} />

            </Route>

            {/* Patient Dashboard */}
            {patientRoutes}

            {/* Receptionist Dashboard */}
            {receptionistRoutes}

            {/* Cashier Dashboard */}
            {cashierRoutes}

            {/* Inventory Dashboard */}
            {inventoryRoutes}

            {/* Dentist Dashboard */}
            {dentistRoutes}

            {/* Admin Dashboard */}
            <Route path='/admin' element={<AdminLayout />}>
                <Route index element={<AdminPage />} />
            </Route>
        </Routes>
    );
}
