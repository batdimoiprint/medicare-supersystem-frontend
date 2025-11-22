import { useForm } from 'react-hook-form'
import { LoginForm } from '@/components/auth/login-form'

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
        // No backend yet — just log to console for now
        console.log('Login form submitted', data)
        // TODO: dispatch auth or navigate to dashboard
    }

    return (

        <LoginForm
            onSubmit={handleSubmit(onSubmit)}
            register={register}
            isSubmitting={isSubmitting}
            rules={{ email: emailRules, password: passwordRules }}
        />

    )
}
