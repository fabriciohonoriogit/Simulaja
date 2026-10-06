---
name: jarvis-gmail-integration
description: >-
  Use this skill when the user asks Jarvis to check their Gmail inbox, look for important emails,
  summarize client messages, or report priority updates from external services.
---

# Jarvis Skill: Gmail Connection & Important Email Briefing

This skill enables Jarvis to connect to Gmail, scan incoming emails, identify high-priority messages (clients, payment receipts, administradora notices), and present an executive briefing in natural language.

## Workflow Instructions

1. **Gmail Authentication & Fetch**:
   - Check `.env` for `GMAIL_USER` and `GMAIL_APP_PASSWORD` or OAuth credentials in `~/.gemini/config/gmail/`.
   - Run the fetch query for unread/important messages.

2. **Filter & Prioritize**:
   - Filter emails by categories:
     - **Clients / Sales**: Leads asking for quotes, simulation updates, or sending payment proofs.
     - **Administradoras**: Assembly results, contemplação alerts, billing notifications.
     - **Urgent Action**: Messages requiring immediate response.

3. **Humanized Briefing Output**:
   - Summarize findings in conversational Portuguese, highlighting key emails and recommending next actions for the user.
