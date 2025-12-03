// Role IDs matching database personnel_tbl.role_id
export const UserRole = {
    Dentist: 1,
    Receptionist: 2,
    Cashier: 3,
    Inventory: 4,
    Admin: 5,
    Patient: 6,
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

// Map role IDs to route paths
export const roleRoutes: Record<UserRoleType, string> = {
    [UserRole.Dentist]: '/dentist',
    [UserRole.Receptionist]: '/receptionist',
    [UserRole.Cashier]: '/cashier',
    [UserRole.Inventory]: '/inventory',
    [UserRole.Admin]: '/admin',
    [UserRole.Patient]: '/patient',
}

// Map role IDs to display names
export const roleNames: Record<UserRoleType, string> = {
    [UserRole.Dentist]: 'Dentist',
    [UserRole.Receptionist]: 'Receptionist',
    [UserRole.Cashier]: 'Cashier',
    [UserRole.Inventory]: 'Inventory Staff',
    [UserRole.Admin]: 'Administrator',
    [UserRole.Patient]: 'Patient',
}

// User data structure stored in context/session
export interface User {
    id: number
    name: string
    email: string
    role: UserRoleType
    avatar?: string
}

// Auth state for the context
export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
}

// Session data stored in sessionStorage
export interface SessionData {
    user_id: string
    user_name: string
    user_role: string
    user_email: string
}

// Auth context type with methods
export interface AuthContextType extends AuthState {
    login: (user: User) => void
    logout: () => void
    validateSession: () => Promise<boolean>
}
