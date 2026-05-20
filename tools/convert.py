#!/usr/bin/env python3
"""
convert.py — Convert a standalone-double-clickable article HTML into a
Jekyll-ready file under _articles/.

USAGE
    python tools/convert.py path/to/source.html
    python tools/convert.py path/to/source.html --out _articles/my-slug.html
    python tools/convert.py path/to/source.html --date 2026-05-19 --excerpt "..."

WHAT IT DOES
    1. Reads the source HTML (must be a full <!doctype html> document)
    2. Extracts <title>, generates slug from filename (or --slug)
    3. Asks for date / excerpt / lang interactively if not provided via flags
    4. Strips <!doctype>, <html>, <head>, <body> wrappers
    5. Pulls the <style> block(s) and wraps each CSS rule with `.art-body`
       scope so the article's styles don't leak into site chrome
    6. Drops the original <title> from <head> (we use the YAML title)
    7. Writes the result to _articles/<slug>.html with a YAML front-matter

ASSUMPTIONS
    - The source article uses class names from the recommended template
      (see ARTICLE_GUIDE.md). It can still override visuals freely — the
      scoping just makes sure those overrides stay inside the article.
    - The source's CSS uses CSS selectors with explicit elements/classes;
      `:root { --foo: ... }` is rewritten to `.art-body { --foo: ... }`.
    - No <script> tags in the source. If you need JS, ask the maintainer.

DEPENDENCIES
    Standard library only (re + argparse + html.parser). No BeautifulSoup
    needed — the structural transforms are simple enough.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


# ---------- small HTML utilities ----------

def extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else ""


def extract_lang(html: str) -> str:
    m = re.search(r'<html[^>]*\blang="([^"]+)"', html, re.IGNORECASE)
    return m.group(1).strip() if m else "zh-CN"


def extract_style_blocks(html: str) -> tuple[str, list[str]]:
    """Return (html_without_styles, list_of_style_block_contents)."""
    blocks: list[str] = []

    def grab(match: re.Match[str]) -> str:
        blocks.append(match.group(1))
        return ""

    cleaned = re.sub(
        r"<style[^>]*>(.*?)</style>",
        grab,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return cleaned, blocks


def strip_outer_wrappers(html: str) -> str:
    html = re.sub(r"<!doctype[^>]*>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<html[^>]*>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"</html>\s*$", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<head>.*?</head>", "", html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"<body[^>]*>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"</body>\s*$", "", html, flags=re.IGNORECASE)
    html = html.strip()

    # Strip a trailing inline <script> — the shared site JS (lang-toggle.js,
    # email reveal) is auto-injected by _layouts/article.html.
    html = re.sub(r"<script[^>]*>[\s\S]*?</script>\s*$", "", html, flags=re.IGNORECASE).strip()

    # Unwrap common outermost containers so the layout's .art-body grid can
    # govern child widths. Order matters — try .art-body first, then .wrap,
    # then <article>.
    for wrapper_pattern in (
        r'^<div class="art-body"[^>]*>([\s\S]*)</div>\s*$',
        r'^<div class="wrap"[^>]*>([\s\S]*)</div>\s*$',
        r"^<article[^>]*>([\s\S]*)</article>\s*$",
    ):
        m = re.match(wrapper_pattern, html, re.IGNORECASE)
        if m:
            html = m.group(1).strip()
            break

    # Also unwrap a non-leading .wrap (e.g. when .lang-toggle precedes it as
    # a sibling). Match a single .wrap and balance its </div> by depth count.
    html = _unwrap_first_div(html, "wrap")
    return html


def _unwrap_first_div(html: str, cls: str) -> str:
    """Find the first <div class="<cls>"> ... </div> and remove the wrapper,
    preserving inner content. Tolerates nested <div>s via a depth counter."""
    open_re = re.compile(rf'<div class="{re.escape(cls)}"[^>]*>', re.IGNORECASE)
    m = open_re.search(html)
    if not m:
        return html
    start, after_open = m.start(), m.end()

    depth = 1
    i = after_open
    while i < len(html) and depth > 0:
        nxt_open = html.find("<div", i)
        nxt_close = html.find("</div>", i)
        if nxt_close < 0:
            return html  # unbalanced — bail
        if 0 <= nxt_open < nxt_close:
            depth += 1
            i = nxt_open + 4
        else:
            depth -= 1
            i = nxt_close + 6
    if depth != 0:
        return html
    inner = html[after_open : i - 6].strip()
    return (html[:start] + inner + html[i:]).strip()


# ---------- CSS scoping ----------

# Rewrite selectors so they only match inside `.art-body`.
# Strategy:
#   - At-rules (@media, @keyframes, @supports, @font-face): keep as-is at the
#     top level, but recursively scope their inner rules.
#   - `:root` → `.art-body`
#   - `body` → `.art-body`
#   - `html` → `.art-body`
#   - any other selector → prefix with `.art-body ` unless it already starts
#     with `.art-body`
#   - inside @keyframes, leave selectors alone (0%, from, to)

_SCOPE = ".art-body"


def _scope_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    # leave keyframe percent/keyword selectors alone
    if re.fullmatch(r"\d+%|from|to|\d+%\s*,\s*\d+%", sel, re.IGNORECASE):
        return sel
    if sel == ":root" or sel == "html" or sel == "body":
        return _SCOPE
    if sel.startswith(_SCOPE):
        return sel
    # `body[data-lang="…"]` (and html/:root variants) — common in articles
    # that toggle state on the body element. Rewrite to target the .art-body
    # wrapper, which is where the layout (and our shared JS) stores state.
    sel = re.sub(r"^body(?=[.:\s#\[])", _SCOPE, sel)
    sel = re.sub(r"^html(?=[.:\s#\[])", _SCOPE, sel)
    if sel.startswith(_SCOPE):
        return sel
    return f"{_SCOPE} {sel}"


def _scope_rule_list(css: str, inside_keyframes: bool = False) -> str:
    """Walk top-level CSS rules and scope each selector list."""
    out: list[str] = []
    i = 0
    n = len(css)

    while i < n:
        # skip whitespace and CSS comments
        ws = re.match(r"\s+|/\*[\s\S]*?\*/", css[i:])
        if ws:
            out.append(ws.group(0))
            i += ws.end()
            continue

        # at-rule
        if css[i] == "@":
            # find end of at-rule prelude (up to '{' or ';')
            j = i
            while j < n and css[j] not in "{;":
                j += 1
            prelude = css[i:j]
            if j < n and css[j] == ";":
                # statement at-rule like @charset, @import — leave it
                out.append(css[i:j + 1])
                i = j + 1
                continue
            # block at-rule — find matching closing brace
            depth = 0
            k = j
            while k < n:
                if css[k] == "{":
                    depth += 1
                elif css[k] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            inner = css[j + 1:k]
            name = prelude.strip().split(None, 1)[0].lower()
            is_kf = name in ("@keyframes", "@-webkit-keyframes")
            recurs = _scope_rule_list(inner, inside_keyframes=is_kf)
            out.append(f"{prelude}{{{recurs}}}")
            i = k + 1
            continue

        # regular rule: read until '{'
        j = i
        while j < n and css[j] != "{":
            j += 1
        if j >= n:
            out.append(css[i:])
            break
        sel_text = css[i:j]
        # find matching close
        depth = 0
        k = j
        while k < n:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
                if depth == 0:
                    break
            k += 1
        body = css[j + 1:k]

        if inside_keyframes:
            scoped_sel = sel_text  # leave 0% / from / to alone
        else:
            parts = [_scope_selector(s) for s in sel_text.split(",")]
            scoped_sel = ", ".join(parts)
        out.append(f"{scoped_sel}{{{body}}}")
        i = k + 1

    return "".join(out)


def scope_css(css: str) -> str:
    return _scope_rule_list(css)


# ---------- main ----------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source", type=Path, help="Path to standalone HTML source")
    ap.add_argument(
        "--out", "-o", type=Path,
        help="Output path (default: _articles/<slug>.html, resolved against --site)",
    )
    ap.add_argument(
        "--site", type=Path, default=Path.cwd(),
        help="Repo root (default: current dir). _articles/ resolved here.",
    )
    ap.add_argument("--slug", help="Slug to use (default: source filename stem)")
    ap.add_argument("--date", help="Publish date, YYYY-MM-DD")
    ap.add_argument("--excerpt", help="One-sentence excerpt for the list page")
    ap.add_argument("--lang", help="zh-CN or en (default: <html lang>)")
    ap.add_argument(
        "--force", action="store_true",
        help="Overwrite output if it already exists.",
    )
    ap.add_argument(
        "--no-scope", action="store_true",
        help="Skip CSS scoping (advanced — only if you really know).",
    )
    args = ap.parse_args()

    src_path = args.source.resolve()
    if not src_path.is_file():
        print(f"ERROR: source not found: {src_path}", file=sys.stderr)
        return 1

    html = src_path.read_text(encoding="utf-8")

    title = extract_title(html)
    if not title:
        print("ERROR: no <title> in source. Add one in the <head>.", file=sys.stderr)
        return 1

    slug = args.slug or src_path.stem
    slug = re.sub(r"[^a-z0-9-]+", "-", slug.lower()).strip("-")

    date = args.date
    if not date:
        # default to today
        date = dt.date.today().isoformat()

    excerpt = args.excerpt or _prompt_if_tty("Excerpt (one sentence): ") or ""
    lang = args.lang or extract_lang(html)

    # extract & scope styles
    html_no_style, style_blocks = extract_style_blocks(html)
    if args.no_scope:
        merged_css = "\n".join(style_blocks)
    else:
        merged_css = "\n".join(scope_css(b) for b in style_blocks)

    body = strip_outer_wrappers(html_no_style)

    # The layout renders the front-matter title as a top-level H1 already.
    # Drop the article's own first <h1>…</h1> to avoid a duplicate. The
    # surrounding header (eyebrow + lead) is kept — only the h1 line goes.
    body, n = re.subn(
        r"<h1[^>]*>[\s\S]*?</h1>\s*",
        "",
        body,
        count=1,
        flags=re.IGNORECASE,
    )
    if n == 0:
        print(
            "WARN: no <h1> found in body — the layout will be the only title.",
            file=sys.stderr,
        )

    # Build output
    fm_lines = [
        "---",
        f'title: {_yaml_string(title)}',
        f"date:  {date}",
        f'excerpt: {_yaml_string(excerpt)}' if excerpt else None,
        f"lang:  {lang}",
        "---",
        "",
    ]
    fm = "\n".join(line for line in fm_lines if line is not None)

    parts: list[str] = [fm]
    if merged_css.strip():
        parts.append("<style>\n" + merged_css.strip() + "\n</style>\n")
    parts.append(body + "\n")

    out_path = args.out or (args.site / "_articles" / f"{slug}.html")
    out_path = out_path.resolve()
    if out_path.exists() and not args.force:
        print(
            f"ERROR: {out_path} already exists. Use --force to overwrite.",
            file=sys.stderr,
        )
        return 1
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(parts), encoding="utf-8")

    print(f"✓ Wrote {out_path.relative_to(Path.cwd()) if out_path.is_relative_to(Path.cwd()) else out_path}")
    print(f"  title:   {title}")
    print(f"  slug:    {slug}")
    print(f"  date:    {date}")
    print(f"  lang:    {lang}")
    if excerpt:
        print(f"  excerpt: {excerpt[:80]}{'…' if len(excerpt) > 80 else ''}")
    return 0


def _prompt_if_tty(prompt: str) -> str:
    if not sys.stdin.isatty():
        return ""
    try:
        return input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        print()
        return ""


def _yaml_string(s: str) -> str:
    """Render a YAML-safe double-quoted string."""
    escaped = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


if __name__ == "__main__":
    raise SystemExit(main())
