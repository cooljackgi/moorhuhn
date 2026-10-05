"""Pack Blender's transparent flight renders. Requires Pillow, outside Blender."""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SIZE, COUNT, FPS = 384, 8, 10
atlas = Image.new('RGBA', (SIZE * COUNT, SIZE))
for index in range(COUNT):
    with Image.open(OUT / 'frames' / f'flight-{index:02d}.png') as image:
        frame = image.convert('RGBA')
    assert frame.size == (SIZE, SIZE)
    bounds = frame.getchannel('A').getbbox()
    assert bounds and 0 < bounds[0] < bounds[2] < SIZE and 0 < bounds[1] < bounds[3] < SIZE, bounds
    atlas.paste(frame, (SIZE * index, 0))
atlas.save(OUT / 'moorhuhn-flight.png', optimize=True)
metadata = {
    'image': 'moorhuhn-flight.png', 'frameWidth': SIZE, 'frameHeight': SIZE,
    'columns': COUNT, 'rows': 1, 'frameCount': COUNT, 'fps': FPS,
    'durationSeconds': COUNT / FPS, 'anchor': {'x': .5, 'y': .5},
    'facing': 'right', 'animation': 'Flight',
    'model': 'moorhuhn.glb', 'source': 'moorhuhn.blend',
}
(OUT / 'moorhuhn-flight.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
print('Packed and checked:', atlas.size, 'RGBA;', FPS, 'fps')
