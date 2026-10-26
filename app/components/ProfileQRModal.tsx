'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  QrCode as QrIcon,
} from 'lucide-react';
import { generateQRMatrix } from '../lib/qr';

interface ProfileQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  role?: string;
}

export default function ProfileQRModal({
  isOpen,
  onClose,
  username,
  displayName,
  profileImage,
  bio,
  role = 'Creator',
}: ProfileQRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Compute profile URL based on origin or fallback
  const [profileUrl, setProfileUrl] = useState(`https://supertime.wtf/${username}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setProfileUrl(`${origin}/${username}`);
      setCanNativeShare(!!navigator.share);
    }
  }, [username]);

  // Render QR Canvas with center avatar
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target canvas pixel resolution
    const size = 520;
    canvas.width = size;
    canvas.height = size;

    try {
      // 1. Generate matrix with High (H) error correction (allows up to 30% occlusion)
      const matrix = generateQRMatrix(profileUrl, 'H');
      const moduleCount = matrix.length;

      // Padding around QR code
      const padding = 36;
      const qrArea = size - padding * 2;
      const cellSize = qrArea / moduleCount;

      // Clear background (pure crisp white for high contrast scanning)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Check if coordinate is in the center reserved logo area
      const centerStart = Math.floor((moduleCount - Math.floor(moduleCount * 0.28)) / 2);
      const centerEnd = centerStart + Math.floor(moduleCount * 0.28);

      const isFinderPattern = (r: number, c: number) => {
        // Top-left, top-right, bottom-left 7x7 finders
        if (r < 7 && c < 7) return true;
        if (r < 7 && c >= moduleCount - 7) return true;
        if (r >= moduleCount - 7 && c < 7) return true;
        return false;
      };

      // 2. Draw QR Modules (Sleek dark rounded blocks for a modern aesthetic)
      ctx.fillStyle = '#0F0F11';

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          // If in center logo clear zone, leave clean
          if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
            continue;
          }

          if (matrix[r][c]) {
            const x = padding + c * cellSize;
            const y = padding + r * cellSize;

            if (isFinderPattern(r, c)) {
              // Finder patterns keep solid blocks for instant camera detection
              ctx.fillRect(x, y, cellSize + 0.3, cellSize + 0.3);
            } else {
              // Slightly rounded modern modules
              const radius = cellSize * 0.25;
              ctx.beginPath();
              ctx.roundRect(x, y, cellSize + 0.2, cellSize + 0.2, radius);
              ctx.fill();
            }
          }
        }
      }

      // 3. Draw Center Avatar Badge
      const centerX = size / 2;
      const centerY = size / 2;
      const avatarRadius = (cellSize * (centerEnd - centerStart + 1.2)) / 2;

      // Background knockout disc behind avatar to keep high contrast
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      // Border ring around avatar
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarRadius + 1, 0, Math.PI * 2);
      ctx.strokeStyle = '#E8E8E8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw avatar image or fallback initials
      if (profileImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = profileImage;
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            img,
            centerX - avatarRadius,
            centerY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          );
          ctx.restore();
        };
        img.onerror = () => {
          drawFallbackAvatar(ctx, centerX, centerY, avatarRadius, username);
        };
      } else {
        drawFallbackAvatar(ctx, centerX, centerY, avatarRadius, username);
      }
    } catch (e) {
      console.error('Failed to render QR Code:', e);
    }
  }, [isOpen, profileUrl, profileImage, username]);

  const drawFallbackAvatar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    name: string
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0F0F11';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), cx, cy);
    ctx.restore();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName || username} on Supertime`,
          text: `Connect with ${displayName || username} on Supertime`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);

    try {
      // Create a high-res branded export card (1000 x 1250 px)
      const exportCanvas = document.createElement('canvas');
      const exWidth = 1000;
      const exHeight = 1250;
      exportCanvas.width = exWidth;
      exportCanvas.height = exHeight;
      const exCtx = exportCanvas.getContext('2d');

      if (!exCtx) return;

      // Premium card background
      exCtx.fillStyle = '#0A0A0C';
      exCtx.fillRect(0, 0, exWidth, exHeight);

      // Subtle gradient aura glow
      const radial = exCtx.createRadialGradient(
        exWidth / 2,
        350,
        50,
        exWidth / 2,
        350,
        500
      );
      radial.addColorStop(0, 'rgba(255, 107, 107, 0.15)');
      radial.addColorStop(0.5, 'rgba(255, 189, 46, 0.08)');
      radial.addColorStop(1, 'rgba(10, 10, 12, 0)');
      exCtx.fillStyle = radial;
      exCtx.fillRect(0, 0, exWidth, exHeight);

      // Top Brand header
      exCtx.fillStyle = '#FFFFFF';
      exCtx.font = 'bold 32px sans-serif';
      exCtx.textAlign = 'center';
      exCtx.fillText('supertime', exWidth / 2, 85);

      exCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      exCtx.font = 'bold 16px sans-serif';
      exCtx.fillText('SCAN TO CONNECT LIVE', exWidth / 2, 115);

      // White QR Box container
      const qrBoxSize = 680;
      const qrBoxX = (exWidth - qrBoxSize) / 2;
      const qrBoxY = 160;
      const qrRadius = 36;

      exCtx.save();
      exCtx.beginPath();
      exCtx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius);
      exCtx.fillStyle = '#FFFFFF';
      exCtx.shadowColor = 'rgba(0,0,0,0.4)';
      exCtx.shadowBlur = 40;
      exCtx.shadowOffsetY = 15;
      exCtx.fill();
      exCtx.restore();

      // Draw QR Canvas inside the box
      const qrInnerPadding = 30;
      exCtx.drawImage(
        canvasRef.current,
        qrBoxX + qrInnerPadding,
        qrBoxY + qrInnerPadding,
        qrBoxSize - qrInnerPadding * 2,
        qrBoxSize - qrInnerPadding * 2
      );

      // Bottom info area
      exCtx.fillStyle = '#FFFFFF';
      exCtx.font = 'bold 44px sans-serif';
      exCtx.textAlign = 'center';
      exCtx.fillText(displayName || username, exWidth / 2, 920);

      exCtx.fillStyle = '#FF4B72';
      exCtx.font = 'bold 24px sans-serif';
      exCtx.fillText(`@${username}`, exWidth / 2, 965);

      exCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      exCtx.font = '20px sans-serif';
      exCtx.fillText('1:1 calls · live rooms · digital store', exWidth / 2, 1020);

      exCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      exCtx.font = '16px sans-serif';
      exCtx.fillText(`supertime.wtf/${username}`, exWidth / 2, 1150);

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supertime-${username}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Download card failed', err);
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          {/* Backdrop dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl overflow-hidden text-foreground"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background border border-border text-muted hover:text-foreground transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/5 border border-border text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">
                <QrIcon className="w-3.5 h-3.5 text-foreground" />
                Artist QR Code
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {displayName || username}
              </h2>
              <p className="text-xs text-muted font-medium mt-0.5">
                @{username}
              </p>
            </div>

            {/* QR Card Container */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center mb-5 relative group">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[240px] aspect-square block rounded-lg"
              />
              <span className="text-[10px] text-zinc-500 font-medium mt-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Point camera to scan profile
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating Card...' : 'Download QR Card'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-background hover:bg-surface text-foreground font-medium text-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-background hover:bg-surface text-foreground font-medium text-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
