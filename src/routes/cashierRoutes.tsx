import CashierLayout from '@/layout/CashierLayout';
import Dashboard from '@/pages/cashier/Dashboard';
import Payments from '@/pages/cashier/Payments';
import PaymentDetails from '@/pages/cashier/PaymentDetails';
import Refunds from '@/pages/cashier/Refunds';
import RefundDetails from '@/pages/cashier/RefundDetails';
import { Route } from 'react-router-dom';

export const cashierRouteData = [
    { index: true, path: undefined, element: <Dashboard />, title: 'Cashier Dashboard' },
    { index: false, path: 'payments', element: <Payments />, title: 'Payments' },
    { index: false, path: 'payments/:appointment_id', element: <PaymentDetails />, title: 'Payment Details' },
    { index: false, path: 'refunds', element: <Refunds />, title: 'Refunds' },
    { index: false, path: 'refunds/:appointment_id', element: <RefundDetails />, title: 'Refund Details' },
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
