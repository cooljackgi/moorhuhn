"""Render the editable Blender model into transparent game-ready frames."""
import bpy
from pathlib import Path
OUT = Path(__file__).resolve().parent
scene = bpy.data.scenes['Moorhuhn_Asset']
bpy.context.window.scene = scene
scene.render.filepath = str(OUT/'moorhuhn-preview.png')
scene.frame_set(4)
bpy.ops.render.render(write_still=True)
scene.render.resolution_x = 384
scene.render.resolution_y = 384
scene.cycles.samples = 24
(OUT/'frames').mkdir(exist_ok=True)
for i,frame in enumerate(range(1,25,3)):
    scene.frame_set(frame)
    scene.render.filepath = str(OUT/'frames'/('flight-%02d.png' % i))
    bpy.ops.render.render(write_still=True)
print('MOORHUHN_RENDER_COMPLETE')
