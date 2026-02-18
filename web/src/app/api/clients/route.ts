import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(request: NextRequest) {
  return request.cookies.get('accessToken')?.value;
}

// GET /api/clients?orgId=...&page=1&limit=20&search=...
// Also: GET /api/clients?orgId=...&id=... (single client)
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const clientId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });
    }

    let url: string;
    if (clientId) {
      url = `${API_URL}/organizations/${orgId}/clients/${clientId}`;
    } else {
      const params = new URLSearchParams();
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');
      const search = searchParams.get('search');
      if (page) params.set('page', page);
      if (limit) params.set('limit', limit);
      if (search) params.set('search', search);
      url = `${API_URL}/organizations/${orgId}/clients?${params.toString()}`;
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

// POST /api/clients  body: { orgId, ...clientData }
export async function POST(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, ...clientData } = body;

    if (!orgId) {
      return NextResponse.json({ message: 'orgId requerido' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/organizations/${orgId}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(clientData),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/clients  body: { orgId, id, ...updateData }
export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, id, ...updateData } = body;

    if (!orgId || !id) {
      return NextResponse.json({ message: 'orgId e id requeridos' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/organizations/${orgId}/clients/${id}`, {
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

// DELETE /api/clients?orgId=...&id=...
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const id = searchParams.get('id');

    if (!orgId || !id) {
      return NextResponse.json({ message: 'orgId e id requeridos' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/organizations/${orgId}/clients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ message: 'Cliente eliminado' });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
