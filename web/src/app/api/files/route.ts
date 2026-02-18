import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// GET /api/files?key=<fileKey>
// Devuelve { data: { url: string } } con la URL firmada de MinIO
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key)
      return NextResponse.json({ message: 'key requerido' }, { status: 400 });

    const res = await fetch(
      `${API_URL}/files/${key}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
