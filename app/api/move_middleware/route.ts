import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const oldPath = path.join(process.cwd(), 'middleware.ts');
  const newPath = path.join(process.cwd(), 'proxy.ts');
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    return NextResponse.json({ success: true, message: 'Renamed middleware.ts to proxy.ts' });
  } else if (fs.existsSync(newPath)) {
    return NextResponse.json({ success: true, message: 'proxy.ts already exists' });
  }
  
  return NextResponse.json({ success: false, message: 'middleware.ts not found' });
}
