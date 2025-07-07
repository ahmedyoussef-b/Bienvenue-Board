// This route has been consolidated into /api/schedule-drafts/route.ts to resolve routing ambiguity.
// It is no longer in use.

import { NextResponse } from 'next/server';

// Return 410 Gone to indicate this endpoint is permanently removed.
export async function GET() {
    return NextResponse.json({ message: "This endpoint is obsolete. Use /api/schedule-drafts?active=true instead." }, { status: 410 });
}

export async function POST() {
    return NextResponse.json({ message: "This endpoint is obsolete. Use POST /api/schedule-drafts instead." }, { status: 410 });
}
