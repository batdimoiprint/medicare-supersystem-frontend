import PatientLayout from '@/layout/PatientLayout';
import PatientPage from '@/pages/patient/PatientPage';
import PatientProfilePage from '@/pages/patient/PatientProfilePage';
import PatientTransactionsPage from '@/pages/patient/PatientTransactionsPage'; // 1. Import component
import { Route } from 'react-router-dom';

export const patientRouteData = [
    { index: true, element: <PatientPage />, title: 'Dashboard' },
    { path: 'profile', element: <PatientProfilePage />, title: 'My Profile' },
    { path: 'transactions', element: <PatientTransactionsPage />, title: 'Transaction History' },
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