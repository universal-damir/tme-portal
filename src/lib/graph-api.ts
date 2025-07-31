/**
 * Microsoft Graph API utilities for Outlook email integration
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Custom authentication provider for Graph API
class CustomAuthProvider implements AuthenticationProvider {
  private accessToken: string | null = null;

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Get access token using client credentials flow
    const tokenResponse = await this.getTokenFromAzure();
    this.accessToken = tokenResponse.access_token;
    return this.accessToken;
  }

  private async getTokenFromAzure() {
    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID; // TO BE PROVIDED
    const clientSecret = process.env.AZURE_CLIENT_SECRET; // TO BE PROVIDED
    const tenantId = process.env.AZURE_TENANT_ID; // TO BE PROVIDED

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure credentials not configured');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    return response.json();
  }
}

// Create Graph client instance
export const getGraphClient = () => {
  const authProvider = new CustomAuthProvider();
  return Client.initWithMiddleware({ authProvider });
};

// Email composition interface
export interface EmailData {
  to: string[];
  subject: string;
  clientFirstName: string;
  pdfBlob: Blob;
  pdfFilename: string;
}

// Create formatted email draft in Outlook
export const createOutlookEmailDraft = async (emailData: EmailData) => {
  try {
    const graphClient = getGraphClient();

    // Convert PDF blob to base64 for attachment
    const pdfBase64 = await blobToBase64(emailData.pdfBlob);

    // Create email with HTML formatting
    const emailMessage = {
      subject: emailData.subject,
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: Arial, sans-serif; font-size: 10pt;">
            <p>Dear ${emailData.clientFirstName}, this is an offer as we discussed.</p>
            <br>
            <p><span style="color: green;">Text example green</span></p>
            <p><span style="color: red;">Text example red</span></p>
            <p><span style="color: #DAA520;">Text example yellow</span> THIS WILL BE CHANGED LATER. JUST NEED TO TEST IT.</p>
          </div>
        `
      },
      toRecipients: emailData.to.map(email => ({
        emailAddress: {
          address: email
        }
      })),
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: emailData.pdfFilename,
          contentType: 'application/pdf',
          contentBytes: pdfBase64
        }
      ]
    };

    // Create draft email
    const draft = await graphClient.api('/me/messages').post(emailMessage);
    
    // Open the draft in Outlook (this will launch the Outlook app)
    if (draft.webLink) {
      window.open(draft.webLink, '_blank');
    }

    return { success: true, draftId: draft.id };
  } catch (error) {
    console.error('Error creating Outlook email draft:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix and return just base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Alternative: Use delegated permissions (user context) instead of app permissions
export const createUserEmailDraft = async (emailData: EmailData, userAccessToken: string) => {
  try {
    const graphClient = Client.init({
      authProvider: {
        getAccessToken: async () => userAccessToken
      }
    });

    // Same email creation logic but using user's context
    const pdfBase64 = await blobToBase64(emailData.pdfBlob);

    const emailMessage = {
      subject: emailData.subject,
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: Arial, sans-serif; font-size: 10pt;">
            <p>Dear ${emailData.clientFirstName}, this is an offer as we discussed.</p>
            <br>
            <p><span style="color: green;">Text example green</span></p>
            <p><span style="color: red;">Text example red</span></p>
            <p><span style="color: #DAA520;">Text example yellow</span> THIS WILL BE CHANGED LATER. JUST NEED TO TEST IT.</p>
          </div>
        `
      },
      toRecipients: emailData.to.map(email => ({
        emailAddress: {
          address: email
        }
      })),
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: emailData.pdfFilename,
          contentType: 'application/pdf',
          contentBytes: pdfBase64
        }
      ]
    };

    const draft = await graphClient.api('/me/messages').post(emailMessage);
    
    // Open draft in Outlook
    if (draft.webLink) {
      window.open(draft.webLink, '_blank');
    }

    return { success: true, draftId: draft.id };
  } catch (error) {
    console.error('Error creating user email draft:', error);
    return { success: false, error: error.message };
  }
};