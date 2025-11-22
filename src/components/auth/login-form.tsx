import { cn } from "@/lib/utils"
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
    }

export function LoginForm<TFormValues extends Record<string, unknown> = Record<string, unknown>>({
    className,
    onSubmit,
    register,
    rules,
    isSubmitting,
    ...props
}: LoginFormProps<TFormValues>) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="p-0 overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form onSubmit={onSubmit} className="p-6 md:p-8">
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your Acme Inc account
                                </p>
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
                                    <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
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
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src={imgDentist}
                            alt="Image"
                            className="absolute inset-0 object-contain w-full h-full"
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
