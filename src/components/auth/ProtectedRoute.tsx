import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/userContext'
import type { UserRoleType } from '@/types/auth'
import { getRoleRoute } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles: UserRoleType[]
}

/**
 * ProtectedRoute component that guards routes based on authentication and role
 * 
 * - Shows loading spinner while validating session
 * - Redirects to /login if not authenticated
 * - Redirects to user's dashboard if authenticated but wrong role
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying session...</p>
                </div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        // Save the attempted URL for redirecting after login
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
        // Redirect to user's correct dashboard
        const correctRoute = getRoleRoute(user.role)
        return <Navigate to={correctRoute} replace />
    }

    // User is authenticated and has correct role
    return <>{children}</>
}

/**
 * PublicOnlyRoute - for pages that should only be accessible when NOT logged in
 * (e.g., login, register pages)
 */
interface PublicOnlyRouteProps {
    children: React.ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect to dashboard if already authenticated
    if (isAuthenticated && user) {
        const dashboardRoute = getRoleRoute(user.role)
        return <Navigate to={dashboardRoute} replace />
    }

    return <>{children}</>
}

export default ProtectedRoute
