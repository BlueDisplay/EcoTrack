import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    system: 'EcoTrack Next.js v3.0',
    roboflow_configured: true,
    roboflow_model: 'visual-pollution-detection-04jk5/3',
    db_configured: !!process.env.DATABASE_URL,
  });
}
