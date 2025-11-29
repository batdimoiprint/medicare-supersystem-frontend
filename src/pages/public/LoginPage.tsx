import { useForm } from 'react-hook-form'
import { LoginForm } from '@/components/auth/login-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import bcrypt from 'bcryptjs'

type LoginFormValues = {
    email: string
    password: string
    remember?: boolean
}

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<LoginFormValues>({ mode: 'onBlur' })
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const emailRules = {
        required: 'Email is required',
        pattern: {
            value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
            message: 'Please enter a valid email',
        },
    }

    const passwordRules = {
        required: 'Password is required',
        minLength: { value: 8, message: 'Password must be at least 8 characters' },
    }

    async function onSubmit(data: LoginFormValues) {
        try {
            setError(null)

            // Static Admin Login
            if (data.email === 'admin@medicare.com' && data.password === 'admin123') {
                localStorage.setItem('user_role', 'admin')
                navigate('/admin')
                return
            }

            // Query patient_tbl for user with matching email
            const { data: patientData, error: queryError } = await supabase
                .schema('patient_record')
                .from('patient_tbl')
                .select('patient_id, email, password, account_status, f_name, l_name')
                .eq('email', data.email)
                .single()

            if (queryError || !patientData) {
                setError('Invalid email or password')
                return
            }

            // Check account status
            if (patientData.account_status === 'Suspended') {
                setError('Your account has been suspended. Please contact support.')
                return
            }

            if (patientData.account_status === 'Inactive') {
                setError('Your account is inactive. Please contact support.')
                return
            }

            if (patientData.account_status === 'Pending') {
                setError('Your account is pending approval. Please wait for administrator approval.')
                return
            }

            // Verify password with bcrypt
            const passwordMatch = await bcrypt.compare(data.password, patientData.password)

            if (!passwordMatch) {
                setError('Invalid email or password')
                return
            }

            // Store user session in localStorage (in production, use proper session management)
            localStorage.setItem('patient_id', patientData.patient_id.toString())
            localStorage.setItem('patient_email', patientData.email || '')
            localStorage.setItem('patient_name', `${patientData.f_name} ${patientData.l_name}`)

            console.log('Patient logged in:', patientData)
            navigate('/patient')
        } catch (err) {
            setError('An unexpected error occurred. Please try again.')
            console.error('Login error:', err)
        }
    }

    return (

        <LoginForm
            onSubmit={handleSubmit(onSubmit)}
            register={register}
            isSubmitting={isSubmitting}
            rules={{ email: emailRules, password: passwordRules }}
            error={error}
        />

    )
}
