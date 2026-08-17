'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { products } from '@/lib/data';
import FileUpload from '@/components/ui/FileUpload';
import type {
  Enquiry,
  OrderForm,
  OrderFormProduct,
  PhotoOption,
  InsidePagesStyle,
  PhotoSuppliedVia,
} from '@/types/database';

/* ── Shared field primitives, matching QuoteForm's visual language ─────── */

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p className="mb-2 font-body text-sm text-text-muted uppercase tracking-wider">
      {children}
      {hint && <span className="ml-2 normal-case text-text-muted/70">({hint})</span>}
    </p>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-border bg-cat-surface px-4 py-3 text-cat-heading font-body text-body-base outline-none transition-all duration-200 focus:border-accent-gold focus:ring-1 focus:ring-accent-gold placeholder:text-text-muted/50"
    />
  );
}

function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ resize: 'none' }}
      className="w-full border border-border bg-cat-surface px-4 py-3 text-cat-heading font-body text-body-base leading-relaxed outline-none transition-all duration-200 focus:border-accent-gold focus:ring-1 focus:ring-accent-gold placeholder:text-text-muted/50"
    />
  );
}

function PillChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2.5 border font-body text-sm transition-all duration-200 text-left',
        'hover:border-accent-gold hover:text-accent-gold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
        selected
          ? 'border-accent-gold bg-accent-gold/10 text-accent-gold scale-[1.02]'
          : 'border-border bg-cat-surface text-cat-heading',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-cat-surface p-6 md:p-8">
      <h2 className="font-display text-2xl text-cat-heading">{title}</h2>
      {subtitle && <p className="mt-1 font-body text-sm text-cat-body">{subtitle}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

/* ── Form state ──────────────────────────────────────────────────────── */

interface FormState {
  deceased_name: string;
  funeral_date: string;
  funeral_time: string;
  venue_name: string;
  date_of_birth: string;
  date_of_death: string;
  age_of_deceased: string;
  photo_option: PhotoOption | null;
  bespoke_design: boolean;
  bespoke_details: string;
  number_of_pages: string;
  inside_pages_style: InsidePagesStyle | null;
  quantity: number | null;
  photo_qty: string;
  photo_supplied_via: PhotoSuppliedVia | null;
  photo_instructions: string;
  additional_products: OrderFormProduct[];
  callback_requested: boolean;
  callback_phone: string;
  additional_notes: string;
  backpage_information: string;
  attachment_url: string;
}

function toFormState(orderForm: OrderForm | null): FormState {
  return {
    deceased_name: orderForm?.deceased_name ?? '',
    funeral_date: orderForm?.funeral_date ?? '',
    funeral_time: orderForm?.funeral_time ?? '',
    venue_name: orderForm?.venue_name ?? '',
    date_of_birth: orderForm?.date_of_birth ?? '',
    date_of_death: orderForm?.date_of_death ?? '',
    age_of_deceased: orderForm?.age_of_deceased ?? '',
    photo_option: orderForm?.photo_option ?? null,
    bespoke_design: orderForm?.bespoke_design ?? false,
    bespoke_details: orderForm?.bespoke_details ?? '',
    number_of_pages: orderForm?.number_of_pages ?? '',
    inside_pages_style: orderForm?.inside_pages_style ?? null,
    quantity: orderForm?.quantity ? Number(orderForm.quantity) : null,
    photo_qty: orderForm?.photo_qty != null ? String(orderForm.photo_qty) : '',
    photo_supplied_via: orderForm?.photo_supplied_via ?? null,
    photo_instructions: orderForm?.photo_instructions ?? '',
    additional_products: orderForm?.additional_products ?? [],
    callback_requested: orderForm?.callback_requested ?? false,
    callback_phone: orderForm?.callback_phone ?? '',
    additional_notes: orderForm?.additional_notes ?? '',
    backpage_information: orderForm?.backpage_information ?? '',
    attachment_url: orderForm?.attachment_url ?? '',
  };
}

const PAGE_OPTIONS = ['4', '8', '12', '16'];
const QUANTITY_MIN = 20;
const QUANTITY_MAX = 200;
const QUANTITY_DEFAULT = 50;

export default function OrderFormClient({
  enquiry,
  initialOrderForm,
}: {
  enquiry: Enquiry;
  initialOrderForm: OrderForm | null;
}) {
  const [data, setData] = useState<FormState>(() => toFormState(initialOrderForm));
  const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'saved' | 'submitted' | 'error'>(
    initialOrderForm?.status === 'submitted' ? 'submitted' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => setStatus('idle'), 2400);
      return () => clearTimeout(timer);
    }
  }, [status]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function setProductQuantity(slug: string, title: string, size: string, quantity: number) {
    setData((prev) => {
      const next = prev.additional_products.filter((p) => !(p.slug === slug && p.size === size));
      if (quantity > 0) next.push({ slug, title, size, quantity });
      return { ...prev, additional_products: next };
    });
  }

  async function save(submit: boolean) {
    setStatus(submit ? 'submitting' : 'saving');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/order-form/${enquiry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submit,
          form: {
            ...data,
            funeral_date: data.funeral_date || null,
            date_of_birth: data.date_of_birth || null,
            date_of_death: data.date_of_death || null,
            quantity: data.quantity != null ? String(data.quantity) : null,
            photo_qty: data.photo_qty ? Number(data.photo_qty) : null,
            additional_products: data.bespoke_design ? data.additional_products : [],
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Something went wrong. Please try again.');
      }
      setStatus(submit ? 'submitted' : 'saved');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'submitted') {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <div className="container-wide flex min-h-screen max-w-2xl flex-col items-center justify-center py-24 text-center">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold"
            style={{ animation: 'successPop 0.4s ease' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
            </svg>
          </div>
          <h1 className="font-display text-display-md text-text-heading">Order form received</h1>
          <p className="mt-4 max-w-md font-body text-body-base text-text-muted">
            Thank you — we have everything we need to get started on {data.deceased_name ? <>the order of service for <strong>{data.deceased_name}</strong></> : 'your order'}. We&apos;ll be in touch if we need anything further.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-8 font-body text-label uppercase tracking-wider text-accent-gold link-underline"
          >
            Make changes to this form
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide pt-32 pb-12">
        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Order Form</span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading max-w-xl">
          Tell us about the <em className="italic text-accent-gold">service</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-muted max-w-lg">
          A few details for your {enquiry.service_type.toLowerCase()} enquiry so we can prepare the design and print specification. Save your progress any time — nothing here is timed.
        </p>
      </div>

      <div className="border-t border-border" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
        className="container-wide max-w-2xl space-y-8 py-16"
      >
        <SectionCard title="The person being honoured">
          <div>
            <FieldLabel>Name of the deceased (as it should appear)</FieldLabel>
            <TextField value={data.deceased_name} onChange={(v) => setField('deceased_name', v)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Date of birth</FieldLabel>
              <TextField type="date" value={data.date_of_birth} onChange={(v) => setField('date_of_birth', v)} />
            </div>
            <div>
              <FieldLabel>Date of death</FieldLabel>
              <TextField type="date" value={data.date_of_death} onChange={(v) => setField('date_of_death', v)} />
            </div>
            <div>
              <FieldLabel hint="if to be displayed">Age</FieldLabel>
              <TextField value={data.age_of_deceased} onChange={(v) => setField('age_of_deceased', v)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Funeral date</FieldLabel>
              <TextField type="date" value={data.funeral_date} onChange={(v) => setField('funeral_date', v)} />
            </div>
            <div>
              <FieldLabel>Funeral time</FieldLabel>
              <TextField value={data.funeral_time} onChange={(v) => setField('funeral_time', v)} placeholder="e.g. 12:00pm" />
            </div>
          </div>
          <div>
            <FieldLabel>Church, crematorium, or venue</FieldLabel>
            <TextField value={data.venue_name} onChange={(v) => setField('venue_name', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Print specification" subtitle="Order of service design and print run.">
          <div>
            <FieldLabel>Cover photograph</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {([
                ['none', 'No photograph'],
                ['colour', 'Colour photograph'],
                ['bw', 'Black & white photograph'],
              ] as [PhotoOption, string][]).map(([value, label]) => (
                <PillChip key={value} selected={data.photo_option === value} onClick={() => setField('photo_option', value)}>
                  {label}
                </PillChip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Number of pages</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PAGE_OPTIONS.map((n) => (
                <PillChip key={n} selected={data.number_of_pages === n} onClick={() => setField('number_of_pages', n)}>
                  {n} pages
                </PillChip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Inside pages</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {([
                ['bw', 'Black & white'],
                ['match_cover', 'To match cover design'],
              ] as [InsidePagesStyle, string][]).map(([value, label]) => (
                <PillChip key={value} selected={data.inside_pages_style === value} onClick={() => setField('inside_pages_style', value)}>
                  {label}
                </PillChip>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <FieldLabel>Quantity</FieldLabel>
              <span className="font-display text-2xl text-accent-gold">
                {(data.quantity ?? QUANTITY_DEFAULT) >= QUANTITY_MAX ? `${QUANTITY_MAX}+` : data.quantity ?? QUANTITY_DEFAULT}
              </span>
            </div>
            <input
              type="range"
              min={QUANTITY_MIN}
              max={QUANTITY_MAX}
              step={5}
              value={data.quantity ?? QUANTITY_DEFAULT}
              onChange={(e) => setField('quantity', Number(e.target.value))}
              aria-label="Quantity"
              className="w-full accent-accent-gold"
            />
            <div className="flex justify-between font-mono text-[11px] text-text-muted">
              <span>{QUANTITY_MIN}</span>
              <span>{QUANTITY_MAX}+</span>
            </div>
          </div>

          <label className="flex items-start gap-3 border-t border-border pt-6">
            <input
              type="checkbox"
              checked={data.bespoke_design}
              onChange={(e) => setField('bespoke_design', e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent-gold"
            />
            <span>
              <span className="block font-body text-body-base text-cat-heading">This is a bespoke design</span>
              <span className="block font-body text-sm text-text-muted">Your client wants to create their own custom design rather than choosing from our templates.</span>
            </span>
          </label>

          {data.bespoke_design && (
            <div className="animate-fadeIn">
              <FieldLabel>Bespoke design details</FieldLabel>
              <TextAreaField
                value={data.bespoke_details}
                onChange={(v) => setField('bespoke_details', v)}
                placeholder="Describe the theme, colours, imagery, or references for the custom design..."
                rows={4}
              />
            </div>
          )}
        </SectionCard>

        {data.bespoke_design && (
          <SectionCard title="Additional products" subtitle="Keepsakes to accompany the bespoke order of service.">
            <div className="space-y-4">
              {products.map((product) => {
                const selectedForProduct = data.additional_products.filter((p) => p.slug === product.slug);
                return (
                  <div key={product.slug} className="border border-border p-4">
                    <p className="font-display text-lg text-cat-heading">{product.title}</p>
                    <div className="mt-3 space-y-2">
                      {product.sizes.map((size) => {
                        const existing = selectedForProduct.find((p) => p.size === size.label);
                        return (
                          <div key={size.label} className="flex items-center justify-between gap-4">
                            <span className="font-body text-sm text-cat-body">
                              {size.label !== 'Standard' ? size.label : product.title}
                              <span className="ml-2 font-mono text-[11px] text-text-muted">{size.dimensions}</span>
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={existing?.quantity ?? ''}
                              onChange={(e) => setProductQuantity(product.slug, product.title, size.label, Math.max(0, Number(e.target.value) || 0))}
                              placeholder="0"
                              className="w-20 border border-border bg-cat-bg px-3 py-1.5 text-center font-mono text-sm text-cat-heading outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        <SectionCard title="Photographs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel hint="first 2 included, £5 each after">Quantity</FieldLabel>
              <TextField type="number" value={data.photo_qty} onChange={(v) => setField('photo_qty', v)} placeholder="0" />
            </div>
            <div>
              <FieldLabel>Supplied via</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {([
                  ['email', 'Email'],
                  ['post', 'Post'],
                ] as [PhotoSuppliedVia, string][]).map(([value, label]) => (
                  <PillChip key={value} selected={data.photo_supplied_via === value} onClick={() => setField('photo_supplied_via', value)}>
                    {label}
                  </PillChip>
                ))}
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Instructions for supplied photographs</FieldLabel>
            <TextAreaField
              value={data.photo_instructions}
              onChange={(v) => setField('photo_instructions', v)}
              placeholder="e.g. print in colour, retouch, crop tighter on the left..."
            />
          </div>
        </SectionCard>

        <SectionCard title="Inside Information">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={data.callback_requested}
              onChange={(e) => setField('callback_requested', e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent-gold"
            />
            <span className="block font-body text-body-base text-cat-heading">
              I&apos;d like the design team to call and discuss the details
            </span>
          </label>
          {data.callback_requested && (
            <div className="animate-fadeIn">
              <FieldLabel>Contact number</FieldLabel>
              <TextField type="tel" value={data.callback_phone} onChange={(v) => setField('callback_phone', v)} />
            </div>
          )}
          <div>
            <TextAreaField
              value={data.additional_notes}
              onChange={(v) => setField('additional_notes', v)}
              placeholder="Running order, readings, anything else we should know..."
              rows={4}
            />
          </div>
        </SectionCard>

        <SectionCard title="Backpage Information">
          <div>
            <TextAreaField
              value={data.backpage_information}
              onChange={(v) => setField('backpage_information', v)}
              placeholder="Thanks, wake, and donation information..."
              rows={4}
            />
          </div>
        </SectionCard>

        <SectionCard title="Attachments" subtitle="A photo, PDF, or other file to go with this order — an alternative to emailing or posting it.">
          <FileUpload
            value={data.attachment_url}
            onChange={(url) => setField('attachment_url', url)}
            folder="order-form-attachments"
            filenamePrefix={enquiry.id.slice(0, 8).toUpperCase()}
            label="Attach a file"
            helperText="PNG, JPG, WebP, AVIF, GIF, HEIC, or PDF up to 25MB"
          />
        </SectionCard>

        {status === 'error' && errorMessage && (
          <p className="font-body text-sm text-accent-blush" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={status === 'submitting' || status === 'saving'}
            className="bg-accent-gold px-8 py-3.5 font-body font-medium uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-dark disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit order form'}
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={status === 'submitting' || status === 'saving'}
            className="font-body text-label uppercase tracking-wider text-text-muted transition-colors hover:text-text-heading disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save and finish later'}
          </button>
        </div>

        <p className="font-mono text-[11px] text-text-muted">
          Questions about your order?{' '}
          <Link href="/contact" className="text-accent-gold link-underline">Contact us</Link>.
        </p>
      </form>
    </main>
  );
}
