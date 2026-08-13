import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.eventName || !body.stepName) {
      return NextResponse.json(
        { error: 'eventName and stepName are required' },
        { status: 400 },
      );
    }

    const event = {
      id: `evt-${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString(),
      received: true,
    };

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 },
    );
  }
}
