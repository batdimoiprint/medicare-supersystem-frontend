import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, AuthContextType, UserRoleType } from '@/types/auth'
import {
    saveSession,
    getSession,
    clearSession,
    validateSessionWithDatabase,
    getRoleRoute,
} from '@/lib/auth'

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)

    // Validate session on mount (only once)
    const validateSession = useCallback(async (): Promise<boolean> => {
        const session = getSession()

        if (!session) {
            setUser(null)
            setIsLoading(false)
            return false
        }

        // Validate against database
        const validatedUser = await validateSessionWithDatabase(session)

        if (validatedUser) {
            setUser(validatedUser)
            // Update session in case data changed
            saveSession(validatedUser)
            setIsLoading(false)
            return true
        }

        // Session invalid - clear it
        clearSession()
        setUser(null)
        setIsLoading(false)
        return false
    }, [])

    // Run validation only on initial mount
    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true)
            validateSession()
        }
    }, [isInitialized, validateSession])

    // Login function - stores user in context and session
    const login = useCallback((userData: User) => {
        saveSession(userData)
        setUser(userData)
        // Ensure loading is false so ProtectedRoute doesn't redirect
        setIsLoading(false)
    }, [])

    // Logout function - clears session and user
    const logout = useCallback(() => {
        clearSession()
        setUser(null)
    }, [])

    const value: AuthContextType = {
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        validateSession,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}

/**
 * Get the dashboard route for the current user's role
 */
export function useUserDashboard(): string {
    const { user } = useAuth()
    return user ? getRoleRoute(user.role) : '/login'
}

/**
 * Check if current user has one of the allowed roles
 */
export function useHasRole(allowedRoles: UserRoleType[]): boolean {
    const { user } = useAuth()
    return user ? allowedRoles.includes(user.role) : false
}

export default AuthContext
