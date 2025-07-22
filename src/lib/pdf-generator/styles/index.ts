// PDF Styles exports
// These will be populated as styles are extracted in Phase 2

// Unified style system for PDF generation
import { StyleSheet } from '@react-pdf/renderer';
import { theme } from './theme';
import { layoutStyles } from './layout';
import { tableStyles } from './tables';

// Export individual style modules
export { theme } from './theme';
export { layoutStyles } from './layout';
export { tableStyles } from './tables';

// Create unified stylesheet combining all styles
export const styles = StyleSheet.create({
  ...layoutStyles,
  ...tableStyles,
});

// Helper function to get themed table styles
export const getTableTheme = (themeType?: 'green' | 'blue' | 'orange' | 'purple' | 'yellow' | 'lightblue' | 'neutral') => {
  const themeMap = {
    green: {
      header: tableStyles.tableHeader,
      totalRow: tableStyles.totalRow,
      sectionBackground: tableStyles.sectionBackgroundGreen,
      sectionTitle: tableStyles.sectionTitleGreen,
    },
    blue: {
      header: tableStyles.tableHeaderBlue,
      totalRow: tableStyles.totalRowBlue,
      sectionBackground: tableStyles.sectionBackgroundBlue,
      sectionTitle: tableStyles.sectionTitleBlue,
    },
    lightblue: {
      header: tableStyles.tableHeaderLightBlue,
      totalRow: tableStyles.totalRowLightBlue,
      sectionBackground: tableStyles.sectionBackgroundLightBlue,
      sectionTitle: layoutStyles.sectionTitle, // Uses default from layout
    },
    orange: {
      header: tableStyles.tableHeaderOrange,
      totalRow: tableStyles.totalRowOrange,
      sectionBackground: tableStyles.sectionBackgroundOrange,
      sectionTitle: layoutStyles.sectionTitle, // Uses default from layout
    },
    purple: {
      header: tableStyles.tableHeaderPurple,
      totalRow: tableStyles.totalRowPurple,
      sectionBackground: tableStyles.sectionBackground,
      sectionTitle: layoutStyles.sectionTitle, // Uses default from layout
    },
    yellow: {
      header: tableStyles.tableHeaderYellow,
      totalRow: tableStyles.totalRowYellow,
      sectionBackground: tableStyles.sectionBackgroundYellow,
      sectionTitle: layoutStyles.sectionTitle, // Uses default from layout
    },
    neutral: {
      header: tableStyles.tableHeaderGrey,
      totalRow: tableStyles.totalRowGrey,
      sectionBackground: tableStyles.sectionBackground,
      sectionTitle: layoutStyles.sectionTitle, // Uses default from layout
    },
  };
  
  // Default to neutral if no theme provided
  return themeMap[themeType || 'neutral'];
};

// Helper function to create consistent spacing
export const spacing = theme.spacing;

// Helper function to get colors
export const colors = theme.colors;

// Core styles
// export { theme } from './theme';
// export { layoutStyles } from './layout';
// export { tableStyles } from './tables';

// Combined stylesheet
// export { createStyleSheet } from './createStyleSheet'; 