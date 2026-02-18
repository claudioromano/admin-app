import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// PATCH /api/invoices/status  body: { orgId, id, status, paidAt? }
export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const { orgId, id, ...statusData } = body;

    if (!orgId || !id)
      return NextResponse.json(
        { message: 'orgId e id requeridos' },
        { status: 400 },
      );

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/invoices/${id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(statusData),
      },
    );

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
