# Chitrai (Art Learning & Sketching Platform)

Chitrai is a gamified art learning and sketching platform supporting online/offline canvas capabilities and generative AI assist.

## Repository Layout (Monorepo)

This repository is set up as an npm workspaces monorepo:

*   **`apps/frontend/`**: React Native Web / Expo client application.
*   **`apps/backend/`**: Node.js & TypeScript core backend.
*   **`apps/ai-service/`**: Python & FastAPI AI inference microservice for open-source AI models.
*   **`.github/workflows/`**: Continuous Integration pipelines.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (v3.10+)

### Setup & Installation

To bootstrap the monorepo dependencies, run:

```bash
npm run bootstrap
```

### Local Development Scripts

*   Start Frontend Dev Server:
    ```bash
    npm run dev:frontend
    ```
*   Start Backend Dev Server:
    ```bash
    npm run dev:backend
    ```
*   Start AI Microservice:
    ```bash
    npm run dev:ai
    ```

## Documentation

For a detailed view of product requirements, architecture pipelines, user persona mappings, and monetization strategies, see [about.md](about.md).
