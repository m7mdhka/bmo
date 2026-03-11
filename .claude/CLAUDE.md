## Project context for BMO

- BMO is an **open-source, local developer workspace platform**.
- It is similar to **Replit/Lovable**, but runs **entirely on the user's machine via Docker**.
- Repository layout:
  - `backend/` – Python backend (APIs, orchestration, project management).
  - `frontend/` – Next.js + React UI.
  - `docs/` – Project documentation.
- Goals:
  - Make it easy for **non-technical users** to create and manage projects from the browser.
  - Keep all code and data **local and private** on the user's device.
- Conventions:
  - Use **Conventional Commits** enforced via **Commitizen**.
  - Prefer clear separation of concerns between backend, frontend, and infra.
