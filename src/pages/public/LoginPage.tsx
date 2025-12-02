import { useForm } from 'react-hook-form';
import { LoginForm } from '@/components/auth/login-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/utils/supabase';
import bcrypt from 'bcryptjs';
import { useAuth } from '@/context/userContext';
import { UserRole, type UserRoleType } from '@/types/auth';
import { getRoleRoute } from '@/lib/auth';

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
  const { login } = useAuth();

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

        // Login via auth context
        login({
          id: patientData.patient_id,
          name: `${patientData.f_name} ${patientData.l_name}`,
          email: patientData.email,
          role: UserRole.Patient,
        });

        navigate(getRoleRoute(UserRole.Patient));
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

      // Validate role ID
      const roleId = personnelData.role_id as UserRoleType;
      if (![1, 2, 3, 4, 5].includes(roleId)) {
        setError('Unauthorized role. Please contact administrator.');
        return;
      }

      // Login via auth context
      login({
        id: personnelData.personnel_id,
        name: `${personnelData.f_name} ${personnelData.l_name}`,
        email: personnelData.email,
        role: roleId,
      });

      navigate(getRoleRoute(roleId));

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