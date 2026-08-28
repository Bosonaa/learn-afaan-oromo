#!/usr/bin/env bash
# Regenerate the PWA icons in public/icons from assets/*.svg. Needs ImageMagick.
# The PNGs are committed, so this only has to run when the SVG source changes.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/icons
convert -background none assets/icon.svg -resize 192x192 public/icons/icon-192.png
convert -background none assets/icon.svg -resize 512x512 public/icons/icon-512.png
convert -background none assets/icon.svg -resize 180x180 public/icons/apple-touch-icon.png
convert -background none assets/icon.svg -resize 32x32 public/favicon.ico
convert -background none assets/icon-maskable.svg -resize 512x512 public/icons/maskable-512.png
