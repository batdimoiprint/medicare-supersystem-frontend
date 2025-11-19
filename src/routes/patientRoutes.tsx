import PatientLayout from '@/layout/PatientLayout';
import PatientPage from '@/pages/patient/PatientPage';
import { Route } from 'react-router-dom';

export const patientRouteData = [
    { index: true, path: undefined, element: <PatientPage />, title: 'Patient Dashboard' }
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
