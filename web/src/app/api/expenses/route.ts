import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// GET /api/expenses?orgId=&page=&limit=&status=&type=&dateFrom=&dateTo=
// GET /api/expenses?orgId=&id=           (detalle)
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const id = searchParams.get('id');

    if (!orgId)
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });

    let url: string;
    if (id) {
      url = `${API_URL}/organizations/${orgId}/expenses/${id}`;
    } else {
      const params = new URLSearchParams();
      ['page', 'limit', 'status', 'type', 'dateFrom', 'dateTo'].forEach((k) => {
        const v = searchParams.get(k);
        if (v) params.set(k, v);
      });
      url = `${API_URL}/organizations/${orgId}/expenses?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST /api/expenses  body: { orgId, ...expenseData }
export async function POST(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const { orgId, ...expenseData } = body;
    if (!orgId)
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });

    const res = await fetch(`${API_URL}/organizations/${orgId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(expenseData),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/expenses  body: { orgId, id, ...updateData }
export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const { orgId, id, ...updateData } = body;
    if (!orgId || !id)
      return NextResponse.json(
        { message: 'orgId e id requeridos' },
        { status: 400 },
      );

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/expenses/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/expenses?orgId=&id=
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const id = searchParams.get('id');
    if (!orgId || !id)
      return NextResponse.json(
        { message: 'orgId e id requeridos' },
        { status: 400 },
      );

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/expenses/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (res.status === 204 || res.ok)
      return NextResponse.json({ message: 'Gasto eliminado' });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
