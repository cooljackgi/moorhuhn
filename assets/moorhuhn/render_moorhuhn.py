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
# A calm peeking pose: tucked wings and feet, separate from the flying sprites.
scene.frame_set(1)
root = scene.objects['Moorhuhn_ROOT']
root.location = (0, 0, 0)
root.rotation_euler = (0, 0, 0)
for side, name in [(-1, 'Wing_near_PIVOT'), (1, 'Wing_far_PIVOT')]:
    wing = scene.objects[name]
    wing.rotation_euler = (side * -1.2, 0, 0)
    wing.scale = (.8, .5, .8)
for name in ['Leg_-1_PIVOT', 'Leg_1_PIVOT']:
    scene.objects[name].rotation_euler = (0, 0, 0)
scene.render.filepath = str(OUT/'moorhuhn-hidden.png')
bpy.ops.render.render(write_still=True)
print('MOORHUHN_RENDER_COMPLETE')
