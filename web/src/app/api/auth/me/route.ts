import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ message: 'No access token' }, { status: 401 });
    }

    let res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // If 401, try auto-refresh
    if (res.status === 401) {
      const refreshToken = request.cookies.get('refreshToken')?.value;
      if (!refreshToken) {
        return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
      }

      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        const response = NextResponse.json({ message: 'Session expired' }, { status: 401 });
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.data.accessToken;
      const newRefreshToken = refreshData.data.refreshToken;

      // Retry with new token
      res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });

      if (!res.ok) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const userData = await res.json();
      const response = NextResponse.json({ user: userData.data });

      response.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });

      response.cookies.set('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    if (!res.ok) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: res.status });
    }

    const userData = await res.json();
    return NextResponse.json({ user: userData.data });
  } catch {
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
