# MOM: My Own Manager - Core Operating System
## STATUS: MISSION COMPLETE

This document serves as the final operational manual for the **MOM (My Own Manager)** platform. Every subsystem has been designed for maximum security, tactical performance, and long-term operator persistence.

---

## 1. System Overview
MOM is a sovereign, high-security managerial intelligence that handles complex adaptive scheduling and encrypted secret storage within the **Obsidian Cipher** design system.

**Technological Base:**
- **Frontend**: React (Vite) + Tailwind CSS (Zero-Curve Tactical UI).
- **Backend/Database**: Supabase (PostgreSQL + RLS).
- **Intelligence**: Azure OpenAI (GPT-4o / GPT-4 Turbo) for logical routing.
- **Security**: Client-side AES-256-GCM encryption for all sensitive payloads.
- **Voice Interface**: Web Speech API for low-latency voice command processing and specialized synthesis.

---

## 2. Intelligence: The Command Center (Neural Link)
The primary interaction model is a conversational terminal. All user input is processed through a multi-stage intent-parsing engine.

### Stage 1: Contextual Gathering
MOM reads the following before processing any message:
- **Active Mission Roadmaps**: Current goals from Supabase.
- **Mission Assignments**: All tasks scheduled for the current date.
- **Vault Index Labels**: Search hints for stored credentials.
- **Long-Term Memory Summary**: Persistent facts about the operator.

### Stage 2: Intent Classification & Parameter Extraction
MOM uses strict classification to determine the flow:
1. **ADD_TASK**: Triggers assignment of new missions to specific goal roadmaps.
2. **ADD_VAULT_ENTRY**: Initiates the **Data Minimization** flow for secrets.
3. **SKIP_TASK**: Triggers the **Adaptive Scheduling** redistribution protocol.
4. **STATUS_CHECK**: Executes a real-time progress audit on current missions.
5. **DISAMBIGUATE**: Prompts the operator for clarification if multiple missions apply.
6. **CHAT**: Casual interaction buffer within the managerial persona.

---

## 3. Data Minimization & Zero-Exposure Security

### The Secure Terminal Flow (Read/Write)

**Storing Secrets (`ADD_VAULT_ENTRY`)**
MOM follows a strict "No-Secret-to-Server" rule for storing passwords:
1. **Minimization**: When the operator wishes to store secrets, MOM identifies only the service label (e.g., "GitHub").
2. **Zero-AI Exposure**: The actual secret payload is **never** sent to the AI server. 
3. **Interactive Local Interface**: MOM spawns a masked secure input field directly in the UI. 
4. **Local Encryption**: The password is encrypted on the device using a in-memory **CryptoKey** (AES-256-GCM).
5. **Cold Storage**: Only the unreadable encrypted blob is saved to Supabase. Even database administrators cannot view operator secrets.

**Retrieval & Auto-Purge (`VAULT_LOOKUP`)**
When an operator queries an existing secret (e.g., "What is my GitHub password?"):
1. **Intent Matching**: The AI recognizes the lookup intent and extracts the service name (e.g., "github").
2. **Blob Fetch**: The frontend fetches the encrypted blob from Supabase matching the search hint.
3. **Local Decryption**: The application instantly decrypts the payload locally using the session `CryptoKey`.
4. **Secure Display Flow**: The decrypted payload (User + Password) is rendered via an interactive UI widget within the chat stream. It features visibility toggles and clipboard copying.
5. **Self-Destruct (Auto-Purge)**: To maintain the zero-exposure paradigm, the widget features a countdown timer. Exactly **30 seconds** after rendering, the widget safely annihilates itself from the chat state, ensuring the decrypted payload is fundamentally erased from DOM and memory.

---

## 4. Operational Persistence (LTM Protocol)

### Deep Memory Extraction
To feel continuous and intuitive, MOM maintains a **Persistent Memory Summary** in the operator's profile. After significant interactions, a background agent extracts permanent facts:
- **Project Deadlines**: Retained context for future planning.
- **Operator Preferences**: Working habits, workout times, and tactical preferences.
- **Goal Context**: Specific details about the operative's background and missions.

### Garbage Collection & Mission Safety
To prevent "context rot," MOM periodically executes a pruning routine:
- **Density Density Control**: Pruning triggers when memory exceeds **1000 characters**.
- **Mission Safety Guard**: MOM will **not** prune a fact—even if its date is past—if the related goal roadmap is still active in the database.
- **Time-Expired Disposal**: Only irrelevant, unlinked, and expired facts are cleared to maintain a high-density intelligence stream.

---

## 5. Adaptive Scheduling & Mission Auditing
MOM manages more than a list; she manages a roadmap:
- **Redistribution Logic**: When a task is skipped, MOM automatically shifts the workload forward, weighting tasks according to the remaining time in the goal cycle.
- **Real-Time Efficiency**: The **System Efficiency Bar** on the Home Screen provides an authoritative live visual of mission progress.

---

### MISSION COMPLETE.
MOM is fully operational and awaiting your first directive, Operator.
