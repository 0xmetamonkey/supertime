'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, FileText, Send, Trash2, Edit3, Loader2, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useAlertDialog } from '../components/AlertDialog';

interface Post {
  id: string;
  title: string;
  content: string; // Markdown
  isLocked: boolean;
  createdAt: number;
  imageUrl?: string;
}

export default function FeastTab({ username }: { username: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { alert: customAlert, AlertDialog } = useAlertDialog();

  useEffect(() => {
    fetchPosts();
  }, [username]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/user/posts?username=${username}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (post?: Post) => {
    if (post) {
      setEditingId(post.id);
      setTitle(post.title);
      setContent(post.content);
      setIsLocked(post.isLocked);
      setImageUrl(post.imageUrl || '');
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
      setIsLocked(false);
      setImageUrl('');
    }
    setIsEditorOpen(true);
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
      if (!response.ok) throw new Error('Upload failed');
      const blob = await response.json();
      setImageUrl(blob.url);
    } catch (e) {
      customAlert({
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      customAlert({
        title: 'Fields Required',
        message: 'Title and content are required.',
        variant: 'warning',
      });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          post: {
            id: editingId || Date.now().toString(),
            title,
            content,
            isLocked,
            imageUrl
          }
        })
      });
      if (res.ok) {
        await fetchPosts();
        setIsEditorOpen(false);
      } else {
        customAlert({
          title: 'Save Failed',
          message: 'Failed to save the post. Please try again.',
          variant: 'error',
        });
      }
    } catch (e) {
      customAlert({
        title: 'Error',
        message: 'An error occurred while saving the post.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this post?',
      message: 'This will permanently remove the post and it cannot be recovered.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', postId: id })
      });
      await fetchPosts();
    } catch (e) {
      customAlert({
        title: 'Delete Failed',
        message: 'An error occurred while deleting the post.',
        variant: 'error',
      });
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      {!isEditorOpen ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">The Feast</h2>
              <p className="text-sm text-muted">Publish exclusive articles, thoughts, and updates.</p>
            </div>
            <button
              onClick={() => handleOpenEditor()}
              className="bg-foreground text-background px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {posts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface border border-dashed border-border rounded-2xl">
                <FileText className="w-8 h-8 text-muted mx-auto mb-3 opacity-50" />
                <h3 className="text-foreground font-medium mb-1">No posts yet</h3>
                <p className="text-sm text-muted">Start writing your first feast to share with your audience.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col group">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-4" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 pr-4">{post.title}</h3>
                    {post.isLocked && <Lock className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
                    {post.content.replace(/!\[.*?\]\(.*?\)/g, '').replace(/<[^>]+>/g, '').replace(/[#*`_]/g, '').trim()}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                    <span className="text-xs text-muted font-medium">
                      {new Date(post.createdAt || parseInt(post.id) || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditor(post)} className="p-2 text-muted hover:text-foreground bg-background rounded-lg border border-border">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-muted hover:text-red-500 bg-background rounded-lg border border-border">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="border-b border-border p-6 flex justify-between items-center bg-background/50">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted" /> 
              {editingId ? 'Edit Post' : 'New Feast'}
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="text-sm font-medium text-muted hover:text-foreground px-3 py-1.5"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-foreground text-background px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <input
                type="text"
                placeholder="Post Title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted focus:ring-0 p-0"
              />
            </div>

            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl cursor-pointer hover:bg-surface transition-colors">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-muted" /> : <ImageIcon className="w-4 h-4 text-muted" />}
                <span className="text-xs font-medium text-foreground">{imageUrl ? 'Change Cover' : 'Add Cover'}</span>
                <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
              </label>

              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors text-xs font-medium ${
                  isLocked 
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400' 
                    : 'bg-background border-border text-foreground hover:bg-surface'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {isLocked ? 'Locked for Subscribers' : 'Public'}
              </button>
            </div>

            {imageUrl && (
              <div className="relative inline-block group">
                <img src={imageUrl} alt="Cover" className="h-32 rounded-xl object-cover border border-border" />
                <button 
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <textarea
                placeholder="Write your content here... (Markdown supported)"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={15}
                className="w-full bg-background border border-border rounded-xl p-5 text-foreground placeholder:text-muted focus:border-foreground outline-none resize-y text-sm font-medium leading-relaxed"
              />
              <p className="text-[11px] text-muted mt-2">
                Tip: You can use standard Markdown like **bold**, *italic*, # Headings, and [links](url).
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {ConfirmDialog}
      {AlertDialog}
    </div>
  );
}
