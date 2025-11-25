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

// Define a type for personnel
type Personnel = {
  personnel_id: string
  email: string
  password: string
  role_id: number
  f_name: string
  l_name: string
  account_status: string
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

  async function onSubmit(formData: LoginFormValues) {
    try {
      setError(null)

      // ---------------------------------------------------
      // 1️⃣ CHECK PATIENT TABLE
      // ---------------------------------------------------
      try {
        const { data: patientData, error: patientError } = await supabase
          .schema('patient_record')
          .from('patient_tbl')
          .select('patient_id, email, password, account_status, f_name, l_name')
          .eq('email', formData.email)
          .single()

        if (patientError) console.log('Patient query error:', patientError)

        if (patientData) {
          if (['Suspended', 'Inactive', 'Pending'].includes(patientData.account_status)) {
            setError(`Patient account status: ${patientData.account_status}`)
            return
          }

          const hashedMatch = await bcrypt.compare(formData.password, patientData.password)
          const plainMatch = formData.password === patientData.password

          if (!hashedMatch && !plainMatch) {
            setError('Invalid email or password')
            return
          }

          localStorage.setItem('user_role', '6')
          localStorage.setItem('user_name', `${patientData.f_name} ${patientData.l_name}`)
          localStorage.setItem('user_id', patientData.patient_id)
          navigate('/patient')
          return
        }
      } catch (patientQueryErr) {
        console.error('Patient query failed:', patientQueryErr)
      }

      // ---------------------------------------------------
      // 2️⃣ CHECK PERSONNEL LOGIN
      // ---------------------------------------------------
      let personnelData: Personnel | null = null

      try {
        const { data: personnelQueryData, error: personnelError } = await supabase
          .schema('public')
          .from('personnel_tbl')
          .select(
            'personnel_id, email, password, role_id, f_name, l_name, account_status'
          )
          .eq('email', formData.email)
          .single()

        console.log('Personnel query data:', personnelQueryData)
        console.log('Personnel query error:', personnelError)

        if (personnelError) {
          console.error('Supabase personnel query error:', personnelError)
          setError('Unable to query personnel data. Check console for details.')
          return
        }

        personnelData = personnelQueryData
      } catch (personnelQueryErr) {
        console.error('Personnel query failed:', personnelQueryErr)
        setError('Unable to fetch personnel data. Check console for details.')
        return
      }

      if (!personnelData) {
        setError('Invalid email or password')
        return
      }

      if (personnelData.account_status === 'Suspended') {
        setError('Your account has been suspended.')
        return
      }

      // Password check: hashed OR plain
      const hashedMatchPersonnel = await bcrypt.compare(
        formData.password,
        personnelData.password
      )
      const plainMatchPersonnel = formData.password === personnelData.password

      if (!hashedMatchPersonnel && !plainMatchPersonnel) {
        setError('Invalid email or password')
        return
      }

      // Save session
      localStorage.setItem('user_role', personnelData.role_id.toString())
      localStorage.setItem('user_name', `${personnelData.f_name} ${personnelData.l_name}`)
      localStorage.setItem('user_id', personnelData.personnel_id)

      // ---------------------------------------------------
      // 3️⃣ REDIRECT BASED ON ROLE
      // ---------------------------------------------------
      switch (personnelData.role_id) {
        case 1:
          navigate('/dentist')
          break
        case 2:
          navigate('/receptionist')
          break
        case 3:
          navigate('/cashier')
          break
        case 4:
          navigate('/inventory')
          break
        case 5:
          navigate('/admin')
          break
        default:
          setError('Unauthorized role.')
          break
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred.')
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
