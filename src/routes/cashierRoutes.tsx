import CashierLayout from '@/layout/CashierLayout';
import CashierPage from '@/pages/cashier/CashierPage';
import { Route } from 'react-router-dom';

export const cashierRouteData = [
    { index: true, path: undefined, element: <CashierPage />, title: 'Cashier Dashboard' }
];

export const cashierRoutes = (
    <Route path='/cashier' element={<CashierLayout />}>
        {cashierRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default cashierRoutes;
