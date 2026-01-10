# TanStack Query + Supabase Setup

Guia de uso do TanStack Query integrado com Supabase neste projeto.

## Estrutura de Arquivos

```
├── components/
│   └── ReactQueryClientProvider.tsx  # Provider do React Query
├── lib/supabase/
│   ├── browser.ts                    # Hook useSupabaseBrowser() para client components
│   ├── server.ts                     # Função useSupabaseServer() para server components
│   └── database.types.ts             # Tipos gerados do Supabase
└── queries/
    ├── index.ts                      # Exportações centralizadas
    ├── get-room-by-code.ts
    ├── get-players-by-room.ts
    ├── get-player-by-client.ts
    └── get-votes-by-room-round.ts
```

## Uso em Client Components

```tsx
"use client";

import useSupabaseBrowser from "@/lib/supabase/browser";
import { getPlayersByRoom } from "@/queries";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export default function PlayersList({ roomId }: { roomId: string }) {
  const supabase = useSupabaseBrowser();
  const {
    data: players,
    isLoading,
    isError,
  } = useQuery(getPlayersByRoom(supabase, roomId));

  if (isLoading) return <div>Carregando...</div>;
  if (isError) return <div>Erro ao carregar</div>;

  return (
    <ul>
      {players?.map((player) => (
        <li key={player.id}>{player.name}</li>
      ))}
    </ul>
  );
}
```

## Uso em Server Components (SSR + Prefetch)

```tsx
// app/room/[code]/page.tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { prefetchQuery } from "@supabase-cache-helpers/postgrest-react-query";
import useSupabaseServer from "@/lib/supabase/server";
import { getRoomByCode } from "@/queries";
import RoomClient from "./room-client";

export default async function RoomPage({
  params,
}: {
  params: { code: string };
}) {
  const queryClient = new QueryClient();
  const supabase = await useSupabaseServer();

  // Prefetch no servidor
  await prefetchQuery(queryClient, getRoomByCode(supabase, params.code));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomClient code={params.code} />
    </HydrationBoundary>
  );
}
```

```tsx
// app/room/[code]/room-client.tsx
"use client";

import useSupabaseBrowser from "@/lib/supabase/browser";
import { getRoomByCode } from "@/queries";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export default function RoomClient({ code }: { code: string }) {
  const supabase = useSupabaseBrowser();
  // Dados já disponíveis imediatamente (prefetched no servidor)
  const { data: room } = useQuery(getRoomByCode(supabase, code));

  return <h1>Sala: {room?.code}</h1>;
}
```

## Criando Novas Queries

Crie um arquivo em `queries/` seguindo o padrão:

```ts
// queries/get-room-by-id.ts
import { TypedSupabaseClient } from "@/lib/supabase/browser";

export function getRoomById(client: TypedSupabaseClient, roomId: string) {
  return client
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .throwOnError()
    .single();
}
```

Exporte em `queries/index.ts`:

```ts
export { getRoomById } from "./get-room-by-id";
```

## Mutations

Para operações de escrita, use `useMutation`:

```tsx
"use client";

import useSupabaseBrowser from "@/lib/supabase/browser";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateRoom() {
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, hostId }: { code: string; hostId: string }) => {
      const { error } = await supabase
        .from("rooms")
        .insert({ code, host_id: hostId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
```

## Atualizando Tipos do Banco

Quando modificar o schema do banco, regenere os tipos:

```bash
supabase gen types typescript --linked --schema=public > lib/supabase/database.types.ts
```

## Referências

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Cache Helpers](https://supabase-cache-helpers.vercel.app/)
- [Supabase SSR with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
