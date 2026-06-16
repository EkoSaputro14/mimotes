# Widget Analytics Design — Sprint 8

> **Date**: 2026-06-13

---

## Endpoint: GET /api/widget/analytics

### Parameters
- `widgetId` (optional): Filter by specific widget
- `days` (optional, default 30): Time window in days

### Response Schema

```json
{
  "totalConversations": 150,
  "activeConversations": 12,
  "totalMessages": 450,
  "refusedAnswers": 23,
  "topQuestions": [
    { "question": "What are your business hours?", "count": 15 },
    { "question": "How do I reset my password?", "count": 8 }
  ],
  "dailyStats": [
    { "date": "2026-06-13", "conversations": 5, "messages": 18 },
    { "date": "2026-06-12", "conversations": 8, "messages": 24 }
  ]
}
```

### Metrics

| Metric | Source | Description |
|---|---|---|
| totalConversations | widget_conversations | Conversations started in period |
| activeConversations | widget_conversations | Status = 'active' |
| totalMessages | widget_messages | All messages in period |
| refusedAnswers | widget_messages | Assistant messages containing refusal keywords |
| topQuestions | widget_messages | Top 10 user messages by frequency |
| dailyStats | JOIN query | Daily conversation + message counts |

### Refused Answer Detection

Keywords indicating refusal:
- "tidak menemukan"
- "tidak tersedia"
- "Informasi tersebut tidak"

This is a heuristic. For precise tracking, add a `refused` boolean to widget_messages.

### Dashboard Widgets (Suggested)

1. **KPI Cards**: Total conversations, active conversations, total messages
2. **Refused Rate**: refusedAnswers / totalMessages × 100
3. **Top Questions Table**: Sorted by frequency
4. **Daily Volume Chart**: Conversations + messages over time
5. **Response Quality**: Ratio of successful vs refused answers

### Security

- Requires API authentication (session or API key)
- Workspace-scoped (cannot query other workspaces)
- SQL injection safe (Prisma parameterized queries)
