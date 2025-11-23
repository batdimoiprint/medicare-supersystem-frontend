import PatientLayout from '@/layout/PatientLayout';
import PatientPage from '@/pages/patient/PatientPage';
import PatientProfilePage from '@/pages/patient/PatientProfilePage';
import PatientTransactionsPage from '@/pages/patient/PatientTransactionsPage';
import MedicalRecordsPage from '@/pages/patient/MedicalRecordsPage';
import PatientNotificationsPage from '@/pages/patient/PatientNotificationsPage'; // Added Import
import { Route } from 'react-router-dom';

export const patientRouteData = [
    { index: true, element: <PatientPage />, title: 'Dashboard' },
    { path: 'profile', element: <PatientProfilePage />, title: 'My Profile' },
    { path: 'transactions', element: <PatientTransactionsPage />, title: 'Transaction History' },
    { path: 'records', element: <MedicalRecordsPage />, title: 'Medical Records' },
    { path: 'notifications', element: <PatientNotificationsPage />, title: 'Notifications' }, // Added Route
];

export const patientRoutes = (
    <Route path='/patient' element={<PatientLayout />}>
        {patientRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default patientRoutes;