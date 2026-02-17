import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }

    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  } catch {
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }
}
