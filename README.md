# Hackthon Mercado 2026

Backend + Evolution API (WhatsApp) em Docker.

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
