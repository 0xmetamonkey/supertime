'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/types/offerings';

// ─── Helpers ─────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const blankItem = (): MenuItem => ({
  id: uid(),
  title: '',
  price: 0,
});

// ─── Props ───────────────────────────────────────────────────────────

interface MenuManagerProps {
  /** Pre-loaded categories (from KV or API). Falls back to empty list. */
  initialCategories?: MenuCategory[];
  /** Called whenever the category list changes so the parent can persist it. */
  onChange?: (categories: MenuCategory[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function MenuManager({
  initialCategories = [],
  onChange,
}: MenuManagerProps) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [newCatName, setNewCatName] = useState('');

  // Editing state — only one item at a time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Propagate changes upward
  const commit = useCallback(
    (next: MenuCategory[]) => {
      setCategories(next);
      onChange?.(next);
    },
    [onChange],
  );

  // ── Category CRUD ──────────────────────────────────────────────

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    commit([...categories, { id: uid(), name, items: [] }]);
    setNewCatName('');
  };

  const deleteCategory = (catId: string) => {
    commit(categories.filter((c) => c.id !== catId));
  };

  // ── Item CRUD ──────────────────────────────────────────────────

  const addItem = (catId: string) => {
    commit(
      categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, blankItem()] } : c,
      ),
    );
  };

  const deleteItem = (catId: string, itemId: string) => {
    commit(
      categories.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c,
      ),
    );
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditPrice(String(item.price));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (catId: string, itemId: string) => {
    commit(
      categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId
                  ? { ...i, title: editTitle.trim() || 'Untitled', price: Number(editPrice) || 0 }
                  : i,
              ),
            }
          : c,
      ),
    );
    setEditingId(null);
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Custom Store Menu</h2>
        <p className="text-sm text-muted mt-0.5">
          Group your offerings into categories — sessions, artwork, merch, consultations, etc.
        </p>
      </div>

      {/* ── Add Category ─────────────────────────────────────────── */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          placeholder="New category name…"
          className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-foreground text-foreground placeholder:text-muted"
        />
        <button
          onClick={addCategory}
          disabled={!newCatName.trim()}
          className="px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* ── Category List ────────────────────────────────────────── */}
      {categories.length === 0 && (
        <div className="py-12 text-center text-muted border border-dashed border-border rounded-2xl text-sm">
          No categories yet — add one above to get started.
        </div>
      )}

      <div className="space-y-5">
        {categories.map((cat) => (
          <div key={cat.id} className="border border-border rounded-2xl bg-surface overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {cat.name}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addItem(cat.id)}
                  className="text-xs font-semibold text-muted hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Item
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Items */}
            {cat.items.length === 0 ? (
              <p className="text-xs text-muted px-5 py-4">
                No items yet — click <span className="font-semibold">+ Item</span> to add one.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3 gap-3"
                  >
                    {editingId === item.id ? (
                      /* ── Inline Edit ── */
                      <>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-foreground text-foreground"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="₹ Price"
                          className="w-24 text-sm bg-background border border-border rounded-lg px-3 py-1.5 text-right focus:outline-none focus:border-foreground text-foreground tabular-nums"
                        />
                        <button
                          onClick={() => saveEdit(cat.id, item.id)}
                          className="text-green-600 hover:text-green-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="text-muted hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* ── Display ── */
                      <>
                        <span className="text-sm text-foreground flex-1 truncate">
                          {item.title || <span className="italic text-muted">Untitled</span>}
                        </span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          ₹{item.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => startEdit(item)}
                          className="text-muted hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(cat.id, item.id)}
                          className="text-muted hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

