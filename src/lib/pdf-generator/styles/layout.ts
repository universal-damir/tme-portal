// Layout styles extracted from the original PDF generator
import { theme } from './theme';

export const layoutStyles = {
  // Page layout
  page: {
    flexDirection: 'column' as const,
    backgroundColor: theme.colors.background.white,
    padding: theme.spacing.xl,
    fontFamily: theme.fonts.primary,
    minHeight: '100vh',
    justifyContent: 'space-between' as const,
  },
  
  // Header
  header: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center' as const,
    borderBottom: `1px solid ${theme.colors.border.light}`,
    paddingBottom: theme.spacing.sm,
  },
  
  logo: {
    width: 72,
    height: 72,
    marginBottom: theme.spacing.sm,
    alignSelf: 'center' as const,
  },
  
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold' as const,
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
    letterSpacing: theme.letterSpacing.wide,
  },
  
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.base,
  },
  
  companyName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.gray[700],
  },
  
  clientInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  
  // Section layouts
  section: {
    marginBottom: theme.spacing['2xl'],
  },
  
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold' as const,
    marginBottom: theme.spacing.base,
    color: theme.colors.primary,
    borderLeft: `3px solid ${theme.colors.primary}`,
    paddingLeft: theme.spacing.base,
  },
  
  contentArea: {
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.light}`,
  },
  
  // Two column layout
  twoColumnLayout: {
    flexDirection: 'row' as const,
    gap: theme.spacing['3xl'],
  },
  
  leftColumn: {
    flex: 0.9,
  },
  
  rightColumn: {
    flex: 1.1,
  },
  
  // Row layouts
  row: {
    flexDirection: 'row' as const,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    width: '40%',
    color: theme.colors.gray[600],
  },
  
  value: {
    fontSize: theme.fontSize.xs,
    width: '60%',
    color: theme.colors.gray[800],
  },
  
  authorityLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    width: '30%',
    color: theme.colors.gray[600],
  },
  
  authorityValue: {
    fontSize: theme.fontSize.xs,
    width: '70%',
    color: theme.colors.gray[800],
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    marginBottom: 15,
    marginLeft: 30,
    marginRight: 30,
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    borderTop: `1px solid ${theme.colors.border.light}`,
    paddingTop: theme.spacing.sm,
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
  },
  
  footerLeft: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
  },
  
  footerCompanyName: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center' as const,
  },
  
  footerCompanyInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    lineHeight: theme.lineHeight.tight,
    textAlign: 'center' as const,
  },
  
  footerLink: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    textDecoration: 'underline' as const,
  },
  
  pageNumber: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    textAlign: 'right' as const,
    alignSelf: 'flex-end' as const,
  },
  
  // Intro sections
  introSection: {
    marginBottom: theme.spacing['3xl'],
    textAlign: 'left' as const,
  },
  
  introHeadline: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
  },
  
  introText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[700],
    lineHeight: theme.lineHeight.normal,
    textAlign: 'justify' as const,
  },
  
  // Special elements
  pageBreak: {
    break: true,
  },
  
  checkboxRow: {
    flexDirection: 'row' as const,
    marginBottom: theme.spacing.sm,
  },

  // Signature section styles
  signatureSection: {
    marginTop: 3, // Moved up 15px from theme.spacing['2xl'] (18px) to 3px
    marginBottom: theme.spacing.xl,
    alignItems: 'flex-start' as const,
  },

  signatureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[700],
    marginBottom: 35,
    textAlign: 'left' as const,
  },

  signatureRow: {
    marginBottom: theme.spacing.sm,
    width: '33%',
  },

  signatureLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    textAlign: 'center' as const,
  },

  signatureLine: {
    borderBottom: `1px solid ${theme.colors.gray[400]}`,
    height: theme.spacing.base,
    width: '100%',
    alignItems: 'center' as const,
  },
  
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
    marginRight: theme.spacing.base,
    backgroundColor: theme.colors.success,
  },
  
  checkboxText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[700],
    flex: 1,
  },
}; 