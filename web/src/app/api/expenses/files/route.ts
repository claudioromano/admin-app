import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// POST /api/expenses/files  multipart: { orgId, expenseId, file, fileType }
export async function POST(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const formData = await request.formData();
    const orgId = formData.get('orgId') as string | null;
    const expenseId = formData.get('expenseId') as string | null;
    const fileEntry = formData.get('file') as File | null;
    const fileType = formData.get('fileType') as string | null;

    if (!orgId || !expenseId || !fileEntry || !fileType)
      return NextResponse.json(
        { message: 'orgId, expenseId, file y fileType son requeridos' },
        { status: 400 },
      );

    // Re-construir FormData para el upstream (preserva nombre y tipo)
    const upstreamForm = new FormData();
    const blob = new Blob([await fileEntry.arrayBuffer()], {
      type: fileEntry.type,
    });
    upstreamForm.append('file', blob, fileEntry.name);
    upstreamForm.append('fileType', fileType);

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/expenses/${expenseId}/files`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: upstreamForm,
      },
    );

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/expenses/files?orgId=&expenseId=&fileId=
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const expenseId = searchParams.get('expenseId');
    const fileId = searchParams.get('fileId');

    if (!orgId || !expenseId || !fileId)
      return NextResponse.json(
        { message: 'orgId, expenseId y fileId son requeridos' },
        { status: 400 },
      );

    const res = await fetch(
      `${API_URL}/organizations/${orgId}/expenses/${expenseId}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (res.status === 204 || res.ok)
      return NextResponse.json({ message: 'Archivo eliminado' });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
