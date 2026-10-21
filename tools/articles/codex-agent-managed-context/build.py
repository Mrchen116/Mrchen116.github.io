#!/usr/bin/env python3
"""Build this article and its standalone lab while preserving the original date."""

from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[3]
SLUG = "codex-agent-managed-context"
SOURCE = ROOT / "drafts" / f"{SLUG}-v2.html"
ARTICLE = ROOT / "_articles" / f"{SLUG}.html"
ASSETS = ROOT / "assets" / "articles" / SLUG
ASSET_URL = f"/assets/articles/{SLUG}/"


def main():
    # The shared converter removes head scripts and preserves source-relative URLs.
    # This article needs its component script plus URLs rooted at the published site.
    original = ARTICLE.read_text(encoding="utf-8")
    date = re.search(r"^date:\s*(\d{4}-\d{2}-\d{2})", original, re.M).group(1)
    subprocess.run([
        sys.executable, str(ROOT / "tools/convert.py"), str(SOURCE),
        "--slug", SLUG, "--date", date, "--lang", "zh-CN", "--force",
        "--excerpt", "拆解 Codex 的 Agent-managed Context：用交互流程理解 Notes、History 与换窗恢复，并与 SKILL.state 的状态机路线对照。",
    ], check=True)
    article = ARTICLE.read_text(encoding="utf-8")
    article = article.replace(f"../assets/articles/{SLUG}/", ASSET_URL)
    article += f'\n<script src="{ASSET_URL}context-lab.js" defer></script>\n'
    ARTICLE.write_text(article, encoding="utf-8")

    lab = (ROOT / "drafts/codex-context-lab.html").read_text(encoding="utf-8")
    lab = lab.replace(f"../assets/articles/{SLUG}/context-lab.js", "context-lab.js")
    (ASSETS / "context-lab.html").write_text(lab, encoding="utf-8")
    print(f"Built {ARTICLE.relative_to(ROOT)} and {ASSETS.relative_to(ROOT)}/context-lab.html")


if __name__ == "__main__":
    main()
