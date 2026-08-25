import re
from pathlib import Path

ROOT = Path(__file__).parent
OLD_VERSION = "perf_mobile_img_1"
NEW_VERSION = "perf_mobile_img_2"

for path in ROOT.glob("*.html"):
    html = path.read_text(encoding="utf-8")
    if OLD_VERSION in html:
        html = html.replace(OLD_VERSION, NEW_VERSION)
        path.write_text(html, encoding="utf-8")
        print(f"Updated: {path.name}")
