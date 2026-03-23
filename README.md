# AI‑Powered Micro‑Wellness & Productivity Assistant for Women Employees

This repository contains the product and system architecture specification for a wellness + productivity mobile app that helps women manage **work, emotions, energy, and mental well‑being** throughout the day with **AI assistance** and **cycle‑aware insights**.

## Documentation
All documentation lives in `Infinite_helix/docs/`:
- **Product + Architecture Dossier**: `Infinite_helix/docs/Product_Architecture_Dossier.md`
- **Manager-facing proposal**: `Infinite_helix/docs/Infinite_Helix_Management_Proposal.md` / `.pdf`
- **Project Analysis**: `Infinite_helix/docs/PROJECT_ANALYSIS.md`
- **Architecture Plan**: `Infinite_helix/docs/ARCHITECTURE_PLAN.html`
- **Chatbot Test Suite**: `Infinite_helix/docs/CHATBOT_TEST_SUITE.md`

## Infinite Helix (Desktop prototype)
- **Desktop assistant prototype (React + Flask + Transformers)**: `Infinite_helix/`
- Start here: `Infinite_helix/README.md`

## Regenerate PDFs locally
Prerequisites: Python 3.10+

```bash
python -m pip install -r requirements.txt
python scripts/generate_pdf.py
```
To generate only the **manager proposal** PDF:
```bash
python scripts/generate_pdf.py Infinite_helix/docs/Infinite_Helix_Management_Proposal.md Infinite_helix/docs/Infinite_Helix_Management_Proposal.pdf
```
