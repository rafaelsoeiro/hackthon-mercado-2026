# Hackthon Mercado 2026

MVP desenvolvido no Hackathon do Mercado (20–22/01) para apoiar a informatização do Mercado Central de São Luís sem excluir práticas e dinâmicas locais.  
A proposta foca em tornar dados acionáveis para comerciantes e poder público por meio de um assistente via WhatsApp e um painel analítico, com implementação simples e evolutiva.

## Contexto do Desafio
O Mercado Central de São Luís é um espaço histórico e cultural que vive um processo de informatização, mas com práticas informais e uma dinâmica própria de comércio. O objetivo não era “digitalizar tudo”, e sim entender como a tecnologia poderia ajudar sem excluir.

## Solução Proposta
- Assistente de negócios e gestão via WhatsApp, capaz de entender texto e áudio, voltado à gestão financeira dos comerciantes residentes.
- Painel analítico para a Prefeitura, com dados consolidados sobre o movimento do comércio para apoiar decisões e políticas públicas.

## Stack Técnica
- Backend: NestJS + TypeScript
- IA: OpenAI GPT-4.1 (equilíbrio entre qualidade e custo) e GPT-4o (speech-to-text e text-to-speech)
- Integração WhatsApp: Evolution API
- Dados e cache: PostgreSQL e Redis

## Impacto Esperado
- Mais previsibilidade e menos desperdício
- Negócios mais saudáveis financeiramente
- Inclusão digital de quem normalmente fica à margem

## Próximos Passos
Como parte da premiação, houve convite da SEMISPE para evoluir o MVP e trabalhar no desenvolvimento e implantação da solução no Mercado Central no futuro.

## Requisitos
- Docker + Docker Compose
- Node.js 20+ (apenas se rodar o backend fora do Docker)

## Estrutura
- `backend/` — aplicação NestJS
- `docker-compose.yaml` — serviços (Evolution API, Postgres, Redis, Backend)
- `.env.example` — env da Evolution API (raiz)
- `backend/.env.example` — env do backend

## Configuração
1. Copie os arquivos de exemplo:
   - `.env.example` → `.env`
   - `backend/.env.example` → `backend/.env`
2. Preencha os valores sensíveis nos dois arquivos.

## Subir com Docker
```bash
docker compose up -d --build
```

Serviços:
- Evolution API: `http://localhost:8083`
- Backend: `http://localhost:3000`

## Variáveis principais

### `.env` (raiz)
Usado pelo serviço `api` (Evolution API).
- `AUTHENTICATION_API_KEY`
- `DATABASE_CONNECTION_URI`
- `CACHE_REDIS_URI`
- `OPENAI_API_KEY` (se aplicável)

### `backend/.env`
Usado pelo serviço `backend`.
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `EVOLUTION_API_URL` (padrão: `http://api:8080`)
- `EVOLUTION_API_KEY`
- `EVOLUTION_API_TIMEOUT_MS`
- `EVOLUTION_API_RETRY_COUNT`

## Observações
- O backend depende da Evolution API estar disponível em `EVOLUTION_API_URL`.
- As chaves **não** devem ser commitadas. Use apenas os `.env.example` no repositório.
