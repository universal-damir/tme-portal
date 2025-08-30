# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack for faster builds)
- **Build**: `npm run build` (creates production build with standalone output for Docker)
- **Production server**: `npm start`
- **Linting**: `npm run lint` (ESLint with Next.js TypeScript rules)

## Architecture Overview

This is a Next.js 15 application built for TME Portal - a comprehensive UAE business setup services portal. The application provides cost calculation, document generation, and management tools for business services.

### Key Architecture Components

**Frontend Stack:**
- Next.js 15 with App Router architecture
- TypeScript with strict mode enabled
- Tailwind CSS for styling with shadcn/ui component library
- React 19 with server components and client components separation

**Backend & Data:**
- PostgreSQL database with connection pooling
- Redis for session storage and caching
- JWT-based authentication with bcrypt password hashing
- Custom RBAC (Role-Based Access Control) system

**Security Features:**
- Account lockout after failed login attempts
- Session management with auto-renewal
- Security headers (X-Frame-Options, CSP, etc.)
- Audit logging for user actions
- Password complexity validation

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components organized by feature domains
- `src/lib/` - Core business logic, utilities, and shared libraries
- `src/contexts/` - React context providers
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

### Major Feature Domains

1. **Portal Navigation** (`src/components/portal/`) - Main layout and navigation system
2. **Cost Overview** (`src/components/cost-overview/`) - UAE business setup cost calculations
3. **Golden Visa** (`src/components/golden-visa/`) - Golden visa application processing
4. **Company Services** (`src/components/company-services/`) - Business service offerings
5. **Taxation** (`src/components/taxation/`) - Tax consultation and filing
6. **PDF Generation** (`src/lib/pdf-generator/`) - Dynamic PDF document creation using @react-pdf/renderer
7. **AI Assistant** (`src/components/ai-assistant/`) - Integrated AI chat functionality

### Database Schema

The application uses PostgreSQL with the following core tables:
- `users` - User accounts with role-based permissions
- `sessions` - Active user sessions
- `audit_logs` - Security and action audit trail

### Authentication Flow

1. Email/password authentication with bcrypt verification
2. JWT session tokens stored in secure HTTP-only cookies
3. Redis-backed session storage for performance
4. Account lockout protection after 5 failed attempts
5. Session auto-renewal for active users

### Authority Configuration System

The app includes a flexible authority cost calculator system (`src/lib/authorities/`) that supports multiple UAE free zones and government departments with configurable pricing structures.

### PDF Generation System

Comprehensive PDF generation system that creates professional documents including cost breakdowns, service agreements, and compliance documentation. Uses React components to generate PDFs with consistent branding.

## UI Design System Standards

**IMPORTANT: All new UI components and modifications must follow these standardized design patterns established in the Golden Visa redesign.**

### Design System Foundation

**Color Palette:**
- **Primary Blue**: `#243F7B` - Use for labels, borders, focus states, primary buttons, and selected states
- **Secondary Beige**: `#D2BC99` - Use for secondary buttons, accents, and highlighted states
- **Typography**: Inter font family (`style={{ fontFamily: 'Inter, sans-serif' }}`)
- **Font Weights**: `font-medium` for labels, `font-semibold` for headings

### Form Component Standards

**Input Field Standardization:**
```jsx
// Standard input field dimensions and styling
className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
onFocus={(e) => e.target.style.borderColor = '#243F7B'}
onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
```

**Label Standardization:**
```jsx
// Standard label styling
className="block text-sm font-medium mb-1" 
style={{ color: '#243F7B' }}
```

**Error Message Standardization:**
```jsx
// Standard error text
className="text-red-500 text-xs mt-1"
```

### Component Layout Patterns

**Form Section Spacing:**
- Use `space-y-4` for section content (not `space-y-6`)
- Use `mb-1` for label margins (not `mb-2`)
- Use `gap-4` for grid layouts

**Responsive Grid Patterns:**
```jsx
// 3-column layout for compact forms
className="grid grid-cols-1 lg:grid-cols-3 gap-4"

// 2-column layout for related fields
className="grid grid-cols-1 lg:grid-cols-2 gap-4" 

// Inline flex for closely related controls
className="flex items-start gap-2"
```

**Form Field Sizing:**
- **Standard inputs**: `h-[42px]` with `px-3 py-2`
- **Narrow numeric inputs**: `w-28` (112px) for small numbers like exchange rates
- **Radio/checkbox containers**: Match input height with `h-[42px]`

### Interactive Element Standards

**Button Styling:**
```jsx
// Primary button
className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg"
style={{ backgroundColor: '#243F7B' }}

// Secondary button  
className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
```

**Animation Standards:**
- Use Framer Motion for all interactive elements
- Standard hover: `whileHover={{ scale: 1.02 }}`
- Standard tap: `whileTap={{ scale: 0.98 }}`
- Form focus: `whileFocus={{ scale: 1.01 }}`
- Section animations: `initial={{ opacity: 0, y: 20 }}, animate={{ opacity: 1, y: 0 }}`

**Radio Button/Checkbox Styling:**
```jsx
// Custom radio button container
className="w-4 h-4 rounded-full border-2 transition-all duration-200"
style={{ borderColor: isSelected ? '#243F7B' : '#d1d5db' }}

// Custom checkbox container  
className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
style={{ borderColor: isChecked ? '#243F7B' : '#d1d5db', backgroundColor: isChecked ? '#243F7B' : 'white' }}
```

### Legacy Component Migration

**Replace These Legacy Patterns:**
- ❌ `shadcn/ui` components (Button, Calendar, Popover) - Replace with custom styled components
- ❌ `space-y-6` spacing - Use `space-y-4` for compact layouts
- ❌ `py-3` input padding - Use `py-2` with `h-[42px]`
- ❌ `mb-2` label margins - Use `mb-1` for compact spacing
- ❌ Large radio button gaps - Use inline layouts with borders
- ❌ Excessive white space - Prioritize horizontal space efficiency

**Required for All New Components:**
- ✅ Framer Motion animations on interactive elements
- ✅ TME color palette (#243F7B, #D2BC99)
- ✅ Inter font family specification
- ✅ Standardized input heights (42px)
- ✅ Consistent focus states with color transitions
- ✅ Responsive grid layouts that stack properly
- ✅ Compact, professional spacing

### Calendar/Date Picker Standards

**Custom Date Picker Implementation:**
- Use custom calendar implementation (not shadcn Calendar)
- Match input field styling exactly (`h-[42px]`, `px-3 py-2`)
- TME color scheme for selected dates and navigation
- Compact calendar popup with proper animations

### Implementation Notes

- Always prioritize **horizontal space efficiency** over vertical layouts
- Group related fields logically (currency + exchange rate together)
- Use appropriate field widths (narrow for small numbers, full-width for text)
- Maintain **visual symmetry** - all interactive elements should align properly
- Test responsive behavior on all screen sizes

## Development Notes

- The app uses strict TypeScript configuration with path aliases (`@/*` maps to `src/*`)
- Component organization follows domain-driven design principles
- All user inputs are validated using Zod schemas
- Database queries use prepared statements to prevent SQL injection
- Docker deployment with security hardening is supported
- The application includes comprehensive error handling and logging