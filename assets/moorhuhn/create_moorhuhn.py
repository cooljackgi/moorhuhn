"""Rebuild the original game character in Blender 4.4. Run with Blender Python."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)
previous = bpy.data.scenes.get('Moorhuhn_Asset')
if previous:
    for obj in list(previous.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(previous)
previous_collection = bpy.data.collections.get('Moorhuhn_Character')
if previous_collection:
    bpy.data.collections.remove(previous_collection)
scene = bpy.data.scenes.new('Moorhuhn_Asset')
bpy.context.window.scene = scene
collection = bpy.data.collections.new('Moorhuhn_Character')
scene.collection.children.link(collection)

def material(name, color, roughness=.68):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Specular IOR Level'].default_value = .25
    return m

brown = material('Feathers • warm chestnut', (.28, .055, .015))
gold = material('Feathers • caramel', (.68, .20, .035))
cream = material('Belly • honey cream', (.95, .58, .14))
dark = material('Tail • deep brown', (.12, .025, .008))
red = material('Comb • poppy red', (.85, .008, .030), .52)
yellow = material('Beak and feet • marigold', (1, .42, .008), .52)
iris = material('Eyes • emerald iris', (.012, .20, .12), .38)
coral = material('Cheeks • coral', (.95, .12, .055), .75)
white = material('Eyes • warm ivory', (1, .97, .87), .3)
black = material('Pupils • espresso', (.012, .008, .006), .22)
highlight = material('Eye highlights', (1, 1, 1), .2)

def move_collection(obj):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)

def empty(name, loc, parent=None):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.location = loc
    obj.parent = parent
    obj.empty_display_type = 'PLAIN_AXES'
    return obj

root = empty('Moorhuhn_ROOT', (0, 0, 0))
root['asset'] = 'Original cartoon marsh chicken for the Moorhuhn browser game'
root['forward_axis'] = '+X; up +Z'

def ellipsoid(name, loc, scale, mat, parent=root, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16)
    obj = bpy.context.object
    obj.name = name
    move_collection(obj)
    obj.parent = parent
    obj.location = loc
    obj.scale = scale
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def capsule(name, start, end, radius, mat, parent=root):
    a, b = Vector(start), Vector(end)
    obj = ellipsoid(name, (a+b)/2, (radius, radius, (b-a).length/2+radius), mat, parent)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return obj

skin_parts = [
    ellipsoid('Body', (0, 0, 1.7), (.83, .57, .66), gold),
    ellipsoid('Breast', (.34, -.01, 1.66), (.58, .575, .55), gold),
    ellipsoid('Neck', (.57, 0, 2.13), (.35, .35, .56), gold, rot=(0, -.23, 0)),
    ellipsoid('Head', (.73, 0, 2.57), (.47, .405, .47), gold),
]
bpy.ops.object.select_all(action='DESELECT')
for obj in skin_parts:
    obj.select_set(True)
skin = skin_parts[0]
bpy.context.view_layer.objects.active = skin
bpy.ops.object.join()
skin.name = 'Body_Neck_Head_Continuous'
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
remesh = skin.modifiers.new('Continuous soft silhouette', 'REMESH')
remesh.mode = 'VOXEL'
remesh.voxel_size = .035
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth = skin.modifiers.new('Soft contours', 'SMOOTH')
smooth.factor = 1.0
smooth.iterations = 5
bpy.ops.object.modifier_apply(modifier=smooth.name)
for polygon in skin.data.polygons:
    polygon.use_smooth = True
# A fitted patch follows the body surface without intersecting spheres.
vertices = [(.32,-.95,1.52)]
faces = []
segments, rings = 64, 8
for ring in range(1,rings+1):
    for i in range(segments):
        angle = 2*math.pi*i/segments
        vertices.append((.32+.38*ring/rings*math.cos(angle),-.95,
                         1.52+.36*ring/rings*math.sin(angle)))
for i in range(segments):
    faces.append((0,1+i,1+(i+1)%segments))
for ring in range(1,rings):
    a=1+(ring-1)*segments
    b=1+ring*segments
    for i in range(segments):
        j=(i+1)%segments
        faces.append((a+i,b+i,b+j,a+j))
mesh=bpy.data.meshes.new('Fitted_Belly_Mesh')
mesh.from_pydata(vertices,[],faces)
mesh.update()
patch=bpy.data.objects.new('Cream_Belly',mesh)
collection.objects.link(patch)
patch.parent=root
mesh.materials.append(cream)
wrap=patch.modifiers.new('Fitted to belly','SHRINKWRAP')
wrap.target=skin
wrap.wrap_method='PROJECT'
wrap.use_project_y=True
wrap.use_positive_direction=True
wrap.use_negative_direction=False
wrap.offset=.009
for polygon in mesh.polygons:
    polygon.use_smooth=True
ellipsoid('Cheek', (.73, -.365, 2.40), (.15, .06, .11), coral)

# Three floppy rounded comb lobes, rather than a sharp rooster crest.
for i, (x, z, tilt) in enumerate([(.34, 3.04, -.50), (.61, 3.18, -.30), (.89, 3.13, -.08)]):
    ellipsoid('Comb_%d' % i, (x, 0, z), (.17, .12, .28), red, rot=(0, tilt, 0))
ellipsoid('Comb_Base', (.65, 0, 2.94), (.35, .125, .10), red)
ellipsoid('Wattle', (1.02, -.035, 2.18), (.105, .14, .25), red, rot=(0, -.15, 0))

# Tapered rounded upper and lower bill. Point toward +X.
def bill(name, loc, radius, length, mat, flatten):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=radius, radius2=.028, depth=length)
    obj = bpy.context.object
    obj.name = name
    move_collection(obj)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler[1] = math.pi/2
    obj.scale.x = flatten
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new('Rounded bill edges', 'BEVEL')
    bevel.width = .055
    bevel.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

bill('Upper_Beak', (1.25, -.01, 2.49), .22, .52, yellow, .60)
bill('Lower_Beak', (1.23, -.01, 2.36), .16, .39, yellow, .48)
for side in [-1, 1]:
    y = side*.345
    ellipsoid('Eye_%s' % side, (.90, y, 2.69), (.245, .145, .29), white)
    ellipsoid('Iris_%s' % side, (1.003, side*.460, 2.70), (.133, .035, .177), iris)
    ellipsoid('Pupil_%s' % side, (1.025, side*.490, 2.70), (.083, .028, .125), black)
    ellipsoid('Glint_%s' % side, (1.04, side*.515, 2.757), (.031, .012, .039), highlight)
    brow_z = (3.00, 2.92) if side == -1 else (2.94, 3.02)
    capsule('Brow_%s' % side, (.76, side*.410, brow_z[0]), (1.04, side*.405, brow_z[1]), .043, dark)
    ellipsoid('Nostril_%s' % side, (1.28, side*.123, 2.55), (.037, .018, .021), dark)

for i, (end, width, mat) in enumerate([
    ((-1.57, -.05, 2.47), .16, dark),
    ((-1.61, .12, 2.17), .19, brown),
    ((-1.45, .29, 1.91), .17, gold),
    ((-1.24, -.21, 2.58), .135, brown),
]):
    capsule('Tail_Feather_%d' % i, (-.58, .03, 1.85), end, width, mat)

wings = []
for side in [-1, 1]:
    pivot = empty('Wing_%s_PIVOT' % ('near' if side == -1 else 'far'), (-.14, side*.39, 1.93), root)
    wings.append(pivot)
    ellipsoid('Wing_Cover_%s' % side, (-.03, side*.36, -.05), (.48, .53, .17), gold, pivot)
    for i in range(5):
        x = -.38 + i*.17
        tip = (x-.10, side*(1.01-abs(i-2)*.08), -.09)
        capsule('Wing_%s_Feather_%d' % (side,i), (x*.5, side*.20, 0), tip, .115,
                [dark,brown,brown,gold,brown][i], pivot)

legs = []
for side in [-1, 1]:
    pivot = empty('Leg_%s_PIVOT' % side, (.04, side*.24, 1.20), root)
    legs.append(pivot)
    capsule('Leg_%s' % side, (0,0,0), (.10,0,-.46), .056, yellow, pivot)
    capsule('Foot_%s' % side, (.10,0,-.46), (.34,0,-.56), .060, yellow, pivot)
    for i in range(3):
        capsule('Toe_%s_%d' % (side,i), (.24,0,-.53), (.48, (i-1)*.12, -.58), .039, yellow, pivot)
    capsule('Back_Toe_%s' % side, (.12,0,-.47), (-.06,side*.06,-.54), .038, yellow, pivot)

scene.frame_start = 1
scene.frame_end = 25
scene.render.fps = 30
for f in range(1,26,3):
    phase = (f-1)/24*2*math.pi
    for side,pivot in zip([-1,1],wings):
        pivot.rotation_euler.x = side*(.05+1.05*math.sin(phase))
        pivot.rotation_euler.z = side*.10*math.cos(phase)
        pivot.keyframe_insert(data_path='rotation_euler', frame=f)
    for side,pivot in zip([-1,1],legs):
        pivot.rotation_euler.y = -.35+side*.23*math.sin(phase)
        pivot.keyframe_insert(data_path='rotation_euler', frame=f)
    root.location.z = .10*math.sin(phase*2)
    root.rotation_euler.y = .08*math.sin(phase)
    root.keyframe_insert(data_path='location',frame=f)
    root.keyframe_insert(data_path='rotation_euler',frame=f)
for obj in [root,*wings,*legs]:
    obj.animation_data.action.name = obj.name+'_Flight'
    for fc in obj.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = 'BEZIER'
        fc.modifiers.new('CYCLES')

world = bpy.data.worlds.new('Moorhuhn_Studio')
scene.world = world
world.use_nodes = True
background = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs[0].default_value = (.34,.41,.52,1)
background.inputs[1].default_value = .55

def point_at(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def area(name, loc, energy, size, color):
    data=bpy.data.lights.new(name,'AREA')
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=loc
    data.energy=energy
    data.shape='DISK'
    data.size=size
    data.color=color
    point_at(obj,(0,0,1.8))

area('Key • softbox', (2,-4,6), 550, 4, (1,.85,.65))
area('Fill • sky', (-3,-2,3), 260, 3, (.63,.77,1))
area('Rim • warm', (-1,4,5), 650, 3, (1,.72,.40))
cam_data = bpy.data.cameras.new('Moorhuhn_Camera')
cam = bpy.data.objects.new('Moorhuhn_Camera',cam_data)
scene.collection.objects.link(cam)
cam.location = (4.0,-9,3.6)
point_at(cam,(0,0,1.90))
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 4.05
scene.camera = cam
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.frame_set(4)

# Leave the asset selected and framed in the running Blender session.
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type == 'VIEW_3D':
            a.spaces.active.region_3d.view_perspective = 'CAMERA'
            a.spaces.active.shading.type = 'MATERIAL'

# Export only the character. Studio lights and camera stay in the .blend.
bpy.ops.export_scene.gltf(filepath=str(OUT/'moorhuhn.glb'), export_format='GLB',
    use_selection=True, use_active_scene=True, export_animations=True, export_frame_range=True,
    export_animation_mode='ACTIVE_ACTIONS', export_nla_strips_merged_animation_name='Flight',
    export_force_sampling=True, export_cameras=False, export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'moorhuhn.blend'))
print('MOORHUHN_CREATED', len(collection.objects), 'objects', OUT)
