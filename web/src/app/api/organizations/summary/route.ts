import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// GET /api/organizations/summary?orgId=
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    if (!orgId)
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });

    const res = await fetch(`${API_URL}/organizations/${orgId}/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
