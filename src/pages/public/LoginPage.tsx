import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel, FieldError } from '@/components/ui/field'

type LoginFormValues = {
    email: string
    password: string
    remember?: boolean
}

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({ mode: 'onBlur' })

    async function onSubmit(data: LoginFormValues) {
        // No backend yet — just log to console for now
        console.log('Login form submitted', data)
        // TODO: dispatch auth or navigate to dashboard
    }

    return (
        <main className="mx-auto w-full max-w-md px-4 py-12">
            <div className="rounded-2xl bg-card p-8 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold text-foreground">Welcome back</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to access your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Field>
                        <FieldLabel>Email address</FieldLabel>
                        <FieldContent>
                            <Input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                                        message: 'Please enter a valid email',
                                    },
                                })}
                                aria-invalid={errors.email ? 'true' : 'false'}
                                placeholder="you@domain.com"
                            />
                            <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
                        </FieldContent>
                    </Field>

                    <Field className="mt-4">
                        <FieldLabel>Password</FieldLabel>
                        <FieldContent>
                            <Input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                })}
                                type="password"
                                aria-invalid={errors.password ? 'true' : 'false'}
                                placeholder="********"
                            />
                            <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
                        </FieldContent>
                    </Field>

                    <div className="flex items-center justify-between mt-6">
                        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <input type="checkbox" {...register('remember')} />
                            Remember me
                        </label>

                        <Link to="/" className="text-sm text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <span>Don’t have an account? </span>
                    <Link to="/register" className="text-primary font-medium hover:underline">
                        Create an account
                    </Link>
                </div>
            </div>
        </main>
    )
}
