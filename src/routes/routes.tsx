import LandingPage from '@/pages/public/LandingPage';
import AdminPage from '@/pages/admin/AdminPage';
import DentistPage from '@/pages/dentist/DentistPage';
import FrontDeskPage from '@/pages/front-desk/FrontDeskPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import PatientPage from '@/pages/patient/PatientPage';
import { Route, Routes } from 'react-router-dom';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/services' element={<LandingPage />} />
            <Route path='/dentist' element={<LandingPage />} />
            <Route path='/contact' element={<LandingPage />} />
            <Route path='/login' element={<LandingPage />} />
            <Route path='/register' element={<LandingPage />} />

            {/* Patient Dashboard */}
            <Route path='/patient' element={<PatientPage />} />


            {/* Frontdesk Dashboard */}
            <Route path='/frontdesk' element={<FrontDeskPage />} />


            {/* Inventory Dashboard */}
            <Route path='/inventory' element={<InventoryPage />} />


            {/* Dentist Dashboard */}
            <Route path='/dentist' element={<DentistPage />} />


            {/* Admin Dashboard */}
            <Route path='/admin' element={<AdminPage />} />

        </Routes>
    );
}
