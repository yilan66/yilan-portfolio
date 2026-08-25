#!/usr/bin/env python3
"""Generate mobile-optimized images and update HTML references."""

import os
import re
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
MAX_MOBILE_LONG_EDGE = 1200
MOBILE_QUALITY = 82
MIN_SIZE_TO_OPTIMIZE_BYTES = 200 * 1024  # 200 KB
VERSION = "perf_mobile_img_1"


def run(cmd, check=True):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{result.stderr}")
    return result


def get_image_dimensions(path):
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "json", path,
    ]
    result = run(cmd, check=False)
    if result.returncode != 0:
        return None, None
    streams = __import__("json").loads(result.stdout).get("streams", [])
    if not streams:
        return None, None
    return streams[0].get("width"), streams[0].get("height")


def generate_mobile_image(src, dst):
    width, height = get_image_dimensions(src)
    if width and height:
        long_edge = max(width, height)
        scale = min(MAX_MOBILE_LONG_EDGE / long_edge, 1.0)
        if scale < 1.0:
            new_long = int(long_edge * scale)
            resize_arg = f"{new_long}>"
        else:
            resize_arg = None
    else:
        resize_arg = f"{MAX_MOBILE_LONG_EDGE}>"

    # Prefer cwebp if source is already WebP/PNG/JPG for best quality/size.
    cmd = ["cwebp", "-q", str(MOBILE_QUALITY), "-metadata", "none"]
    if resize_arg:
        cmd += ["-resize", str(new_long), "0"]
    cmd += [src, "-o", dst]

    result = run(cmd, check=False)
    if result.returncode != 0:
        # Fallback to ImageMagick convert
        cmd = ["convert", src, "-quality", str(MOBILE_QUALITY)]
        if resize_arg:
            cmd += ["-resize", resize_arg]
        cmd += [dst]
        run(cmd)


def should_optimize(path, size):
    if size < MIN_SIZE_TO_OPTIMIZE_BYTES:
        return False
    ext = os.path.splitext(path)[1].lower()
    return ext in (".webp", ".jpg", ".jpeg", ".png")


def update_html_file(path, mobile_map):
    with open(path, "r", encoding="utf-8") as fh:
        html = fh.read()

    original = html

    def replace_img_tag(match):
        tag = match.group(0)
        src_match = re.search(r'src=["\'](\./assets/[^"\']+?\.(?:webp|png|jpg|jpeg|gif))(?:\?[^"\']*)?["\']', tag)
        if not src_match:
            return tag

        src = src_match.group(1)
        clean_src = src.split("?")[0].lstrip("./")
        if clean_src not in mobile_map:
            return tag

        mobile_src = mobile_map[clean_src] + f"?v={VERSION}"

        # Add data-mobile-src if not present
        if 'data-mobile-src=' not in tag:
            tag = tag.replace(src_match.group(0), f'{src_match.group(0)} data-mobile-src="{mobile_src}"')
        else:
            # Update existing data-mobile-src
            tag = re.sub(
                r'data-mobile-src=["\'][^"\']+["\']',
                f'data-mobile-src="{mobile_src}"',
                tag,
            )

        return tag

    html = re.sub(r'<img[^>]+>', replace_img_tag, html)

    if html != original:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)
        return True
    return False


def main():
    html_files = [f for f in os.listdir(BASE) if f.endswith(".html")]

    # Collect all image references
    image_refs = {}
    for page in html_files:
        with open(os.path.join(BASE, page), "r", encoding="utf-8") as fh:
            html = fh.read()
        refs = re.findall(
            r'<img[^>]+src=["\'](\./assets/[^"\']+?\.(?:webp|png|jpg|jpeg|gif))(?:\?[^"\']*)?["\']',
            html,
        )
        for ref in refs:
            clean = ref.split("?")[0].lstrip("./")
            image_refs[clean] = image_refs.get(clean, 0) + 1

    # Generate mobile images
    mobile_map = {}
    total = len(image_refs)
    for idx, clean_src in enumerate(sorted(image_refs.keys()), 1):
        src_path = os.path.join(BASE, clean_src)
        if not os.path.exists(src_path):
            print(f"[{idx}/{total}] SKIP: {clean_src} not found")
            continue

        size = os.path.getsize(src_path)
        if not should_optimize(src_path, size):
            print(f"[{idx}/{total}] SKIP: {clean_src} ({size/1024:.0f} KB) too small")
            continue

        base, ext = os.path.splitext(clean_src)
        mobile_name = base + "-mobile.webp"
        mobile_path = os.path.join(BASE, mobile_name)

        print(f"[{idx}/{total}] GENERATE {mobile_name} from {clean_src} ({size/1024:.0f} KB)")
        try:
            generate_mobile_image(src_path, mobile_path)
            mobile_size = os.path.getsize(mobile_path)
            mobile_map[clean_src] = "./" + mobile_name
            print(f"  -> {mobile_size/1024:.0f} KB ({mobile_size/size:.0%})")
        except Exception as e:
            print(f"  -> ERROR: {e}", file=sys.stderr)

    # Update HTML files
    updated = []
    for page in html_files:
        if update_html_file(os.path.join(BASE, page), mobile_map):
            updated.append(page)

    print(f"\nGenerated {len(mobile_map)} mobile images")
    print(f"Updated {len(updated)} HTML files:")
    for page in updated:
        print(f"  - {page}")


if __name__ == "__main__":
    main()
