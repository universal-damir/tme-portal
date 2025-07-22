# TME Portal v5.2 - Claude Context Guide

## Project Overview
**TME Portal v5.2** is a professional UAE Business Setup Services Portal built with Next.js 15, TypeScript, and React 19. It provides comprehensive cost calculation, PDF generation, and business service management for UAE company setup and compliance services.

## Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS with Shadcn/ui components (New York style)
- **PDF Generation**: @react-pdf/renderer v4.3.0
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner toasts
- **Date Handling**: date-fns

## Architecture Overview

### Tab-Based Portal System
The portal is organized into 5 main tabs:
- **Cost Overview**: UAE business setup cost calculations
- **Golden Visa**: Golden visa application processing  
- **Company Services**: Annual accounting, compliance, and business services
- **Corporate Changes**: Company structure modifications
- **Taxation**: Tax consultation and CIT filing

### Core Directory Structure
```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── portal/            # Main portal layout and navigation
│   ├── cost-overview/     # Cost calculation components
│   ├── golden-visa/       # Golden visa components
│   ├── company-services/  # Business services components
│   ├── taxation/          # Tax-related components
│   └── ui/               # Shadcn/ui components
├── contexts/              # React contexts (SharedClientContext)
├── hooks/                 # Custom React hooks
├── lib/
│   ├── authorities/       # Authority-specific cost calculators
│   ├── pdf-generator/     # PDF generation system
│   └── utils.ts          # Common utilities
└── types/                 # TypeScript type definitions
```

## Key Components & Patterns

### Shared State Management
- **SharedClientContext**: Manages client information across all tabs
- **Auto-save functionality**: Automatically saves form data to localStorage
- **Tab navigation**: Tracks visited/completed tabs

### Component Architecture Patterns
```typescript
// Standard component structure
interface ComponentProps {
  // Props definition
}

export const Component = ({ }: ComponentProps) => {
  // Hooks first
  // Event handlers with "handle" prefix
  // Early returns for loading/error states
  // JSX with Tailwind classes
}
```

### Utility Functions
- `cn()`: Combines Tailwind classes using clsx + tailwind-merge
- `formatCurrency()`: Formats numbers as AED currency
- `formatDate()`: Formats dates to DD/MM/YYYY or DD.MM.YYYY

## Code Style Guidelines

### TypeScript
- Use strict typing with interfaces over types
- Define clear prop interfaces for all components
- Use const assertions for readonly arrays
- Prefer `Record<string, T>` for object mappings

### React Patterns
- Use functional components with hooks
- Prefix event handlers with "handle" (e.g., `handleClick`, `handleSubmit`)
- Use early returns for better readability
- Implement proper error boundaries

### Styling
- **Always use Tailwind classes** - avoid CSS modules or styled components
- Use `cn()` utility for conditional classes
- Follow Shadcn/ui component patterns
- Use CSS variables for theming (defined in globals.css)

### File Organization
- Group related files in feature folders
- Use index.ts files for clean exports
- Separate hooks, utils, and types by feature
- Keep components focused and single-purpose

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint

# Shadcn/ui components
npx shadcn@latest add [component]  # Add new UI component
```

## PDF Generation System

### Architecture
- **Document Templates**: React components that render to PDF
- **Data Transformers**: Convert form data to PDF-ready format
- **Generators**: Orchestrate document creation and download
- **Branding Configs**: TME FZCO vs Management Consultants styling

### Key Files
- `src/lib/pdf-generator/generator.ts`: Main PDF orchestration
- `src/lib/pdf-generator/components/`: PDF document templates
- `src/lib/pdf-generator/utils/`: Data transformation utilities

## Authority Cost Calculation System

### Design Pattern
- **Factory Pattern**: `calculator-factory.ts` creates authority-specific calculators
- **Strategy Pattern**: Each authority (DET, IFZA, etc.) implements `CostCalculator` interface
- **Registry**: Centralized authority registration in `registry.ts`

### Adding New Authority
1. Create calculator class implementing `CostCalculator`
2. Register in `registry.ts`
3. Add to authority constants

## Testing & Quality

### Linting
- ESLint configuration for Next.js and TypeScript
- Custom rules for React hooks and accessibility
- Tailwind class ordering

### Form Validation
- Zod schemas for type-safe validation
- React Hook Form integration
- Real-time validation feedback

## Repository Etiquette

### Branch Naming
- `feature/feature-name`: New features
- `fix/bug-description`: Bug fixes
- `refactor/component-name`: Code refactoring
- `docs/update-description`: Documentation updates

### Commit Messages
- Use conventional commits format
- `feat:`, `fix:`, `docs:`, `refactor:`, `test:` prefixes
- Keep messages concise and descriptive

### Code Review Guidelines
- Ensure TypeScript strict compliance
- Verify Tailwind-only styling
- Check component prop interfaces
- Test PDF generation functionality
- Validate form submissions and error handling

## Special Behaviors & Warnings

### PDF Generation
- Large PDFs may take 10-15 seconds to generate
- Images must be base64 encoded or accessible via public URL
- Complex tables can cause layout issues - test thoroughly

### Form Auto-save
- Data automatically saves to localStorage every 2 seconds
- Clear saved data when navigating away from portal
- Handle localStorage quota exceeded errors

### Authority Calculations
- Cost calculations are authority-specific and complex
- Always validate calculations against official fee schedules
- Test edge cases (0 shareholders, multiple visa types, etc.)

### Component State
- Use React.memo() sparingly - only for expensive computations
- Prefer server components where possible
- Keep client components minimal and focused

## Environment Configuration

### Required Environment Variables
```bash
# Add to .env.local if needed
NEXT_PUBLIC_APP_VERSION=5.2
```

### Import Aliases
```typescript
@/components  # src/components
@/lib         # src/lib  
@/hooks       # src/hooks
@/types       # src/types
@/utils       # src/lib/utils
```

## Common Patterns to Remember

### Form Components
- Always use React Hook Form with Zod validation
- Implement proper error states and loading indicators
- Use Shadcn/ui form components consistently

### Data Flow
- Props down, events up pattern
- Use contexts sparingly for truly global state
- Prefer local state management where possible

### Error Handling
- Implement proper error boundaries
- Use toast notifications for user feedback
- Log errors appropriately for debugging

---

*This guide should be kept up-to-date as the project evolves. Focus on patterns, conventions, and project-specific behaviors that aren't obvious from the code.* 