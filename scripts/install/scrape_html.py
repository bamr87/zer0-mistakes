#!/usr/bin/env python3
# =============================================================================
# scripts/install/scrape_html.py — HTML extractor for the zer0-mistakes
# installer's site-scraping pipeline.
# =============================================================================
# Stdlib only (Python >= 3.6). Reads HTML from a file or stdin, extracts:
#
#   - title, description, language, canonical URL
#   - Open Graph + Twitter card metadata
#   - main content as a heuristic-selected subtree, rendered to Markdown
#   - all internal links (same host as --base-url, normalized + deduped)
#   - top-level navigation links (from <nav>, <header>, role="navigation")
#   - first image (used as preview)
#
# Two subcommands:
#   extract --url URL [--base-url BASE] [HTML_FILE]
#       Emit a JSON document describing the page.
#
#   crawl-links --base-url BASE [HTML_FILE]
#       Emit a newline-delimited list of in-scope links discovered in the page
#       (used by the bash crawler to enqueue further pages).
#
# Why a Python helper? Pure bash + sed is too brittle for real-world HTML and
# pandoc isn't guaranteed to be installed; html.parser is in every supported
# Python install and gives us deterministic, cross-platform behaviour.
# =============================================================================
from __future__ import annotations

import argparse
import json
import re
import sys
from html import unescape
from html.parser import HTMLParser
from typing import Dict, List, Optional, Tuple
from urllib.parse import urldefrag, urljoin, urlparse


# ---------------------------------------------------------------------------
# DOM model — minimal tree we can reason about.
# ---------------------------------------------------------------------------
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

# Tags that never contribute meaningful content (stripped wholesale).
DROP_TAGS = {"script", "style", "noscript", "template", "iframe", "svg"}

# Tags that typically wrap chrome (header/footer/nav/aside). We use these
# as heuristic anti-signals when selecting main content.
CHROME_TAGS = {"header", "footer", "nav", "aside"}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag: str, attrs: Optional[Dict[str, str]] = None):
        self.tag = tag
        self.attrs = attrs or {}
        self.children: List["Node | str"] = []
        self.parent: Optional["Node"] = None

    def add(self, child):
        if isinstance(child, Node):
            child.parent = self
        self.children.append(child)

    def find_all(self, tag: str) -> List["Node"]:
        out: List[Node] = []
        stack: List[Node] = [self]
        while stack:
            n = stack.pop()
            if n.tag == tag:
                out.append(n)
            for c in n.children:
                if isinstance(c, Node):
                    stack.append(c)
        return out

    def text(self) -> str:
        parts: List[str] = []
        for c in self.children:
            if isinstance(c, str):
                parts.append(c)
            elif c.tag not in DROP_TAGS:
                parts.append(c.text())
        return "".join(parts)


class DOMBuilder(HTMLParser):
    """Build a tolerant DOM from real-world HTML."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("__root__")
        self.stack: List[Node] = [self.root]
        self._dropping = 0  # nested depth inside DROP_TAGS

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in DROP_TAGS:
            # Track depth so nested drops work, but still push a node so
            # the matching end tag is consumed.
            self._dropping += 1
        node = Node(tag, {k.lower(): (v or "") for k, v in attrs})
        self.stack[-1].add(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        # Self-closing form — treat as void regardless of tag name.
        tag = tag.lower()
        node = Node(tag, {k.lower(): (v or "") for k, v in attrs})
        self.stack[-1].add(node)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in VOID_TAGS:
            return
        # Pop until we find a matching tag (HTML is forgiving).
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                if tag in DROP_TAGS and self._dropping > 0:
                    self._dropping -= 1
                del self.stack[i:]
                return
        # No match — ignore the stray end tag.

    def handle_data(self, data):
        if self._dropping:
            return
        if data:
            self.stack[-1].add(data)


def parse_html(html: str) -> Node:
    b = DOMBuilder()
    try:
        b.feed(html)
    except Exception:
        # Be forgiving: return whatever was parsed so far.
        pass
    return b.root


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------
def first(seq, default=None):
    for x in seq:
        return x
    return default


def _meta(root: Node) -> Dict[str, str]:
    meta: Dict[str, str] = {}
    for m in root.find_all("meta"):
        a = m.attrs
        key = a.get("name") or a.get("property") or a.get("itemprop")
        val = a.get("content")
        if key and val:
            meta[key.lower()] = val.strip()
    return meta


def extract_metadata(root: Node, url: str) -> Dict[str, str]:
    meta = _meta(root)
    title_node = first(root.find_all("title"))
    title = (title_node.text().strip() if title_node else "").strip()
    if not title:
        title = meta.get("og:title") or meta.get("twitter:title") or ""

    description = (
        meta.get("description")
        or meta.get("og:description")
        or meta.get("twitter:description")
        or ""
    ).strip()

    canonical = ""
    for l in root.find_all("link"):
        if l.attrs.get("rel", "").lower() == "canonical":
            canonical = l.attrs.get("href", "").strip()
            break
    if not canonical:
        canonical = meta.get("og:url", "")

    html_nodes = root.find_all("html")
    lang = html_nodes[0].attrs.get("lang", "").strip() if html_nodes else ""

    image = (meta.get("og:image") or meta.get("twitter:image") or "").strip()
    if image:
        image = urljoin(url, image)

    site_name = (
        meta.get("og:site_name")
        or meta.get("application-name")
        or ""
    ).strip()

    return {
        "title": title,
        "description": description,
        "canonical": canonical,
        "lang": lang or "en",
        "image": image,
        "site_name": site_name,
    }


# ---------------------------------------------------------------------------
# Link extraction
# ---------------------------------------------------------------------------
SKIP_LINK_PREFIXES = ("mailto:", "tel:", "javascript:", "data:", "#")
SKIP_LINK_EXTS = (
    ".pdf", ".zip", ".tar", ".tgz", ".gz", ".rar", ".7z",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".mp4", ".webm", ".mp3", ".wav", ".ogg",
    ".css", ".js", ".xml", ".json", ".rss", ".atom",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
)


def normalize_link(href: str, base_url: str) -> Optional[str]:
    if not href:
        return None
    h = href.strip()
    if not h or any(h.lower().startswith(p) for p in SKIP_LINK_PREFIXES):
        return None
    full = urljoin(base_url, h)
    full, _ = urldefrag(full)
    if not full:
        return None
    parsed = urlparse(full)
    if parsed.scheme not in ("http", "https"):
        return None
    if any(parsed.path.lower().endswith(e) for e in SKIP_LINK_EXTS):
        return None
    # Strip default ports for stable dedup
    netloc = parsed.netloc
    if netloc.endswith(":80") and parsed.scheme == "http":
        netloc = netloc[:-3]
    if netloc.endswith(":443") and parsed.scheme == "https":
        netloc = netloc[:-4]
    path = parsed.path or "/"
    query = ("?" + parsed.query) if parsed.query else ""
    return f"{parsed.scheme}://{netloc}{path}{query}"


def same_host(url: str, base_url: str) -> bool:
    a = urlparse(url).netloc.lower().lstrip("www.")
    b = urlparse(base_url).netloc.lower().lstrip("www.")
    return a == b and a != ""


def extract_links(root: Node, url: str, base_url: str) -> List[Tuple[str, str]]:
    out: List[Tuple[str, str]] = []
    seen = set()
    for a in root.find_all("a"):
        href = a.attrs.get("href", "")
        norm = normalize_link(href, url)
        if not norm or not same_host(norm, base_url):
            continue
        if norm in seen:
            continue
        seen.add(norm)
        label = " ".join(a.text().split())[:120]
        out.append((norm, label))
    return out


def extract_nav_links(root: Node, url: str, base_url: str) -> List[Tuple[str, str]]:
    out: List[Tuple[str, str]] = []
    seen = set()
    candidates: List[Node] = []
    candidates.extend(root.find_all("nav"))
    for h in root.find_all("header"):
        candidates.append(h)
    # role="navigation" anywhere
    stack: List[Node] = [root]
    while stack:
        n = stack.pop()
        if isinstance(n, Node):
            if n.attrs.get("role", "").lower() == "navigation":
                candidates.append(n)
            for c in n.children:
                if isinstance(c, Node):
                    stack.append(c)
    for container in candidates:
        for a in container.find_all("a"):
            href = a.attrs.get("href", "")
            norm = normalize_link(href, url)
            if not norm or not same_host(norm, base_url):
                continue
            if norm in seen:
                continue
            label = " ".join(a.text().split())
            if not label or len(label) > 80:
                continue
            seen.add(norm)
            out.append((norm, label))
    return out


# ---------------------------------------------------------------------------
# Main-content selection
# ---------------------------------------------------------------------------
def _text_length(node: Node) -> int:
    if node.tag in DROP_TAGS:
        return 0
    return len(" ".join(node.text().split()))


def select_main(root: Node) -> Node:
    """Pick the subtree most likely to contain the page's primary content."""
    # Explicit markers, in order of trust.
    for tag in ("main",):
        nodes = root.find_all(tag)
        if nodes:
            return max(nodes, key=_text_length)
    # role="main"
    stack: List[Node] = [root]
    role_main: Optional[Node] = None
    while stack:
        n = stack.pop()
        if n.attrs.get("role", "").lower() == "main":
            role_main = n
            break
        for c in n.children:
            if isinstance(c, Node):
                stack.append(c)
    if role_main:
        return role_main

    articles = root.find_all("article")
    if articles:
        return max(articles, key=_text_length)

    # Heuristic: pick the descendant with the most text length that isn't
    # inside chrome.
    body = first(root.find_all("body")) or root
    best = body
    best_score = _text_length(body)
    stack = [body]
    while stack:
        n = stack.pop()
        for c in n.children:
            if not isinstance(c, Node):
                continue
            if c.tag in CHROME_TAGS or c.tag in DROP_TAGS:
                continue
            score = _text_length(c)
            # Favor deeper rich containers (sections/divs with most text).
            if score > best_score * 0.9 and c.tag in (
                "section", "div", "article", "main",
            ):
                if score > best_score:
                    best = c
                    best_score = score
            stack.append(c)
    return best


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------
INLINE_TAGS = {"a", "b", "strong", "i", "em", "u", "code", "span", "small",
               "sub", "sup", "abbr", "mark", "kbd", "var", "samp"}


def _normalize_ws(s: str) -> str:
    return re.sub(r"[ \t\r\n\f]+", " ", s).strip()


def _md_escape(s: str) -> str:
    # Escape characters that have markdown meaning at the start of a line
    # or inline. We keep this conservative.
    return s.replace("\\", "\\\\").replace("`", "\\`")


def _render_inline(node: Node, base_url: str) -> str:
    parts: List[str] = []
    for c in node.children:
        if isinstance(c, str):
            parts.append(c)
            continue
        if c.tag in DROP_TAGS:
            continue
        if c.tag == "br":
            parts.append("\n")
            continue
        inner = _render_inline(c, base_url)
        if c.tag == "a":
            href = c.attrs.get("href", "").strip()
            full = urljoin(base_url, href) if href else ""
            label = _normalize_ws(inner) or full
            if full:
                parts.append(f"[{label}]({full})")
            else:
                parts.append(label)
        elif c.tag in ("strong", "b"):
            t = _normalize_ws(inner)
            parts.append(f"**{t}**" if t else "")
        elif c.tag in ("em", "i"):
            t = _normalize_ws(inner)
            parts.append(f"*{t}*" if t else "")
        elif c.tag == "code":
            t = inner.strip()
            parts.append(f"`{t}`" if t else "")
        elif c.tag == "img":
            alt = c.attrs.get("alt", "").strip()
            src = urljoin(base_url, c.attrs.get("src", "").strip())
            if src:
                parts.append(f"![{alt}]({src})")
        else:
            parts.append(inner)
    return "".join(parts)


def _render_block(node: Node, base_url: str, lines: List[str], list_depth: int = 0):
    tag = node.tag
    if tag in DROP_TAGS:
        return
    if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
        level = int(tag[1])
        text = _normalize_ws(_render_inline(node, base_url))
        if text:
            lines.append("")
            lines.append("#" * level + " " + text)
            lines.append("")
        return
    if tag == "p":
        text = _normalize_ws(_render_inline(node, base_url))
        if text:
            lines.append("")
            lines.append(text)
            lines.append("")
        return
    if tag == "br":
        return
    if tag in ("ul", "ol"):
        ordered = tag == "ol"
        idx = 1
        for c in node.children:
            if isinstance(c, Node) and c.tag == "li":
                bullet = f"{idx}." if ordered else "-"
                # Render li inline content + nested blocks.
                inline = _normalize_ws(_render_inline(c, base_url))
                indent = "  " * list_depth
                if inline:
                    lines.append(f"{indent}{bullet} {inline}")
                # Walk nested lists.
                for cc in c.children:
                    if isinstance(cc, Node) and cc.tag in ("ul", "ol"):
                        _render_block(cc, base_url, lines, list_depth + 1)
                idx += 1
        lines.append("")
        return
    if tag == "blockquote":
        inner: List[str] = []
        for c in node.children:
            if isinstance(c, Node):
                _render_block(c, base_url, inner, list_depth)
            elif isinstance(c, str):
                t = _normalize_ws(c)
                if t:
                    inner.append(t)
        if inner:
            lines.append("")
            for ln in inner:
                if ln:
                    lines.append("> " + ln)
                else:
                    lines.append(">")
            lines.append("")
        return
    if tag == "pre":
        code = node.text()
        lines.append("")
        lines.append("```")
        for ln in code.rstrip().splitlines():
            lines.append(ln)
        lines.append("```")
        lines.append("")
        return
    if tag == "hr":
        lines.append("")
        lines.append("---")
        lines.append("")
        return
    if tag in ("table", "thead", "tbody", "tr", "td", "th"):
        # Tables: render as a simplified GFM table when we see <table>.
        if tag == "table":
            _render_table(node, base_url, lines)
        return
    if tag == "img":
        alt = node.attrs.get("alt", "").strip()
        src = urljoin(base_url, node.attrs.get("src", "").strip())
        if src:
            lines.append("")
            lines.append(f"![{alt}]({src})")
            lines.append("")
        return
    if tag == "figure":
        for c in node.children:
            if isinstance(c, Node):
                _render_block(c, base_url, lines, list_depth)
        return
    # Container — recurse.
    if tag in INLINE_TAGS or tag == "__root__" or tag in (
        "div", "section", "article", "main", "body", "html",
        "figure", "figcaption", "details", "summary",
    ):
        # If this node is purely inline, emit a paragraph.
        only_inline = all(
            isinstance(c, str) or c.tag in INLINE_TAGS or c.tag == "br"
            for c in node.children
        )
        if only_inline and tag != "__root__":
            text = _normalize_ws(_render_inline(node, base_url))
            if text:
                lines.append("")
                lines.append(text)
                lines.append("")
            return
        for c in node.children:
            if isinstance(c, Node):
                _render_block(c, base_url, lines, list_depth)
            elif isinstance(c, str):
                t = _normalize_ws(c)
                if t:
                    lines.append("")
                    lines.append(t)
                    lines.append("")
        return
    # Unknown tag — recurse blindly.
    for c in node.children:
        if isinstance(c, Node):
            _render_block(c, base_url, lines, list_depth)


def _render_table(table: Node, base_url: str, lines: List[str]):
    rows: List[List[str]] = []
    header: Optional[List[str]] = None
    for tr in table.find_all("tr"):
        cells: List[str] = []
        is_header_row = False
        for c in tr.children:
            if not isinstance(c, Node):
                continue
            if c.tag in ("td", "th"):
                if c.tag == "th":
                    is_header_row = True
                cells.append(_normalize_ws(_render_inline(c, base_url)))
        if not cells:
            continue
        if header is None and is_header_row:
            header = cells
        else:
            rows.append(cells)
    if not header and rows:
        header = rows.pop(0)
    if not header:
        return
    lines.append("")
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(["---"] * len(header)) + " |")
    for r in rows:
        # Pad/truncate to header width
        if len(r) < len(header):
            r = r + [""] * (len(header) - len(r))
        else:
            r = r[: len(header)]
        lines.append("| " + " | ".join(r) + " |")
    lines.append("")


def to_markdown(node: Node, base_url: str) -> str:
    lines: List[str] = []
    _render_block(node, base_url, lines)
    # Collapse 3+ blank lines.
    out: List[str] = []
    blank = 0
    for ln in lines:
        if ln == "":
            blank += 1
            if blank <= 1:
                out.append("")
        else:
            blank = 0
            out.append(ln.rstrip())
    return "\n".join(out).strip() + "\n"


# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------
def cmd_extract(args) -> int:
    html = _read_input(args.html_file)
    root = parse_html(html)
    base = args.base_url or args.url
    meta = extract_metadata(root, args.url)
    main = select_main(root)
    markdown = to_markdown(main, args.url)
    links = extract_links(root, args.url, base)
    nav = extract_nav_links(root, args.url, base)
    word_count = len(markdown.split())
    out = {
        "url": args.url,
        "base_url": base,
        "title": meta["title"],
        "description": meta["description"],
        "canonical": meta["canonical"],
        "lang": meta["lang"],
        "image": meta["image"],
        "site_name": meta["site_name"],
        "word_count": word_count,
        "markdown": markdown,
        "links": [{"url": u, "label": l} for u, l in links],
        "nav": [{"url": u, "label": l} for u, l in nav],
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


def cmd_crawl_links(args) -> int:
    html = _read_input(args.html_file)
    root = parse_html(html)
    base = args.base_url
    url = args.url or base
    for u, _ in extract_links(root, url, base):
        sys.stdout.write(u + "\n")
    return 0


def _read_input(path: Optional[str]) -> str:
    if not path or path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def main(argv: List[str]) -> int:
    p = argparse.ArgumentParser(description="zer0-mistakes site scraper helper")
    sub = p.add_subparsers(dest="command", required=True)

    p_ext = sub.add_parser("extract", help="Parse one HTML page → JSON")
    p_ext.add_argument("--url", required=True, help="URL the HTML was fetched from")
    p_ext.add_argument("--base-url", default="", help="Site base URL for same-host filter")
    p_ext.add_argument("html_file", nargs="?", default="-")
    p_ext.set_defaults(func=cmd_extract)

    p_lnk = sub.add_parser("crawl-links", help="List in-scope links in HTML")
    p_lnk.add_argument("--base-url", required=True)
    p_lnk.add_argument("--url", default="")
    p_lnk.add_argument("html_file", nargs="?", default="-")
    p_lnk.set_defaults(func=cmd_crawl_links)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
