import supabase from '@/utils/supabase'
import type { User, UserRoleType, SessionData } from '@/types/auth'
import { UserRole, roleRoutes } from '@/types/auth'

// Session storage keys
const SESSION_KEYS = {
    USER_ID: 'user_id',
    USER_NAME: 'user_name',
    USER_ROLE: 'user_role',
    USER_EMAIL: 'user_email',
} as const

/**
 * Save user session to sessionStorage
 */
export function saveSession(user: User): void {
    sessionStorage.setItem(SESSION_KEYS.USER_ID, user.id.toString())
    sessionStorage.setItem(SESSION_KEYS.USER_NAME, user.name)
    sessionStorage.setItem(SESSION_KEYS.USER_ROLE, user.role.toString())
    sessionStorage.setItem(SESSION_KEYS.USER_EMAIL, user.email)
}

/**
 * Read session data from sessionStorage
 */
export function getSession(): SessionData | null {
    const userId = sessionStorage.getItem(SESSION_KEYS.USER_ID)
    const userName = sessionStorage.getItem(SESSION_KEYS.USER_NAME)
    const userRole = sessionStorage.getItem(SESSION_KEYS.USER_ROLE)
    const userEmail = sessionStorage.getItem(SESSION_KEYS.USER_EMAIL)

    if (!userId || !userName || !userRole) {
        return null
    }

    return {
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_email: userEmail ?? '',
    }
}

/**
 * Clear session from sessionStorage
 */
export function clearSession(): void {
    sessionStorage.removeItem(SESSION_KEYS.USER_ID)
    sessionStorage.removeItem(SESSION_KEYS.USER_NAME)
    sessionStorage.removeItem(SESSION_KEYS.USER_ROLE)
    sessionStorage.removeItem(SESSION_KEYS.USER_EMAIL)
}

/**
 * Convert session data to User object
 */
export function sessionToUser(session: SessionData): User {
    return {
        id: parseInt(session.user_id, 10),
        name: session.user_name,
        email: session.user_email,
        role: parseInt(session.user_role, 10) as UserRoleType,
    }
}

/**
 * Get the dashboard route for a given role
 */
export function getRoleRoute(role: UserRoleType): string {
    return roleRoutes[role] ?? '/login'
}

/**
 * Check if a role is allowed to access a route
 */
export function isRoleAllowed(userRole: UserRoleType, allowedRoles: UserRoleType[]): boolean {
    return allowedRoles.includes(userRole)
}

/**
 * Validate session against Supabase database
 * Checks if user still exists and account is active
 */
export async function validateSessionWithDatabase(session: SessionData): Promise<User | null> {
    const userId = parseInt(session.user_id, 10)
    const roleId = parseInt(session.user_role, 10) as UserRoleType

    try {
        // Patient validation (role 6)
        if (roleId === UserRole.Patient) {
            const { data: patient, error } = await supabase
                .schema('patient_record')
                .from('patient_tbl')
                .select('patient_id, f_name, l_name, email, account_status')
                .eq('patient_id', userId)
                .maybeSingle()

            if (error || !patient) {
                return null
            }

            // Check if account is active
            if (['Suspended', 'Inactive', 'Pending'].includes(patient.account_status)) {
                return null
            }

            return {
                id: patient.patient_id,
                name: `${patient.f_name} ${patient.l_name}`,
                email: patient.email,
                role: UserRole.Patient,
            }
        }

        // Personnel validation (roles 1-5)
        const { data: personnel, error } = await supabase
            .from('personnel_tbl')
            .select('personnel_id, f_name, l_name, email, role_id, account_status')
            .eq('personnel_id', userId)
            .maybeSingle()

        if (error || !personnel) {
            return null
        }

        // Check if account is suspended
        if (personnel.account_status === 'Suspended') {
            return null
        }

        // Verify role matches
        if (personnel.role_id !== roleId) {
            return null
        }

        return {
            id: personnel.personnel_id,
            name: `${personnel.f_name} ${personnel.l_name}`,
            email: personnel.email,
            role: personnel.role_id as UserRoleType,
        }
    } catch (error) {
        console.error('Session validation error:', error)
        return null
    }
}
