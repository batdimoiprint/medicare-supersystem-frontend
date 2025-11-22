import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { differenceInYears } from 'date-fns'
import { Link } from 'react-router-dom'

type RegistrationForm = {
    f_name: string
    l_name: string
    m_name: string
    suffix?: string
    birthdate: Date | undefined
    gender: string
    email: string
    password: string
    confirm_password?: string
    address: string
    blood_type: string
    pri_contact_no: string
    sec_contact_no?: string
    ec_f_name: string
    ec_l_name: string
    ec_m_name_init: string
    ec_contact_no: string
    ec_relationship: string
    ec_email: string
}

export default function RegisterPage() {
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RegistrationForm>({ mode: 'onBlur' })

    const birthdate = watch('birthdate')
    const password = watch('password')
    const age = birthdate ? differenceInYears(new Date(), birthdate) : null

    function normalizePhone(raw?: string) {
        if (!raw) return ''
        const trimmed = raw.trim()

        // quick-return when already in +63 form (or another +country) — remove whitespace
        if (trimmed.startsWith('+')) return trimmed.replace(/\s+/g, '')

        // keep only digits
        let digits = trimmed.replace(/\D/g, '')

        // remove leading zeros
        digits = digits.replace(/^0+/, '')

        // if it already contains a country prefix (63...), return with +
        if (digits.startsWith('63')) return `+${digits}`

        // if the user typed the national (10-digit) number starting with 9 (e.g. 9123456789)
        if (digits.length === 10 && digits.startsWith('9')) return `+63${digits}`

        // if someone typed 11-digit local with leading 0 (e.g. 09123456789) we've stripped zeros above
        if (digits.length === 10) return `+63${digits}`

        // fallback — prefix with +63
        return `+63${digits}`
    }

    async function onSubmit(data: RegistrationForm) {
        // normalize primary and secondary contact so final payload always contains +639... form
        data.pri_contact_no = normalizePhone(data.pri_contact_no)
        if (data.sec_contact_no) {
            data.sec_contact_no = normalizePhone(data.sec_contact_no)
        }

        // No server — temporarily store in localStorage for quick testing
        console.log('Registration', data)
        alert('Registration submitted (no backend). Review console for data.')
    }

    // Password strength logic
    const getStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    }

    const strength = getStrength(password || "");
    const strengthColor = ['bg-border', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthText = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong'];

    const genderOptions = ['Male', 'Female', 'LGBTQIA+', 'Prefer Not to Say']
    const bloodTypes = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-', 'Unspecified']
    const relationships = ['Parent', 'Child', 'Relative', 'Spouse', 'Friend', 'Sibling', 'Guardian', 'Others', 'Unspecified']

    return (
        <main className="mx-auto ">
            <div className="rounded-2xl bg-card p-8 shadow-lg">
                <header className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold text-foreground">Create your account</h1>
                    <p className="text-muted-foreground text-balance">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Log in
                        </Link>
                    </p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <section className="space-y-6">
                        <Label className="text-lg font-semibold text-foreground">Patient Details</Label>

                        {/* Row 1: Identity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <Field className="lg:col-span-1">
                                <FieldLabel>First name <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('f_name', { required: 'First name required' })} placeholder="e.g. Juan" className="w-full" />
                                    <FieldError errors={errors.f_name ? [{ message: errors.f_name.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-1">
                                <FieldLabel>Middle name <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('m_name', { required: 'Middle name required' })} placeholder="e.g. Dela" className="w-full" />
                                    <FieldError errors={errors.m_name ? [{ message: errors.m_name.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-1">
                                <FieldLabel>Last name <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('l_name', { required: 'Last name required' })} placeholder="e.g. Cruz" className="w-full" />
                                    <FieldError errors={errors.l_name ? [{ message: errors.l_name.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-1">
                                <FieldLabel>Suffix</FieldLabel>
                                <FieldContent>
                                    <Input {...register('suffix')} placeholder="Optional" className="w-full" />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-1">
                                <FieldLabel>
                                    Birth date <span className="text-red-500">*</span>
                                    {age !== null && <span className="ml-2 text-xs font-normal text-muted-foreground">({age} yrs)</span>}
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="birthdate"
                                        rules={{ required: 'Birth date required' }}
                                        render={({ field }) => (
                                            <DatePicker
                                                id="birthdate"
                                                value={field.value}
                                                onChange={(d) => {
                                                    // keep the same shape as the previous Calendar onSelect
                                                    field.onChange(d)
                                                }}
                                                placeholder="Pick a date"
                                                className="w-full"
                                            />
                                        )}
                                    />
                                    <FieldError errors={errors.birthdate ? [{ message: errors.birthdate.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-1">
                                <FieldLabel>Gender <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="gender"
                                        rules={{ required: 'Gender required' }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {genderOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <FieldError errors={errors.gender ? [{ message: errors.gender.message }] : []} />
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 2: Contact & Blood Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field>
                                <FieldLabel>Email <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('email', {
                                        required: 'Email required',
                                        pattern: {
                                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                            message: 'Invalid email address',
                                        },
                                    })} placeholder="e.g. juan@example.com" className="w-full" />
                                    <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Primary contact <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <div className="flex items-stretch gap-2">
                                        <Label >+63</Label>
                                        <Input
                                            {...register('pri_contact_no', {
                                                required: 'Contact required',
                                                pattern: {
                                                    value: /^\d{10}$/,
                                                    message: 'Must be exactly 10 digits',
                                                },
                                            })}
                                            placeholder="e.g. 9123456789"
                                            className="w-full rounded-l-none"
                                            maxLength={10}
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <FieldError errors={errors.pri_contact_no ? [{ message: errors.pri_contact_no.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Secondary contact</FieldLabel>
                                <FieldContent>
                                    <div className="flex items-stretch gap-2">
                                        <Label >+63</Label>
                                        <Input
                                            {...register('sec_contact_no', {
                                                pattern: {
                                                    value: /^\d{10}$/,
                                                    message: 'Must be exactly 10 digits',
                                                },
                                            })}
                                            placeholder="Optional (e.g. 9123456789)"
                                            className="w-full rounded-l-none"
                                            maxLength={10}
                                            inputMode="numeric"
                                        />
                                    </div>
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Blood type <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Controller control={control} name="blood_type" rules={{ required: 'Blood type required' }} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                {bloodTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <FieldError errors={errors.blood_type ? [{ message: errors.blood_type.message }] : []} />
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 3: Address */}
                        <Field>
                            <FieldLabel>Address <span className="text-red-500">*</span></FieldLabel>
                            <FieldContent>
                                <Input {...register('address', { required: 'Address required' })} placeholder="e.g. 123 Rizal St, Brgy. San Jose, Manila" className="w-full" />
                                <FieldError errors={errors.address ? [{ message: errors.address.message }] : []} />
                            </FieldContent>
                        </Field>
                    </section>

                    <section className="space-y-6">
                        <Label className="text-lg font-semibold text-foreground">Emergency Contact</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field>
                                <FieldLabel>Given Name <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_f_name', { required: 'Required' })} placeholder="e.g. Maria" className="w-full" />
                                    <FieldError errors={errors.ec_f_name ? [{ message: errors.ec_f_name.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>M.I. <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_m_name_init', { required: 'Required' })} placeholder="e.g. A" className="w-full" />
                                    <FieldError errors={errors.ec_m_name_init ? [{ message: errors.ec_m_name_init.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Surname <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_l_name', { required: 'Required' })} placeholder="e.g. Santos" className="w-full" />
                                    <FieldError errors={errors.ec_l_name ? [{ message: errors.ec_l_name.message }] : []} />
                                </FieldContent>
                            </Field>

                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field>
                                <FieldLabel>Relationship <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Controller control={control} name="ec_relationship" rules={{ required: 'Required' }} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                {relationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )} />
                                    <FieldError errors={errors.ec_relationship ? [{ message: errors.ec_relationship.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Contact No. <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <div className="flex items-stretch gap-2">
                                        <Label >+63</Label>
                                        <Input
                                            {...register('ec_contact_no', {
                                                required: 'Required',
                                                pattern: {
                                                    value: /^\d{10}$/,
                                                    message: 'Must be exactly 10 digits',
                                                },
                                            })}
                                            placeholder="e.g. 9123456789"
                                            className="w-full rounded-l-none"
                                            maxLength={10}
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <FieldError errors={errors.ec_contact_no ? [{ message: errors.ec_contact_no.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Email <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_email', {
                                        required: 'Required',
                                        pattern: {
                                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                            message: 'Invalid email address',
                                        },

                                    })} placeholder="e.g. contact@example.com" className="w-full" />
                                    <FieldError errors={errors.ec_email ? [{ message: errors.ec_email.message }] : []} />
                                </FieldContent>
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <Label className="text-lg font-semibold text-foreground">Account Security</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Password <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} type="password" placeholder="********" className="w-full" />
                                    <div className="mt-2 flex gap-1 h-1">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className={`h-full flex-1 rounded-full transition-colors ${i < strength ? strengthColor[strength] : 'bg-muted'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{strengthText[strength]}</p>
                                    <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Confirm password <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('confirm_password', { validate: v => v === watch('password') || "Mismatch" })} type="password" placeholder="********" className="w-full" />
                                    <FieldError errors={errors.confirm_password ? [{ message: errors.confirm_password.message }] : []} />
                                </FieldContent>
                            </Field>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" className="w-full md:w-auto">Create Account</Button>
                    </div>
                </form>
            </div>
        </main>
    )
}
