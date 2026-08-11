from __future__ import annotations

import argparse
from pathlib import Path

import pypdfium2 as pdfium


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--scale", type=float, default=2.0)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(args.pdf)
    for index, page in enumerate(document, start=1):
        image = page.render(scale=args.scale).to_pil()
        image.save(args.output_dir / f"page-{index:02d}.png", optimize=True)


if __name__ == "__main__":
    main()
