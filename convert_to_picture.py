import re
from pathlib import Path

ROOT = Path(__file__).parent
HTML_FILES = list(ROOT.glob("*.html"))


def convert_img_to_picture(html: str) -> str:
    def replace(match: re.Match) -> str:
        tag = match.group(0)

        src_match = re.search(r'src=["\'](\./assets/[^"\']+?\.(?:webp|png|jpg|jpeg|gif))(?:\?[^"\']*)?["\']', tag)
        mobile_match = re.search(r'data-mobile-src=["\']([^"\']+)["\']', tag)

        if not src_match or not mobile_match:
            return tag

        desktop_src = src_match.group(1)
        mobile_src = mobile_match.group(1)

        # Remove data-mobile-src from img tag
        img_without_mobile = re.sub(r'\s*data-mobile-src=["\'][^"\']+["\']', '', tag)

        # Build picture wrapper
        picture = f'<picture><source media="(max-width: 767px)" srcset="{mobile_src}">{img_without_mobile}</picture>'
        return picture

    return re.sub(r'<img[^>]*data-mobile-src[^>]*>', replace, html)


def main():
    for path in HTML_FILES:
        html = path.read_text(encoding="utf-8")
        new_html = convert_img_to_picture(html)
        if new_html != html:
            path.write_text(new_html, encoding="utf-8")
            print(f"Updated: {path.name}")
        else:
            print(f"Skipped: {path.name}")


if __name__ == "__main__":
    main()
