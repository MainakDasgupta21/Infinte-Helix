# AI‑Powered Micro‑Wellness & Productivity Assistant for Women Employees

This repository contains the product and system architecture specification for a wellness + productivity mobile app that helps women manage **work, emotions, energy, and mental well‑being** throughout the day with **AI assistance** and **cycle‑aware insights**.

## Documentation (PDF + source)
- **Product + Architecture Dossier (Markdown source of truth)**: `docs/Product_Architecture_Dossier.md`
- **Product + Architecture Dossier (PDF export)**: `docs/Product_Architecture_Dossier.pdf`
- **Manager-facing proposal (Infinite Helix, formal)**: `docs/Infinite_Helix_Management_Proposal.md` → `docs/Infinite_Helix_Management_Proposal.pdf`

## Infinite Helix (Desktop prototype)
- **Desktop assistant prototype (React + Flask + Transformers)**: `apps/infinite-helix/`
- Start here: `apps/infinite-helix/README.md`

## Regenerate PDFs locally
Prerequisites: Python 3.10+

```bash
python -m pip install -r requirements.txt
python scripts/generate_pdf.py
```
To generate only the **manager proposal** PDF:
```bash
python scripts/generate_pdf.py docs/Infinite_Helix_Management_Proposal.md docs/Infinite_Helix_Management_Proposal.pdf
```
