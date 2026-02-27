import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    system: 'EcoTrack Next.js v3.0',
    roboflow_configured: !!process.env.ROBOFLOW_API_KEY,
    roboflow_model: process.env.ROBOFLOW_MODEL ?? 'not configured',
    db_configured: !!process.env.DATABASE_URL,
  });
}
