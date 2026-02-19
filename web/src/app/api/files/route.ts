import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getToken(req: NextRequest) {
  return req.cookies.get('accessToken')?.value;
}

// GET /api/files?key=<fileKey>&filename=<originalName>
// Proxea el archivo desde MinIO a través de la API, sirviendo el contenido
// binario directamente al browser con los headers Content-Type y Content-Disposition.
export async function GET(request: NextRequest) {
  try {
    const accessToken = getToken(request);
    if (!accessToken)
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const filename = searchParams.get('filename');

    if (!key)
      return NextResponse.json({ message: 'key requerido' }, { status: 400 });

    const qs = new URLSearchParams({ key });
    if (filename) qs.set('filename', filename);

    const res = await fetch(`${API_URL}/files?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
    };
    const disposition = res.headers.get('Content-Disposition');
    if (disposition) headers['Content-Disposition'] = disposition;
    const length = res.headers.get('Content-Length');
    if (length) headers['Content-Length'] = length;

    return new Response(res.body, { headers });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
