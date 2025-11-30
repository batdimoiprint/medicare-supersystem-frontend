import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { differenceInYears, format } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import { useState } from 'react'
import bcrypt from 'bcryptjs'

type RegistrationForm = {
  f_name: string
  l_name: string
  m_name?: string
  suffix?: string
  birthdate: Date | undefined
  gender: string
  email?: string
  password: string
  confirm_password?: string
  house_no?: string
  street: string
  barangay?: string
  city: string
  country?: string
  blood_type?: string
  pri_contact_no: string
  sec_contact_no?: string
  ec_f_name: string
  ec_l_name: string
  ec_m_name?: string
  ec_contact_no: string
  ec_relationship: string
  ec_email?: string
}

export default function RegisterPage() {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RegistrationForm>({ mode: 'onBlur' })
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const birthdate = watch('birthdate')
  const password = watch('password')
  const age = birthdate ? differenceInYears(new Date(), birthdate) : null

  function normalizePhone(raw?: string) {
    if (!raw) return ''
    const trimmed = raw.trim()
    if (trimmed.startsWith('+')) return trimmed.replace(/\s+/g, '')
    let digits = trimmed.replace(/\D/g, '')
    digits = digits.replace(/^0+/, '')
    if (digits.startsWith('63')) return `+${digits}`
    if (digits.length === 10 && digits.startsWith('9')) return `+63${digits}`
    if (digits.length === 10) return `+63${digits}`
    return `+63${digits}`
  }

  async function onSubmit(data: RegistrationForm) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      data.pri_contact_no = normalizePhone(data.pri_contact_no)
      if (data.sec_contact_no) {
        data.sec_contact_no = normalizePhone(data.sec_contact_no)
      }
      const ecContactNo = normalizePhone(data.ec_contact_no)

      const formattedBirthdate = data.birthdate ? format(data.birthdate, 'yyyy-MM-dd') : null

      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(data.password, saltRounds)

      const tempData = {
        ...data,
        pri_contact_no: data.pri_contact_no,
        sec_contact_no: data.sec_contact_no,
        ec_contact_no: ecContactNo,
        birthdate: formattedBirthdate,
        password: hashedPassword
      }

      localStorage.setItem("pending_registration", JSON.stringify(tempData))

      // ✅ Use VITE_SITE_URL for redirect
      const redirectUrl =
        import.meta.env.MODE === "development"
          ? "http://localhost:5173/verify"
          : `${import.meta.env.VITE_SITE_URL}/verify`

      const { error: authError } = await supabase.auth.signUp({
        email: data.email!,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (authError) throw new Error(authError.message)

      alert("A verification email has been sent! Please check your inbox.")
      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password strength logic
  const getStrength = (pass: string) => {
    let score = 0
    if (!pass) return 0
    if (pass.length > 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }

  const strength = getStrength(password || "")
  const strengthColor = ['bg-border', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strengthText = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong']

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
                    {submitError && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive text-destructive px-4 py-3 text-sm">
                            {submitError}
                        </div>
                    )}

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
                                <FieldLabel>Middle name</FieldLabel>
                                <FieldContent>
                                    <Input {...register('m_name')} placeholder="e.g. Dela (Optional)" className="w-full" />
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
                                <FieldLabel>Email</FieldLabel>
                                <FieldContent>
                                    <Input {...register('email', {
                                        pattern: {
                                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                            message: 'Invalid email address',
                                        },
                                    })} placeholder="e.g. juan@example.com (Optional)" className="w-full" />
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
                                <FieldLabel>Blood type</FieldLabel>
                                <FieldContent>
                                    <Controller control={control} name="blood_type" render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                                            <SelectContent>
                                                {bloodTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )} />
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 3: Address (Composite) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Field>
                                <FieldLabel>House No.</FieldLabel>
                                <FieldContent>
                                    <Input {...register('house_no')} placeholder="e.g. 123 (Optional)" className="w-full" />
                                </FieldContent>
                            </Field>
                            <Field className="lg:col-span-2">
                                <FieldLabel>Street <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('street', { required: 'Street required' })} placeholder="e.g. Rizal St." className="w-full" />
                                    <FieldError errors={errors.street ? [{ message: errors.street.message }] : []} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>Barangay</FieldLabel>
                                <FieldContent>
                                    <Input {...register('barangay')} placeholder="e.g. San Jose (Optional)" className="w-full" />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>City <span className="text-red-500">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register('city', { required: 'City required' })} placeholder="e.g. Manila" className="w-full" />
                                    <FieldError errors={errors.city ? [{ message: errors.city.message }] : []} />
                                </FieldContent>
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel>Country</FieldLabel>
                            <FieldContent>
                                <Input {...register('country')} placeholder="e.g. Philippines (Optional)" className="w-full" />
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
                                <FieldLabel>Middle name</FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_m_name')} placeholder="e.g. Agustin (Optional)" className="w-full" />
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
                                <FieldLabel>Email</FieldLabel>
                                <FieldContent>
                                    <Input {...register('ec_email', {
                                        pattern: {
                                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                            message: 'Invalid email address',
                                        },
                                    })} placeholder="e.g. contact@example.com (Optional)" className="w-full" />
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
                        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    )
}
