# Medicare SuperSystem Frontend - AI Coding Agent Instructions

## Project Overview
Multi-backend dental clinic management system with role-segregated frontends. This React frontend integrates with **3 separate backends**: Django (appointments/payments), Flask (patient records/EMR), and Supabase (inventory/dentist system). Each role (Patient, Admin, Front Desk, Inventory, Dentist) has isolated routes and will eventually connect to specific backend services.

## Tech Stack & Build System
- **React 19** + **TypeScript 5.9** + **Vite 7** 
- **pnpm** (not npm/yarn) - use `pnpm install`, `pnpm run dev`, `pnpm run build`
- **Tailwind CSS 4** with custom CSS variables via `@theme inline` in `src/index.css`
- **React Router v7** (not v6) - uses standard `<Routes>` and `<Route>` components (no data routers yet)
- **shadcn/ui** components from multiple registries (see `components.json`)

## Critical Path Aliases
All imports use `@/` prefix configured in `vite.config.ts` and `tsconfig.json`:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import AdminPage from "@/pages/admin/AdminPage"
```

## Component Architecture Patterns

### 1. shadcn/ui Component System
- Located in `src/components/ui/` - **DO NOT manually edit** unless customizing
- Add new components: `pnpm dlx shadcn@latest add <component-name>`
- Multiple registries configured: `@shadcn-studio`, `@shadcnblocks`, `@shadcndesign`, `@react-bits`
- Components use **class-variance-authority (CVA)** for variant styling:
```typescript
const buttonVariants = cva("base-classes", {
  variants: { variant: { default: "...", destructive: "..." } }
})
```

### 2. Form Field Pattern (Critical Convention)
Use the **Field composition pattern** from `@/components/ui/field` for all forms:
```tsx
<Field orientation="vertical">
  <FieldLabel>Username</FieldLabel>
  <Input placeholder="Enter username" />
  <FieldDescription>Your public display name</FieldDescription>
  <FieldError errors={errors} />
</Field>
```
- Supports `orientation="vertical" | "horizontal" | "responsive"` for layout
- `FieldError` auto-renders React Hook Form errors array
- Built-in `aria-invalid` and accessibility support

### 3. Styling Utilities
- **Always use `cn()` utility** when merging Tailwind classes:
```tsx
<div className={cn("base-classes", conditionalClasses, className)} />
```
- CSS variables defined in `src/index.css` with light/dark modes
- Custom scrollbar styling via `::-webkit-scrollbar` (see `src/index.css`)

## Routing & Page Structure

### Current Route Layout (`src/routes/routes.tsx`)
```
/ (LandingPage - public)
├── /patient        → PatientPage
├── /frontdesk      → FrontDeskPage  
├── /inventory      → InventoryPage (will use Supabase)
├── /dentist        → DentistPage (will use Supabase)
└── /admin          → AdminPage
```
**Note**: All public routes (`/login`, `/register`, `/services`, etc.) currently render `LandingPage` - authentication/routing guards not yet implemented.

### Adding New Routes
1. Create page component in `src/pages/{role}/`
2. Add route in `src/routes/routes.tsx`
3. Follow role-based path prefixes (`/patient/*`, `/admin/*`, etc.)

## Backend Integration (Not Yet Implemented)
When implementing API calls:
- **Django** (`VITE_ENV_BACKEND_DJANGO_URL`): Appointments, scheduling, reservation fee payments
- **Flask** (`VITE_ENV_BACKEND_FLASK_URL`): Patient records, EMR, treatment histories  
- **Supabase** (`VITE_ENV_SUPABASE_URL`): Inventory management, dentist system
- Use **TanStack React Query** for server state (already in dependencies)
- Supabase real-time subscriptions should invalidate React Query cache

## Dark Mode Implementation
- Managed by `ThemeProvider` in `src/components/theme-provider.tsx`
- Uses `localStorage` key `"vite-ui-theme"` (default: `"dark"`)
- `ModeToggle` component toggles light/dark/system modes
- Theme classes applied to `<html>` element (`class="dark"` or `class="light"`)

## Development Workflow

### Essential Commands
```bash
pnpm install              # Install dependencies
pnpm run dev              # Start dev server (http://localhost:5173)
pnpm run build            # TypeScript compile + Vite build
pnpm run preview          # Preview production build
pnpm run lint             # ESLint (TypeScript + React Hooks + React Refresh)
pnpm dlx shadcn@latest add <name>  # Add shadcn component
```

### Common Gotchas
- **Import paths**: Always use `@/` prefix, never relative `../../`
- **Button icons**: Use `<Button asChild>` pattern for icon-only buttons
- **Radix primitives**: shadcn components are wrappers - check Radix UI docs for advanced props
- **Tailwind v4**: Uses new `@theme inline` syntax in CSS (not old `tailwind.config.js`)

## File Organization Conventions
```
src/
├── components/
│   ├── ui/              # shadcn components (managed via CLI)
│   ├── shared/          # Business logic components (headers, sidebars)
│   │   ├── headers/
│   │   ├── sidebars/
│   │   └── public/
│   ├── landing/         # Landing page specific components
│   ├── mode-toggle.tsx  # Theme switcher
│   └── theme-provider.tsx
├── pages/               # Route components (one per role)
├── lib/
│   └── utils.ts         # cn() utility
└── routes/
    └── routes.tsx       # Central route definitions
```

## Animation Libraries
- **Framer Motion** for complex animations (`framer-motion` v12.23.24)
- **GSAP** for scroll/timeline animations (`gsap` v3.13.0)
- **tw-animate-css** for Tailwind animation utilities
- Example: `BlurText` component uses Framer Motion variants

## When Adding Features
1. **Forms**: Use React Hook Form + Field components from `@/components/ui/field`
2. **Buttons/UI**: Check shadcn registries before building custom components
3. **Icons**: Use `lucide-react` (already imported in most UI components)
4. **API calls**: Set up TanStack React Query hooks in `src/lib/api/` (create this directory)
5. **Types**: Add to `src/types/` directory (create as needed)

## Accessibility Requirements
- All interactive components use Radix UI primitives (WCAG compliant)
- Forms must use `aria-invalid` and proper error announcements (Field components handle this)
- Test keyboard navigation for all new features
