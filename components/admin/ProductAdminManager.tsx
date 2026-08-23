'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FileUpload from '@/components/ui/FileUpload';
import type { Product, ServiceCategory } from '@/types/database';

const CATEGORIES: ServiceCategory[] = ['wedding', 'funeral', 'sports', 'branding', 'events'];

interface SizeRow {
  label: string;
  dimensions: string;
  description: string;
}

interface FormState {
  id: string | null;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: ServiceCategory;
  image_url: string;
  sizes: SizeRow[];
  related_slugs: string[];
  published: boolean;
}

function emptySize(): SizeRow {
  return { label: '', dimensions: '', description: '' };
}

function emptyForm(): FormState {
  return {
    id: null,
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    category: 'wedding',
    image_url: '',
    sizes: [emptySize()],
    related_slugs: [],
    published: true,
  };
}

function toFormState(item: Product): FormState {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle ?? '',
    description: item.description ?? '',
    category: item.category,
    image_url: item.image_url ?? '',
    sizes:
      item.sizes.length > 0
        ? item.sizes.map((s) => ({ label: s.label, dimensions: s.dimensions, description: s.description ?? '' }))
        : [emptySize()],
    related_slugs: item.related_slugs,
    published: item.published,
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductAdminManager({ initialItems }: { initialItems: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');

  const visibleItems = useMemo(
    () => (categoryFilter === 'all' ? items : items.filter((item) => item.category === categoryFilter)),
    [items, categoryFilter]
  );

  function openCreate() {
    setError('');
    setForm(emptyForm());
  }

  function openEdit(item: Product) {
    setError('');
    setForm(toFormState(item));
  }

  function closeForm() {
    setForm(null);
    setError('');
  }

  function updateSize(index: number, patch: Partial<SizeRow>) {
    if (!form) return;
    setForm({
      ...form,
      sizes: form.sizes.map((size, i) => (i === index ? { ...size, ...patch } : size)),
    });
  }

  function addSize() {
    if (!form) return;
    setForm({ ...form, sizes: [...form.sizes, emptySize()] });
  }

  function removeSize(index: number) {
    if (!form) return;
    setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) });
  }

  async function handleSubmit() {
    if (!form) return;
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }
    const sizes = form.sizes
      .filter((s) => s.label.trim() && s.dimensions.trim())
      .map((s) => ({ label: s.label.trim(), dimensions: s.dimensions.trim(), description: s.description.trim() || undefined }));
    if (sizes.length === 0) {
      setError('At least one size (label + dimensions) is required.');
      return;
    }

    setSaving(true);
    setError('');

    const slug = slugify(form.slug);
    const payload = {
      slug,
      // Products are one-per-catalog-item now (design variety comes from
      // picking a portfolio template on the product page, not from
      // multiple product rows) — type_slug/type_label just mirror the
      // product itself rather than being a separate admin concept.
      type_slug: slug,
      type_label: form.title,
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      category: form.category,
      image_url: form.image_url || null,
      sizes,
      related_slugs: form.related_slugs,
      published: form.published,
    };

    try {
      const response = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to save product.');
      }

      const saved: Product = json.data;
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current];
      });
      setForm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Product) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/products/${item.id}`, { method: 'DELETE' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete product.');
      }

      setItems((current) => current.filter((existing) => existing.id !== item.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="dash-legacy">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${categoryFilter === 'all' ? 'border-[#C6A85C] text-[#C6A85C]' : 'border-white/15 text-white/40 hover:text-white/70'
              }`}
          >
            All ({items.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest capitalize transition-colors ${categoryFilter === cat ? 'border-[#C6A85C] text-[#C6A85C]' : 'border-white/15 text-white/40 hover:text-white/70'
                }`}
            >
              {cat} ({items.filter((i) => i.category === cat).length})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="border border-[#C6A85C] bg-[#C6A85C] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90"
        >
          + New product
        </button>
      </div>

      {/* Items table */}
      <div className="border border-white/10">
        {visibleItems.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-white/30">No products in this category yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Image</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Title</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Slug</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, i) => (
                <tr key={item.id} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden border border-white/10 bg-white/5">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-white/80">{item.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-white/40">{item.slug}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs capitalize text-white/50">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`font-mono text-[10px] uppercase ${item.published ? 'text-emerald-400' : 'text-white/30'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="font-mono text-[10px] uppercase tracking-wider text-white/50 hover:text-[#C6A85C]"
                    >
                      Edit
                    </button>
                    <span className="mx-2 text-white/15">·</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="font-mono text-[10px] uppercase tracking-wider text-white/50 hover:text-red-400 disabled:opacity-40"
                    >
                      {deletingId === item.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / edit panel */}
      {form && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#151C24] p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-light">{form.id ? 'Edit product' : 'New product'}</h2>
              <button type="button" onClick={closeForm} className="font-mono text-xl text-white/40 hover:text-white">
                &times;
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Slug <span className="normal-case text-white/25">(used in the URL, must be unique)</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. memory-cards"
                    className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
                    className="mt-2 w-full border border-white/15 bg-[#151C24] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Subtitle</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
              </div>

              <div>
                <FileUpload
                  label="Photo"
                  helperText={`Uploads to Cloudflare R2 under /${form.category}`}
                  folder={form.category}
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Sizes</p>
                  <button
                    type="button"
                    onClick={addSize}
                    className="font-mono text-[10px] uppercase tracking-wider text-[#C6A85C] hover:opacity-80"
                  >
                    + Add size
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {form.sizes.map((size, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 border border-white/10 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                      <input
                        type="text"
                        value={size.label}
                        onChange={(e) => updateSize(index, { label: e.target.value })}
                        placeholder="Label (e.g. Standard)"
                        className="border border-white/15 bg-transparent px-3 py-2 text-xs text-white outline-none focus:border-[#C6A85C]"
                      />
                      <input
                        type="text"
                        value={size.dimensions}
                        onChange={(e) => updateSize(index, { dimensions: e.target.value })}
                        placeholder="Dimensions (e.g. A6)"
                        className="border border-white/15 bg-transparent px-3 py-2 text-xs text-white outline-none focus:border-[#C6A85C]"
                      />
                      <input
                        type="text"
                        value={size.description}
                        onChange={(e) => updateSize(index, { description: e.target.value })}
                        placeholder="Description (optional)"
                        className="border border-white/15 bg-transparent px-3 py-2 text-xs text-white outline-none focus:border-[#C6A85C]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        disabled={form.sizes.length === 1}
                        className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-red-400 disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Related products <span className="normal-case text-white/25">(shown as "You might also like")</span>
                </label>
                <select
                  multiple
                  value={form.related_slugs}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      related_slugs: Array.from(e.target.selectedOptions).map((opt) => opt.value),
                    })
                  }
                  className="mt-2 h-32 w-full border border-white/15 bg-[#151C24] px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
                >
                  {items
                    .filter((item) => item.id !== form.id)
                    .map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.title}
                      </option>
                    ))}
                </select>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="h-4 w-4 accent-[#C6A85C]"
                />
                <span className="font-mono text-xs uppercase tracking-wider text-white/60">Published (visible on the public site)</span>
              </label>

              {error && (
                <p className="font-mono text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="border border-[#C6A85C] bg-[#C6A85C] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create product'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
