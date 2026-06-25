// Resend email client for Memories in Prints
// Handles enquiry notifications and auto-reply emails

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Memories in Prints <hello@memoriesinprints.com>';
const STUDIO_EMAIL = 'hello@memoriesinprints.com';

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not configured. Email not sent.');
    return { success: true, mock: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return { success: true };
}

export async function sendEnquiryNotification(enquiry: {
  name: string;
  email: string;
  service_type: string;
  description: string | null;
  country: string | null;
}) {
  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `New Enquiry: ${enquiry.service_type} — ${enquiry.name}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">New Enquiry Received</h1>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 24px 0;" />
        <p><strong>Name:</strong> ${enquiry.name}</p>
        <p><strong>Email:</strong> ${enquiry.email}</p>
        <p><strong>Service:</strong> ${enquiry.service_type}</p>
        ${enquiry.country ? `<p><strong>Country:</strong> ${enquiry.country}</p>` : ''}
        ${enquiry.description ? `<p><strong>Brief:</strong> ${enquiry.description}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 24px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">Reply directly to this email to respond to the client.</p>
      </div>
    `,
  });
}

export async function sendEnquiryAutoReply(clientEmail: string, clientName: string) {
  return sendEmail({
    to: clientEmail,
    subject: `We've received your enquiry, ${clientName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Thank you, ${clientName}.</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          We've received your enquiry and will be in touch within 24 hours.
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          In the meantime, feel free to browse our <a href="https://memoriesinprints.com/portfolio" style="color: #C6A85C;">portfolio</a> 
          or read about our <a href="https://memoriesinprints.com/process" style="color: #C6A85C;">process</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="https://memoriesinprints.com" style="color: #C6A85C;">memoriesinprints.com</a>
        </p>
      </div>
    `,
  });
}
