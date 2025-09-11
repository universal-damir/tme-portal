// Unsubscribe API Route
// Handles one-click unsubscribe from email notifications

import { NextRequest, NextResponse } from 'next/server';
import { NotificationEmailService } from '@/lib/services/notification-email';

// GET /api/notifications/unsubscribe/[token] - Unsubscribe via link
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Handle unsubscribe
    const success = await NotificationEmailService.handleUnsubscribe(token);

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid or expired unsubscribe token' },
        { status: 400 }
      );
    }

    // Return success HTML page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - TME Portal</title>
          <style>
            body {
              font-family: Inter, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #243F7B;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 30px;
              background: #243F7B;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
            }
            .button:hover {
              background: #1a2d5a;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from email notifications.</p>
            <p>You will still receive in-app notifications when you log into the TME Portal.</p>
            <p>You can re-enable email notifications at any time from your account settings.</p>
            <a href="${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'}" class="button">
              Return to Portal
            </a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    
    // Return error HTML page
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - TME Portal</title>
          <style>
            body {
              font-family: Inter, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #ef4444;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 30px;
              background: #243F7B;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Unsubscribe Failed</h1>
            <p>We couldn't process your unsubscribe request.</p>
            <p>Please try again or contact support if the problem persists.</p>
            <a href="${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'}" class="button">
              Return to Portal
            </a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}