# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Damon Music Academy is a comprehensive music education platform built with React 18, TypeScript, and Supabase. The application serves multiple user types (students, teachers, admins) with role-based access control and features course management, event coordination, a shop system, and professional services.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on port 8080 (configured in vite.config.ts)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing and Development
- `npm run type-check` - TypeScript type checking (if available)
- Development server runs on `http://localhost:8080` with host "::" for network access

### Database Operations
- SQL files in root directory are for debugging and database management
- `check_role.sql` - Query user roles across multiple tables
- `fix_teacher_trigger.sql` - Database trigger for user role assignment
- `test_teacher_bookings.sql` and `debug_teacher_bookings.sql` - Teacher-specific database operations

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Query (@tanstack/react-query) + React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor

### Key Architectural Patterns

#### Role-Based Access Control
The application implements a sophisticated role system:
- **Profiles Table**: Central user management with roles (student, teacher, admin)
- **Teacher Approval Flow**: Teachers register → pending_teachers table → admin approval → teachers table
- **Automatic Role Assignment**: Database triggers assign roles based on table presence
- **Route Protection**: Role-based routing in App.tsx with specialized dashboards

#### Authentication Flow
Located in `src/hooks/useAuth.tsx`:
- **Session Management**: Automatic token refresh and expiration handling
- **Persistent State**: Manages authentication state across browser refreshes
- **Clean Logout**: Comprehensive cleanup of localStorage and session data
- **Error Handling**: Graceful handling of expired sessions with redirects

#### Database Schema Design
Key tables include:
- `profiles` - Central user management
- `teachers` / `pending_teachers` - Teacher approval workflow
- `registrations` - Student course enrollments
- `events` / `news` - Content management
- `quotes` - Professional services quote system

### Component Architecture

#### Page Structure
Pages are located in `src/pages/` and follow role-based organization:
- **Public Pages**: Index, About, Courses, Services, Gallery, Shop
- **Auth Pages**: Auth, Registration, TeacherSignup
- **Role-Specific**: StudentDashboard, TeacherDashboard, Admin
- **Content Pages**: Events, News, FAQ
- **Legal Pages**: Privacy Policy, Terms of Service, etc.

#### Component Organization
- `src/components/ui/` - shadcn/ui components (Button, Dialog, etc.)
- `src/components/auth/` - Authentication-related components
- `src/components/` - Feature-specific components (AdminPanel, LessonScheduler, etc.)

#### State Management Pattern
- **Authentication**: Global context via AuthProvider
- **Server State**: React Query for data fetching and caching
- **Local State**: React useState/useReducer for component-specific state
- **Forms**: React Hook Form with Zod schemas for validation

### Integration Patterns

#### Supabase Integration
Located in `src/integrations/supabase/`:
- **Client**: Pre-configured Supabase client with TypeScript types
- **Types**: Auto-generated TypeScript interfaces from database schema
- **Environment**: Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

#### Styling System
- **Design Tokens**: CSS variables in Tailwind config for consistent theming
- **Component Variants**: class-variance-authority for component styling patterns
- **Responsive Design**: Mobile-first approach with Tailwind responsive utilities
- **Typography**: @tailwindcss/typography plugin for rich content formatting

## File Structure Conventions

### Import Aliases
Configured in tsconfig.json and vite.config.ts:
- `@/*` maps to `./src/*`
- Enables clean imports: `@/components/ui/button`

### TypeScript Configuration
- **Strict Mode**: Disabled for flexibility (noImplicitAny: false)
- **Path Mapping**: Absolute imports from src directory
- **Lib Checking**: Disabled for faster builds (skipLibCheck: true)

### Environment Variables
Required for Supabase connection:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Development Workflow

### Code Organization Principles
- **Feature-First**: Components organized by feature rather than type
- **Separation of Concerns**: Clear separation between UI, business logic, and data layers
- **Reusability**: Shared UI components in components/ui/
- **Type Safety**: Comprehensive TypeScript usage with Supabase-generated types

### Database Development
- Use SQL files in root for database operations and debugging
- Teacher approval workflow requires understanding of pending_teachers → teachers flow
- Role assignment happens automatically via database triggers

### Authentication Development
- Always test with different user roles (student, teacher, admin)
- Handle session expiration gracefully
- Clear all cached data on logout for security

### UI Development
- Follow shadcn/ui patterns for consistency
- Use Tailwind CSS variables for theming
- Implement responsive design with mobile-first approach
- Leverage existing component variants before creating new ones

## Common Development Patterns

### Data Fetching
```typescript
// Use React Query for server state
const { data, loading, error } = useQuery({
  queryKey: ['events'],
  queryFn: () => supabase.from('events').select('*')
});
```

### Form Handling
```typescript
// React Hook Form with Zod validation
const form = useForm<FormData>({
  resolver: zodResolver(schema)
});
```

### Role-Based Rendering
```typescript
// Check user role in components
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
```

### Error Handling
- Use toast notifications for user feedback (Sonner)
- Implement graceful error boundaries
- Log errors appropriately without exposing sensitive data
