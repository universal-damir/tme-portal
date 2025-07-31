import { NextRequest, NextResponse } from 'next/server';
import { EMAIL_TEMPLATES } from '@/components/shared/EmailDraftGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentType: string } }
) {
  try {
    const { documentType } = params;
    
    // Convert to uppercase to match EMAIL_TEMPLATES keys
    const templateKey = documentType.toUpperCase() as keyof typeof EMAIL_TEMPLATES;
    
    // Get the template from existing EMAIL_TEMPLATES
    const template = EMAIL_TEMPLATES[templateKey];
    
    if (!template) {
      return NextResponse.json(
        { error: `Template not found for document type: ${documentType}` },
        { status: 404 }
      );
    }

    // Return template with enhanced formatting options
    const enhancedTemplate = {
      ...template,
      // Ensure Arial 10pt is set
      fontFamily: 'Arial, sans-serif',
      fontSize: '10pt',
      // Add formatting helper functions
      formatOptions: {
        colors: {
          blue: '#0066cc',
          red: '#cc0000', 
          green: '#006600',
          yellow: '#DAA520',
          black: '#000000',
          tmePrimary: '#243F7B',
          tmeSecondary: '#D2BC99'
        },
        styles: {
          bold: 'font-weight: bold;',
          underline: 'text-decoration: underline;',
          italic: 'font-style: italic;'
        }
      }
    };

    return NextResponse.json(enhancedTemplate);
    
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format text with colors and styles
export function formatEmailText(text: string, color?: string, styles?: string[]) {
  let styleString = 'font-family: Arial, sans-serif; font-size: 10pt;';
  
  if (color) {
    const colors = {
      blue: '#0066cc',
      red: '#cc0000', 
      green: '#006600',
      yellow: '#DAA520',
      black: '#000000',
      tmePrimary: '#243F7B',
      tmeSecondary: '#D2BC99'
    };
    styleString += ` color: ${colors[color as keyof typeof colors] || color};`;
  }
  
  if (styles) {
    styles.forEach(style => {
      switch (style) {
        case 'bold':
          styleString += ' font-weight: bold;';
          break;
        case 'underline':
          styleString += ' text-decoration: underline;';
          break;
        case 'italic':
          styleString += ' font-style: italic;';
          break;
      }
    });
  }
  
  return `<span style="${styleString}">${text}</span>`;
}