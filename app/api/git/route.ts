import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout: addOut } = await execAsync('git add .');
    const { stdout: commitOut } = await execAsync('git commit -m "chore: strip neobrutalist visuals from CreatorProfile, Layout, and Globals"');
    const { stdout: pushOut } = await execAsync('git push origin redesign-v1');

    return NextResponse.json({ 
      success: true, 
      logs: { add: addOut, commit: commitOut, push: pushOut } 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stderr: error.stderr
    });
  }
}
