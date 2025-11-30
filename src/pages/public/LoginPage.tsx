import { useForm } from 'react-hook-form';
import { LoginForm } from '@/components/auth/login-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/utils/supabase';
import bcrypt from 'bcryptjs';

type LoginFormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({ mode: 'onBlur' });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const emailRules = {
    required: 'Email is required',
    pattern: {
      value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
      message: 'Please enter a valid email',
    },
  };

  const passwordRules = {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
  };

  function normalizeHash(hash: string) {
    return hash.replace(/^\$2y\$/, '$2a$');
  }

  async function onSubmit(formData: LoginFormValues) {
    try {
      setError(null);
      const sanitizedEmail = formData.email.trim().toLowerCase();

      // 1️⃣ PATIENT LOGIN CHECK
      const { data: patientData, error: patientError } = await supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('patient_id, email, password, account_status, f_name, l_name')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (patientError) {
        console.error('Patient query error:', patientError);
        setError('Login service temporarily unavailable');
        return;
      }

      if (patientData) {
        if (['Suspended', 'Inactive', 'Pending'].includes(patientData.account_status)) {
          setError(`Account status: ${patientData.account_status}. Please contact support.`);
          return;
        }

        const normalizedHash = normalizeHash(patientData.password);
        const hashedMatch = await bcrypt.compare(formData.password, normalizedHash);

        if (!hashedMatch) {
          setError('Invalid email or password');
          return;
        }

        // Use sessionStorage instead of localStorage
        sessionStorage.setItem('user_role', '6');
        sessionStorage.setItem('user_name', `${patientData.f_name} ${patientData.l_name}`);
        sessionStorage.setItem('user_id', patientData.patient_id.toString());

        navigate('/patient');
        return;
      }

      // 2️⃣ PERSONNEL LOGIN CHECK
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel_tbl')
        .select('personnel_id, email, password, role_id, f_name, l_name, account_status')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (personnelError) {
        console.error('Personnel query error:', personnelError);
        setError('Login service temporarily unavailable');
        return;
      }

      if (!personnelData) {
        setError('Invalid email or password');
        return;
      }

      if (personnelData.account_status === 'Suspended') {
        setError('Your account has been suspended. Please contact administrator.');
        return;
      }

      const normalizedPersonnelHash = normalizeHash(personnelData.password);
      const hashedMatchPersonnel = await bcrypt.compare(
        formData.password,
        normalizedPersonnelHash
      );

      if (!hashedMatchPersonnel) {
        setError('Invalid email or password');
        return;
      }

      // Use sessionStorage
      sessionStorage.setItem('user_role', personnelData.role_id.toString());
      sessionStorage.setItem('user_name', `${personnelData.f_name} ${personnelData.l_name}`);
      sessionStorage.setItem('user_id', personnelData.personnel_id.toString());

      // 3️⃣ REDIRECT BY ROLE
      const roleRoutes: { [key: number]: string } = {
        1: '/dentist',
        2: '/receptionist',
        3: '/cashier',
        4: '/inventory',
        5: '/admin',
      };

      const route = roleRoutes[personnelData.role_id];
      if (route) {
        navigate(route);
      } else {
        setError('Unauthorized role. Please contact administrator.');
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
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
  );
}