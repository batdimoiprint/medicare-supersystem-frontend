import ReceptionistLayout from '@/layout/ReceptionistLayout';
import FrontDeskPage from '@/pages/receptionist/ReceptionistPage';
import { Route } from 'react-router-dom';

export const receptionistRouteData = [
    { index: true, path: undefined, element: <FrontDeskPage />, title: 'Front Desk Dashboard' }
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
