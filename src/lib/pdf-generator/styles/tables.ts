// Table styles extracted from the original PDF generator
import { theme } from './theme';

export const tableStyles = {
  // Cost table container
  costTable: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background.white,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border.gray}`,
  },
  
  // Section backgrounds for different themes
  sectionBackground: {
    backgroundColor: theme.colors.background.lightGray,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.gray}`,
  },
  
  sectionBackgroundGreen: {
    backgroundColor: theme.colors.background.green,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.green}`,
  },
  
  sectionBackgroundBlue: {
    backgroundColor: theme.colors.background.blue,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.blue}`,
  },

  sectionBackgroundLightBlue: {
    backgroundColor: theme.colors.background.lightblue,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.lightblue}`,
  },
  
  sectionBackgroundYellow: {
    backgroundColor: theme.colors.background.yellow,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${theme.colors.border.yellow}`,
  },
  
  sectionBackgroundOrange: {
    backgroundColor: '#fff7ed', // Orange background similar to yellow
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    border: `1px solid #fed7aa`, // Orange border
  },
  
  // Table headers for different themes (all compact and consistent)
  tableHeader: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  tableHeaderBlue: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.info,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  tableHeaderOrange: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  tableHeaderPurple: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.purple,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },

  tableHeaderLightBlue: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.lightblue,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  tableHeaderYellow: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.yellow,
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  tableHeaderGrey: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.gray[600],
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    color: 'white',
    borderRadius: theme.borderRadius.base,
  },
  
  // Table rows (compact)
  tableRow: {
    flexDirection: 'row' as const,
    padding: 4,
    borderBottom: `1px solid ${theme.colors.border.gray}`,
    fontSize: theme.fontSize.xs,
  },
  
  // Table cells
  tableCell: {
    flex: 1,
    textAlign: 'left' as const,
  },
  
  tableCellCenter: {
    flex: 1,
    textAlign: 'center' as const,
  },
  
  tableCellRight: {
    flex: 1,
    textAlign: 'right' as const,
  },
  
  // Header cells
  tableHeaderCell: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    color: theme.colors.gray[700],
    textAlign: 'center' as const,
  },
  
  tableHeaderDescription: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    color: 'white',
    textAlign: 'left' as const,
    flex: 3,
    paddingLeft: theme.spacing.base,
  },
  
  tableHeaderDescriptionWide: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    color: 'white',
    textAlign: 'left' as const,
    flex: 4,
    paddingLeft: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
  },
  
  tableHeaderCurrency: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    color: 'white',
    textAlign: 'right' as const,
    flex: 1,
    paddingRight: theme.spacing.base,
  },
  
  // Content cells
  tableCellDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[800],
    flex: 3,
    paddingLeft: theme.spacing.base,
    textAlign: 'left' as const,
  },
  
  tableCellDescriptionWide: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[800],
    flex: 4,
    paddingLeft: theme.spacing.base,
    textAlign: 'left' as const,
  },
  
  tableCellAmount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[800],
    flex: 1,
    paddingRight: theme.spacing.base,
    textAlign: 'right' as const,
  },
  
  // Red text for reductions/discounts
  tableCellDescriptionRed: {
    fontSize: theme.fontSize.xs,
    color: '#dc2626',
    flex: 3,
    paddingLeft: theme.spacing.base,
    textAlign: 'left' as const,
  },

  tableCellDescriptionWideRed: {
    fontSize: theme.fontSize.xs,
    color: '#dc2626',
    flex: 4,
    paddingLeft: theme.spacing.base,
    textAlign: 'left' as const,
  },
  
  tableCellAmountRed: {
    fontSize: theme.fontSize.xs,
    color: '#dc2626',
    flex: 1,
    paddingRight: theme.spacing.base,
    textAlign: 'right' as const,
  },
  
  // Total rows for different themes (all compact and consistent)
  totalRow: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.success,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowBlue: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.info,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowYellow: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.yellow,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowPurple: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.purple,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },

  totalRowLightBlue: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.lightblue,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowOrange: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.warning,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowGrey: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.gray[600],
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  
  totalRowCompact: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.success,
    color: 'white',
    padding: theme.spacing.base,
    fontWeight: 'bold' as const,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.base,
    borderRadius: theme.borderRadius.base,
    alignItems: 'center' as const,
  },
  
  // Total labels and amounts
  totalLabel: {
    flex: 3,
    paddingLeft: theme.spacing.base,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
  },
  
  totalAmount: {
    flex: 1,
    paddingRight: theme.spacing.base,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    textAlign: 'right' as const,
  },
  
  // Section titles with themes
  sectionTitleGreen: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold' as const,
    marginBottom: theme.spacing.base,
    color: theme.colors.success,
    borderLeft: `3px solid ${theme.colors.success}`,
    paddingLeft: theme.spacing.base,
  },
  
  sectionTitleBlue: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold' as const,
    marginBottom: theme.spacing.base,
    color: theme.colors.info,
    borderLeft: `3px solid ${theme.colors.info}`,
    paddingLeft: theme.spacing.base,
  },
  
  // Activity table styles
  activityTable: {
    backgroundColor: theme.colors.background.light,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.base,
  },
  
  activityHeader: {
    flexDirection: 'row' as const,
    backgroundColor: '#f1f5f9',
    padding: theme.spacing.base,
    borderBottom: `1px solid ${theme.colors.border.light}`,
  },
  
  activityHeaderText: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold' as const,
    color: theme.colors.gray[600],
  },
  
  activityCodeColumn: {
    width: '50%',
    textAlign: 'left' as const,
    paddingLeft: theme.spacing.base,
  },
  
  activityDescColumn: {
    width: '50%',
    textAlign: 'left' as const,
    paddingLeft: theme.spacing.base,
  },
  
  activityRow: {
    flexDirection: 'row' as const,
    padding: theme.spacing.base,
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center' as const,
  },
  
  activityRowLast: {
    flexDirection: 'row' as const,
    padding: theme.spacing.base,
    alignItems: 'center' as const,
  },
  
  activityCode: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[800],
    width: '50%',
    textAlign: 'left' as const,
    fontWeight: 'normal' as const,
    paddingLeft: theme.spacing.base,
  },
  
  activityDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[800],
    width: '50%',
    paddingLeft: theme.spacing.base,
  },
}; 