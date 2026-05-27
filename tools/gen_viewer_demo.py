#!/usr/bin/env python3
"""Generate viewer-demo.html with mock data faithful to skill-creator's real
pipeline (SKILL.md / agents/*.md / references/schemas.md / aggregate_benchmark.py).

Mock skill: `pdf` — the canonical example used throughout the upstream docs.
Two evals, 3 runs per (eval, config), 4 (eval × config) combinations surfaced in
the Outputs tab — that's runs-per-configuration=3 per benchmark.json convention.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = Path(
    "/Users/czj/.claude/plugins/marketplaces/claude-plugins-official/"
    "plugins/skill-creator/skills/skill-creator/eval-viewer/viewer.html"
)
OUT = ROOT / "assets" / "skill-creator" / "viewer-demo.html"


# ---------------------------------------------------------------------------
# Eval prompts — match SKILL.md's recommended style (long, casual, context-rich)
# ---------------------------------------------------------------------------

EVAL_0_PROMPT = (
    "hey so I have a blank W-9 PDF that I need to fill out for our new "
    "contractor (his name's John Smith, EIN is 87-1234567, business name "
    "Smith Consulting LLC, address 488 Folsom St, San Francisco CA 94105). "
    "Form is at inputs/blank-w9.pdf, his info is in inputs/contractor_data.json. "
    "Need the filled PDF saved to outputs/."
)

EVAL_1_PROMPT = (
    "Got an invoice PDF from one of our vendors (Acme Supplies, 3 pages, "
    "saved as inputs/invoice-2026-Q1.pdf). I need to extract all line items "
    "into a CSV — columns should be item, qty, unit_price, line_total. "
    "Page 2 looks like a scan of a printed sheet so OCR will probably be "
    "needed for that one. Output the CSV to outputs/."
)


# ---------------------------------------------------------------------------
# Realistic output files — what executor (with vs without skill) actually produces
# ---------------------------------------------------------------------------

# Eval 0 — with_skill: structured transcript, field_info.json, indication of pypdf use
EVAL_0_WITH_TRANSCRIPT = """## Eval Prompt

hey so I have a blank W-9 PDF that I need to fill out for our new contractor
(name: John Smith, EIN 87-1234567, business: Smith Consulting LLC, address
488 Folsom St SF 94105). Form: inputs/blank-w9.pdf, data: inputs/contractor_data.json.

## Step 1 · Read skill

Read pdf/SKILL.md. Skill bundles `scripts/fill_form.py` (pypdf-based) and
points at it for AcroForm PDFs. Plan: probe form with pdftk to confirm it has
fillable fields, then run fill_form.py with field mapping.

## Step 2 · Inspect form

  Bash: pdftk inputs/blank-w9.pdf dump_data_fields | head -50
  → 12 fields: f1_01 (Name), f1_02 (BusinessName), f1_03 (Federal_tax_class),
    f1_04 (Exempt_payee_code), f1_05 (FATCA_code), f1_06 (Address),
    f1_07 (City_State_Zip), f1_08 (Account_numbers), f1_09 (Requester_name),
    f2_01 (SSN), f2_02 (EIN), f2_03 (Signature_date)

## Step 3 · Load data

  Read: inputs/contractor_data.json
  → {"name": "John Smith", "business": "Smith Consulting LLC",
     "tax_class": "LLC-C", "ein": "87-1234567",
     "address": "488 Folsom St", "city_state_zip": "San Francisco CA 94105"}

## Step 4 · Run fill_form.py

  Bash: python pdf/scripts/fill_form.py inputs/blank-w9.pdf outputs/filled-w9.pdf \\
        --field f1_01="John Smith" --field f1_02="Smith Consulting LLC" \\
        --field f1_03="LLC-C" --field f1_06="488 Folsom St" \\
        --field f1_07="San Francisco CA 94105" --field f2_02="87-1234567"
  → Wrote outputs/filled-w9.pdf (12 fields populated, signature/date left blank
    per skill guidance: "do not auto-fill signature fields")

## Step 5 · Validate

  Bash: pdftk outputs/filled-w9.pdf dump_data_fields | grep FieldValue
  → 12 FieldValue entries, all populated except f2_03 (signature, intentional)

## Final output

  outputs/filled-w9.pdf      (filled form)
  outputs/field_info.json    (field mapping recorded)
"""

EVAL_0_WITH_FIELD_INFO = """{
  "form": "W-9",
  "total_fields": 12,
  "fields_filled": 11,
  "fields_left_blank": ["f2_03 (signature_date)"],
  "blank_reason": "Skill instructs not to auto-fill signature fields",
  "mapping": {
    "f1_01": "John Smith",
    "f1_02": "Smith Consulting LLC",
    "f1_03": "LLC-C",
    "f1_06": "488 Folsom St",
    "f1_07": "San Francisco CA 94105",
    "f2_02": "87-1234567"
  }
}"""

EVAL_0_WITH_USER_NOTES = """# User notes

- Left signature/date field (f2_03) blank — skill SKILL.md says "never
  auto-fill signature fields; flag for human"
"""

# Eval 0 — without_skill: agent improvises text overlay
EVAL_0_WITHOUT_TRANSCRIPT = """## Eval Prompt

hey so I have a blank W-9 PDF that I need to fill out for our new contractor
[...same prompt...]

## Step 1 · Inspect

  Read: inputs/blank-w9.pdf
  → Binary PDF, ~140KB. I'll need a Python library to fill it.

## Step 2 · Attempt

  Bash: python -c "import pypdf; ..."
  → pypdf available. But I don't know the field names of this W-9.

## Step 3 · Try text overlay approach

Since I don't know the form's internal field names, I'll overlay text at
approximate coordinates using reportlab.

  Bash: python -c "from reportlab.pdfgen import canvas; c = canvas.Canvas('overlay.pdf'); c.drawString(72, 720, 'John Smith'); c.drawString(72, 690, 'Smith Consulting LLC'); ... c.save()"

  Bash: python -c "from pypdf import PdfReader, PdfWriter; ... merge overlay onto blank ..."
  → outputs/filled-w9.pdf written (~155KB)

## Notes

- Did not use AcroForm field-filling — I would need to introspect the form
  first and didn't have a script for that
- Text is placed at hardcoded coordinates that match a generic letter-size
  W-9 layout; may misalign on different revisions
- Couldn't verify field count
"""

EVAL_0_WITHOUT_USER_NOTES = """# User notes

- Used text overlay approach (reportlab) instead of AcroForm fill — text may
  be visually present but won't be machine-readable as form data
- Coordinates are hardcoded; haven't verified alignment against this specific
  W-9 revision
"""

# Eval 1 — with_skill: structured output, OCR fallback used
EVAL_1_WITH_TRANSCRIPT = """## Eval Prompt

Got an invoice PDF from Acme Supplies (3 pages, inputs/invoice-2026-Q1.pdf).
Extract line items to CSV with columns item, qty, unit_price, line_total.
Page 2 looks scanned so OCR may be needed.

## Step 1 · Read skill

pdf/SKILL.md. For text-extractable PDFs use `scripts/extract_text.py`
(pdfplumber). For scanned pages skill provides `scripts/ocr_page.py`
(tesseract + image preprocessing). Plan: probe each page, branch by type.

## Step 2 · Probe pages

  Bash: python pdf/scripts/probe_pages.py inputs/invoice-2026-Q1.pdf
  → page 1: text (extractable, 2814 chars)
    page 2: scanned (0 chars extractable, image-based)
    page 3: text (1106 chars)

## Step 3 · Extract pages 1 & 3 via pdfplumber

  Bash: python pdf/scripts/extract_text.py inputs/invoice-2026-Q1.pdf \\
        --pages 1,3 --tables
  → 5 line items from page 1, 1 line item from page 3

## Step 4 · OCR page 2

  Bash: python pdf/scripts/ocr_page.py inputs/invoice-2026-Q1.pdf --page 2 \\
        --preprocess deskew,contrast
  → 2 line items recovered (Widget-7A x 12, Gasket-M4 x 50)

## Step 5 · Normalize and write CSV

Parsed currency strings ("$1,250.00" → 1250.00), validated qty * unit_price
matches line_total within ±$0.01 — all 8 rows pass.

  Write: outputs/line_items.csv (8 rows, 4 columns)
"""

EVAL_1_WITH_CSV = """item,qty,unit_price,line_total
Bolt-A12-Stainless,200,0.45,90.00
Hex-Nut-M8,500,0.08,40.00
Bracket-L-90deg,40,12.50,500.00
Steel-Plate-3mm,15,28.00,420.00
Rivet-Pop-4mm,1000,0.04,40.00
Widget-7A,12,18.75,225.00
Gasket-M4,50,1.20,60.00
Sealant-Tube-300ml,8,9.25,74.00
"""

EVAL_1_WITH_USER_NOTES = """# User notes

- Page 2 OCR returned "Gosket" on first pass; corrected to "Gasket" after
  applying skill's contrast preprocessing — flagging in case the real
  invoice has different spelling
- Row totals validated to within $0.01 (rounding)
"""

# Eval 1 — without_skill: gives up on scanned page
EVAL_1_WITHOUT_TRANSCRIPT = """## Eval Prompt

[...same...]

## Step 1 · Try pdfplumber

  Bash: python -c "import pdfplumber; ..."
  → Page 1: extracted text, found 5 line items in a table
    Page 2: empty (0 chars) — looks scanned
    Page 3: extracted text, 1 line item

## Step 2 · What to do about page 2

Page 2 doesn't have extractable text. I could try OCR but tesseract isn't
installed in this environment, and I don't have a script ready. I'll proceed
with the 6 items I have and note this in the output.

## Step 3 · Write CSV

  Write: outputs/line_items.csv (6 rows)
"""

EVAL_1_WITHOUT_CSV = """item,qty,unit_price,line_total
Bolt-A12-Stainless,200,0.45,90.00
Hex-Nut-M8,500,0.08,40.00
Bracket-L-90deg,40,12.50,500.00
Steel-Plate-3mm,15,28.00,420.00
Rivet-Pop-4mm,1000,0.04,40.00
Sealant-Tube-300ml,8,9.25,74.00
"""

EVAL_1_WITHOUT_USER_NOTES = """# User notes

- Page 2 appears to be a scan; no text extractable. Skipped — would need OCR
  setup which I don't have available.
- Output may be incomplete.
"""


# ---------------------------------------------------------------------------
# Assertions (eval-level, plain strings) — operational style per grader.md examples
# ---------------------------------------------------------------------------

EVAL_0_ASSERTIONS = [
    "The output includes the name 'John Smith'",
    "All 12 fillable fields in the W-9 form are populated (or signature-related fields explicitly left blank with a note)",
    "The EIN field contains '87-1234567'",
    "The assistant used a PDF form-filling approach (e.g. AcroForm fields via pypdf/pdftk), not a text overlay",
    "The output PDF opens without errors and field values are readable as form data",
]

EVAL_1_ASSERTIONS = [
    "The output is a CSV file with header row: item, qty, unit_price, line_total",
    "All 8 line items from the invoice appear in the CSV",
    "Numeric columns contain numbers (no currency symbols or thousands separators)",
    "The assistant used the skill's OCR script (ocr_page.py) for the scanned page 2",
    "For each row, qty × unit_price equals line_total within rounding tolerance",
]


# ---------------------------------------------------------------------------
# Per-run grading.json builders — full schema per references/schemas.md
# ---------------------------------------------------------------------------

def grading(expectations, tool_calls, total_steps, output_chars, transcript_chars,
            exec_secs, grader_secs, claims, user_notes, eval_feedback=None,
            errors=0):
    passed = sum(1 for e in expectations if e["passed"])
    total = len(expectations)
    failed = total - passed
    total_tool_calls = sum(tool_calls.values())
    g = {
        "expectations": expectations,
        "summary": {
            "passed": passed,
            "failed": failed,
            "total": total,
            "pass_rate": round(passed / total, 4) if total else 0.0,
        },
        "execution_metrics": {
            "tool_calls": tool_calls,
            "total_tool_calls": total_tool_calls,
            "total_steps": total_steps,
            "errors_encountered": errors,
            "output_chars": output_chars,
            "transcript_chars": transcript_chars,
        },
        "timing": {
            "executor_duration_seconds": exec_secs,
            "grader_duration_seconds": grader_secs,
            "total_duration_seconds": round(exec_secs + grader_secs, 1),
        },
        "claims": claims,
        "user_notes_summary": user_notes,
    }
    if eval_feedback:
        g["eval_feedback"] = eval_feedback
    return g


# Expectation builders (text matches eval-level assertion verbatim)

def exp(text, passed, evidence):
    return {"text": text, "passed": passed, "evidence": evidence}


WITH_EXP_0 = [
    exp(EVAL_0_ASSERTIONS[0], True,
        "field_info.json shows f1_01 mapped to 'John Smith'; "
        "pdftk dump in transcript Step 5 confirms FieldValue: John Smith"),
    exp(EVAL_0_ASSERTIONS[1], True,
        "11/12 fields populated; f2_03 (signature_date) deliberately left "
        "blank per skill instruction; user_notes documents this choice"),
    exp(EVAL_0_ASSERTIONS[2], True,
        "f2_02 (EIN) mapped to '87-1234567' in field_info.json; "
        "pdftk dump confirms"),
    exp(EVAL_0_ASSERTIONS[3], True,
        "Transcript Step 4: 'python pdf/scripts/fill_form.py ... "
        "--field f1_01=...' — used AcroForm field filling via pypdf"),
    exp(EVAL_0_ASSERTIONS[4], True,
        "pdftk dump_data_fields completes without error and returns 12 "
        "FieldValue entries; file size 162KB, opens in qpdf inspection"),
]

WITHOUT_EXP_0 = [
    exp(EVAL_0_ASSERTIONS[0], True,
        "Text overlay places 'John Smith' on page 1; pdftotext extracts it"),
    exp(EVAL_0_ASSERTIONS[1], False,
        "No AcroForm fields were filled (text overlay approach used). "
        "pdftk dump_data_fields shows all 12 FieldValue entries empty."),
    exp(EVAL_0_ASSERTIONS[2], True,
        "EIN string '87-1234567' present in overlay text"),
    exp(EVAL_0_ASSERTIONS[3], False,
        "Transcript Step 3 documents use of reportlab to draw text at "
        "hardcoded coordinates — explicitly a text overlay, not form fill"),
    exp(EVAL_0_ASSERTIONS[4], False,
        "PDF opens but field values are not machine-readable as form data "
        "(overlay text, not AcroForm values). Fails the spirit of the test."),
]

WITH_EXP_1 = [
    exp(EVAL_1_ASSERTIONS[0], True,
        "CSV header: 'item,qty,unit_price,line_total' — exact match"),
    exp(EVAL_1_ASSERTIONS[1], True,
        "8 rows in CSV; transcript shows 5 from page 1, 2 from OCR'd page 2, "
        "1 from page 3"),
    exp(EVAL_1_ASSERTIONS[2], True,
        "Spot-checked column 3: 0.45, 0.08, 12.50, 28.00 — pure numbers, "
        "no $ or commas"),
    exp(EVAL_1_ASSERTIONS[3], True,
        "Transcript Step 4: 'python pdf/scripts/ocr_page.py "
        "inputs/invoice-2026-Q1.pdf --page 2 --preprocess deskew,contrast'"),
    exp(EVAL_1_ASSERTIONS[4], True,
        "Verified: 200*0.45=90.00, 500*0.08=40.00, 40*12.50=500.00, "
        "15*28.00=420.00, 1000*0.04=40.00, 12*18.75=225.00, "
        "50*1.20=60.00, 8*9.25=74.00 — all match"),
]

WITHOUT_EXP_1 = [
    exp(EVAL_1_ASSERTIONS[0], True,
        "CSV header exact match"),
    exp(EVAL_1_ASSERTIONS[1], False,
        "Only 6 rows in CSV; missing the 2 items from page 2 "
        "(Widget-7A, Gasket-M4)"),
    exp(EVAL_1_ASSERTIONS[2], True,
        "All numeric columns are plain numbers"),
    exp(EVAL_1_ASSERTIONS[3], False,
        "Transcript Step 2: 'tesseract isn't installed in this environment, "
        "and I don't have a script ready' — agent gave up on OCR rather "
        "than using the skill's bundled ocr_page.py"),
    exp(EVAL_1_ASSERTIONS[4], True,
        "All 6 included rows satisfy qty * unit_price = line_total"),
]


# Claims (grader-extracted, schema example style)

CLAIMS_WITH_0 = [
    {"claim": "The form has 12 fillable fields",
     "type": "factual", "verified": True,
     "evidence": "Counted 12 entries in field_info.json; pdftk dump confirms"},
    {"claim": "Used pypdf via fill_form.py to populate fields",
     "type": "process", "verified": True,
     "evidence": "Transcript Step 4 shows the exact Bash invocation"},
    {"claim": "Signature field deliberately left blank",
     "type": "quality", "verified": True,
     "evidence": "user_notes.md documents the choice and cites skill guidance"},
]

CLAIMS_WITHOUT_0 = [
    {"claim": "PDF was filled out with contractor data",
     "type": "quality", "verified": False,
     "evidence": "Text is visually overlaid but no form fields hold the values; "
                 "downstream consumers expecting AcroForm data will see an empty form"},
    {"claim": "Used reportlab to overlay text at letter-size W-9 coordinates",
     "type": "process", "verified": True,
     "evidence": "Transcript Step 3 documents the approach"},
]

CLAIMS_WITH_1 = [
    {"claim": "Page 2 required OCR; pages 1 and 3 are text-extractable",
     "type": "factual", "verified": True,
     "evidence": "probe_pages.py output in transcript Step 2"},
    {"claim": "Recovered 2 line items from OCR'd page 2",
     "type": "factual", "verified": True,
     "evidence": "Widget-7A and Gasket-M4 rows present in line_items.csv"},
    {"claim": "Row arithmetic was validated",
     "type": "quality", "verified": True,
     "evidence": "Transcript Step 5: 'validated qty * unit_price matches "
                 "line_total within ±$0.01 — all 8 rows pass'"},
]

CLAIMS_WITHOUT_1 = [
    {"claim": "Page 2 was scanned and unextractable",
     "type": "factual", "verified": True,
     "evidence": "pdfplumber returned 0 chars for page 2"},
    {"claim": "Output may be incomplete",
     "type": "quality", "verified": True,
     "evidence": "user_notes.md flags this; CSV has 6 of 8 known items"},
]


# user_notes_summary (grader copies/summarizes from outputs/user_notes.md)

NOTES_WITH_0 = {
    "uncertainties": [],
    "needs_review": [],
    "workarounds": [
        "Signature field (f2_03) intentionally left blank per skill guidance",
    ],
}

NOTES_WITHOUT_0 = {
    "uncertainties": [
        "Coordinates hardcoded for a generic W-9; layout may misalign on different revisions",
    ],
    "needs_review": [
        "Field values placed as text overlay are not retrievable as AcroForm data",
    ],
    "workarounds": [
        "Used reportlab text overlay instead of AcroForm field filling",
    ],
}

NOTES_WITH_1 = {
    "uncertainties": [
        "Page 2 OCR initially read 'Gosket'; corrected to 'Gasket' after contrast preprocessing",
    ],
    "needs_review": [],
    "workarounds": [],
}

NOTES_WITHOUT_1 = {
    "uncertainties": [],
    "needs_review": [
        "Output incomplete — 2 line items from scanned page 2 are missing",
    ],
    "workarounds": [
        "Skipped page 2 entirely instead of attempting OCR",
    ],
}


# eval_feedback (grader's critique of the eval itself, per grader.md Step 6)

EVAL_FB_WITH_0 = {
    "suggestions": [
        {
            "assertion": "The output PDF opens without errors and field values are readable as form data",
            "reason": "This passed but is largely a tautology for any non-corrupt PDF. "
                      "Consider tightening to 'pdftk dump_data_fields returns at least "
                      "10 non-empty FieldValue entries' — that's what actually "
                      "distinguishes form-fill from overlay.",
        },
    ],
    "overall": "Assertions are mostly discriminating, but the 'opens without errors' "
               "check is weak. The form-fill vs. overlay distinction is the real value.",
}


# Build a run dict in the shape generate_review.py's build_run() produces

def make_run(eval_id, config, run_no, prompt, output_files, grading_obj):
    """eval-N/config/run-K relative to root → 'eval-N-config-run-K' (per
    generate_review.py:119)."""
    rel = f"eval-{eval_id}/{config}/run-{run_no}"
    return {
        "id": rel.replace("/", "-"),
        "eval_id": eval_id,
        "prompt": prompt,
        "outputs": output_files,
        "grading": grading_obj,
    }


# ---------------------------------------------------------------------------
# Visible runs in the viewer (4 — one per eval × config so it's navigable)
# ---------------------------------------------------------------------------

def text_file(name, content):
    return {"name": name, "type": "text", "content": content}


# Note: the canonical layout puts filled-w9.pdf as a binary; for the demo we
# substitute a text "field_info.json" + transcript so it renders inline.
visible_runs = [
    make_run(
        0, "with_skill", 1, EVAL_0_PROMPT,
        [
            text_file("field_info.json", EVAL_0_WITH_FIELD_INFO),
            text_file("transcript.md", EVAL_0_WITH_TRANSCRIPT),
            text_file("user_notes.md", EVAL_0_WITH_USER_NOTES),
        ],
        grading(
            WITH_EXP_0,
            {"Read": 4, "Write": 2, "Bash": 6, "Glob": 1},
            total_steps=5, output_chars=2480, transcript_chars=2105,
            exec_secs=42.7, grader_secs=24.1,
            claims=CLAIMS_WITH_0, user_notes=NOTES_WITH_0,
            eval_feedback=EVAL_FB_WITH_0,
        ),
    ),
    make_run(
        0, "without_skill", 1, EVAL_0_PROMPT,
        [
            text_file("transcript.md", EVAL_0_WITHOUT_TRANSCRIPT),
            text_file("user_notes.md", EVAL_0_WITHOUT_USER_NOTES),
        ],
        grading(
            WITHOUT_EXP_0,
            {"Read": 3, "Write": 1, "Bash": 9},
            total_steps=3, output_chars=1430, transcript_chars=1280,
            exec_secs=26.4, grader_secs=22.8,
            claims=CLAIMS_WITHOUT_0, user_notes=NOTES_WITHOUT_0,
        ),
    ),
    make_run(
        1, "with_skill", 1, EVAL_1_PROMPT,
        [
            text_file("line_items.csv", EVAL_1_WITH_CSV),
            text_file("transcript.md", EVAL_1_WITH_TRANSCRIPT),
            text_file("user_notes.md", EVAL_1_WITH_USER_NOTES),
        ],
        grading(
            WITH_EXP_1,
            {"Read": 3, "Write": 1, "Bash": 8},
            total_steps=5, output_chars=420, transcript_chars=1840,
            exec_secs=51.3, grader_secs=29.5,
            claims=CLAIMS_WITH_1, user_notes=NOTES_WITH_1,
        ),
    ),
    make_run(
        1, "without_skill", 1, EVAL_1_PROMPT,
        [
            text_file("line_items.csv", EVAL_1_WITHOUT_CSV),
            text_file("transcript.md", EVAL_1_WITHOUT_TRANSCRIPT),
            text_file("user_notes.md", EVAL_1_WITHOUT_USER_NOTES),
        ],
        grading(
            WITHOUT_EXP_1,
            {"Read": 2, "Write": 1, "Bash": 4},
            total_steps=3, output_chars=315, transcript_chars=920,
            exec_secs=31.1, grader_secs=20.4,
            claims=CLAIMS_WITHOUT_1, user_notes=NOTES_WITHOUT_1,
        ),
    ),
]


# ---------------------------------------------------------------------------
# benchmark.json — 3 runs per (eval, config) for realistic stats
# Schema per aggregate_benchmark.py + references/schemas.md
# ---------------------------------------------------------------------------

def bench_run(eval_id, eval_name, config, run_no, pass_rate, passed, total,
              time_seconds, tokens, tool_calls, expectations, notes, errors=0):
    failed = total - passed
    return {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "configuration": config,
        "run_number": run_no,
        "result": {
            "pass_rate": pass_rate,
            "passed": passed,
            "failed": failed,
            "total": total,
            "time_seconds": time_seconds,
            "tokens": tokens,
            "tool_calls": tool_calls,
            "errors": errors,
        },
        "expectations": expectations,
        "notes": notes,
    }


def flatten_notes(user_notes):
    return (user_notes["uncertainties"] + user_notes["needs_review"]
            + user_notes["workarounds"])


# 3 runs per (eval, config). pass_rate kept stable for with_skill (skill is
# deterministic on AcroForm); without_skill has more variance.

bench_runs = [
    # Eval 0 · with_skill — tight cluster around 1.0
    bench_run(0, "fill-w9-form", "with_skill", 1, 1.0, 5, 5, 66.8, 4120, 13,
              WITH_EXP_0, flatten_notes(NOTES_WITH_0)),
    bench_run(0, "fill-w9-form", "with_skill", 2, 1.0, 5, 5, 71.2, 4380, 14,
              WITH_EXP_0, flatten_notes(NOTES_WITH_0)),
    bench_run(0, "fill-w9-form", "with_skill", 3, 0.8, 4, 5, 64.3, 3960, 12,
              # one run skipped tax_class field — fewer fields filled
              [{**e, "passed": (e["passed"] if i != 1 else False)}
               for i, e in enumerate(WITH_EXP_0)],
              ["Tax_class field (f1_03) left blank — unclear which LLC subtype applied"]),
    # Eval 0 · without_skill — fails the structural assertions, passes the trivial ones
    bench_run(0, "fill-w9-form", "without_skill", 1, 0.4, 2, 5, 49.2, 2710, 13,
              WITHOUT_EXP_0, flatten_notes(NOTES_WITHOUT_0)),
    bench_run(0, "fill-w9-form", "without_skill", 2, 0.2, 1, 5, 38.7, 2240, 9,
              # this run misaligned coordinates badly — name overlay failed too
              [{**e, "passed": (False if i == 0 else e["passed"])}
               for i, e in enumerate(WITHOUT_EXP_0)],
              ["Output PDF text overlay was misaligned — name appeared in wrong region",
               "Tried 2 different coordinate sets, neither matched"]),
    bench_run(0, "fill-w9-form", "without_skill", 3, 0.4, 2, 5, 54.0, 2890, 14,
              WITHOUT_EXP_0,
              ["Used hardcoded letter-size coordinates"]),

    # Eval 1 · with_skill — strong but not perfect (OCR has natural variance)
    bench_run(1, "extract-invoice-line-items", "with_skill", 1, 1.0, 5, 5,
              80.8, 5040, 12, WITH_EXP_1, flatten_notes(NOTES_WITH_1)),
    bench_run(1, "extract-invoice-line-items", "with_skill", 2, 0.8, 4, 5,
              91.4, 5380, 13,
              # OCR misread one qty — line_total mismatch
              [{**e, "passed": (False if i == 4 else e["passed"])}
               for i, e in enumerate(WITH_EXP_1)],
              ["OCR read 'Widget-7A x 12' as 'x 17' on first pass; corrected after re-preprocess but row total mismatch"]),
    bench_run(1, "extract-invoice-line-items", "with_skill", 3, 1.0, 5, 5,
              78.3, 4970, 11, WITH_EXP_1, []),

    # Eval 1 · without_skill — consistently fails OCR assertion
    bench_run(1, "extract-invoice-line-items", "without_skill", 1, 0.6, 3, 5,
              51.5, 2680, 7, WITHOUT_EXP_1, flatten_notes(NOTES_WITHOUT_1)),
    bench_run(1, "extract-invoice-line-items", "without_skill", 2, 0.4, 2, 5,
              28.1, 1410, 4,
              # this run gave up earlier — also missed a header
              [{**e, "passed": (False if i in (0, 1, 3) else e["passed"])}
               for i, e in enumerate(WITHOUT_EXP_1)],
              ["Aborted after page 2 failed; only processed page 1",
               "Output CSV has 5 rows instead of 6 or 8"]),
    bench_run(1, "extract-invoice-line-items", "without_skill", 3, 0.6, 3, 5,
              55.2, 2810, 8, WITHOUT_EXP_1, []),
]


# Aggregate run_summary (matching aggregate_benchmark.calculate_stats output)

def stats(values):
    n = len(values)
    mean = sum(values) / n
    if n > 1:
        var = sum((x - mean) ** 2 for x in values) / (n - 1)
        sd = var ** 0.5
    else:
        sd = 0.0
    return {
        "mean": round(mean, 4),
        "stddev": round(sd, 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
    }


with_pass = [r["result"]["pass_rate"] for r in bench_runs if r["configuration"] == "with_skill"]
with_time = [r["result"]["time_seconds"] for r in bench_runs if r["configuration"] == "with_skill"]
with_tok = [r["result"]["tokens"] for r in bench_runs if r["configuration"] == "with_skill"]
wo_pass = [r["result"]["pass_rate"] for r in bench_runs if r["configuration"] == "without_skill"]
wo_time = [r["result"]["time_seconds"] for r in bench_runs if r["configuration"] == "without_skill"]
wo_tok = [r["result"]["tokens"] for r in bench_runs if r["configuration"] == "without_skill"]

with_stats_pass = stats(with_pass)
with_stats_time = stats(with_time)
with_stats_tok = stats(with_tok)
wo_stats_pass = stats(wo_pass)
wo_stats_time = stats(wo_time)
wo_stats_tok = stats(wo_tok)

delta_pass = with_stats_pass["mean"] - wo_stats_pass["mean"]
delta_time = with_stats_time["mean"] - wo_stats_time["mean"]
delta_tok = with_stats_tok["mean"] - wo_stats_tok["mean"]

run_summary = {
    "with_skill": {
        "pass_rate": with_stats_pass,
        "time_seconds": with_stats_time,
        "tokens": with_stats_tok,
    },
    "without_skill": {
        "pass_rate": wo_stats_pass,
        "time_seconds": wo_stats_time,
        "tokens": wo_stats_tok,
    },
    "delta": {
        "pass_rate": f"{delta_pass:+.2f}",
        "time_seconds": f"{delta_time:+.1f}",
        "tokens": f"{delta_tok:+.0f}",
    },
}


# Analyzer notes — style from agents/analyzer.md "Analyzing Benchmark Results"

analyzer_notes = [
    "Assertion 'The output is a CSV file with header row: item, qty, unit_price, line_total' passes 100% in both configurations — may not differentiate skill value, since writing any well-formed CSV header satisfies it.",
    "Without-skill runs consistently fail on the OCR assertion (0/3 in eval-1) — the agent gives up on the scanned page when no preprocessing script is available, rather than improvising. This is the assertion the skill most clearly differentiates on.",
    "Eval 0 with_skill shows tight variance (pass_rate 0.93 ± 0.12) compared to without_skill (0.33 ± 0.12) — the skill's AcroForm path produces consistent outputs; the overlay-coordinate path doesn't.",
    "Eval 1 with_skill, run 2 had an OCR misread on Widget-7A quantity (12 → 17) before re-preprocessing corrected it — flaky on first pass under default settings. Consider adding a verification step to ocr_page.py.",
    "Skill adds 31.6s average execution time (+105%) and 1928 average tokens (+72%) per run. Cost is real but the pass-rate delta (+0.55) makes it defensible.",
    "Without-skill eval-1 run 2 aborted after page 2 — output has 5 rows instead of 6 minimum. Suggests baseline agents have variable patience for partial failures.",
]


benchmark = {
    "metadata": {
        "skill_name": "pdf",
        "skill_path": "/path/to/skills/pdf",
        "executor_model": "claude-sonnet-4-6",
        "analyzer_model": "claude-opus-4-7",
        "timestamp": "2026-05-20T14:32:11Z",
        "evals_run": [0, 1],
        "runs_per_configuration": 3,
    },
    "runs": bench_runs,
    "run_summary": run_summary,
    "notes": analyzer_notes,
}


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

embedded = {
    "skill_name": "pdf",
    "runs": visible_runs,
    "previous_feedback": {},
    "previous_outputs": {},
    "benchmark": benchmark,
}

template = TEMPLATE.read_text()
out = template.replace(
    "/*__EMBEDDED_DATA__*/",
    f"const EMBEDDED_DATA = {json.dumps(embedded)};",
)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(out)
print(f"wrote {OUT} ({len(out)} bytes)")
print(f"  visible runs: {len(visible_runs)}, benchmark runs: {len(bench_runs)}")
print(f"  with_skill pass_rate: {with_stats_pass['mean']:.2f} ± {with_stats_pass['stddev']:.2f}")
print(f"  without_skill pass_rate: {wo_stats_pass['mean']:.2f} ± {wo_stats_pass['stddev']:.2f}")
print(f"  delta: {run_summary['delta']}")
