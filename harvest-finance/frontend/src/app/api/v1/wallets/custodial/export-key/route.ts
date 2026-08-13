import { NextRequest, NextResponse } from 'next/server';

const mockKeys: Record<string, string> = {
  'user-1': 'SCZ3K7H3O2Q8Y5M4R6N9P1T2V7X8W3A4S5D6F7G8H9J0K1L2M3N4O5P6',
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { password } = body;

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const secretKey = mockKeys['user-1'];

  return NextResponse.json({
    secret_key: secretKey,
    user_id: 'user-1',
    wallet_type: 'custodial',
  });
}
