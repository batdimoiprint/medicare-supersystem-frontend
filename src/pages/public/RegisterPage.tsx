import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'

type RegistrationForm = {
    f_name: string
    l_name: string
    m_name?: string
    suffix?: string
    birthdate?: string
    gender?: string
    email: string
    password: string
    confirm_password?: string
    address?: string
    blood_type?: string
    pri_contact_no?: string
    sec_contact_no?: string
    image?: FileList
    ec_f_name?: string
    ec_l_name?: string
    ec_m_name_init?: string
    ec_contact_no?: string
    ec_relationship?: string
    ec_email?: string
}

export default function RegisterPage() {
    const { register, handleSubmit, control, watch, trigger, formState: { errors, isSubmitting } } = useForm<RegistrationForm>({ mode: 'onBlur' })
    const [step, setStep] = useState<number>(1)
    const [preview, setPreview] = useState<string | null>(null)

    function onImageChange(files?: FileList) {
        const file = files && files[0]
        if (!file) return setPreview(null)
        setPreview(URL.createObjectURL(file))
    }

    async function onSubmit(data: RegistrationForm) {
        // No server — temporarily store in localStorage for quick testing
        console.log('Registration', data)
        alert('Registration submitted (no backend). Review console for data.')
    }

    async function nextStep() {
        let fieldsToValidate: (keyof RegistrationForm)[] = []
        if (step === 1) fieldsToValidate = ['f_name', 'l_name', 'pri_contact_no']
        if (step === 2) fieldsToValidate = ['email', 'password', 'confirm_password']
        if (!fieldsToValidate.length) return setStep(s => s + 1)
        // trigger expects specific keys — allow any here to validate a subset safely
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ok = await trigger(fieldsToValidate as any)
        if (ok) setStep(s => s + 1)
    }

    function prevStep() {
        setStep(s => Math.max(1, s - 1))
    }


    const genderOptions = ['Female', 'Male', 'LGBTQIA+', 'Prefer Not to Say']
    const bloodTypes = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-', 'Unspecified']
    const relationships = ['Parent', 'Child', 'Relative', 'Spouse', 'Friend', 'Sibling', 'Guardian', 'Others', 'Unspecified']

    return (
        <main className="mx-auto max-w-4xl px-4 py-12">
            <div className="rounded-2xl bg-card p-8 shadow-lg">
                <header className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold text-foreground">Create your account</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Register as a patient — include emergency contact for faster care.</p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Patient Details</h2>

                        <Field>
                            <FieldLabel>First name</FieldLabel>
                            <FieldContent>
                                <Input {...register('f_name', { required: 'First name required' })} placeholder="First name" />
                                <FieldError errors={errors.f_name ? [{ message: errors.f_name.message }] : []} />
                            </FieldContent>
                        </Field>

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={nextStep}>Next</Button>
                        </div>

                        <Field>
                            <FieldLabel>Last name</FieldLabel>
                            <FieldContent>
                                <Input {...register('l_name', { required: 'Last name required' })} placeholder="Last name" />
                                <FieldError errors={errors.l_name ? [{ message: errors.l_name.message }] : []} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Middle name</FieldLabel>
                            <FieldContent>
                                <Input {...register('m_name')} placeholder="Middle name" />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Suffix</FieldLabel>
                            <FieldContent>
                                <Input {...register('suffix')} placeholder="Jr, III, etc." />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Birth date</FieldLabel>
                            <FieldContent>
                                <Input {...register('birthdate')} type="date" />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Gender</FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name="gender"
                                    render={({ field }) => (
                                        <Select onValueChange={(v) => field.onChange(v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genderOptions.map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Email</FieldLabel>
                            <FieldContent>
                                <Input {...register('email', { required: 'Email required' })} placeholder="Email" />
                                <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Address</FieldLabel>
                            <FieldContent>
                                <Input {...register('address')} placeholder="House no., Street, City" />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Primary contact</FieldLabel>
                            <FieldContent>
                                <Input {...register('pri_contact_no', { pattern: { value: /^\+?\d{7,15}$/, message: 'Invalid phone number' } })} placeholder="+639xxxxxxxxx" />
                                <FieldError errors={errors.pri_contact_no ? [{ message: errors.pri_contact_no.message }] : []} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Secondary contact</FieldLabel>
                            <FieldContent>
                                <Input {...register('sec_contact_no')} placeholder="Optional" />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Blood type</FieldLabel>
                            <FieldContent>
                                <Controller control={control} name="blood_type" render={({ field }) => (
                                    <Select onValueChange={(v) => field.onChange(v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select blood type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bloodTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Profile photo</FieldLabel>
                            <FieldContent>
                                <Input type="file" accept="image/*" {...register('image')} onChange={(e) => onImageChange(e.target.files || undefined)} />
                                {preview && <img src={preview} alt="preview" className="mt-2 h-24 w-24 rounded-full object-cover" />}
                            </FieldContent>
                        </Field>
                    </section>

                    {step === 2 && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Account</h2>

                            <Field>
                                <FieldLabel>Password</FieldLabel>
                                <FieldContent>
                                    <Input {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min length 8' } })} type="password" />
                                    <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Confirm password</FieldLabel>
                                <FieldContent>
                                    <Input {...register('confirm_password', { validate: (v) => (v === watch('password')) || "Passwords don't match" })} type="password" />
                                    <FieldError errors={errors.confirm_password ? [{ message: errors.confirm_password.message }] : []} />
                                </FieldContent>
                            </Field>

                            {/* removed account_status - the server sets the default account lifecycle state */}

                            <div className="flex justify-between">
                                <Button variant="ghost" onClick={() => prevStep()}>Back</Button>
                                <Button onClick={nextStep}>Next</Button>
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Emergency Contact</h2>


                            <div className="border-t pt-4">
                                <h3 className="mb-2 text-sm font-medium">Emergency contact</h3>
                                <Field>
                                    <FieldLabel>Name (given)</FieldLabel>
                                    <FieldContent>
                                        <Input {...register('ec_f_name')} placeholder="Given name" />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>Name (surname)</FieldLabel>
                                    <FieldContent>
                                        <Input {...register('ec_l_name')} placeholder="Surname" />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>Middle initial</FieldLabel>
                                    <FieldContent>
                                        <Input {...register('ec_m_name_init')} placeholder="M" />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Relationship</FieldLabel>
                                    <FieldContent>
                                        <Controller control={control} name="ec_relationship" render={({ field }) => (
                                            <Select onValueChange={(v) => field.onChange(v)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pick relationship" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {relationships.map(r => <SelectItem value={r} key={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Contact number</FieldLabel>
                                    <FieldContent>
                                        <Input {...register('ec_contact_no')} placeholder="Phone" />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Contact email</FieldLabel>
                                    <FieldContent>
                                        <Input {...register('ec_email')} placeholder="contact@example.com" />
                                    </FieldContent>
                                </Field>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <Button variant="ghost" onClick={() => prevStep()}>Back</Button>
                                <Button type="submit" disabled={isSubmitting}>Create account</Button>
                            </div>
                        </section>
                    )}
                </form>
            </div>
        </main>
    )
}
