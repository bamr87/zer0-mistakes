#!/usr/bin/env python3
"""Pixelate + palette-quantize PNG images to shrink file size while keeping quality.

File: scripts/features/pixelate_images.py
Purpose: Dependency-free (Python stdlib only) image optimizer for the Jekyll
         preview banners under ``assets/images/previews``. The preview art is
         AI-generated "retro pixel art / 8-bit" styling, so downsampling and
         reducing the colour palette both shrinks the files dramatically *and*
         reinforces the intended aesthetic.

Why pure stdlib: GitHub Pages / CI runners and contributor machines cannot be
assumed to have ImageMagick, ``pngquant`` or Pillow installed. The preview PNGs
are uniformly 8-bit, non-interlaced truecolour (colour type 2), which is cheap
to decode and re-encode with ``zlib`` alone.

Pipeline per image:
  1. Decode the PNG (8-bit colour types 0/2/3/4/6, non-interlaced).
  2. Pixelate: downsample to a target size (nearest or box filter).
  3. Quantize: median-cut the colours to an N-colour palette.
  4. Encode an indexed PNG-8 (+ ``tRNS`` when the source had alpha).
  5. Keep the result only when it is actually smaller than the original.

Run ``python3 pixelate_images.py --help`` for CLI usage, or
``--selftest`` to exercise the round-trip on a synthetic image.
"""

from __future__ import annotations

import argparse
import os
import struct
import sys
import zlib

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

# Channels per PNG colour type (8-bit only).
CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}


class UnsupportedPNG(Exception):
    """Raised when a PNG uses a feature this minimal decoder does not handle."""


# ---------------------------------------------------------------------------
# Decoding
# ---------------------------------------------------------------------------

def _iter_chunks(data: bytes):
    if data[:8] != PNG_SIGNATURE:
        raise UnsupportedPNG("not a PNG file")
    pos = 8
    n = len(data)
    while pos + 8 <= n:
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        ctype = data[pos + 4:pos + 8]
        start = pos + 8
        end = start + length
        if end + 4 > n:
            raise UnsupportedPNG("truncated chunk")
        yield ctype, data[start:end]
        pos = end + 4  # skip the 4-byte CRC


def _paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def _unfilter(raw: bytes, width: int, height: int, bpp: int) -> bytearray:
    """Reverse PNG scanline filtering. Returns flat per-channel byte buffer."""
    stride = width * bpp
    out = bytearray(stride * height)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        ftype = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ftype == 0:
            pass
        elif ftype == 1:  # Sub
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ftype == 2:  # Up
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:  # Average
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:  # Paeth
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                c = prev[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + _paeth(a, prev[i], c)) & 0xFF
        else:
            raise UnsupportedPNG(f"unknown filter type {ftype}")
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


class Image:
    """In-memory RGB or RGBA image with a flat ``bytearray`` of pixel data."""

    __slots__ = ("width", "height", "channels", "data")

    def __init__(self, width: int, height: int, channels: int, data: bytearray):
        self.width = width
        self.height = height
        self.channels = channels  # 3 (RGB) or 4 (RGBA)
        self.data = data


def decode_png(data: bytes) -> Image:
    """Decode an 8-bit, non-interlaced PNG into an RGB/RGBA :class:`Image`."""
    ihdr = None
    palette = None
    trns = None
    idat = bytearray()
    for ctype, chunk in _iter_chunks(data):
        if ctype == b"IHDR":
            width, height, bit_depth, color_type, comp, filt, interlace = struct.unpack(
                ">IIBBBBB", chunk
            )
            ihdr = (width, height, bit_depth, color_type, interlace)
        elif ctype == b"PLTE":
            palette = chunk
        elif ctype == b"tRNS":
            trns = chunk
        elif ctype == b"IDAT":
            idat += chunk
        elif ctype == b"IEND":
            break

    if ihdr is None:
        raise UnsupportedPNG("missing IHDR")
    width, height, bit_depth, color_type, interlace = ihdr
    if bit_depth != 8:
        raise UnsupportedPNG(f"unsupported bit depth {bit_depth}")
    if interlace != 0:
        raise UnsupportedPNG("interlaced PNG not supported")
    if color_type not in CHANNELS:
        raise UnsupportedPNG(f"unsupported colour type {color_type}")

    bpp = CHANNELS[color_type]
    flat = _unfilter(zlib.decompress(bytes(idat)), width, height, bpp)

    # Normalise to RGB (3) or RGBA (4).
    npix = width * height
    if color_type == 2:  # RGB
        return Image(width, height, 3, flat)
    if color_type == 6:  # RGBA
        return Image(width, height, 4, flat)
    if color_type == 0:  # grayscale -> RGB
        out = bytearray(npix * 3)
        for i in range(npix):
            v = flat[i]
            out[i * 3] = out[i * 3 + 1] = out[i * 3 + 2] = v
        return Image(width, height, 3, out)
    if color_type == 4:  # grayscale + alpha -> RGBA
        out = bytearray(npix * 4)
        for i in range(npix):
            v = flat[i * 2]
            out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v
            out[i * 4 + 3] = flat[i * 2 + 1]
        return Image(width, height, 4, out)
    # color_type == 3: palette index -> RGB(A)
    if palette is None:
        raise UnsupportedPNG("indexed PNG missing PLTE")
    has_alpha = trns is not None
    chan = 4 if has_alpha else 3
    out = bytearray(npix * chan)
    for i in range(npix):
        idx = flat[i]
        out[i * chan] = palette[idx * 3]
        out[i * chan + 1] = palette[idx * 3 + 1]
        out[i * chan + 2] = palette[idx * 3 + 2]
        if has_alpha:
            out[i * chan + 3] = trns[idx] if idx < len(trns) else 255
    return Image(width, height, chan, out)


# ---------------------------------------------------------------------------
# Pixelate (downsample)
# ---------------------------------------------------------------------------

def target_size(width: int, height: int, *, block=None, scale=None, max_width=None):
    """Resolve the output dimensions from the chosen pixelation knob."""
    if block:
        ow = max(1, round(width / block))
        oh = max(1, round(height / block))
    elif scale:
        ow = max(1, round(width * scale))
        oh = max(1, round(height * scale))
    elif max_width and width > max_width:
        ow = max_width
        oh = max(1, round(height * max_width / width))
    else:
        ow, oh = width, height
    return ow, oh


def downsample_nearest(img: Image, ow: int, oh: int) -> Image:
    src = img.data
    c = img.channels
    w, h = img.width, img.height
    out = bytearray(ow * oh * c)
    oi = 0
    for oy in range(oh):
        rowbase = (oy * h // oh) * w * c
        for ox in range(ow):
            si = rowbase + (ox * w // ow) * c
            out[oi:oi + c] = src[si:si + c]
            oi += c
    return Image(ow, oh, c, out)


def downsample_box(img: Image, ow: int, oh: int) -> Image:
    """Area-average downsample. Higher quality than nearest, but slower."""
    src = img.data
    c = img.channels
    w, h = img.width, img.height
    out = bytearray(ow * oh * c)
    oi = 0
    for oy in range(oh):
        sy0 = oy * h // oh
        sy1 = max(sy0 + 1, (oy + 1) * h // oh)
        for ox in range(ow):
            sx0 = ox * w // ow
            sx1 = max(sx0 + 1, (ox + 1) * w // ow)
            count = (sy1 - sy0) * (sx1 - sx0)
            sums = [0] * c
            for sy in range(sy0, sy1):
                base = (sy * w + sx0) * c
                for _ in range(sx0, sx1):
                    for ch in range(c):
                        sums[ch] += src[base + ch]
                    base += c
            for ch in range(c):
                out[oi + ch] = sums[ch] // count
            oi += c
    return Image(ow, oh, c, out)


def upscale_nearest_indices(indices: bytearray, w: int, h: int, ow: int, oh: int) -> bytearray:
    """Nearest-neighbour upscale of an index buffer (cheap; flat blocks)."""
    out = bytearray(ow * oh)
    oi = 0
    for oy in range(oh):
        rowbase = (oy * h // oh) * w
        for ox in range(ow):
            out[oi] = indices[rowbase + (ox * w // ow)]
            oi += 1
    return out


# ---------------------------------------------------------------------------
# Quantize (median cut)
# ---------------------------------------------------------------------------

def _histogram(img: Image, bits: int = 8):
    """Return ``{color_key: count}`` over all pixels.

    ``bits`` < 8 reduces colour precision (top ``bits`` per channel) before
    counting. That collapses the near-unique colours typical of AI gradient art
    into far fewer buckets, which keeps median-cut fast with no visible loss.
    Colour keys are the (reduced) ``bytes`` of each pixel's channels.
    """
    data = img.data
    c = img.channels
    hist = {}
    get = hist.get
    if bits >= 8:
        for i in range(0, len(data), c):
            key = bytes(data[i:i + c])
            hist[key] = get(key, 0) + 1
    else:
        mask = (0xFF << (8 - bits)) & 0xFF
        table = bytes((v & mask) for v in range(256))
        for i in range(0, len(data), c):
            key = bytes(data[i:i + c]).translate(table)
            hist[key] = get(key, 0) + 1
    return hist


class _Box:
    """A median-cut colour box; range metadata is cached and only recomputed
    for the two children produced by a split (never for every box each pass)."""

    __slots__ = ("entries", "score", "widest")

    def __init__(self, entries, channels):
        self.entries = entries
        self._measure(channels)

    def _measure(self, channels):
        entries = self.entries
        if len(entries) < 2:
            self.score = 0
            self.widest = 0
            return
        widest = 0
        score = -1
        for ch in range(channels):
            lo = 255
            hi = 0
            for key, _ in entries:
                v = key[ch]
                if v < lo:
                    lo = v
                if v > hi:
                    hi = v
            rng = hi - lo
            if rng > score:
                score = rng
                widest = ch
        self.score = score
        self.widest = widest


def median_cut(hist: dict, max_colors: int, channels: int):
    """Median-cut quantization. Returns (palette, color_key->index map)."""
    entries = list(hist.items())
    if len(entries) <= max_colors:
        palette = [tuple(key) for key, _ in entries]
        cmap = {key: idx for idx, (key, _) in enumerate(entries)}
        return palette, cmap

    boxes = [_Box(entries, channels)]
    while len(boxes) < max_colors:
        # Pick the splittable box with the widest single-channel spread.
        target = max(boxes, key=lambda b: b.score)
        if target.score <= 0:
            break
        boxes.remove(target)
        ch = target.widest
        ent = target.entries
        ent.sort(key=lambda kc: kc[0][ch])
        total = sum(cnt for _, cnt in ent)
        acc = 0
        split = 1
        half = total / 2
        for i in range(len(ent) - 1):
            acc += ent[i][1]
            if acc >= half:
                split = i + 1
                break
        boxes.append(_Box(ent[:split], channels))
        boxes.append(_Box(ent[split:], channels))

    palette = []
    cmap = {}
    for idx, box in enumerate(boxes):
        sums = [0] * channels
        total = 0
        for key, cnt in box.entries:
            for ch in range(channels):
                sums[ch] += key[ch] * cnt
            total += cnt
            cmap[key] = idx
        palette.append(tuple(sums[ch] // total for ch in range(channels)))
    return palette, cmap


# ---------------------------------------------------------------------------
# Encoding (PNG-8 indexed)
# ---------------------------------------------------------------------------

def _chunk(ctype: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + ctype
        + data
        + struct.pack(">I", zlib.crc32(ctype + data) & 0xFFFFFFFF)
    )


def encode_png8(width, height, indices: bytearray, palette, alpha=None, level=9) -> bytes:
    plte = bytearray()
    for color in palette:
        plte += bytes((color[0], color[1], color[2]))
    # Pad palette to power-of-two entries is not required; PNG allows any count.

    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None) — best for indexed data
        raw += indices[y * width:(y + 1) * width]
    idat = zlib.compress(bytes(raw), level)

    out = bytearray(PNG_SIGNATURE)
    out += _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 3, 0, 0, 0))
    out += _chunk(b"PLTE", bytes(plte))
    if alpha is not None:
        # tRNS may be shorter than the palette; trailing 255s are implied opaque.
        trns = bytes(alpha)
        trimmed = trns.rstrip(b"\xff")
        out += _chunk(b"tRNS", trimmed if trimmed else b"\x00")
    out += _chunk(b"IDAT", idat)
    out += _chunk(b"IEND", b"")
    return bytes(out)


# ---------------------------------------------------------------------------
# High-level pixelate
# ---------------------------------------------------------------------------

def pixelate_png(
    data: bytes,
    *,
    colors=256,
    block=None,
    scale=None,
    max_width=1024,
    box_filter=False,
    upscale=False,
    bits=6,
    level=9,
):
    """Pixelate + quantize PNG ``data``. Returns the optimized PNG bytes."""
    img = decode_png(data)
    ow, oh = target_size(img.width, img.height, block=block, scale=scale, max_width=max_width)

    if (ow, oh) != (img.width, img.height):
        small = downsample_box(img, ow, oh) if box_filter else downsample_nearest(img, ow, oh)
    else:
        small = img

    colors = max(2, min(256, colors))
    bits = max(1, min(8, bits))
    hist = _histogram(small, bits)
    palette, cmap = median_cut(hist, colors, small.channels)

    c = small.channels
    indices = bytearray(ow * oh)
    src = small.data
    if bits >= 8:
        for p, i in enumerate(range(0, len(src), c)):
            indices[p] = cmap[bytes(src[i:i + c])]
    else:
        mask = (0xFF << (8 - bits)) & 0xFF
        table = bytes((v & mask) for v in range(256))
        for p, i in enumerate(range(0, len(src), c)):
            indices[p] = cmap[bytes(src[i:i + c]).translate(table)]

    out_w, out_h = ow, oh
    if upscale and (img.width, img.height) != (ow, oh):
        indices = upscale_nearest_indices(indices, ow, oh, img.width, img.height)
        out_w, out_h = img.width, img.height

    alpha = None
    if c == 4:
        alpha = [color[3] for color in palette]
        palette = [color[:3] for color in palette]

    return encode_png8(out_w, out_h, indices, palette, alpha=alpha, level=level)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _human(n: float) -> str:
    size = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f}{unit}" if unit == "B" else f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}GB"


def _gather_targets(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, _dirs, names in os.walk(p):
                for name in names:
                    if name.lower().endswith(".png"):
                        files.append(os.path.join(root, name))
        elif p.lower().endswith(".png"):
            files.append(p)
    return sorted(set(files))


def process_file(path, args):
    """Process one file. Returns (status, original_size, new_size)."""
    original = os.path.getsize(path)
    with open(path, "rb") as fh:
        data = fh.read()
    try:
        out = pixelate_png(
            data,
            colors=args.colors,
            block=args.block,
            scale=args.scale,
            max_width=args.max_width,
            box_filter=(args.filter == "box"),
            upscale=args.upscale,
            bits=args.bits,
            level=args.level,
        )
    except UnsupportedPNG as exc:
        return ("unsupported", original, original, str(exc))

    new_size = len(out)
    if new_size >= original and not args.force:
        return ("nogain", original, new_size, "")

    if args.dry_run:
        return ("would", original, new_size, "")

    dest = path
    if args.output_dir:
        os.makedirs(args.output_dir, exist_ok=True)
        dest = os.path.join(args.output_dir, os.path.basename(path))
    if args.backup and dest == path:
        backup = path + ".orig"
        if not os.path.exists(backup):
            with open(backup, "wb") as bf:
                bf.write(data)
    with open(dest, "wb") as fh:
        fh.write(out)
    return ("done", original, new_size, "")


def _process_star(packed):
    """Top-level wrapper so ``ProcessPoolExecutor`` can pickle the call."""
    path, args = packed
    try:
        return (path,) + process_file(path, args)
    except Exception as exc:  # never let one bad file abort the batch
        size = os.path.getsize(path) if os.path.exists(path) else 0
        return (path, "error", size, size, str(exc))


def build_parser():
    p = argparse.ArgumentParser(
        description="Pixelate + palette-quantize PNGs to shrink them while keeping quality.",
    )
    p.add_argument("paths", nargs="*", help="PNG files and/or directories to process")
    p.add_argument("--colors", type=int, default=256, help="palette size 2-256 (default: 256)")
    p.add_argument("--bits", type=int, default=6,
                   help="colour precision 1-8 used while quantizing (default: 6; "
                        "lower = faster + smaller, may band smooth gradients)")
    size = p.add_mutually_exclusive_group()
    size.add_argument("--max-width", type=int, default=1024,
                      help="downscale so width <= N, preserving aspect (default: 1024)")
    size.add_argument("--scale", type=float, help="scale factor, e.g. 0.5")
    size.add_argument("--block", type=int,
                      help="pixel block size: average NxN source pixels per output pixel")
    p.add_argument("--filter", choices=("nearest", "box"), default="nearest",
                   help="downsample filter (default: nearest; box = higher quality, slower)")
    p.add_argument("--upscale", action="store_true",
                   help="restore original WxH (chunky pixels) instead of storing reduced size")
    p.add_argument("--level", type=int, default=9, help="zlib compression level 0-9 (default: 9)")
    p.add_argument("--output-dir", help="write outputs here instead of in place")
    p.add_argument("-j", "--jobs", type=int, default=1,
                   help="parallel worker processes (default: 1)")
    p.add_argument("--backup", action="store_true", help="keep <file>.orig when writing in place")
    p.add_argument("--force", action="store_true", help="write even if the result is not smaller")
    p.add_argument("-n", "--dry-run", action="store_true", help="report savings without writing")
    p.add_argument("-q", "--quiet", action="store_true", help="only print the summary line")
    p.add_argument("--selftest", action="store_true", help="run an internal round-trip test and exit")
    return p


def selftest():
    """Encode a synthetic gradient PNG, pixelate it, and verify it decodes."""
    w = h = 64
    body = bytearray()
    for y in range(h):
        body.append(0)
        for x in range(w):
            body += bytes(((x * 4) % 256, (y * 4) % 256, ((x + y) * 2) % 256))
    src = bytearray(PNG_SIGNATURE)
    src += _chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    src += _chunk(b"IDAT", zlib.compress(bytes(body), 9))
    src += _chunk(b"IEND", b"")

    out = pixelate_png(bytes(src), colors=16, block=4, max_width=None)
    decoded = decode_png(out)
    assert decoded.width == 16 and decoded.height == 16, (decoded.width, decoded.height)
    assert decoded.channels == 3
    # Verify the encoder produced a valid indexed PNG.
    assert out[:8] == PNG_SIGNATURE
    print("selftest OK: 64x64 RGB -> %s pixelated PNG-8 (%s)" % (
        f"{decoded.width}x{decoded.height}", _human(len(out))))


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.selftest:
        selftest()
        return 0
    if not args.paths:
        print("error: no paths given (use --help)", file=sys.stderr)
        return 2

    targets = _gather_targets(args.paths)
    if not targets:
        print("No .png files found in the given paths.", file=sys.stderr)
        return 1

    work = [(t, args) for t in targets]
    if args.jobs and args.jobs > 1 and len(targets) > 1:
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor(max_workers=args.jobs) as ex:
            results = list(ex.map(_process_star, work))  # map preserves order
    else:
        results = [_process_star(w) for w in work]

    total_before = total_after = 0
    written = skipped = unsupported = errored = 0
    for path, status, before, after, *rest in results:
        note = rest[0] if rest else ""
        total_before += before
        if status in ("done", "would"):
            total_after += after
            written += 1
            verb = "would write" if status == "would" else "wrote"
            pct = (1 - after / before) * 100 if before else 0
            if not args.quiet:
                print(f"  {verb}: {os.path.basename(path):50} "
                      f"{_human(before):>8} -> {_human(after):>8}  (-{pct:.0f}%)")
        elif status == "nogain":
            total_after += before
            skipped += 1
            if not args.quiet:
                print(f"  skip (no gain): {os.path.basename(path):42} {_human(before):>8}")
        elif status == "unsupported":
            total_after += before
            unsupported += 1
            if not args.quiet:
                print(f"  skip (unsupported: {note}): {os.path.basename(path)}")
        else:  # error
            total_after += before
            errored += 1
            print(f"  ERROR: {os.path.basename(path)}: {note}", file=sys.stderr)

    saved = total_before - total_after
    pct = (saved / total_before * 100) if total_before else 0
    print("")
    print(f"Processed {len(targets)} file(s): "
          f"{written} optimized, {skipped} no-gain, "
          f"{unsupported} unsupported, {errored} errored")
    print(f"Total: {_human(total_before)} -> {_human(total_after)}  "
          f"(saved {_human(saved)}, -{pct:.0f}%)"
          + ("  [dry run]" if args.dry_run else ""))
    return 1 if errored else 0


if __name__ == "__main__":
    raise SystemExit(main())
