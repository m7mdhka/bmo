## bmo-template-base

This folder contains the **base template contract** for community templates that can be discovered and used by BMO.

You can copy this structure into a separate GitHub repository (recommended repo name: `bmo-template-base` or `bmo-template-<stack>`) and customize it to create your own template.

---

## Goals

- **Standardize** what a “BMO template” looks like.
- **Make it easy** for the community to create and share templates.
- **Allow BMO** to automatically discover and display community templates.

---

## Required files

Every BMO template repository **must** have:

- **`bmo-template.json`** in the repo root  
  Describes the template so BMO can discover and display it.

- **`README.md`** in the repo root  
  Explains what the template is and how to use it after creation.

You can add any other files you like (Next.js app, Python project, etc.). BMO just needs the manifest and README at the top level.

---

## `bmo-template.json` schema

This file must be valid JSON and live at the root of the template repository.

**Required fields:**

- **`name`**: Short, human-readable name of the template.
- **`description`**: One or two sentences describing what the template sets up.
- **`category`**: High-level type (for example: `"frontend"`, `"backend"`, `"fullstack"`, `"cli"`, `"data-science"`).
- **`tags`**: Array of strings used for search and filtering in BMO (for example: `["nextjs", "saas", "tailwind"]`).
- **`bmoTemplateVersion`**: Integer that describes the version of the template contract (start with `1`).

**Optional but recommended fields:**

- **`icon`**: A short identifier for an icon BMO can map to (for example: `"nextjs"`, `"python"`, `"node"`, `"react"`).
- **`homepage`**: URL with more information or documentation about the template.
- **`postCreateCommands`**: Array of shell commands that BMO can run after creating a project from this template (for example: `["npm install"]`).

Example:

```json
{
  "name": "Next.js SaaS Starter",
  "description": "Next.js + Tailwind + Auth starter for SaaS apps.",
  "category": "frontend",
  "tags": ["nextjs", "saas", "tailwind", "auth", "typescript"],
  "bmoTemplateVersion": 1,
  "icon": "nextjs",
  "homepage": "https://github.com/your-user/your-template-repo",
  "postCreateCommands": ["npm install"]
}
```

---

## GitHub requirements for community templates

To be automatically discovered by BMO as a **community template**, a repository should:

1. **Be public** on GitHub.
2. **Contain** a valid `bmo-template.json` at the repo root.
3. **Contain** a `README.md` at the repo root.
4. **Use GitHub topics**:
   - Must include: `bmo-template`
   - Can also include more specific topics like: `bmo-template-frontend`, `bmo-template-backend`, `nextjs`, `python`, etc.

These rules allow BMO to search GitHub for repositories with the `bmo-template` topic, then read `bmo-template.json` to get full metadata.

---

## Recommended workflow for community authors

1. **Fork a base template**
   - Start from an official base template repo (for example: `bmo-template-base-nextjs`), or copy this folder into a new repo.

2. **Customize the code**
   - Add your own project structure, dependencies, configs, and example files.

3. **Fill out `bmo-template.json`**
   - Set a clear `name`, `description`, `category`, and `tags`.
   - Update `homepage` to point to your repo or docs.
   - Add any `postCreateCommands` you want BMO to run after a project is created.

4. **Write your `README.md`**
   - Explain what the template is for.
   - Document any environment variables, services, or special steps.

5. **Publish the repo**
   - Make the repository **public** on GitHub.
   - Add the **`bmo-template`** topic and any other relevant topics.

Once these steps are done, BMO can automatically discover your template and show it in the **Community Templates** list.

---

## Notes for BMO maintainers

- Changes to the `bmo-template.json` schema should:
  - Bump `bmoTemplateVersion`.
  - Stay backward compatible where possible.
- BMO’s backend should:
  - Search GitHub for repos with the `bmo-template` topic.
  - For each repository, try to fetch `bmo-template.json`.
  - Validate and normalize the data into BMO’s internal template model.

