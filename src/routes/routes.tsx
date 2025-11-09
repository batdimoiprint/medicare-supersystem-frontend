import Landing from '@/pages/public/Landing'
import { Route, Routes } from 'react-router-dom'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Landing />} />
        </Routes>
    )
}
