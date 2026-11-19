# Eduquack

Espaço de estudo para vestibulares, ENEM e concursos, com o mascote **Tuck**.

- **Grátis:** pastas, trilha manual, tarefas, cartões, páginas e foco.
- **Plus:** tudo com IA (trilha automática, lições adaptativas, cartões, resumos, simulados, correção de redação, análise de edital e conversa com o Tuck), com proteção de escopo.

## Estrutura

- `index.html`, `css/`, `js/` — app (JavaScript modular, sem build).
- `api/` — funções serverless (Vercel): IA, notificações, ícone.
- `supabase/migrations/` — banco (RLS em todas as tabelas).
- `guia/` — páginas de conteúdo para SEO.

## Variáveis de ambiente (Vercel)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `CRON_SECRET`; opcionais: `PLUS_AI_LIMIT`, `PLUS_TUTOR_LIMIT`, `FREE_ANALYZE_LIMIT` (0 = análise só no Plus), `GROQ_MODELS`.
