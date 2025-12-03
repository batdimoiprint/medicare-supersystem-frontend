// removed cn usage — keep component simple and explicit
import type { UseFormRegister, Path, RegisterOptions } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    // FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import imgDentist from '@/components/assets/img_dentist.png'

type LoginFormProps<TFormValues extends Record<string, unknown> = Record<string, unknown>> =
    React.ComponentProps<'div'> & {
        onSubmit?: React.FormEventHandler<HTMLFormElement>
        register?: UseFormRegister<TFormValues>
        rules?: {
            email?: RegisterOptions
            password?: RegisterOptions
        }
        isSubmitting?: boolean
        error?: string | null
    }

export function LoginForm<TFormValues extends Record<string, unknown> = Record<string, unknown>>({
    className,
    onSubmit,
    register,
    rules,
    isSubmitting,
    error,
    ...props
}: LoginFormProps<TFormValues>) {
    // The login form should span the viewport (minus the header). Use a min height
    // that approximates full screen minus header height. The inner card is centered
    // and constrained to max-w-7xl for large screens.
    const wrapperClass = `w-full min-h-[calc(80vh-72px)] flex items-center justify-center ${className ?? ''}`

    return (
        <div className={wrapperClass} {...props}>
            {/* card fills width, constrained by max-w-7xl, and stretches vertically */}
            <Card className="my-16 p-0 overflow-hidden w-full ">
                <CardContent className="grid p-0 md:grid-cols-2 h-[min(76vh,880px)] w-full">
                    <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col justify-center h-full">
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your Medicare account
                                </p>
                                {error && (
                                    <div className="w-full px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:text-red-400 dark:border-red-900">
                                        {error}
                                    </div>
                                )}
                            </div>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    {...(register ? register('email' as Path<TFormValues>, rules?.email as unknown as RegisterOptions<TFormValues, Path<TFormValues>>) : { required: true })}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    {/* <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </a> */}
                                </div>
                                <Input id="password" type="password" {...(register ? register('password' as Path<TFormValues>, rules?.password as unknown as RegisterOptions<TFormValues, Path<TFormValues>>) : { required: true })} />
                            </Field>
                            <Field>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</Button>
                            </Field>

                            <FieldDescription className="text-center">
                                Don&apos;t have an account?      <Link to="/register" className="font-medium text-primary hover:underline">
                                    Create an account
                                </Link>
                            </FieldDescription>

                        </FieldGroup>
                    </form>
                    <div className="hidden bg-background/50 md:flex h-full items-center justify-center">
                        <img
                            src={imgDentist}
                            alt="Image"
                            className="object-contain w-128 h-128 "
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
