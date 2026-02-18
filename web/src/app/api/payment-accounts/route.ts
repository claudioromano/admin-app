import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(request: NextRequest) {
  return request.cookies.get('accessToken')?.value;
}

// GET /api/payment-accounts
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/payment-accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST /api/payment-accounts  body: { name, holder, type, description?, alias? }
export async function POST(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${API_URL}/payment-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/payment-accounts  body: { id, ...updateData }
export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: 'id requerido' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/payment-accounts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/payment-accounts?id=...
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'id requerido' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/payment-accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ message: 'Cuenta eliminada' });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
