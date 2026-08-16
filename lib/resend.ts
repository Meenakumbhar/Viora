// Resend email client for Memories in Prints
// Handles enquiry notifications, auto-reply emails, order status updates, and account verification

import type { OrderStatus, Enquiry, OrderForm } from '@/types/database';
import { SITE_URL } from '@/lib/site-url';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Sender address — must be on a domain verified in the Resend dashboard, or sends will fail.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Memories in Prints <info@memoriesinprints.com>';
// Where internal notifications (e.g. "New Enquiry Received") land — your own inbox, not a sender.
const STUDIO_EMAIL = process.env.RESEND_STUDIO_EMAIL || 'info@memoriesinprints.com';

// All values interpolated into email HTML below come from user/admin free text —
// escape it so a name, brief, or status note can't break the markup.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>
        <p><strong>Service:</strong> ${escapeHtml(enquiry.service_type)}</p>
        ${enquiry.country ? `<p><strong>Country:</strong> ${escapeHtml(enquiry.country)}</p>` : ''}
        ${enquiry.description ? `<p><strong>Brief:</strong> ${escapeHtml(enquiry.description)}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 24px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">Reply directly to this email to respond to the client.</p>
      </div>
    `,
  });
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "It's in our queue and we'll begin work shortly.",
  in_progress: "Our studio is actively working on it now.",
  completed: 'Your order is complete. Thank you for choosing us.',
};

const ORDER_STAGES: OrderStatus[] = ['pending', 'in_progress', 'completed'];

// Table-based (not flexbox) so it renders consistently across email clients.
function buildStatusStepperHtml(status: OrderStatus): string {
  const currentIndex = ORDER_STAGES.indexOf(status);
  const cells = ORDER_STAGES.map((stage, i) => {
    const reached = i <= currentIndex;
    const color = reached ? '#C6A85C' : '#5B6470';
    const borderColor = reached ? '#C6A85C' : '#2A3340';
    return `
      <td width="33%" align="center" style="padding: 14px 4px; border-bottom: 3px solid ${borderColor};">
        <span style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${color};">
          ${ORDER_STATUS_LABELS[stage]}
        </span>
      </td>`;
  }).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>${cells}</tr>
    </table>`;
}

export async function sendOrderPlacedEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  event_date?: string | null;
  quantity_estimate?: string | null;
}) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  return sendEmail({
    to: order.customer_email,
    subject: `Order placed — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Thank you, ${name}.</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          Your order for <strong>${serviceType}</strong> has been placed and is now being tracked.
        </p>
        <div style="margin: 24px 0; padding: 16px 20px; background: #151C24; border: 1px solid #2A3340;">
          <p style="margin: 0; font-size: 13px; color: #8A8F96;">Order reference</p>
          <p style="margin: 4px 0 0; font-size: 18px; color: #C6A85C;">#${reference}</p>
          ${order.event_date ? `
          <p style="margin: 12px 0 0; font-size: 13px; color: #8A8F96;">Event / delivery date</p>
          <p style="margin: 4px 0 0; font-size: 16px;">${escapeHtml(new Date(order.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</p>` : ''}
          ${order.quantity_estimate ? `
          <p style="margin: 12px 0 0; font-size: 13px; color: #8A8F96;">Estimated quantity</p>
          <p style="margin: 4px 0 0; font-size: 16px;">${escapeHtml(order.quantity_estimate)}</p>` : ''}
        </div>
        ${buildStatusStepperHtml('pending')}
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          We'll email you again as soon as the status changes.
        </p>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderStatusUpdateEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  status: OrderStatus;
  note?: string | null;
}) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const statusLabel = ORDER_STATUS_LABELS[order.status];
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  return sendEmail({
    to: order.customer_email,
    subject: `Order update: ${statusLabel} — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Order update</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          Hi ${name}, your order for <strong>${serviceType}</strong> (#${reference}) has moved to <strong style="color: #C6A85C;">${statusLabel}</strong>.
        </p>
        ${buildStatusStepperHtml(order.status)}
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">${ORDER_STATUS_MESSAGES[order.status]}</p>
        ${order.note ? `
        <div style="margin: 24px 0; padding: 16px 20px; background: #151C24; border-left: 3px solid #C6A85C;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8A8F96;">Message from the studio</p>
          <p style="margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: #F0EDE8;">${escapeHtml(order.note)}</p>
        </div>` : ''}
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(user: { email: string; name?: string | null; url: string }) {
  const verifyUrl = user.url;
  const greetingName = user.name ? escapeHtml(user.name) : 'there';

  return sendEmail({
    to: user.email,
    subject: 'Verify your email — Memories in Prints',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Hi ${greetingName}, confirm your email</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          Thanks for creating an account with Memories in Prints. Click below to verify your email address and activate your account.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${verifyUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Verify email
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #8A8F96;">
          Or paste this link into your browser:<br />
          <a href="${verifyUrl}" style="color: #C6A85C; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #8A8F96;">
          This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user: { email: string; name?: string | null; url: string }) {
  const resetUrl = user.url;
  const greetingName = user.name ? escapeHtml(user.name) : 'there';

  return sendEmail({
    to: user.email,
    subject: 'Reset your password — Memories in Prints',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Hi ${greetingName}, reset your password</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          We received a request to reset the password for your Memories in Prints account. Click below to choose a new one.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Reset password
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #8A8F96;">
          Or paste this link into your browser:<br />
          <a href="${resetUrl}" style="color: #C6A85C; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #8A8F96;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
        </p>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

// ─── Design Review ─────────────────────────────────────────────────────────────

export async function sendDesignReadyEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
}, version: number) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  const reviewUrl = `${SITE_URL}/account/orders/${order.id}/review`;

  return sendEmail({
    to: order.customer_email,
    subject: `Your design is ready for review — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Hi ${name}, your design is ready.</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          We've uploaded proof v${version} for your <strong>${serviceType}</strong> order (#${reference}). Take a look and let us know what you think — approve it, or mark up anything you'd like changed.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${reviewUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Review your design
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

export async function sendDesignReadyForProofreadingEmail(order: {
  id: string;
  customer_name: string;
  service_type: string;
}, version: number) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  const manageUrl = `${SITE_URL}/staff/orders/${order.id}`;

  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `Awaiting proofreading — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">Ready for proofreading</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          Proof v${version} for ${name}'s <strong>${serviceType}</strong> order (#${reference}) is waiting on the proofreader before it goes to the customer.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Review the proof
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendDesignReturnedToDesignerEmail(order: {
  id: string;
  customer_name: string;
  service_type: string;
}, version: number, commentCount: number) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  const manageUrl = `${SITE_URL}/staff/orders/${order.id}`;

  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `Proofreader returned a design — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">Sent back for revisions</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          The proofreader left <strong>${commentCount} mark${commentCount === 1 ? '' : 's'}</strong> on proof v${version} for ${name}'s <strong>${serviceType}</strong> order (#${reference}) and sent it back for revisions.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            View the marks
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendDesignChangesRequestedEmail(order: {
  id: string;
  customer_name: string;
  service_type: string;
}, version: number, commentCount: number) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  const manageUrl = `${SITE_URL}/admin/orders/${order.id}/designs`;

  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `Changes requested — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">Design changes requested</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          ${name} left <strong>${commentCount} comment${commentCount === 1 ? '' : 's'}</strong> on proof v${version} for order #${reference} (${serviceType}).
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            View comments
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendDesignApprovedEmail(order: {
  id: string;
  customer_name: string;
  service_type: string;
}, version: number) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const name = escapeHtml(order.customer_name);
  const serviceType = escapeHtml(order.service_type);
  const manageUrl = `${SITE_URL}/admin/orders/${order.id}/designs`;

  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `Design approved — ${order.service_type} (#${reference})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">Design approved ✓</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          ${name} approved proof v${version} for order #${reference} (${serviceType}). Ready to move to production.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            View order
          </a>
        </div>
      </div>
    `,
  });
}

// Sent the moment a quote is placed — the order form link is the main call
// to action, since we need the deceased/service/print details before any
// design work can start.
export async function sendEnquiryAutoReply(enquiry: { id: string; name: string; email: string }) {
  const name = escapeHtml(enquiry.name);
  const orderFormUrl = `${SITE_URL}/order-form/${enquiry.id}`;

  return sendEmail({
    to: enquiry.email,
    subject: `We've received your enquiry, ${enquiry.name}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 28px; font-weight: 300;">Thank you, ${name}.</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          We've received your enquiry and will be in touch within 24 hours.
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          To help us get started, please fill in your order form with the service details and print specification — you can save it and come back any time.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${orderFormUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Fill in your order form
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #8A8F96;">
          Or paste this link into your browser:<br />
          <a href="${orderFormUrl}" style="color: #C6A85C; word-break: break-all;">${orderFormUrl}</a>
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          In the meantime, feel free to browse our <a href="${SITE_URL}/portfolio" style="color: #C6A85C;">portfolio</a>
          or read about our <a href="${SITE_URL}/process" style="color: #C6A85C;">process</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #2A3340; margin: 32px 0;" />
        <p style="color: #8A8F96; font-size: 14px;">
          Memories in Prints · Global Design & Print Studio<br />
          <a href="${SITE_URL}" style="color: #C6A85C;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderFormSubmittedEmail(enquiry: Enquiry, orderForm: OrderForm) {
  const name = escapeHtml(enquiry.name);
  // Points staff at the read-only summary, not the customer's own editable
  // link — the same URL for both would let a staff view accidentally alter
  // the customer's answers.
  const manageUrl = `${SITE_URL}/staff/order-form/${enquiry.id}`;
  const deceasedName = orderForm.deceased_name ? escapeHtml(orderForm.deceased_name) : '—';

  return sendEmail({
    to: STUDIO_EMAIL,
    subject: `Order form submitted — ${name} (${deceasedName})`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0E1117; color: #F0EDE8; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #C6A85C; font-size: 24px; font-weight: 300;">Order form submitted</h1>
        <p style="font-size: 16px; line-height: 1.7; color: #F0EDE8;">
          ${name} has filled in their order form.
        </p>
        <div style="margin: 24px 0; padding: 16px 20px; background: #151C24; border: 1px solid #2A3340;">
          <p style="margin: 0; font-size: 13px; color: #8A8F96;">Deceased</p>
          <p style="margin: 4px 0 0; font-size: 16px;">${deceasedName}</p>
          ${orderForm.funeral_date ? `
          <p style="margin: 12px 0 0; font-size: 13px; color: #8A8F96;">Funeral date</p>
          <p style="margin: 4px 0 0; font-size: 16px;">${escapeHtml(new Date(orderForm.funeral_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</p>` : ''}
          ${orderForm.bespoke_design ? `<p style="margin: 12px 0 0; font-size: 13px; color: #C6A85C;">Bespoke design requested</p>` : ''}
        </div>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #C6A85C; color: #0E1117; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            View order form
          </a>
        </div>
      </div>
    `,
  });
}
