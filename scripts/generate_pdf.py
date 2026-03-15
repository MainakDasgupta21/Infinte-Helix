from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
from typing import Optional


def _normalize_text(s: str, *, force_latin1: bool) -> str:
    """
    Normalize text for PDF rendering:
    - Replace common Unicode punctuation with ASCII equivalents for consistency.
    - Remove control characters.
    - Optionally force latin-1 (for core PDF fonts without Unicode support).
    """
    replacements = {
        "\u2019": "'",  # right single quote
        "\u2018": "'",  # left single quote
        "\u201c": '"',  # left double quote
        "\u201d": '"',  # right double quote
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u2212": "-",  # minus
        "\u00a0": " ",  # nbsp
        "\u2026": "...",  # ellipsis
        "\u2011": "-",  # non-breaking hyphen
        "\u2010": "-",  # hyphen
        "\u2022": "-",  # bullet
        "\ufeff": "",  # BOM
        "\u2265": ">=",  # >= (avoid missing glyph issues across fonts)
        "\u2264": "<=",  # <=
        "\u2192": "->",  # right arrow
        "\u2190": "<-",  # left arrow
        "\u00d7": "x",  # multiplication sign
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    # Remove any remaining control chars except newline and tab.
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", s)
    if force_latin1:
        # Core PDF fonts (Helvetica/Courier) are latin-1 only.
        s = s.encode("latin-1", errors="replace").decode("latin-1")
    return s


def _soft_break_long_tokens(line: str, max_token_len: int = 60) -> str:
    """
    fpdf2 can't always break long tokens (e.g., long hyphenated identifiers).
    Insert spaces after common separators for tokens longer than max_token_len.
    """
    parts = line.split(" ")
    out: list[str] = []
    for p in parts:
        if len(p) > max_token_len:
            p = re.sub(r"([/_\-.])", r"\1 ", p)
        out.append(p)
    return " ".join(out)


def _clean_inline_markdown(s: str) -> str:
    # Links: [text](url) -> text (url)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", s)
    # Inline code: `x` -> x
    s = re.sub(r"`([^`]+)`", r"\1", s)
    # Bold/italic markers
    s = s.replace("**", "").replace("*", "")
    return s


@dataclass(frozen=True)
class Styles:
    cover_title_size: int = 26
    cover_subtitle_size: int = 14
    toc_title_size: int = 18
    h1_size: int = 16
    h2_size: int = 13
    h3_size: int = 11
    body_size: int = 10.5
    code_size: int = 9
    line_height: float = 5.2
    code_line_height: float = 4.4
    section_gap: float = 2.0


def generate_pdf(md_path: Path, pdf_path: Path) -> None:
    try:
        from fpdf import FPDF  # type: ignore
    except Exception as e:  # pragma: no cover
        raise SystemExit(
            "Missing dependency 'fpdf2'. Install it with: python -m pip install fpdf2"
        ) from e

    styles = Styles()

    repo_root = md_path.resolve().parents[1]
    fonts_dir = repo_root / "assets" / "fonts"
    noto_regular = fonts_dir / "NotoSans-Regular.ttf"
    noto_bold = fonts_dir / "NotoSans-Bold.ttf"
    noto_italic = fonts_dir / "NotoSans-Italic.ttf"
    noto_bolditalic = fonts_dir / "NotoSans-BoldItalic.ttf"
    noto_mono = fonts_dir / "NotoSansMono-Regular.ttf"

    use_unicode_fonts = (
        noto_regular.exists()
        and noto_bold.exists()
        and noto_italic.exists()
        and noto_bolditalic.exists()
        and noto_mono.exists()
    )

    md_text = _normalize_text(
        md_path.read_text(encoding="utf-8"),
        force_latin1=not use_unicode_fonts,
    )
    lines = md_text.splitlines()

    # Pre-scan for title + TOC items
    title: Optional[str] = None
    subtitle: Optional[str] = None
    doc_date: Optional[str] = None
    toc_items: list[tuple[int, str]] = []

    for ln in lines:
        if not title and ln.startswith("# "):
            title = _clean_inline_markdown(ln[2:].strip())
            continue
        if not subtitle and ln.startswith("## "):
            subtitle = _clean_inline_markdown(ln[3:].strip())
        if (doc_date is None) and ln.strip().startswith("**Date**:"):
            doc_date = ln.split("**Date**:", 1)[1].strip()
        if ln.startswith("## ") and not ln[3:].strip().lower().startswith("table of contents"):
            toc_items.append((1, _clean_inline_markdown(ln[3:].strip())))
        elif ln.startswith("### "):
            toc_items.append((2, _clean_inline_markdown(ln[4:].strip())))

    if not title:
        title = md_path.stem

    class ReportPDF(FPDF):
        def __init__(self, doc_title: str):
            super().__init__(format="A4", unit="mm")
            self._doc_title = doc_title

        def header(self):
            # No header on cover page
            if self.page_no() == 1:
                return
            self.set_text_color(110, 110, 110)
            if use_unicode_fonts:
                self.set_font("NotoSans", size=9)
            else:
                self.set_font("Helvetica", size=9)
            self.set_x(self.l_margin)
            self.cell(0, 6, self._doc_title, new_x="LMARGIN", new_y="NEXT")
            y = self.get_y()
            self.set_draw_color(220, 220, 220)
            self.line(self.l_margin, y, self.w - self.r_margin, y)
            self.ln(2)
            self.set_text_color(0, 0, 0)

        def footer(self):
            self.set_y(-14)
            self.set_text_color(120, 120, 120)
            if use_unicode_fonts:
                self.set_font("NotoSans", size=9)
            else:
                self.set_font("Helvetica", size=9)
            self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")
            self.set_text_color(0, 0, 0)

    pdf = ReportPDF(doc_title=title)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(left=18, top=18, right=18)

    if use_unicode_fonts:
        # fpdf2 supports Unicode automatically for TTF fonts.
        pdf.add_font("NotoSans", "", str(noto_regular))
        pdf.add_font("NotoSans", "B", str(noto_bold))
        pdf.add_font("NotoSans", "I", str(noto_italic))
        pdf.add_font("NotoSans", "BI", str(noto_bolditalic))
        pdf.add_font("NotoMono", "", str(noto_mono))

    def set_body(style: str = ""):
        if use_unicode_fonts:
            pdf.set_font("NotoSans", style=style, size=styles.body_size)
        else:
            pdf.set_font("Helvetica", style=style, size=styles.body_size)

    def set_code():
        if use_unicode_fonts:
            pdf.set_font("NotoMono", size=styles.code_size)
        else:
            pdf.set_font("Courier", size=styles.code_size)

    def write_heading(text: str, level: int):
        text = _clean_inline_markdown(text)
        pdf.ln(styles.section_gap)
        pdf.set_x(pdf.l_margin)
        pdf.set_text_color(20, 33, 61)
        if use_unicode_fonts:
            if level == 1:
                pdf.set_font("NotoSans", style="B", size=styles.h1_size)
            elif level == 2:
                pdf.set_font("NotoSans", style="B", size=styles.h2_size)
            else:
                pdf.set_font("NotoSans", style="B", size=styles.h3_size)
        else:
            if level == 1:
                pdf.set_font("Helvetica", style="B", size=styles.h1_size)
            elif level == 2:
                pdf.set_font("Helvetica", style="B", size=styles.h2_size)
            else:
                pdf.set_font("Helvetica", style="B", size=styles.h3_size)
        pdf.multi_cell(0, styles.line_height + 0.8, text)
        pdf.set_text_color(0, 0, 0)
        set_body()

    def write_paragraph(text: str):
        set_body()
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, styles.line_height, _clean_inline_markdown(text))

    def write_bullet(text: str, indent_mm: float = 4.0):
        set_body()
        pdf.set_x(pdf.l_margin + indent_mm)
        pdf.multi_cell(0, styles.line_height, f"- {_clean_inline_markdown(text)}")

    def write_numbered(num: str, text: str, indent_mm: float = 0.0):
        set_body()
        pdf.set_x(pdf.l_margin + indent_mm)
        pdf.multi_cell(0, styles.line_height, f"{num}. {_clean_inline_markdown(text)}")

    def write_code_block(code: str):
        set_code()
        pdf.ln(0.8)
        pdf.set_fill_color(245, 246, 248)
        pdf.set_draw_color(232, 234, 238)
        for ln in code.splitlines() or [""]:
            pdf.set_x(pdf.l_margin + 2)
            pdf.multi_cell(0, styles.code_line_height, ln, fill=True)
        pdf.ln(1.0)
        set_body()

    # Cover page
    pdf.add_page()
    pdf.set_text_color(20, 33, 61)
    if use_unicode_fonts:
        pdf.set_font("NotoSans", style="B", size=styles.cover_title_size)
    else:
        pdf.set_font("Helvetica", style="B", size=styles.cover_title_size)
    pdf.ln(30)
    pdf.multi_cell(0, styles.line_height + 4, title, align="C")
    pdf.ln(4)
    if subtitle:
        if use_unicode_fonts:
            pdf.set_font("NotoSans", size=styles.cover_subtitle_size)
        else:
            pdf.set_font("Helvetica", size=styles.cover_subtitle_size)
        pdf.set_text_color(60, 70, 90)
        pdf.multi_cell(0, styles.line_height + 2, subtitle, align="C")
    pdf.ln(10)
    pdf.set_text_color(90, 90, 90)
    if use_unicode_fonts:
        pdf.set_font("NotoSans", size=11)
    else:
        pdf.set_font("Helvetica", size=11)
    if doc_date:
        pdf.multi_cell(0, styles.line_height + 1, f"Date: {doc_date}", align="C")
    pdf.set_text_color(0, 0, 0)

    # TOC page (generated)
    pdf.add_page()
    pdf.set_text_color(20, 33, 61)
    if use_unicode_fonts:
        pdf.set_font("NotoSans", style="B", size=styles.toc_title_size)
    else:
        pdf.set_font("Helvetica", style="B", size=styles.toc_title_size)
    pdf.multi_cell(0, styles.line_height + 2, "Contents")
    pdf.ln(2)
    set_body()
    for level, txt in toc_items:
        indent = 2 if level == 1 else 8
        pdf.set_x(pdf.l_margin + indent)
        pdf.multi_cell(0, styles.line_height, txt)

    # Main content
    pdf.add_page()
    set_body()

    in_code = False
    code_buf: list[str] = []
    skipping_md_toc = False

    for raw in lines:
        # Remove the markdown TOC section since we generate our own
        if raw.startswith("## ") and raw[3:].strip().lower().startswith("table of contents"):
            skipping_md_toc = True
            continue
        if skipping_md_toc:
            if raw.strip() == "---":
                skipping_md_toc = False
            continue

        line = _soft_break_long_tokens(raw.rstrip())

        # Skip the top-level title line since we rendered it already
        if raw.startswith("# ") and raw[2:].strip() == title:
            continue

        if line.strip().startswith("```"):
            if in_code:
                in_code = False
                write_code_block("\n".join(code_buf))
                code_buf = []
            else:
                in_code = True
            continue

        if in_code:
            code_buf.append(line)
            continue

        if not line.strip():
            pdf.ln(2.5)
            continue

        if line.startswith("## "):
            write_heading(line[3:].strip(), level=1)
            continue
        if line.startswith("### "):
            write_heading(line[4:].strip(), level=2)
            continue
        if line.startswith("#### "):
            write_heading(line[5:].strip(), level=3)
            continue

        # Bullets
        if re.match(r"^\s*-\s+", raw):
            leading = len(raw) - len(raw.lstrip(" "))
            level = max(0, leading // 2)
            write_bullet(line.lstrip()[2:].strip(), indent_mm=4.0 + (level * 4.0))
            continue

        # Numbered list (basic)
        m = re.match(r"^\s*(\d+)[\.\)]\s+(.*)$", line)
        if m:
            leading = len(raw) - len(raw.lstrip(" "))
            level = max(0, leading // 2)
            write_numbered(m.group(1), m.group(2), indent_mm=(level * 4.0))
            continue

        # Horizontal rule-ish
        if line.strip() in {"---", "***"}:
            pdf.ln(1.5)
            x1 = pdf.l_margin
            x2 = pdf.w - pdf.r_margin
            y = pdf.get_y()
            pdf.line(x1, y, x2, y)
            pdf.ln(2.5)
            continue

        write_paragraph(line)

    # Flush trailing code block if file ends inside it
    if in_code and code_buf:
        write_code_block("\n".join(code_buf))

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(pdf_path))


def main() -> None:
    import sys

    repo_root = Path(__file__).resolve().parents[1]
    if len(sys.argv) >= 3:
        md_path = Path(sys.argv[1])
        pdf_path = Path(sys.argv[2])
        if not md_path.is_absolute():
            md_path = repo_root / md_path
        if not pdf_path.is_absolute():
            pdf_path = repo_root / pdf_path
    else:
        md_path = repo_root / "docs" / "Product_Architecture_Dossier.md"
        pdf_path = repo_root / "docs" / "Product_Architecture_Dossier.pdf"

    if not md_path.exists():
        raise SystemExit(f"Markdown file not found: {md_path}")

    generate_pdf(md_path=md_path, pdf_path=pdf_path)
    print(f"Wrote: {pdf_path}")


if __name__ == "__main__":
    main()

