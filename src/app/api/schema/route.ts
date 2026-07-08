import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SchemaPayload {
  content: string;
  format: 'json' | 'yaml';
}

function parsePayload(data: unknown): SchemaPayload | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const { content, format } = data as Record<string, unknown>;
  if (typeof content !== 'string' || content.trim() === '') {
    return null;
  }
  if (format !== 'json' && format !== 'yaml') {
    return null;
  }
  return { content, format };
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('saved_schemas')
    .select('content, format')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schema: data });
}

export async function PUT(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const payload = parsePayload(data);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid schema payload' }, { status: 400 });
  }

  const { error } = await supabase.from('saved_schemas').upsert({
    user_id: user.id,
    content: payload.content,
    format: payload.format,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
