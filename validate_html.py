import os
import sys
from html.parser import HTMLParser

errors = []


def check_asset(path_str: str):
    if path_str.startswith("http://") or path_str.startswith("https://"):
        return
    file_path = os.path.join(os.path.dirname(__file__), path_str)
    if not os.path.exists(file_path):
        errors.append(f"Missing asset: {path_str}")


class Validator(HTMLParser):
    void_elements = {
        "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr",
    }

    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.void_elements:
            self.stack.append(tag)
        if tag in {"script", "link"}:
            for attr, value in attrs:
                if (tag == "script" and attr == "src") or (tag == "link" and attr == "href"):
                    check_asset(value)

    def handle_endtag(self, tag):
        if not self.stack:
            errors.append(f"Unexpected closing tag: {tag}")
            return
        last = self.stack.pop()
        if last != tag:
            errors.append(f"Mismatched tag: expected </{last}> got </{tag}>")


if __name__ == "__main__":
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    parser = Validator()
    try:
        parser.feed(content)
        parser.close()
    except Exception as e:
        errors.append(str(e))

    if parser.stack:
        errors.append("Unclosed tags: " + ", ".join(parser.stack))

    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        sys.exit(1)
    print("index.html looks valid and all assets exist.")
