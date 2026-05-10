# API Reference

**Base URL:** `http://localhost:8001/api/v1`

## Users

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| `GET` | `/users/{walletAddress}` | Buscar usuário | - |
| `POST` | `/users` | Criar usuário | `{ wallet_address, role }` |
| `GET` | `/users/{walletAddress}/participations` | Buscar participações | - |

### User Schema
```json
{
  "walletAddress": "string",
  "role": "creator" | "editor",
  "created_at": "ISO8601 (opcional)"
}
```

## Pools

| Método | Endpoint | Descrição | Query Params |
|--------|----------|-----------|--------------|
| `GET` | `/pools` | Listar pools | `status`, `creator_wallet`, `page`, `limit` |
| `GET` | `/pools/{poolPda}` | Buscar pool | - |
| `GET` | `/pools/{poolPda}/entries` | Listar entries do pool | `page`, `limit` |

### Pool Schema
```json
{
  "pda_address": "string",
  "creator_wallet": "string",
  "original_video_id": "string",
  "prize_amount": "number",
  "scoring_rules": {
    "views_weight": "number",
    "likes_weight": "number",
    "comments_weight": "number"
  },
  "participant_count": "number",
  "total_score": "number",
  "status": "OPEN" | "CLOSED" | "DISTRIBUTED",
  "expiry_timestamp": "ISO8601"
}
```

## Entries

| Método | Endpoint | Descrição | Query Params |
|--------|----------|-----------|--------------|
| `GET` | `/entries` | Listar entries | `user_wallet`, `pool_pda`, `page`, `limit` |
| `GET` | `/entries/{entryPda}` | Buscar entry | - |
| `GET` | `/entries/{entryPda}/audit-logs` | Buscar logs | - |

### Entry Schema
```json
{
  "pda_address": "string",
  "pool_pda": "string",
  "user_wallet": "string",
  "channel_id": "string",
  "clip_link": "string",
  "views": "number",
  "likes": "number",
  "comments": "number",
  "score": "number",
  "claimed": "boolean"
}
```

### AuditLog Schema
```json
{
  "id": "string",
  "entry_pda": "string",
  "validation_type": "TRANSCRIPT" | "SSIM_FRAME" | "CHANNEL_CHECK",
  "status": "PASS" | "FAIL" | "FRAUD",
  "details": "any",
  "created_at": "ISO8601"
}
```

## Utils

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| `POST` | `/utils/hash-link` | Gerar hash de URL | `{ url }` |

### Hash Response
```json
{
  "original_url": "string",
  "normalized_url": "string",
  "hash_bytes": "number[]",
  "hash_hex": "string"
}
```

## Pagination

Respostas paginadas seguem o formato:
```json
{
  "items": [],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```
