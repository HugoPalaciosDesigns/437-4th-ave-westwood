"""
Build the Artifact-flavoured copy of the site.

The Artifact host wraps the file it is given in its own
<!doctype><head>...</head><body> skeleton, so it must be handed page
CONTENT only. This takes the standalone index.html (the source of truth)
and emits build/artifact.html: the <title>, the stylesheet <link>s and
everything inside <body>, in that order.

Run:  python build_artifact.py
"""

import io
import os
import re
import json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "index.html")
OUT_DIR = os.path.join(HERE, "build")
OUT = os.path.join(OUT_DIR, "artifact.html")

html = io.open(SRC, encoding="utf-8").read()

head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

title = re.search(r"<title>.*?</title>", head, re.S).group(0)
links = re.findall(r'<link rel="(?:stylesheet|preconnect)"[^>]*>', head)

os.makedirs(OUT_DIR, exist_ok=True)
io.open(OUT, "w", encoding="utf-8").write(
    title + "\n" + "\n".join(links) + "\n" + body.strip() + "\n"
)

# Manifest of every supporting file the page references, as
# {published path: source path} for the Artifact tool's `files` argument.
files = {"styles.css": "styles.css", "app.js": "app.js"}
for root, _dirs, names in os.walk(os.path.join(HERE, "img")):
    for n in sorted(names):
        rel = os.path.relpath(os.path.join(root, n), HERE).replace("\\", "/")
        files[rel] = rel

io.open(os.path.join(OUT_DIR, "files.json"), "w", encoding="utf-8").write(
    json.dumps(files, indent=1)
)

total = sum(os.path.getsize(os.path.join(HERE, v)) for v in files.values())
print("wrote", os.path.relpath(OUT, HERE), "-", len(open(OUT, 'rb').read()), "bytes")
print("supporting files:", len(files), "-", round(total / 1048576, 2), "MB")
