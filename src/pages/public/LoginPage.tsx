import { useForm } from 'react-hook-form'
import { LoginForm } from '@/components/auth/login-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'

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

      // Sign in using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Check if email is confirmed
      if (!authData.user?.email_confirmed_at) {
        setError('Please verify your email before logging in.')
        return
      }

      // Optional: fetch patient profile from patient_tbl after login
     const { data: patientData, error: patientError } = await supabase
  .schema('patient_record')
  .from('patient_tbl')
  .select('patient_id, email, f_name, l_name, account_status')
  .eq('email', data.email)
  .single()


      if (patientError || !patientData) {
        setError('Failed to fetch patient profile.')
        return
      }

      // Check account status in patient_tbl
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

      // Store user info in localStorage or context
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

