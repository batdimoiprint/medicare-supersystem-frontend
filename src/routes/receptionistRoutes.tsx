import ReceptionistLayout from '@/layout/ReceptionistLayout';
import Dashboard from '@/pages/receptionist/Dashboard';
import Appointments from '@/pages/receptionist/Appointments';
import AppointmentDetails from '@/pages/receptionist/AppointmentDetails';
import CancelRequests from '@/pages/receptionist/CancelRequests';
import CancelRequestDetails from '@/pages/receptionist/CancelRequestDetails';
import { Route } from 'react-router-dom';

export const receptionistRouteData = [
    { index: true, path: undefined, element: <Dashboard />, title: 'Receptionist Dashboard' },
    { index: false, path: 'appointments', element: <Appointments />, title: 'Appointments' },
    { index: false, path: 'appointments/:appointment_id', element: <AppointmentDetails />, title: 'Appointment Details' },
    { index: false, path: 'cancel-requests', element: <CancelRequests />, title: 'Cancel Requests' },
    { index: false, path: 'cancel-requests/:appointment_id', element: <CancelRequestDetails />, title: 'Cancel Request Details' },
];

export const receptionistRoutes = (
    <Route path='/receptionist' element={<ReceptionistLayout />}>
        {receptionistRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default receptionistRoutes;
