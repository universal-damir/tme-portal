# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack for faster builds)
- **Build**: `npm run build` (creates production build with standalone output for Docker)
- **Production server**: `npm start`
- **Linting**: `npm run lint` (ESLint with Next.js TypeScript rules)

## Architecture Overview

This is a Next.js 15 application built for TME Portal v5.2 - a comprehensive UAE business setup services portal. The application provides cost calculation, document generation, and management tools for business services.

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

## Development Notes

- The app uses strict TypeScript configuration with path aliases (`@/*` maps to `src/*`)
- Component organization follows domain-driven design principles
- All user inputs are validated using Zod schemas
- Database queries use prepared statements to prevent SQL injection
- Docker deployment with security hardening is supported
- The application includes comprehensive error handling and logging