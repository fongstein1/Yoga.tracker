# Yoga Value — personal practice tracker

**Live original ChatGPT Site:** [Open Yoga Value](https://yoga-value-personal-practice.jauntytune2.chatgpt.site)

This repository contains an **independent, editable web implementation** based on the published Yoga Value feature set. The original ChatGPT Site's source code was not available for export through the connected tools, so this is **not represented as the exact original source**. The original published site remains unchanged.

## Features

- Set a membership amount and billing period (monthly or annual)
- Log a class for today or an earlier date; delete incorrect records
- Cost per class based on membership spending over the tracked membership term
- Monthly class activity and cost-per-class trend
- Light/dark mode; responsive layout
- JSON export/import with schema validation
- Browser-local storage; no accounts, trackers or backend

## Run

This is a dependency-free static site. Open `index.html` in your browser, or serve the folder locally (for example `python -m http.server 8080`). It can also deploy to Vercel as a static site with no build command.

## Data safety

**Important:** The original ChatGPT-hosted Yoga Value app and this repository's implementation have *different origins*, so their `localStorage` is separate. Opening a new hosting URL won't copy existing class history.

Before switching apps, use **Export JSON backup** in the original app. The JSON format may not be identical to the format used by this rebuild, so verify imports against the original exported data before assuming compatibility. Never overwrite an existing browser dataset without exporting a backup.

All data is stored in the current browser only. GitHub contains **source code, not your personal attendance records**.

## Related

Central portfolio: [P20 — Yoga Cost Dashboard](https://github.com/fongstein1/ai-project-portfolio/blob/main/data/projects.json)

This project remains "Done for Now"; this source-control snapshot does not indicate a new feature roadmap or a Vercel deployment.
