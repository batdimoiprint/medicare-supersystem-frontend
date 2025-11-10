import LandingPage from '@/pages/public/LandingPage'
import { Route, Routes } from 'react-router-dom'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<LandingPage />} />
        </Routes>

        
    )
}
