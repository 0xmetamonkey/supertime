/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  ShoppingBag,
  Tag,
  DollarSign,
  Check,
  Upload,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  Package,
  Wrench,
  Music,
  Palette,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAlertDialog } from '../components/AlertDialog';
import { useConfirmDialog } from '../components/ConfirmDialog';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit?: string; // 'fixed' | 'per_item' | 'per_hr' | 'per_day' | 'per_track' | 'per_month'
  type?: 'service' | 'physical' | 'digital' | 'booking' | 'commission';
  image?: string;
  badge?: string; // 'Popular', 'Limited', 'New', etc.
  available?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

interface MenuCatalogEditorProps {
  username: string;
  initialCategories?: MenuCategory[];
  onSaved?: (categories: MenuCategory[]) => void;
}

const PRESET_TEMPLATES: { name: string; icon: any; categories: MenuCategory[] }[] = [
  {
    name: 'Visual Artist & Physical Goods',
    icon: Palette,
    categories: [
      {
        id: 'cat-art',
        name: 'Original Canvas Paintings',
        description: 'Authentic handcrafted original artwork shipped directly to collectors',
        items: [
          {
            id: 'item-1',
            name: 'Original Acrylic on Canvas (24x36)',
            description: 'Custom textured acrylic canvas painting signed with certificate of authenticity.',
            price: 25000,
            priceUnit: 'fixed',
            type: 'physical',
            badge: 'Featured',
            available: true,
          },
          {
            id: 'item-2',
            name: 'Fine Art Archival Print (A3)',
            description: 'Museum-grade archival cotton rag giclée print, limited edition of 50.',
            price: 3500,
            priceUnit: 'per_item',
            type: 'physical',
            badge: 'Limited',
            available: true,
          }
        ]
      },
      {
        id: 'cat-commissions',
        name: 'Custom Commissions',
        description: 'Bespoke commissioned artwork tailored to your room or project',
        items: [
          {
            id: 'item-3',
            name: 'Custom Portrait / Concept Art',
            description: 'Full resolution digital illustration with commercial usage rights.',
            price: 8000,
            priceUnit: 'fixed',
            type: 'commission',
            available: true,
          }
        ]
      }
    ]
  },
  {
    name: 'Music & Audio Producer',
    icon: Music,
    categories: [
      {
        id: 'cat-beats',
        name: 'Beats & Sound Kits',
        description: 'Exclusive licenses, wav leases, and sound libraries',
        items: [
          {
            id: 'item-beat-1',
            name: 'Exclusive Instrumental Lease',
            description: 'WAV stems + untagged master track with unlimited streaming license.',
            price: 7500,
            priceUnit: 'per_track',
            type: 'digital',
            badge: 'Popular',
            available: true,
          },
          {
            id: 'item-kit-1',
            name: 'Signature Drum & Melody Pack',
            description: 'Over 150+ royalty-free sounds, 808s, and analog synth one-shots.',
            price: 1800,
            priceUnit: 'fixed',
            type: 'digital',
            available: true,
          }
        ]
      },
      {
        id: 'cat-mix',
        name: 'Mixing & Mastering Services',
        description: 'Industry-standard vocal tuning, stem mixing, and broadcast loudness',
        items: [
          {
            id: 'item-mix-1',
            name: 'Full Vocal & Beat Mixdown',
            description: 'Professional balance, EQ, compression, and spatial effects with 2 revision rounds.',
            price: 5000,
            priceUnit: 'per_track',
            type: 'service',
            available: true,
          }
        ]
      }
    ]
  },
  {
    name: 'Consulting, Design & Mentorship',
    icon: Wrench,
    categories: [
      {
        id: 'cat-sessions',
        name: '1:1 Consulting & Strategy',
        description: 'Dedicated guidance, project advisory, and skill building',
        items: [
          {
            id: 'item-consult-1',
            name: 'Portfolio / Project Deep Dive',
            description: '60-minute intensive review with action plan and recording.',
            price: 4500,
            priceUnit: 'per_hr',
            type: 'booking',
            badge: 'Best Seller',
            available: true,
          },
          {
            id: 'item-consult-2',
            name: 'Monthly Advisory Retainer',
            description: 'Weekly scheduled advisory calls plus direct async Slack/WhatsApp support.',
            price: 35000,
            priceUnit: 'per_month',
            type: 'service',
            available: true,
          }
        ]
      }
    ]
  }
];

export default function MenuCatalogEditor({ username, initialCategories = [], onSaved }: MenuCatalogEditorProps) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialCategories.forEach(c => { init[c.id] = true; });
    return init;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryDescInput, setCategoryDescInput] = useState('');

  // Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemPriceUnit, setItemPriceUnit] = useState<string>('fixed');
  const [itemType, setItemType] = useState<'service' | 'physical' | 'digital' | 'booking' | 'commission'>('service');
  const [itemImage, setItemImage] = useState<string>('');
  const [itemBadge, setItemBadge] = useState<string>('');
  const [itemAvailable, setItemAvailable] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { alert: customAlert, AlertDialog } = useAlertDialog();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Open Category Modal ──
  const openAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryNameInput('');
    setCategoryDescInput('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryNameInput(cat.name);
    setCategoryDescInput(cat.description || '');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    if (editingCategoryId) {
      setCategories(prev => prev.map(cat => cat.id === editingCategoryId ? {
        ...cat,
        name: categoryNameInput.trim(),
        description: categoryDescInput.trim(),
      } : cat));
    } else {
      const newCat: MenuCategory = {
        id: `cat-${Date.now()}`,
        name: categoryNameInput.trim(),
        description: categoryDescInput.trim(),
        items: [],
      };
      setCategories(prev => [...prev, newCat]);
      setExpandedCategories(prev => ({ ...prev, [newCat.id]: true }));
    }

    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    const agreed = await confirm({
      title: `Delete Category "${catName}"?`,
      message: 'All items inside this category will also be removed from your catalog.',
      confirmText: 'Delete Category',
      destructive: true,
    });
    if (!agreed) return;

    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  // ── Open Item Modal ──
  const openAddItem = (catId: string) => {
    setTargetCategoryId(catId);
    setEditingItemId(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemPriceUnit('fixed');
    setItemType('service');
    setItemImage('');
    setItemBadge('');
    setItemAvailable(true);
    setShowItemModal(true);
  };

  const openEditItem = (catId: string, item: MenuItem) => {
    setTargetCategoryId(catId);
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price);
    setItemPriceUnit(item.priceUnit || 'fixed');
    setItemType(item.type || 'service');
    setItemImage(item.image || '');
    setItemBadge(item.badge || '');
    setItemAvailable(item.available ?? true);
    setShowItemModal(true);
  };

  const handleUploadItemImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingImage(true);
    const file = e.target.files[0];
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      const data = await res.json();
      if (data.url) {
        setItemImage(data.url);
      }
    } catch {
      customAlert({
        title: 'Upload Failed',
        message: 'Could not upload image. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategoryId || !itemName.trim() || itemPrice === '') return;

    const newItemData: MenuItem = {
      id: editingItemId || `item-${Date.now()}`,
      name: itemName.trim(),
      description: itemDesc.trim(),
      price: Number(itemPrice),
      priceUnit: itemPriceUnit,
      type: itemType,
      image: itemImage.trim() || undefined,
      badge: itemBadge.trim() || undefined,
      available: itemAvailable,
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id !== targetCategoryId) return cat;
      const existingIndex = cat.items.findIndex(i => i.id === newItemData.id);
      if (existingIndex >= 0) {
        const nextItems = [...cat.items];
        nextItems[existingIndex] = newItemData;
        return { ...cat, items: nextItems };
      } else {
        return { ...cat, items: [...cat.items, newItemData] };
      }
    }));

    setShowItemModal(false);
  };

  const handleDeleteItem = async (catId: string, itemId: string, itemTitle: string) => {
    const agreed = await confirm({
      title: `Delete "${itemTitle}"?`,
      message: 'This item will be removed from your selling menu.',
      confirmText: 'Delete Item',
      destructive: true,
    });
    if (!agreed) return;

    setCategories(prev => prev.map(cat => cat.id === catId ? {
      ...cat,
      items: cat.items.filter(i => i.id !== itemId),
    } : cat));
  };

  // ── Apply Preset Template ──
  const applyPreset = async (preset: typeof PRESET_TEMPLATES[0]) => {
    const agreed = await confirm({
      title: `Load "${preset.name}" Template?`,
      message: 'This will add sample categories and items to your catalog. You can customize them anytime.',
      confirmText: 'Load Template',
    });
    if (!agreed) return;

    setCategories(preset.categories);
    const newExpand: Record<string, boolean> = {};
    preset.categories.forEach(c => { newExpand[c.id] = true; });
    setExpandedCategories(newExpand);
  };

  // ── Save to Backend ──
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/user/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuCategories: categories }),
      });

      if (!res.ok) throw new Error('Failed to save menu');

      setSaveSuccess(true);
      if (onSaved) onSaved(categories);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      customAlert({
        title: 'Save Failed',
        message: 'Could not save menu items. Please check your connection and try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalItemsCount = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium tracking-tight text-foreground">Sell Anything: Menu & Catalog</h3>
              <p className="text-xs text-muted mt-0.5">
                Organize anything you offer into categories and menu items (artwork, beats, consultations, merch, custom commissions).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddCategory}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground hover:bg-foreground/5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Saved Catalog!' : isSaving ? 'Saving...' : 'Save Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="flex items-center justify-between py-4 text-xs text-muted border-b border-border/50">
        <div className="flex items-center gap-4">
          <span>{categories.length} {categories.length === 1 ? 'Category' : 'Categories'}</span>
          <span>•</span>
          <span>{totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} Listed</span>
        </div>
        {username && (
          <a
            href={`/${username}?tab=products`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors font-medium"
          >
            <span>View on Profile</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Categories & Items Content */}
      <div className="mt-6 space-y-6">
        {categories.length === 0 ? (
          /* Empty State + Preset Starters */
          <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-2xl bg-foreground/[0.01]">
            <div className="w-14 h-14 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted">
              <Layers className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-1">Your Selling Menu is Empty</h4>
            <p className="text-xs text-muted max-w-md mx-auto mb-6">
              Create categories and list products, artwork, digital downloads, or creative services for your fans and clients.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={openAddCategory}
                className="px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                + Create Custom Category
              </button>
            </div>

            <div className="pt-6 border-t border-border max-w-xl mx-auto">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-3">
                Or Start With a Ready-Made Template
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRESET_TEMPLATES.map((tpl, i) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(tpl)}
                      className="p-3 bg-surface border border-border hover:border-foreground/40 rounded-xl text-left transition-all group cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-muted group-hover:text-foreground mb-1.5 transition-colors" />
                      <div className="text-xs font-semibold text-foreground leading-tight">{tpl.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Categories List */
          <div className="space-y-6">
            {categories.map((cat) => {
              const isExpanded = expandedCategories[cat.id] ?? true;
              return (
                <div
                  key={cat.id}
                  className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm transition-colors"
                >
                  {/* Category Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-surface border-b border-border/70">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className="text-muted hover:text-foreground transition-colors p-1"
                        aria-label="Toggle Category"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{cat.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-foreground/5 text-muted border border-border shrink-0">
                            {cat.items?.length || 0} items
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted truncate mt-0.5">{cat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openAddItem(cat.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                        title="Add item to category"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 text-muted hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5">
                      {(!cat.items || cat.items.length === 0) ? (
                        <div className="text-center py-8 border border-dashed border-border/80 rounded-xl bg-surface/30">
                          <Package className="w-6 h-6 text-muted mx-auto mb-2 opacity-50" />
                          <p className="text-xs text-muted mb-3">No items in this category yet.</p>
                          <button
                            type="button"
                            onClick={() => openAddItem(cat.id)}
                            className="px-3.5 py-1.5 bg-surface border border-border text-foreground hover:bg-foreground/5 text-xs font-medium rounded-lg transition-all cursor-pointer"
                          >
                            + Add First Item
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {cat.items.map((item) => (
                            <div
                              key={item.id}
                              className={`p-4 rounded-xl border transition-all flex flex-col justify-between bg-surface ${
                                item.available ? 'border-border' : 'border-border/60 opacity-60 bg-foreground/[0.01]'
                              }`}
                            >
                              <div className="flex items-start gap-3.5 mb-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-muted shrink-0">
                                    <Tag className="w-5 h-5 opacity-40" />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <h5 className="font-semibold text-foreground text-sm truncate">{item.name}</h5>
                                    {item.badge && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-neo-pink/15 text-neo-pink px-1.5 py-0.5 rounded-full shrink-0">
                                        {item.badge}
                                      </span>
                                    )}
                                    {!item.available && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded-full shrink-0">
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                    {item.description || 'No description provided.'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                                <div className="font-mono font-semibold text-foreground">
                                  ₹{item.price.toLocaleString()}
                                  {item.priceUnit && item.priceUnit !== 'fixed' && (
                                    <span className="text-muted font-normal text-[11px] ml-1">
                                      / {item.priceUnit.replace('per_', '')}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditItem(cat.id, item)}
                                    className="px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(cat.id, item.id, item.name)}
                                    className="px-2 py-1 text-xs font-medium text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Category Modal (Add / Edit) ── */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl z-10"
            >
              <h4 className="text-lg font-bold text-foreground mb-1">
                {editingCategoryId ? 'Edit Category' : 'New Menu Category'}
              </h4>
              <p className="text-xs text-muted mb-5">
                Group items that belong together (e.g., Original Art, Music Production, 1:1 Sessions, Merch).
              </p>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="e.g. Original Canvas Paintings"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={categoryDescInput}
                    onChange={(e) => setCategoryDescInput(e.target.value)}
                    placeholder="Short summary for this category..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {editingCategoryId ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Item Modal (Add / Edit) ── */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowItemModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-2xl z-10 my-8"
            >
              <h4 className="text-lg font-bold text-foreground mb-1">
                {editingItemId ? 'Edit Menu Item' : 'Add Item to Menu'}
              </h4>
              <p className="text-xs text-muted mb-5">
                Set what you are selling, its price, description, and thumbnail.
              </p>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Oil on Canvas (18x24) or Beat License"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                      Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="5000"
                        className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                      Price Unit
                    </label>
                    <select
                      value={itemPriceUnit}
                      onChange={(e) => setItemPriceUnit(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="per_item">Per Item / Piece</option>
                      <option value="per_hr">Per Hour</option>
                      <option value="per_day">Per Day</option>
                      <option value="per_track">Per Track / Song</option>
                      <option value="per_month">Per Month</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                      Item Type
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="service">Service / Custom</option>
                      <option value="physical">Physical Product / Art</option>
                      <option value="digital">Digital File / Download</option>
                      <option value="booking">1:1 Session / Booking</option>
                      <option value="commission">Commission</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                      Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={itemBadge}
                      onChange={(e) => setItemBadge(e.target.value)}
                      placeholder="e.g. Popular, Limited, New"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Describe dimensions, deliverables, format, what is included..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                    Thumbnail Image
                  </label>
                  <div className="flex items-center gap-3">
                    {itemImage ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0">
                        <img src={itemImage} alt="Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setItemImage('')}
                          className="absolute top-0 right-0 p-0.5 bg-black/70 text-white rounded-bl"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}

                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-border rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadItemImage}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Availability</span>
                    <span className="text-[11px] text-muted">Visible and ready to order on profile</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {editingItemId ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {AlertDialog}
      {ConfirmDialog}
    </div>
  );
}

