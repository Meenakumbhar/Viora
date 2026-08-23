'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FileUpload from '@/components/ui/FileUpload';
import type { PortfolioItem, PortfolioFilters, ServiceCategory } from '@/types/database';

const CATEGORIES: ServiceCategory[] = ['wedding', 'funeral', 'sports', 'branding', 'events'];

const FILTER_GROUPS: { key: keyof PortfolioFilters; label: string }[] = [
  { key: 'style', label: 'Style' },
  { key: 'religion', label: 'Religion' },
  { key: 'colour', label: 'Colour' },
  { key: 'children', label: 'Children' },
];

interface FormState {
  id: string | null;
  title: string;
  category: ServiceCategory;
  description: string;
  location: string;
  image_url: string;
  published: boolean;
  templateNumber: string;
  filterText: Record<keyof PortfolioFilters, string>;
}

function emptyForm(): FormState {
  return {
    id: null,
    title: '',
    category: 'wedding',
    description: '',
    location: '',
    image_url: '',
    published: true,
    templateNumber: '',
    filterText: { style: '', religion: '', colour: '', children: '' },
  };
}

function toFormState(item: PortfolioItem): FormState {
  const filterText: Record<keyof PortfolioFilters, string> = { style: '', religion: '', colour: '', children: '' };
  (Object.keys(filterText) as (keyof PortfolioFilters)[]).forEach((key) => {
    filterText[key] = (item.filters?.[key] ?? []).join(', ');
  });

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    description: item.description ?? '',
    location: item.location ?? '',
    image_url: item.image_url,
    published: item.published,
    templateNumber: item.template_number ?? '',
    filterText,
  };
}

function parseFilters(filterText: Record<keyof PortfolioFilters, string>): PortfolioFilters {
  const filters: PortfolioFilters = {};
  (Object.keys(filterText) as (keyof PortfolioFilters)[]).forEach((key) => {
    const values = filterText[key]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length > 0) filters[key] = values;
  });
  return filters;
}

export default function PortfolioAdminManager({ initialItems }: { initialItems: PortfolioItem[] }) {
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

  function openEdit(item: PortfolioItem) {
    setError('');
    setForm(toFormState(item));
  }

  function closeForm() {
    setForm(null);
    setError('');
  }

  async function handleSubmit() {
    if (!form) return;
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.image_url) {
      setError('Upload an image before saving.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title,
      category: form.category,
      description: form.description || null,
      location: form.location || null,
      image_url: form.image_url,
      filters: parseFilters(form.filterText),
      template_number: form.templateNumber.trim() || null,
      published: form.published,
    };

    try {
      const response = await fetch(form.id ? `/api/portfolio/${form.id}` : '/api/portfolio', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to save item.');
      }

      const saved: PortfolioItem = json.data;
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];
      });
      setForm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PortfolioItem) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/portfolio/${item.id}`, { method: 'DELETE' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete item.');
      }

      setItems((current) => current.filter((existing) => existing.id !== item.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item.');
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
          + New item
        </button>
      </div>

      {/* Items table */}
      <div className="border border-white/10">
        {visibleItems.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-white/30">No portfolio items in this category yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Image</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Title</th>
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
              <h2 className="font-display text-2xl font-light">{form.id ? 'Edit item' : 'New item'}</h2>
              <button type="button" onClick={closeForm} className="font-mono text-xl text-white/40 hover:text-white">
                &times;
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
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
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="London, UK"
                    className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Template no. <span className="normal-case text-white/25">(reference number, not required to be unique)</span>
                </label>
                <input
                  type="text"
                  value={form.templateNumber}
                  onChange={(e) => setForm({ ...form, templateNumber: e.target.value })}
                  placeholder="e.g. 195"
                  className="mt-2 w-full max-w-xs border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
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
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Filters (comma separated, optional)</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {FILTER_GROUPS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block font-mono text-[9px] uppercase tracking-widest text-white/30">{label}</label>
                      <input
                        type="text"
                        value={form.filterText[key]}
                        onChange={(e) =>
                          setForm({ ...form, filterText: { ...form.filterText, [key]: e.target.value } })
                        }
                        placeholder="e.g. minimal, classic"
                        className="mt-1.5 w-full border border-white/15 bg-transparent px-3 py-2 text-xs text-white outline-none focus:border-[#C6A85C]"
                      />
                    </div>
                  ))}
                </div>
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
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create item'}
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
