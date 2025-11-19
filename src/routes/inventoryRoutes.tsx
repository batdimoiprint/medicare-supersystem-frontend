import InventoryLayout from '@/layout/InventoryLayout';
import InventoryPage from '@/pages/inventory/InventoryPage';
import { Route } from 'react-router-dom';

export const inventoryRouteData = [
    { index: true, path: undefined, element: <InventoryPage />, title: 'Inventory Dashboard' }
];

export const inventoryRoutes = (
    <Route path='/inventory' element={<InventoryLayout />}>
        {inventoryRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default inventoryRoutes;
