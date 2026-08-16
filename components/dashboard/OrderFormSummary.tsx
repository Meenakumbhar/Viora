import type { Enquiry, OrderForm } from '@/types/database';

const PHOTO_OPTION_LABELS: Record<string, string> = {
  none: 'No photograph',
  colour: 'Colour photograph',
  bw: 'Black & white photograph',
};

const INSIDE_PAGES_LABELS: Record<string, string> = {
  bw: 'Black & white',
  match_cover: 'To match cover design',
};

const PHOTO_SUPPLIED_LABELS: Record<string, string> = {
  email: 'Email',
  post: 'Post',
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">{label}</p>
      <p className="mt-1 font-body text-sm text-white/80">{value ?? '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5">
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/40">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export default function OrderFormSummary({ enquiry, orderForm }: { enquiry: Enquiry; orderForm: OrderForm | null }) {
  if (!orderForm) {
    return (
      <div className="border border-white/10 bg-white/[0.02] p-10 text-center font-mono text-xs text-white/30">
        {enquiry.name} hasn&apos;t filled in an order form yet.
      </div>
    );
  }

  const f = orderForm;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
            f.status === 'submitted'
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
          }`}
        >
          {f.status === 'submitted' ? 'Submitted' : 'Draft — not yet submitted'}
        </span>
        <span className="font-mono text-[10px] text-white/30">
          Last updated {formatDate(f.updated_at)}
        </span>
      </div>

      <Section title="The person being honoured">
        <Field label="Deceased name" value={f.deceased_name} />
        <Field label="Date of birth" value={formatDate(f.date_of_birth)} />
        <Field label="Date of death" value={formatDate(f.date_of_death)} />
        <Field label="Age" value={f.age_of_deceased} />
        <Field label="Funeral date" value={formatDate(f.funeral_date)} />
        <Field label="Funeral time" value={f.funeral_time} />
        <Field label="Venue" value={f.venue_name} />
      </Section>

      <Section title="Print specification">
        <Field label="Cover photograph" value={f.photo_option ? PHOTO_OPTION_LABELS[f.photo_option] : null} />
        <Field label="Number of pages" value={f.number_of_pages} />
        <Field label="Inside pages" value={f.inside_pages_style ? INSIDE_PAGES_LABELS[f.inside_pages_style] : null} />
        <Field label="Quantity" value={f.quantity} />
        <Field label="Bespoke design" value={f.bespoke_design ? 'Yes' : 'No'} />
        {f.bespoke_design && f.bespoke_details && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Bespoke design details" value={<span className="whitespace-pre-wrap">{f.bespoke_details}</span>} />
          </div>
        )}
      </Section>

      {f.bespoke_design && f.additional_products && f.additional_products.length > 0 && (
        <Section title="Additional products">
          {f.additional_products.map((p, i) => (
            <Field key={`${p.slug}-${p.size}-${i}`} label={`${p.title} — ${p.size}`} value={`Qty ${p.quantity}`} />
          ))}
        </Section>
      )}

      <Section title="Photographs">
        <Field label="Quantity" value={f.photo_qty} />
        <Field label="Supplied via" value={f.photo_supplied_via ? PHOTO_SUPPLIED_LABELS[f.photo_supplied_via] : null} />
        {f.photo_instructions && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Instructions" value={<span className="whitespace-pre-wrap">{f.photo_instructions}</span>} />
          </div>
        )}
      </Section>

      <Section title="Inside information">
        <Field label="Callback requested" value={f.callback_requested ? 'Yes' : 'No'} />
        {f.callback_requested && <Field label="Contact number" value={f.callback_phone} />}
        {f.additional_notes && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Notes" value={<span className="whitespace-pre-wrap">{f.additional_notes}</span>} />
          </div>
        )}
      </Section>

      {f.backpage_information && (
        <Section title="Backpage information">
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="whitespace-pre-wrap font-body text-sm text-white/80">{f.backpage_information}</span>
          </div>
        </Section>
      )}

      <Section title="Attachment">
        <div className="sm:col-span-2 lg:col-span-3">
          {f.attachment_url ? (
            <a
              href={f.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#C6A85C] hover:text-white hover:underline"
            >
              {f.attachment_url.split('/').pop()} — view / download →
            </a>
          ) : (
            <span className="font-mono text-xs text-white/30">No file attached.</span>
          )}
        </div>
      </Section>
    </div>
  );
}
