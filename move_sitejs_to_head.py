import re
from pathlib import Path

ROOT = Path(__file__).parent
HTML_FILES = list(ROOT.glob("*.html"))
OLD_SCRIPT = '<script src="./site.js?v=perf_mobile_img_2"></script>'
NEW_SCRIPT = '<script src="./site.js?v=perf_mobile_img_3" defer></script>'


def move_script_to_head(html: str) -> str:
    if OLD_SCRIPT not in html:
        return html

    # Remove existing script tag from body
    html = html.replace(OLD_SCRIPT, "")

    # Insert after stylesheet in head
    html = html.replace(
        '<link rel="stylesheet" href="./styles.css?v=hero_interactive_1" />',
        '<link rel="stylesheet" href="./styles.css?v=hero_interactive_1" />\n    ' + NEW_SCRIPT,
    )
    return html


for path in HTML_FILES:
    html = path.read_text(encoding="utf-8")
    new_html = move_script_to_head(html)
    if new_html != html:
        path.write_text(new_html, encoding="utf-8")
        print(f"Updated: {path.name}")
    else:
        print(f"Skipped: {path.name}")
