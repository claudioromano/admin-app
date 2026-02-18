import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(request: NextRequest) {
  return request.cookies.get('accessToken')?.value;
}

// GET /api/organizations/payment-accounts?orgId=...
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });
    }

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/payment-accounts`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST /api/organizations/payment-accounts  body: { orgId, paymentAccountId }
export async function POST(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, paymentAccountId } = body;

    if (!orgId || !paymentAccountId) {
      return NextResponse.json(
        { message: 'orgId y paymentAccountId requeridos' },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/payment-accounts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentAccountId }),
      },
    );

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/organizations/payment-accounts?orgId=...&paymentAccountId=...
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const paymentAccountId = searchParams.get('paymentAccountId');

    if (!orgId || !paymentAccountId) {
      return NextResponse.json(
        { message: 'orgId y paymentAccountId requeridos' },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/payment-accounts/${paymentAccountId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ message: 'Cuenta desvinculada' });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
