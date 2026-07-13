/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Plus,
  X,
  Package,
  Link as LinkIcon,
  Calendar,
  Video,
  FileText,
  Upload,
  Zap,
  Edit2,
  Trash2,
  Clock
} from 'lucide-react';
import FundraiserManager from './FundraiserManager';

interface StorefrontTabProps {
  username: string | null;
  initialSettings?: any;
}

export default function StorefrontTab({ username, initialSettings }: StorefrontTabProps) {
  const [storefrontTab, setStorefrontTab] = useState<'store' | 'courses' | 'about'>('store');
  const [showCreateShow, setShowCreateShow] = useState(false);
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowDesc, setNewShowDesc] = useState('');
  const [newShowDate, setNewShowDate] = useState('');
  const [newShowTime, setNewShowTime] = useState('');
  const [newShowPrice, setNewShowPrice] = useState('');
  const [newShowSeats, setNewShowSeats] = useState('100');
  const [products, setProducts] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    type: 'digital' as 'digital' | 'link' | 'booking' | 'recording',
    content: '',
    duration: '',
    thumbnail: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Subscription State
  const [subPrice, setSubPrice] = useState(initialSettings?.subscriptionPrice || 199);
  const [subBenefits, setSubBenefits] = useState<string[]>(initialSettings?.subscriptionBenefits || []);
  const [newBenefit, setNewBenefit] = useState('');
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [subSaveSuccess, setSubSaveSuccess] = useState(false);

  const handleSaveSubscription = async () => {
    setIsSavingSub(true);
    setSubSaveSuccess(false);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionPrice: subPrice, subscriptionBenefits: subBenefits }),
      });
      setSubSaveSuccess(true);
      setTimeout(() => setSubSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save subscription settings");
    } finally {
      setIsSavingSub(false);
    }
  };

  useEffect(() => {
    fetch('/api/user/products')
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, []);

  const handleSaveProducts = async (newProducts: any[]) => {
    setProducts(newProducts);
    try {
      await fetch('/api/user/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts }),
      });
    } catch (err) {
      console.error('Error saving products:', err);
    }
  };

  const handleFileUpload = async (file: File, type: 'product' | 'thumbnail') => {
    if (type === 'product') setUploadingFile(true);
    else setUploadingThumb(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.url) {
        if (type === 'product') {
          setProductForm(prev => ({ ...prev, content: data.url }));
        } else {
          setProductForm(prev => ({ ...prev, thumbnail: data.url }));
        }
      } else {
        throw new Error('Upload response is missing url');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      if (type === 'product') setUploadingFile(false);
      else setUploadingThumb(false);
    }
  };

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price) return;
    const product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: productForm.name,
      description: productForm.description,
      price: parseInt(productForm.price),
      type: productForm.type,
      content: productForm.content,
      duration: productForm.duration,
      thumbnail: productForm.thumbnail,
      createdAt: editingProduct?.createdAt || Date.now(),
    };
    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? product : p);
    } else {
      newProducts = [...products, product];
    }
    handleSaveProducts(newProducts);
    setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const startEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: String(prod.price || ''),
      type: prod.type || 'digital',
      content: prod.content || '',
      duration: prod.duration || '',
      thumbnail: prod.thumbnail || '',
    });
    setShowProductForm(true);
  };

  const productTypeConfig = {
    digital: { icon: Package, label: 'Digital Product', color: 'neo-green', desc: 'PDF, preset, template, video' },
    link: { icon: LinkIcon, label: 'Link / Course', color: 'neo-blue', desc: 'Course, community, resource URL' },
    booking: { icon: Calendar, label: 'Booking / Call', color: 'neo-pink', desc: 'Zoom, Meet, Calendly link' },
    recording: { icon: Video, label: 'Video Recording', color: 'neo-yellow', desc: 'Gated masterclass or free video' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h3 className="text-2xl font-medium tracking-tight text-foreground">Product Manager</h3>
          <p className="text-sm text-muted mt-1">Sell digital products, courses, bookings & more</p>
        </div>
        <div className="flex gap-3">
          {username && (
            <button
              onClick={() => window.open('/' + username, '_blank')}
              className="bg-surface text-foreground px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 border border-border hover:bg-background transition-colors shadow-sm"
            >
              <Eye className="w-4 h-4" /> View Live Store
            </button>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
              setShowProductForm(true);
            }}
            className="bg-foreground text-background px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface p-8 rounded-2xl border border-border shadow-lg"
          >
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-xl font-medium text-foreground">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h4>
              <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="p-2 rounded-lg hover:bg-background transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-gray-450 mb-3">Product Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['digital', 'link', 'booking', 'recording'] as const).map((type) => {
                  const config = productTypeConfig[type];
                  const isActive = productForm.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setProductForm(prev => ({ ...prev, type }))}
                      className={`p-4 rounded-xl text-left border transition-all ${isActive
                        ? `bg-foreground text-background border-transparent shadow-sm`
                        : 'bg-surface text-foreground border-border hover:border-muted'
                        }`}
                    >
                      <config.icon className={`w-5 h-5 mb-2 ${isActive ? 'text-blue-450' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium leading-none">{config.label}</p>
                      <p className={`text-xs mt-1.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{config.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-450 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Premium Lightroom Presets"
                  className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-450 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="499"
                  min="0"
                  className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-450 mb-2">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what the buyer will get..."
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors resize-none"
              />
            </div>

            {/* Type-specific fields */}
            {productForm.type === 'digital' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-450 mb-2">Upload File</label>
                <div className="border border-dashed border-gray-300 dark:border-border rounded-xl p-6 bg-gray-50 dark:bg-zinc-900/50 text-center">
                  {productForm.content ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">File Uploaded ✓</span>
                      <button onClick={() => setProductForm(prev => ({ ...prev, content: '' }))} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className={`w-8 h-8 ${uploadingFile ? 'animate-bounce text-blue-500' : 'text-gray-300'}`} />
                      <span className="text-xs font-medium text-gray-400">
                        {uploadingFile ? 'Uploading...' : 'Click to upload (PDF, ZIP, etc.)'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'product')}
                        disabled={uploadingFile}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {productForm.type === 'link' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-450 mb-2">External URL</label>
                <input
                  type="url"
                  value={productForm.content}
                  onChange={(e) => setProductForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="https://notion.so/your-course or discord.gg/invite"
                  className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors"
                />
              </div>
            )}

            {productForm.type === 'booking' && (
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-450 mb-2">Meeting Link</label>
                  <input
                    type="url"
                    value={productForm.content}
                    onChange={(e) => setProductForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="https://meet.google.com/... or calendly.com/..."
                    className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-450 mb-2">Duration</label>
                  <input
                    type="text"
                    value={productForm.duration}
                    onChange={(e) => setProductForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="30 min / 1 hour"
                    className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground focus:outline-none focus:bg-surface transition-colors"
                  />
                </div>
              </div>
            )}

            {productForm.type === 'recording' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-450 mb-2">Upload Video File</label>
                <div className="border border-dashed border-gray-300 dark:border-border rounded-xl p-6 bg-gray-50 dark:bg-zinc-900/50 text-center">
                  {productForm.content ? (
                    <div className="flex items-center justify-center gap-3">
                      <Video className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Video Uploaded ✓</span>
                      <button onClick={() => setProductForm(prev => ({ ...prev, content: '' }))} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className={`w-8 h-8 ${uploadingFile ? 'animate-bounce text-blue-500' : 'text-gray-350'}`} />
                      <span className="text-xs font-medium text-gray-450">
                        {uploadingFile ? 'Uploading video...' : 'Click to upload video (MP4, MOV)'}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'product')}
                        disabled={uploadingFile}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Set Price to 0 to provide this recording completely Free to all visitors, or any amount for paid Gated access.
                </p>
              </div>
            )}

            {/* Cover Image */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-gray-450 mb-2">Cover Image (optional)</label>
              <div className="border border-dashed border-gray-300 dark:border-border rounded-xl p-4 bg-gray-50 dark:bg-zinc-900/50">
                {productForm.thumbnail ? (
                  <div className="flex items-center gap-4">
                    <img src={productForm.thumbnail} alt="Cover" className="w-16 h-16 object-cover border border-gray-200 dark:border-border rounded-lg" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 flex-1">Image uploaded ✓</span>
                    <button onClick={() => setProductForm(prev => ({ ...prev, thumbnail: '' }))} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-2">
                    <Upload className={`w-5 h-5 ${uploadingThumb ? 'animate-bounce text-blue-500' : 'text-gray-350'}`} />
                    <span className="text-xs font-medium text-gray-450">
                      {uploadingThumb ? 'Uploading...' : 'Upload cover image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')}
                      disabled={uploadingThumb}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                className="px-6 py-2.5 font-medium text-sm text-gray-400 hover:text-gray-900 dark:hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProductSubmit}
                disabled={!productForm.name || !productForm.price}
                className="bg-foreground text-background px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-30 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                {editingProduct ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface p-5 border border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-muted mb-1">Total Products</span>
          <span className="text-2xl font-medium text-foreground">{products?.length || 0}</span>
        </div>
        <div className="bg-surface p-5 border border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-muted mb-1">Types Active</span>
          <span className="text-2xl font-medium text-foreground">{new Set(products?.map((p: any) => p.type)).size || 0}</span>
        </div>
        <div className="bg-surface p-5 border border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-muted mb-1">Store Status</span>
          <span className="text-2xl font-medium text-green-600 dark:text-green-400">{products?.length > 0 ? 'LIVE' : '—'}</span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((prod: any) => {
          const typeConf = productTypeConfig[prod.type as keyof typeof productTypeConfig] || productTypeConfig.digital;
          const TypeIcon = typeConf.icon;
          return (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-2xl group relative overflow-hidden hover:shadow-md transition-all shadow-sm"
            >
              {/* Thumbnail / Header */}
              {prod.thumbnail ? (
                <div className="h-36 bg-zinc-100 border-b border-border overflow-hidden">
                  <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className="h-24 bg-background border-b border-border flex items-center justify-center">
                  <TypeIcon className="w-10 h-10 opacity-20" />
                </div>
              )}

              <div className="p-6">
                {/* Type Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-background text-foreground rounded">
                    {typeConf.label}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditProduct(prod)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) {
                          handleSaveProducts(products.filter((p: any) => p.id !== prod.id));
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-medium text-foreground mb-1 leading-tight">{prod.name}</h4>
                {prod.description && (
                  <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-2">{prod.description}</p>
                )}

                <div className="flex justify-between items-end pt-4 border-t border-border">
                  <span className="text-lg font-medium text-gray-955 dark:text-white">₹{prod.price}</span>
                  {prod.type === 'booking' && prod.duration && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {prod.duration}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State / Add Card */}
        {(!products || products.length === 0) ? (
          <div
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
              setShowProductForm(true);
            }}
            className="lg:col-span-3 py-16 bg-background border border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-surface transition-colors group"
          >
            <div className="w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-sm font-medium text-foreground">Add Your First Product</p>
            <p className="text-xs text-muted mt-1">Digital goods, courses, bookings & more</p>
          </div>
        ) : (
          <div
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
              setShowProductForm(true);
            }}
            className="border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-background transition-colors group"
          >
            <Plus className="w-6 h-6 text-muted group-hover:text-foreground transition-colors mb-2" />
            <span className="text-xs font-medium text-gray-400 group-hover:text-foreground">Add Another</span>
          </div>
        )}
      </div>

      <div className="w-full h-[1px] bg-border my-12" />
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
           <h3 className="text-xl font-medium text-foreground">Membership / Inner Circle</h3>
           <p className="text-sm text-muted mb-6">Manage your monthly subscription tier</p>
           
           <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
             <div className="mb-4">
               <label className="text-xs font-medium text-gray-500 block mb-1.5">Monthly Price (₹)</label>
               <input
                 type="number"
                 value={subPrice}
                 onChange={(e) => setSubPrice(Number(e.target.value))}
                 className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface"
               />
             </div>
             
             <div className="mb-4">
               <label className="text-xs font-medium text-gray-500 block mb-1.5">Subscription Benefits</label>
               <div className="flex gap-2 mb-3">
                 <input
                   type="text"
                   value={newBenefit}
                   onChange={(e) => setNewBenefit(e.target.value)}
                   placeholder="e.g. Exclusive Q&A"
                   className="flex-1 bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && newBenefit.trim()) {
                       setSubBenefits([...subBenefits, newBenefit.trim()]);
                       setNewBenefit('');
                     }
                   }}
                 />
                 <button
                   onClick={() => {
                     if (newBenefit.trim()) {
                       setSubBenefits([...subBenefits, newBenefit.trim()]);
                       setNewBenefit('');
                     }
                   }}
                   className="bg-foreground text-background px-4 rounded-xl font-medium text-sm"
                 >
                   Add
                 </button>
               </div>
               
               <ul className="space-y-2 mt-4">
                 {subBenefits.map((b: string, i: number) => (
                   <li key={i} className="flex justify-between items-center bg-background border border-border rounded-lg p-3 text-sm text-foreground">
                     <span>{b}</span>
                     <button
                       onClick={() => setSubBenefits(subBenefits.filter((_, idx) => idx !== i))}
                       className="text-gray-400 hover:text-red-500"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </li>
                 ))}
                 {subBenefits.length === 0 && (
                   <p className="text-sm text-gray-400 text-center py-4">No benefits added yet.</p>
                 )}
               </ul>
             </div>
             
             <button
               onClick={handleSaveSubscription}
               disabled={isSavingSub}
               className={`w-full py-3 rounded-xl font-medium text-sm transition-opacity mt-4 ${subSaveSuccess ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-foreground text-white dark:text-background hover:opacity-90'}`}
             >
               {subSaveSuccess ? 'Saved ✓' : isSavingSub ? 'Saving...' : 'Save Membership Settings'}
             </button>
           </div>
        </div>
        <div>
           <h3 className="text-xl font-medium text-foreground">Live Shows</h3>
           <p className="text-sm text-muted mb-6">Schedule ticketed broadcast events</p>
           <button onClick={() => setShowCreateShow(true)}
              className="w-full py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
              Create a Show
           </button>
           <AnimatePresence>
                {showCreateShow && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-surface border border-border p-6 rounded-2xl shadow-lg mt-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-foreground">New Event</h3>
                      </div>
                      <button onClick={() => setShowCreateShow(false)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-background">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1.5">Show Title</label>
                        <input type="text" value={newShowTitle} onChange={e => setNewShowTitle(e.target.value)}
                          placeholder="e.g. Live Acoustic Night"
                          className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Description</label>
                        <textarea value={newShowDesc} onChange={e => setNewShowDesc(e.target.value)}
                          placeholder="Tell fans what to expect..." rows={2}
                          className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Date</label>
                          <input type="date" value={newShowDate} onChange={e => setNewShowDate(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Time</label>
                          <input type="time" value={newShowTime} onChange={e => setNewShowTime(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Ticket Price (INR)</label>
                          <input type="number" value={newShowPrice} onChange={e => setNewShowPrice(e.target.value)}
                            placeholder="299" min="0"
                            className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none focus:bg-surface" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Max Seats</label>
                          <select value={newShowSeats} onChange={e => setNewShowSeats(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm text-foreground outline-none">
                            <option value="25">25 seats</option>
                            <option value="100">100 seats</option>
                            <option value="1000">1,000 seats</option>
                            <option value="10000">Unlimited</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!newShowTitle || !newShowDate || !newShowTime || !newShowPrice) { alert('Please fill in all fields'); return; }
                          try {
                            await fetch('/api/shows', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'create', title: newShowTitle, description: newShowDesc, date: newShowDate, time: newShowTime, ticketPrice: Number(newShowPrice), maxSeats: Number(newShowSeats) }),
                            });
                            setShowCreateShow(false);
                            alert('Show created!');
                          } catch (e) { alert('Failed to create show'); }
                        }}
                        disabled={!newShowTitle || !newShowDate || !newShowTime || !newShowPrice}
                        className="w-full py-3 bg-gray-900 dark:bg-foreground text-white dark:text-background rounded-xl font-medium text-sm disabled:opacity-50 mt-4">
                        Create Event
                      </button>
                    </div>
                  </motion.div>
                )}
           </AnimatePresence>
        </div>
        <div>
           <h3 className="text-xl font-medium text-foreground">Fundraisers</h3>
           <p className="text-sm text-muted mb-6">Run a charity stream or personal goal</p>
           <FundraiserManager username={username || ''} />
        </div>
      </div>
    </div>
  );
}
