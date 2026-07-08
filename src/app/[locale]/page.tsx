import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SPEC } from '@/lib/openapi/default-spec';
import { Workspace } from '@/components/workspace/Workspace';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialContent = DEFAULT_SPEC;
  let restored = false;

  if (user) {
    const { data } = await supabase
      .from('saved_schemas')
      .select('content')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.content) {
      initialContent = data.content;
      restored = true;
    }
  }

  return (
    <Workspace
      initialContent={initialContent}
      isAuthenticated={Boolean(user)}
      restored={restored}
    />
  );
}
