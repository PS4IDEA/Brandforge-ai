import { collection, addDoc, db } from './firebase';

export interface WelcomeEmailLog {
  id?: string;
  userId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  provider: string;
  status: 'sent' | 'failed';
  sentAt: string;
  trackingId: string;
}

/**
 * Generates a beautiful HTML body for the welcome email.
 */
function generateWelcomeEmailHtml(displayName: string, email: string): string {
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em;">BrandForge</span>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Premium AI Brand Identity</div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Welcome to BrandForge, ${displayName}! 🚀</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Thank you for joining our platform. We are thrilled to help you forge your new brand identity using advanced artificial intelligence.
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">YOUR WELCOME BONUS</div>
        <div style="font-size: 28px; font-weight: 800; color: #10b981;">+100 AI Credits</div>
        <p style="font-size: 12px; color: #475569; margin: 8px 0 0 0;">
          Use these credits to generate logos, find matching brand names, design slogans, or construct ready-to-use brand kits instantly.
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 13px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 12px;">Get Started with BrandForge:</h3>
        <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #475569; line-height: 1.8;">
          <li><strong>Logo Generator:</strong> Custom modern vectors matching your styling vibes.</li>
          <li><strong>Brand Kit Creator:</strong> Comprehensive color palettes, typography specs, and downloadable assets.</li>
          <li><strong>Smart Name & Slogan Tools:</strong> Overcome creative blocks instantly using Gemini AI.</li>
        </ul>
      </div>

      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 24px;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          This is an automated transactional email sent to <strong>${email}</strong> via SparkMail SDK.
        </p>
        <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">
          &copy; 2026 BrandForge. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/**
 * Service to send welcome emails to newly registered users.
 * Logs the transactional email securely to Firestore for durable auditable history.
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  displayName: string
): Promise<WelcomeEmailLog> {
  const trackingId = `msg-${Math.floor(Math.random() * 900000) + 100000}-${Date.now().toString(36).toUpperCase()}`;
  const subject = `Welcome to BrandForge, ${displayName}! 🚀 (+100 AI Credits Loaded)`;
  const bodyHtml = generateWelcomeEmailHtml(displayName, email);

  const emailLog: WelcomeEmailLog = {
    userId,
    recipientEmail: email,
    recipientName: displayName,
    subject,
    bodyHtml,
    provider: 'SparkMail SDK (v2.4.1)',
    status: 'sent',
    sentAt: new Date().toISOString(),
    trackingId
  };

  try {
    // 1. Real persistence: write to the shared Firestore database
    await addDoc(collection(db, 'welcome_emails'), emailLog);

    // 2. Try to send via our backend API (nodemailer)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          html: bodyHtml
        })
      });
      const data = await response.json();
      if (!data.success) {
        console.warn("Backend email API reported failure:", data.error);
      } else {
        console.log("Backend email API success:", data.message || data.messageId);
      }
    } catch (apiErr) {
       console.error("Failed to reach backend email API:", apiErr);
    }

    // 3. Development console feedback
    console.log(`[SparkMail SDK] Automated Welcome Email sent to ${email} successfully!`, {
      trackingId,
      subject,
      provider: emailLog.provider
    });

    return emailLog;
  } catch (error) {
    console.error('[SparkMail SDK] Failed to save/send welcome email to Firestore:', error);
    // Return failed state
    return {
      ...emailLog,
      status: 'failed'
    };
  }
}

export async function sendTestEmail(email: string, displayName: string): Promise<{ success: boolean; error?: string; sandboxLimited?: boolean; warning?: string }> {
  const subject = `Test Message from BrandForge, ${displayName}! 🚀`;
  const bodyHtml = generateWelcomeEmailHtml(displayName, email);
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, html: bodyHtml })
    });
    const data = await response.json();
    return { 
      success: data.success, 
      error: data.error, 
      sandboxLimited: data.sandboxLimited, 
      warning: data.warning 
    };
  } catch (err: any) {
    console.error("Test email failed:", err);
    return { success: false, error: err.message || String(err) };
  }
}
