
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / 'Images'
PHOTOGRAPHY_HTML = ROOT / 'photography.html'

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.BMP', '.TIF', '.TIFF'}


def find_images(images_dir: Path):
    images = []
    for root, dirs, files in os.walk(images_dir):
        dirs.sort()
        files.sort()
        for f in files:
            if Path(f).suffix in IMAGE_EXTS:
                full = Path(root) / f
                rel = full.relative_to(ROOT).as_posix()
                images.append(rel)
    return images


def generate_img_tags(image_paths):
    lines = []
    for p in image_paths:
        alt = Path(p).name
        # Keep the same path string (spaces preserved)
        lines.append(f'        <img src="{p}" alt="{alt}">')
    return '\n'.join(lines)


def replace_gallery(html_path: Path, new_inner_html: str):
    text = html_path.read_text(encoding='utf-8')

    start_tag = '<div class="gallery">'
    start_idx = text.find(start_tag)
    if start_idx == -1:
        print('No <div class="gallery"> block found in', html_path)
        return False

    div_open_pos = start_idx + len(start_tag)
    end_idx = text.find('</div>', div_open_pos)
    if end_idx == -1:
        print('Could not find closing </div> for gallery in', html_path)
        return False

    before = text[:div_open_pos]
    after = text[end_idx:]
    replacement = before + '\n' + new_inner_html + '\n    ' + after.lstrip()

    html_path.write_text(replacement, encoding='utf-8')
    return True


def main():
    if not IMAGES_DIR.exists():
        print('Images directory not found at', IMAGES_DIR)
        sys.exit(1)
    if not PHOTOGRAPHY_HTML.exists():
        print('photography.html not found at', PHOTOGRAPHY_HTML)
        sys.exit(1)

    images = find_images(IMAGES_DIR)
    print(f'Found {len(images)} images')
    img_html = generate_img_tags(images)
    ok = replace_gallery(PHOTOGRAPHY_HTML, img_html)
    if ok:
        print('photography.html updated successfully')
    else:
        print('Failed to update photography.html')


if __name__ == '__main__':
    main()

