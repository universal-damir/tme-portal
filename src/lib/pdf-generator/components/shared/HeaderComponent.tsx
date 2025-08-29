import React from 'react';
import { View, Image, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { getBrandingByAuthority } from '../../branding';
import type { PDFComponentProps } from '../../types';

interface HeaderComponentProps extends Pick<PDFComponentProps, 'data'> {
  // Header now includes company information that varies by authority
  // Enhanced with full branding system
  showClientInfo?: boolean; // New prop to control client info display
}

// HeaderComponent - Enhanced with branding system
// Uses the new branding configurations for consistent company information
export const HeaderComponent: React.FC<HeaderComponentProps> = ({ data, showClientInfo = false }) => {
  // Defensive check to prevent crashes when data is malformed
  if (!data || !data.authorityInformation || !data.authorityInformation.responsibleAuthority) {
    console.error('HeaderComponent: Invalid data provided', data);
    // Return a minimal header with default branding if data is invalid
    return (
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image style={{ width: 50, height: 50, marginRight: 12 }} src="/logo.png" />
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#243F7B', marginBottom: 2 }}>TME Services FZCO</Text>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>(CIT TRN 10020 08363 00001 | VAT TRN 10020 08363 00003)</Text>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>PO Box 487770 | Dubai | UAE</Text>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>T +971 4 8 84 13 29 | setup@TME-Services.com | www.TME-Services.com</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Get branding configuration based on authority
  const branding = getBrandingByAuthority(data.authorityInformation.responsibleAuthority);
  
  // Extract client info for display when showClientInfo is true
  const companyServicesData = (data as any).companyServicesData;
  const clientDetails = data.clientDetails;
  const clientCompanyName = clientDetails?.companyName || companyServicesData?.companyName;
  const clientFirstName = clientDetails?.firstName || companyServicesData?.firstName;
  const clientLastName = clientDetails?.lastName || companyServicesData?.lastName;

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image style={{ width: 50, height: 50, marginRight: 12 }} src={branding.logo} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: branding.colors.primary, marginBottom: 2 }}>
              {branding.header.companyName}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary, marginBottom: 1 }}>
              {branding.header.address}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary, marginBottom: 1 }}>
              {branding.header.poBox} | {branding.header.location}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary }}>
              T {branding.header.phone} | {branding.header.email} | {branding.header.website}
            </Text>
          </View>
        </View>
        
        {/* Client info section - only shown when showClientInfo is true */}
        {showClientInfo && (clientCompanyName || (clientFirstName && clientLastName)) && (
          <View style={{ alignItems: 'flex-end' }}>
            {clientCompanyName && (
              <Text style={{ fontSize: 10, color: '#9ca3af', marginBottom: 1 }}>
                {clientCompanyName}
              </Text>
            )}
            {clientFirstName && clientLastName && (
              <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                {clientFirstName} {clientLastName}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}; 