import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'app', 'dashboard', 'DashboardClient.tsx');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex replacements to strip neobrutalist styles
  content = content.replace(/shadow-\[[^\]]+\]/g, 'shadow-sm');
  content = content.replace(/border-[24] border-black/g, 'border border-gray-200 rounded-xl'); 
  content = content.replace(/border-b-[24] border-black/g, 'border-b border-gray-200');
  content = content.replace(/border-r-[24] border-black/g, 'border-r border-gray-200');
  content = content.replace(/border-t-[24] border-black/g, 'border-t border-gray-200');
  content = content.replace(/border-black/g, 'border-gray-200');
  content = content.replace(/bg-neo-pink/g, 'bg-white');
  content = content.replace(/bg-neo-yellow/g, 'bg-white');
  content = content.replace(/bg-neo-green/g, 'bg-white');
  content = content.replace(/bg-neo-blue/g, 'bg-white');
  content = content.replace(/text-neo-pink/g, 'text-blue-600');
  content = content.replace(/text-neo-yellow/g, 'text-amber-600');
  content = content.replace(/text-neo-green/g, 'text-green-600');
  content = content.replace(/text-neo-blue/g, 'text-blue-600');
  content = content.replace(/neo-box/g, '');
  content = content.replace(/font-black/g, 'font-medium');
  content = content.replace(/uppercase/g, '');
  content = content.replace(/tracking-tighter/g, '');
  content = content.replace(/tracking-[a-z]+/g, '');
  content = content.replace(/translate-x-\[-?[\d]+px\]/g, '');
  content = content.replace(/translate-y-\[-?[\d]+px\]/g, '');
  content = content.replace(/active:translate-[xy]-\[-?[\d]+px\]/g, '');
  content = content.replace(/active:shadow-none/g, '');
  content = content.replace(/bg-black text-white/g, 'bg-gray-900 text-white rounded-lg');

  fs.writeFileSync(filePath, content, 'utf-8');

  return NextResponse.json({ success: true, message: 'Cleaned DashboardClient.tsx' });
}
