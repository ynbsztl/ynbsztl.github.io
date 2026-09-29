"""Generate web JPEGs and EXIF data: python3 scripts/build_photography.py SOURCE SLUG."""
import argparse
import json
import re
from datetime import datetime
from fractions import Fraction
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def build(source, slug):
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        raise ValueError('Use a lowercase, hyphen-separated slug')
    photos = []
    destination = ROOT / 'assets/photography' / slug
    destination.mkdir(parents=True, exist_ok=True)
    for path in sorted(source.iterdir()):
        if path.suffix.lower() not in ('.jpg', '.jpeg'):
            continue
        with Image.open(path) as original:
            exif = original.getexif()
            details = exif.get_ifd(34665)
            taken = details.get(36867)
            taken = datetime.strptime(taken, '%Y:%m:%d %H:%M:%S').isoformat() if taken else None
            exposure = details.get(33434)
            shutter = str(Fraction(float(exposure)).limit_denominator(100000)) + 's' if exposure else None
            aperture = details.get(33437)
            focal = details.get(37386)
            photo = ImageOps.exif_transpose(original).convert('RGB')
            # New images contain no original EXIF/GPS; retain color profile if present.
            profile = original.info.get('icc_profile')
            for label, size in [('small', 900), ('large', 2000)]:
                resized = photo.copy()
                resized.thumbnail((size, size))
                options = {'quality': 87, 'optimize': True, 'progressive': True}
                if profile:
                    options['icc_profile'] = profile
                resized.save(destination / f'{path.stem}-{label}.jpg', **options)
            photos.append({'id': path.stem, 'width': photo.width, 'height': photo.height,
                           'taken': taken, 'camera': exif.get(272), 'lens': details.get(42036),
                           'iso': details.get(34855), 'shutter': shutter,
                           'aperture': f'f/{float(aperture):g}' if aperture else None,
                           'focal': f'{float(focal):g}mm' if focal else None,
                           'small': f'/assets/photography/{slug}/{path.stem}-small.jpg',
                           'large': f'/assets/photography/{slug}/{path.stem}-large.jpg'})
    if not photos:
        raise ValueError('No JPEG files found')
    photos.sort(key=lambda p: (p['taken'] or '', p['id']))
    target = ROOT / '_data/photography' / f'{slug}.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + '\n')
    print(f'Generated {len(photos)} photos; first capture: {photos[0]["taken"]}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('slug')
    args = parser.parse_args()
    build(args.source, args.slug)
