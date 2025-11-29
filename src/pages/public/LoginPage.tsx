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

  // Normalize bcrypt hash ($2y$ → $2a$)
  function normalizeHash(hash: string) {
    return hash.replace(/^\$2y\$/, '$2a$')
  }

  async function onSubmit(formData: LoginFormValues) {
    try {
      setError(null)

      const { data: patientData } = await supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('patient_id, email, password, account_status, f_name, l_name')
        .eq('email', formData.email)
        .maybeSingle()

      if (patientData) {
        if (['Suspended', 'Inactive', 'Pending'].includes(patientData.account_status)) {
          setError(`Patient account status: ${patientData.account_status}`)
          return
        }

        const normalizedHash = normalizeHash(patientData.password)
        const hashedMatch = await bcrypt.compare(formData.password, normalizedHash)
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

      const { data: personnelData } = await supabase
        .from('personnel_tbl')
        .select(
          'personnel_id, email, password, role_id, f_name, l_name, account_status'
        )
        .eq('email', formData.email)
        .maybeSingle()

      if (!personnelData) {
        setError('Invalid email or password')
        return
      }

      if (personnelData.account_status === 'Suspended') {
        setError('Your account has been suspended.')
        return
      }

      const normalizedPersonnelHash = normalizeHash(personnelData.password)

      const hashedMatchPersonnel = await bcrypt.compare(
        formData.password,
        normalizedPersonnelHash
      )
      const plainMatchPersonnel = formData.password === personnelData.password

      if (!hashedMatchPersonnel && !plainMatchPersonnel) {
        setError('Invalid email or password')
        return
      }

      localStorage.setItem('user_role', personnelData.role_id.toString())
      localStorage.setItem(
        'user_name',
        `${personnelData.f_name} ${personnelData.l_name}`
      )
      localStorage.setItem('user_id', personnelData.personnel_id)

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
