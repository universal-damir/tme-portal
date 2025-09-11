// Email sender module - separate file to handle nodemailer import
// This works around Turbopack issues with dynamic imports

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  messageId?: string;
}): Promise<any> {
  const transport = getEmailTransporter();
  
  // Add a unique Message-ID if not provided to prevent duplicates
  const emailOptions = {
    ...options,
    messageId: options.messageId || `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@tme-portal.com>`,
    headers: {
      'X-Entity-Ref-ID': options.messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      'X-Mailer': 'TME Portal Notification System'
    }
  };
  
  return transport.sendMail(emailOptions);
}