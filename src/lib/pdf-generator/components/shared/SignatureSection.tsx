import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { formatDateDDMMYYYY } from '../../utils';
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../translations/golden-visa';
import type { PDFComponentProps } from '../../types';

// SignatureSection - Signature area for agreement
// Shows: "Agreed to the offer above", dynamic date, Signature line
export const SignatureSection: React.FC<PDFComponentProps> = ({ data }) => {
  const formattedDate = formatDateDDMMYYYY(data.clientDetails.date);
  const locale: Locale = (data as any).locale || 'en';
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  return (
    <View style={styles.signatureSection}>
      <Text style={styles.signatureText}>
        {t.signature.agreedText(formattedDate)}
      </Text>
      
      <View style={styles.signatureRow}>
        <View style={styles.signatureLine}></View>
      </View>
      
      <Text style={styles.signatureLabel}>{t.signature.signatureLabel}</Text>
    </View>
  );
}; 