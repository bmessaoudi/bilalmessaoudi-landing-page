"""
Builds the 3D room behind the site, lights it with Cycles and bakes the light into textures.

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P blender/room.py -- [flags]

    --preview        render the camera poses to blender/out/ instead of baking
    --res 2048       atlas size in the GLB
    --samples 384    Cycles samples per bake
    --ss 2           bake at res * ss, then scale down (cheap denoise)

Everything is built from code, so the room can be rebuilt after a change to the books
(run `node blender/export-books.mts` first). Coordinates are written in three.js space
(x right, y up, z towards the viewer) and converted to Blender's z-up on creation.
"""

import bpy
import bmesh
import json
import math
import os
import random
import sys
import time
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default):
    if name in argv:
        i = argv.index(name)
        return type(default)(argv[i + 1]) if not isinstance(default, bool) else True
    return default


PREVIEW = arg("--preview", False)
RES = arg("--res", 2048)
SAMPLES = arg("--samples", 384)
SS = arg("--ss", 2)

BOOKS = json.load(open(os.path.join(HERE, "books.json")))

# same numbers as lib/scene/room.ts
WALL_Z = -0.62
WALL_X = -1.75
RIGHT_X = 2.3
FRONT_Z = 4.0
CEIL = 2.7
SHELF = dict(x=1.32, w=0.96, h=1.96, d=0.34, t=0.03, rows=[0.07, 0.53, 0.99, 1.45])
DESK = dict(x=-0.15, w=1.4, d=0.7, top=0.74)
DESK_Z = WALL_Z + 0.02 + DESK["d"] / 2
WIN = dict(z=0.35, y=1.45, w=0.95, h=1.05, depth=0.16)


def V(x, y, z):
    """three.js position to Blender."""
    return Vector((x, -z, y))


# ---------------------------------------------------------------- scene

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "METAL"
scene.cycles.device = "GPU"
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 5
scene.cycles.glossy_bounces = 3
scene.cycles.sample_clamp_indirect = 6
scene.view_settings.view_transform = "AgX"
for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
    try:
        scene.view_settings.look = look
        break
    except TypeError:
        pass
scene.view_settings.exposure = 0.25

world = bpy.data.worlds.new("World")
scene.world = world
wn = world.node_tree
wn.nodes["Background"].inputs[0].default_value = (0.02, 0.025, 0.045, 1)
wn.nodes["Background"].inputs[1].default_value = 1.0

coll = scene.collection
rng = random.Random(7)

# ---------------------------------------------------------------- materials


class N:
    """Tiny node graph helper."""

    def __init__(self, name):
        self.m = bpy.data.materials.new(name)
        try:
            self.m.use_nodes = True
        except AttributeError:
            pass
        self.t = self.m.node_tree
        self.bsdf = self.t.nodes["Principled BSDF"]

    def node(self, kind, **props):
        n = self.t.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.t.links.new(a, b)

    def set(self, name, value):
        self.bsdf.inputs[name].default_value = value

    def coords(self, scale=(1, 1, 1), space="Object"):
        tc = self.node("ShaderNodeTexCoord")
        mp = self.node("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = scale
        self.link(tc.outputs[space], mp.inputs["Vector"])
        return mp.outputs["Vector"]

    def noise(self, vec, scale=5, detail=6, rough=0.5, distortion=0.0):
        n = self.node("ShaderNodeTexNoise")
        self.link(vec, n.inputs["Vector"])
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        n.inputs["Distortion"].default_value = distortion
        return n

    def ramp(self, fac, stops):
        r = self.node("ShaderNodeValToRGB")
        self.link(fac, r.inputs["Fac"])
        els = r.color_ramp.elements
        while len(els) < len(stops):
            els.new(0.5)
        for e, (pos, col) in zip(els, stops):
            e.position = pos
            e.color = (*hexc(col), 1)
        return r.outputs["Color"]

    def bump(self, height, strength=0.2, distance=0.002):
        b = self.node("ShaderNodeBump")
        b.inputs["Strength"].default_value = strength
        b.inputs["Distance"].default_value = distance
        self.link(height, b.inputs["Height"])
        self.link(b.outputs["Normal"], self.bsdf.inputs["Normal"])
        return b


def mix(n, blend="MIX"):
    """A colour Mix node; returns (node, factor, a, b, result)."""
    m = n.node("ShaderNodeMix", data_type="RGBA", blend_type=blend)
    a = [s for s in m.inputs if s.name == "A" and s.type == "RGBA"][0]
    b = [s for s in m.inputs if s.name == "B" and s.type == "RGBA"][0]
    out = [s for s in m.outputs if s.type == "RGBA"][0]
    return m, m.inputs[0], a, b, out


def hexc(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def plain(name, col, rough=0.6, metal=0.0, coat=0.0):
    n = N(name)
    n.set("Base Color", (*hexc(col), 1))
    n.set("Roughness", rough)
    n.set("Metallic", metal)
    if coat:
        n.set("Coat Weight", coat)
    return n.m


def textured(name, col, rough=0.6, scale=60, amount=0.08, bump=0.15, metal=0.0):
    """A colour with a little noise in it and a matching bump: plaster, plastic, fabric."""
    n = N(name)
    v = n.coords()
    nz = n.noise(v, scale=scale, detail=8, rough=0.6)
    base = hexc(col)
    dark = tuple(c * (1 - amount) for c in base)
    _, f, a, b, out = mix(n)
    n.link(nz.outputs["Fac"], f)
    a.default_value = (*dark, 1)
    b.default_value = (*base, 1)
    n.link(out, n.bsdf.inputs["Base Color"])
    n.set("Roughness", rough)
    n.set("Metallic", metal)
    if bump:
        n.bump(nz.outputs["Fac"], strength=bump, distance=0.001)
    return n.m


def wood(name, light, dark, grain_axis="x", rough=0.5, scale=1.0):
    """Long stretched noise reads as grain, a second noise breaks it into growth rings."""
    n = N(name)
    s = {"x": (2, 70, 70), "y": (70, 2, 70), "z": (70, 70, 2)}[grain_axis]
    v = n.coords(tuple(a * scale for a in s))
    g = n.noise(v, scale=1.2, detail=10, rough=0.62, distortion=1.4)
    col = n.ramp(g.outputs["Fac"], [(0.3, dark), (0.52, light), (0.75, dark)])
    n.link(col, n.bsdf.inputs["Base Color"])
    n.set("Roughness", rough)
    n.set("Coat Weight", 0.15)
    n.set("Coat Roughness", 0.35)
    n.bump(g.outputs["Fac"], strength=0.08, distance=0.001)
    return n.m


def floor_mat():
    n = N("floor")
    tc = n.node("ShaderNodeTexCoord")
    br = n.node("ShaderNodeTexBrick", offset=0.37, offset_frequency=1, squash=1.0, squash_frequency=1)
    n.link(tc.outputs["Object"], br.inputs["Vector"])
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Brick Width"].default_value = 1.15
    br.inputs["Row Height"].default_value = 0.16
    br.inputs["Mortar Size"].default_value = 0.0018
    br.inputs["Mortar Smooth"].default_value = 0.3
    br.inputs["Bias"].default_value = 0.0
    br.inputs["Color1"].default_value = (*hexc("#7A5638"), 1)
    br.inputs["Color2"].default_value = (*hexc("#93694A"), 1)
    br.inputs["Mortar"].default_value = (*hexc("#2A1C12"), 1)
    # grain along x (the plank length)
    mp = n.node("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (2.5, 90, 90)
    n.link(tc.outputs["Object"], mp.inputs["Vector"])
    g = n.noise(mp.outputs["Vector"], scale=1.0, detail=10, rough=0.6, distortion=1.6)
    grain = n.ramp(g.outputs["Fac"], [(0.35, "#5A3E28"), (0.6, "#FFFFFF")])
    _, f, a, b, out = mix(n, "MULTIPLY")
    f.default_value = 0.55
    n.link(br.outputs["Color"], a)
    n.link(grain, b)
    n.link(out, n.bsdf.inputs["Base Color"])
    # worn varnish: rougher where the grain is dark
    rr = n.node("ShaderNodeMapRange")
    n.link(g.outputs["Fac"], rr.inputs[0])
    rr.inputs[3].default_value = 0.5
    rr.inputs[4].default_value = 0.32
    n.link(rr.outputs[0], n.bsdf.inputs["Roughness"])
    n.set("Coat Weight", 0.2)
    n.set("Coat Roughness", 0.3)
    inv = n.node("ShaderNodeMath", operation="SUBTRACT")
    inv.inputs[0].default_value = 1.0
    n.link(br.outputs["Fac"], inv.inputs[1])
    n.bump(inv.outputs[0], strength=0.6, distance=0.002)
    return n.m


def emission(name, col, strength):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    t = m.node_tree
    t.nodes.remove(t.nodes["Principled BSDF"])
    e = t.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*hexc(col), 1)
    e.inputs["Strength"].default_value = strength
    t.links.new(e.outputs[0], t.nodes["Material Output"].inputs["Surface"])
    return m


def sky_mat():
    """Dusk seen through the window: deep blue on top, peach at the horizon."""
    m = bpy.data.materials.new("sky")
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    t = m.node_tree
    t.nodes.remove(t.nodes["Principled BSDF"])
    tc = t.nodes.new("ShaderNodeTexCoord")
    sep = t.nodes.new("ShaderNodeSeparateXYZ")
    t.links.new(tc.outputs["Generated"], sep.inputs[0])
    r = t.nodes.new("ShaderNodeValToRGB")
    t.links.new(sep.outputs["Y"], r.inputs["Fac"])
    els = r.color_ramp.elements
    els.new(0.5)
    els.new(0.75)
    for e, (p, c) in zip(els, [(0.18, "#E9A070"), (0.4, "#C27C7A"), (0.62, "#5E5F8E"), (0.95, "#1E2A4C")]):
        e.position = p
        e.color = (*hexc(c), 1)
    e = t.nodes.new("ShaderNodeEmission")
    e.inputs["Strength"].default_value = 1.6
    t.links.new(r.outputs["Color"], e.inputs["Color"])
    t.links.new(e.outputs[0], t.nodes["Material Output"].inputs["Surface"])
    return m


M = {
    "wall": textured("wall", "#BDB4A6", rough=0.92, scale=90, amount=0.05, bump=0.06),
    "ceiling": textured("ceiling", "#C9C3B8", rough=0.95, scale=60, amount=0.03, bump=0.03),
    "skirting": plain("skirting", "#D8D2C6", rough=0.45),
    "frame": plain("frame", "#E4E0D6", rough=0.4),
    "floor": floor_mat(),
    "sky": sky_mat(),
    "desk": wood("desk", "#B68A5C", "#8A6038", "x", rough=0.42),
    "shelf": wood("shelf", "#B39672", "#86694A", "y", rough=0.5),
    "steel": plain("steel", "#1E1F22", rough=0.38, metal=0.8),
    "alu": textured("alu", "#B9BBBE", rough=0.32, scale=400, amount=0.06, bump=0.02, metal=1.0),
    "alu_dark": textured("alu_dark", "#55575C", rough=0.35, scale=400, amount=0.05, bump=0.02, metal=1.0),
    "plastic_black": plain("plastic_black", "#141518", rough=0.45),
    "glass_black": plain("glass_black", "#08090B", rough=0.08, coat=0.6),
    "keycap": textured("keycap", "#D6D3CC", rough=0.55, scale=300, amount=0.03, bump=0.05),
    "keycap_dark": textured("keycap_dark", "#8E8B86", rough=0.55, scale=300, amount=0.03, bump=0.05),
    "kb_case": textured("kb_case", "#5C5E64", rough=0.4, scale=400, amount=0.04, bump=0.02),
    "mouse_shell": plain("mouse_shell", "#DEDCD7", rough=0.38),
    "bakelite": plain("bakelite", "#17130F", rough=0.3),
    "ceramic": plain("ceramic", "#ECE8DF", rough=0.15, coat=0.5),
    "ceramic_green": plain("ceramic_green", "#5F7465", rough=0.22, coat=0.4),
    "terracotta": textured("terracotta", "#B4673F", rough=0.85, scale=120, amount=0.12, bump=0.15),
    "soil": textured("soil", "#2B2018", rough=1.0, scale=200, amount=0.3, bump=0.4),
    "fabric": textured("fabric", "#5A6170", rough=0.95, scale=900, amount=0.14, bump=0.3),
    "rubber": plain("rubber", "#1A1A1C", rough=0.8),
    "lampshade": plain("lampshade", "#2E3B35", rough=0.4, metal=0.6),
    "lamp_inner": plain("lamp_inner", "#E8E2D4", rough=0.5),
    "bulb": emission("bulb", "#FFD9A8", 45.0),
    "screen": emission("screen", "#18202E", 3.0),
    "pages": textured("pages", "#E6DFCB", rough=0.9, scale=1500, amount=0.06, bump=0.1),
    "clawd": textured("clawd", "#D77757", rough=0.5, scale=160, amount=0.03, bump=0.03),
    "clawd_eye": plain("clawd_eye", "#141110", rough=0.25),
    "cable": plain("cable", "#121214", rough=0.6),
}


def leaf_mat():
    n = N("leaf")
    v = n.coords()
    w = n.node("ShaderNodeTexWave", wave_type="BANDS", bands_direction="Z")
    n.link(v, w.inputs["Vector"])
    w.inputs["Scale"].default_value = 22
    w.inputs["Distortion"].default_value = 6
    w.inputs["Detail"].default_value = 4
    col = n.ramp(w.outputs["Fac"], [(0.35, "#2C4A2E"), (0.65, "#557A47")])
    n.link(col, n.bsdf.inputs["Base Color"])
    n.set("Roughness", 0.45)
    n.set("Subsurface Weight", 0.1)
    return n.m


def rug_mat():
    n = N("rug")
    tc = n.node("ShaderNodeTexCoord")
    sep = n.node("ShaderNodeSeparateXYZ")
    n.link(tc.outputs["Generated"], sep.inputs[0])
    # a border two thirds of the way out, then flat wool
    w = n.node("ShaderNodeTexWave", wave_type="BANDS", bands_direction="X")
    n.link(tc.outputs["Generated"], w.inputs["Vector"])
    w.inputs["Scale"].default_value = 3.0
    col = n.ramp(w.outputs["Fac"], [(0.0, "#4A3B33"), (0.05, "#8E7A62"), (0.12, "#8E7A62"), (0.16, "#5C4A3E")])
    v = n.coords()
    nz = n.noise(v, scale=700, detail=4)
    _, f, a, b, out = mix(n, "MULTIPLY")
    f.default_value = 0.25
    n.link(col, a)
    n.link(nz.outputs["Color"], b)
    n.link(out, n.bsdf.inputs["Base Color"])
    n.set("Roughness", 1.0)
    n.set("Sheen Weight", 0.5)
    n.bump(nz.outputs["Fac"], strength=0.5, distance=0.003)
    return n.m


M["leaf"] = leaf_mat()
M["rug"] = rug_mat()
M["succulent"] = textured("succulent", "#7E9C82", rough=0.5, scale=40, amount=0.15, bump=0.05)

# ---------------------------------------------------------------- geometry helpers


def obj_from_bm(name, bm, mats, atlas):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    for m in mats:
        o.data.materials.append(m)
    o["atlas"] = atlas
    return o


def bevel(o, width, segments=3, angle=40):
    if width <= 0:
        return o
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = width
    b.segments = segments
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(angle)
    b.harden_normals = True
    b.use_clamp_overlap = True
    o.data.shade_smooth()
    return o


def box(name, size, at, mat, atlas, bev=0.003, seg=3, rot=None):
    """size = (w, h, d) in three.js axes, at = centre in three.js space."""
    w, h, d = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    if rot:
        o.rotation_euler = rot_three(rot)
    return bevel(o, min(bev, min(size) * 0.45), seg)


def rot_three(r):
    """Rotation given as three.js euler (x, y, z) -> Blender euler on the converted axes."""
    rx, ry, rz = r
    return (rx, -rz, ry)


def cylinder(name, r, h, at, mat, atlas, verts=32, bev=0.002, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    return bevel(o, bev, 2)


def lathe(name, profile, at, mat, atlas, steps=48, smooth=True):
    """Spin a (radius, height) profile around the vertical axis."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, y)) for r, y in profile]
    for a, b in zip(vs, vs[1:]):
        bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=steps, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    if smooth:
        o.data.shade_smooth()
    return o


def rod(name, a, b, r, mat, atlas, verts=16):
    a, b = V(*a), V(*b)
    d = b - a
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=d.length)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = (a + b) / 2
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    o.data.shade_smooth()
    return o


def sphere(name, r, at, mat, atlas, scale=(1, 1, 1), seg=24):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    sx, sy, sz = scale
    bmesh.ops.scale(bm, vec=(sx, sz, sy), verts=bm.verts)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    o.data.shade_smooth()
    return o


def plane(name, w, h, at, mat, atlas, normal="+z"):
    """A w x h rectangle facing `normal` (three.js axis)."""
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
    bmesh.ops.scale(bm, vec=(w, h, 1), verts=bm.verts)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    # the grid faces Blender +Z (three +y); turn it to face the requested axis
    o.rotation_euler = {
        "+y": (0, 0, 0),
        "-y": (math.pi, 0, 0),
        "+z": (math.pi / 2, 0, 0),
        "-z": (math.pi / 2, 0, math.pi),
        "+x": (math.pi / 2, 0, math.pi / 2),
        "-x": (math.pi / 2, 0, -math.pi / 2),
    }[normal]
    return o


def join(name, objs):
    """Apply modifiers and merge into one object, keeping materials."""
    for o in objs:
        apply_modifiers(o)
    target = objs[0]
    with bpy.context.temp_override(active_object=target, selected_editable_objects=objs, object=target):
        bpy.ops.object.join()
    target.name = name
    target.data.name = name
    return target


def apply_modifiers(o):
    if o.type != "MESH" or not o.modifiers:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)


def set_origin(o, three_point):
    """Move the pivot of an object without moving its geometry."""
    bpy.context.view_layer.update()
    world = V(*three_point)
    local = o.matrix_world.inverted() @ world
    o.data.transform(Matrix.Translation(-local))
    o.matrix_world = o.matrix_world @ Matrix.Translation(local)


def parent(child, par):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = par
    child.matrix_world = mw


def empty(name, at, rot=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    coll.objects.link(e)
    e.location = V(*at)
    e.rotation_euler = rot_three(rot)
    return e


# ---------------------------------------------------------------- room shell

W0, W1 = WALL_X, RIGHT_X
Z0, Z1 = WALL_Z, FRONT_Z
cx, cz = (W0 + W1) / 2, (Z0 + Z1) / 2
plane("floor", W1 - W0, Z1 - Z0, (cx, 0, cz), M["floor"], "room", "+y")
plane("ceiling", W1 - W0, Z1 - Z0, (cx, CEIL, cz), M["ceiling"], "room", "-y")["uv_scale"] = 0.35
plane("wall_back", W1 - W0, CEIL, (cx, CEIL / 2, Z0), M["wall"], "room", "+z")
plane("wall_right", Z1 - Z0, CEIL, (W1, CEIL / 2, cz), M["wall"], "room", "-x")["uv_scale"] = 0.6
plane("wall_front", W1 - W0, CEIL, (cx, CEIL / 2, Z1), M["wall"], "room", "-z")["uv_scale"] = 0.25

# left wall, with a deep window opening
wz0, wz1 = WIN["z"] - WIN["w"] / 2, WIN["z"] + WIN["w"] / 2
wy0, wy1 = WIN["y"] - WIN["h"] / 2, WIN["y"] + WIN["h"] / 2
plane("wall_left_a", wz0 - Z0, CEIL, (W0, CEIL / 2, (Z0 + wz0) / 2), M["wall"], "room", "+x")
plane("wall_left_b", Z1 - wz1, CEIL, (W0, CEIL / 2, (wz1 + Z1) / 2), M["wall"], "room", "+x")["uv_scale"] = 0.7
plane("wall_left_c", WIN["w"], wy0, (W0, wy0 / 2, WIN["z"]), M["wall"], "room", "+x")
plane("wall_left_d", WIN["w"], CEIL - wy1, (W0, (wy1 + CEIL) / 2, WIN["z"]), M["wall"], "room", "+x")
dpt = WIN["depth"]
plane("reveal_top", dpt, WIN["w"], (W0 - dpt / 2, wy1, WIN["z"]), M["wall"], "room", "-y")
plane("reveal_l", dpt, WIN["h"], (W0 - dpt / 2, WIN["y"], wz0), M["wall"], "room", "-z")
plane("reveal_r", dpt, WIN["h"], (W0 - dpt / 2, WIN["y"], wz1), M["wall"], "room", "-z")
box("sill", (dpt + 0.07, 0.03, WIN["w"] + 0.12), (W0 - dpt / 2 + 0.035, wy0 - 0.015, WIN["z"]), M["frame"], "room", bev=0.004)

# window frame, set back into the opening
fx = W0 - dpt + 0.03
frame_parts = []
for i, (y, z, h, w) in enumerate(
    [
        (wy1 - 0.03, WIN["z"], 0.06, WIN["w"]),
        (wy0 + 0.035, WIN["z"], 0.07, WIN["w"]),
        (WIN["y"], wz0 + 0.03, WIN["h"], 0.06),
        (WIN["y"], wz1 - 0.03, WIN["h"], 0.06),
        (WIN["y"], WIN["z"], WIN["h"], 0.045),
        (WIN["y"] + 0.18, WIN["z"], 0.035, WIN["w"]),
    ]
):
    frame_parts.append(box(f"wf{i}", (0.06, h, w), (fx, y, z), M["frame"], "room", bev=0.004))
join("window_frame", frame_parts)
handle = box("window_handle", (0.02, 0.09, 0.016), (fx + 0.045, WIN["y"] - 0.05, WIN["z"] + 0.04), M["alu"], "room", bev=0.004)
sky = plane("sky", 4.0, 3.2, (W0 - 1.2, 1.6, WIN["z"]), M["sky"], "room", "+x")
sky["uv_scale"] = 0.15

# skirting boards
box("skirt_back", (W1 - W0, 0.09, 0.016), (cx, 0.045, Z0 + 0.008), M["skirting"], "room", bev=0.003)
box("skirt_left_a", (0.016, 0.09, Z1 - Z0), (W0 + 0.008, 0.045, cz), M["skirting"], "room", bev=0.003)
box("skirt_right", (0.016, 0.09, Z1 - Z0), (W1 - 0.008, 0.045, cz), M["skirting"], "room", bev=0.003)["uv_scale"] = 0.5

# rug under the chair
rug = box("rug", (1.9, 0.01, 1.3), (-0.2, 0.005, 0.75), M["rug"], "room", bev=0.004)

# ---------------------------------------------------------------- desk

dx, dw, dd, top = DESK["x"], DESK["w"], DESK["d"], DESK["top"]
box("desk_top", (dw, 0.03, dd), (dx, top - 0.015, DESK_Z), M["desk"], "furniture", bev=0.004)
legs = []
for sx in (-1, 1):
    for sz in (-1, 1):
        legs.append(box(f"leg{sx}{sz}", (0.035, top - 0.03, 0.035), (dx + sx * (dw / 2 - 0.05), (top - 0.03) / 2, DESK_Z + sz * (dd / 2 - 0.05)), M["steel"], "furniture", bev=0.004))
    legs.append(box(f"rail{sx}", (0.03, 0.05, dd - 0.1), (dx + sx * (dw / 2 - 0.05), top - 0.055, DESK_Z), M["steel"], "furniture", bev=0.003))
legs.append(box("rail_back", (dw - 0.1, 0.05, 0.03), (dx, top - 0.055, DESK_Z - dd / 2 + 0.05), M["steel"], "furniture", bev=0.003))
join("desk_frame", legs)

# ---------------------------------------------------------------- monitor

mx, mz = dx - 0.02, WALL_Z + 0.2
mw, mh = 0.62, 0.37
my = top + 0.13 + mh / 2
mon = [
    box("mon_panel", (mw, mh, 0.014), (mx, my, mz + 0.007), M["plastic_black"], "props", bev=0.003),
    box("mon_back", (mw - 0.04, mh - 0.06, 0.03), (mx, my + 0.01, mz - 0.012), M["alu"], "props", bev=0.012, seg=4),
    box("mon_neck", (0.05, 0.2, 0.016), (mx, top + 0.11, mz - 0.04), M["alu"], "props", bev=0.004, rot=(-0.12, 0, 0)),
    box("mon_foot", (0.22, 0.008, 0.17), (mx, top + 0.004, mz - 0.02), M["alu"], "props", bev=0.003),
]
monitor = join("monitor", mon)
screen = plane("screen", mw - 0.02, mh - 0.03, (mx, my + 0.005, mz + 0.0145), M["screen"], "", "+z")

# ---------------------------------------------------------------- keyboard and mouse

def wedge(name, w, d, h_front, h_back, at, mat, atlas, bev=0.003, seg=3):
    """A box whose top slopes from h_front (+z side) up to h_back; `at` is the centre of its bottom face."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        x, y, z = v.co
        # blender -y is three +z, the front
        v.co = Vector((x * w, y * d, 0.0 if z < 0 else (h_front if y < 0 else h_back)))
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    return bevel(o, bev, seg)


def keycap(name, w, d, h, at, mat, atlas, tilt=0.0, taper=0.001, bev=0.0011):
    """A low-profile keycap: a box whose top is a little smaller than its foot, rounded."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    for v in bm.verts:
        if v.co.z > 0:
            v.co.x -= math.copysign(taper, v.co.x)
            v.co.y -= math.copysign(taper, v.co.y)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.location = V(*at)
    o.rotation_euler = rot_three((tilt, 0, 0))
    return bevel(o, bev, 2)


# a low-profile 75% board: Fn row, number row, three letter rows, bottom row with arrows
KEY_ROWS = [
    [1] * 16,
    [1] * 13 + [2, 1],
    [1.5] + [1] * 12 + [1.5, 1],
    [1.75] + [1] * 11 + [2.25, 1],
    [2.25] + [1] * 10 + [1.75, 1, 1],
    [1.25] * 3 + [6.25] + [1] * 6,
]
pitch, key_gap, fn_gap, kb_margin = 0.019, 0.0019, 0.004, 0.0075
kb_w = 16 * pitch + 2 * kb_margin
kb_d = len(KEY_ROWS) * pitch + fn_gap + 2 * kb_margin
kb_hf, kb_hb = 0.0075, 0.0145  # case height at the front and the back: a ~3 degree typing angle
kb_tilt = math.atan2(kb_hb - kb_hf, kb_d)
kx, kz = mx, DESK_Z + 0.13
kb = [wedge("kb_case", kb_w, kb_d, kb_hf, kb_hb, (kx, top, kz), M["kb_case"], "props", bev=0.0035, seg=4)]
cap_h, cap_sink = 0.0046, 0.0013
for r, row in enumerate(KEY_ROWS):
    lz = -kb_d / 2 + kb_margin + (r + 0.5) * pitch + (fn_gap if r else 0)
    surf = kb_hf + (kb_hb - kb_hf) * (0.5 - lz / kb_d)
    u0 = 0.0
    for k, u in enumerate(row):
        lx = -kb_w / 2 + kb_margin + (u0 + u / 2) * pitch
        u0 += u
        space = u > 6
        mod = (u != 1 and not space) or (r == 0 and k == 0) or k == len(row) - 1 or (r == 4 and k == len(row) - 2) or (r == 5 and not space)
        kb.append(
            keycap(
                f"key{r}_{k}",
                u * pitch - key_gap,
                pitch - key_gap,
                cap_h,
                (kx + lx, top + surf + cap_h / 2 - cap_sink, kz + lz),
                M["keycap_dark" if mod else "keycap"],
                "props",
                tilt=kb_tilt,
            )
        )
keyboard = join("keyboard", kb)


def mouse_part(name, faces_of, shape, nudge, mat, atlas):
    """One piece of the mouse shell: a uv sphere (poles at nose and tail) keeping the faces
    `faces_of` picks, its open edges pulled back by `nudge` so the pieces leave a seam."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
    bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, "X"))
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not faces_of(f.calc_center_median())], context="FACES")
    for v in bm.verts:
        u = v.co.normalized()
        if v.is_boundary:
            u = nudge(u)
        v.co = shape(u)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.data.shade_smooth()
    return o


# a right-handed mouse, built along blender +y (its nose points away from the sitter)
ms_l, ms_w, ms_h, ms_lift = 0.114, 0.061, 0.033, 0.005


def mouse_shape(u, k=1.0, n=2.6):
    # a superellipsoid rather than a sphere: fuller sides and blunter ends, like a real shell
    x, y, z = u / (abs(u.x) ** n + abs(u.y) ** n + abs(u.z) ** n) ** (1 / n)
    hw = ms_w / 2 * (1 - 0.16 * (y + 1) / 2)  # a little narrower at the nose
    if z >= 0:
        z *= ms_h * (1 - 0.32 * (y + 0.3) ** 2)  # the hump sits behind the middle, under the palm
    else:
        z *= ms_lift
    return Vector((x * hw * k, y * ms_l / 2 * k, (z + ms_lift) * k + ms_lift * (1 - k)))


ms_split = math.cos(11 * math.pi / 24)  # the ring where the buttons end
ms_side = math.radians(50)
ms_seam = 0.016
ms_wheel = (ms_split + 0.18, ms_split + 0.52)  # where the wheel slot opens along the seam


def on_button(c, side):
    c = c.normalized()
    return c.y > ms_split and abs(math.atan2(c.x, c.z)) < ms_side and c.x * side > 0


def button_nudge(side):
    def f(u):
        th, ph = math.acos(max(-1, min(1, u.y))), math.atan2(u.x, u.z)
        centre, ring = abs(u.x) < 1e-4, abs(u.y - ms_split) < 1e-4
        if centre:
            # the centre seam opens up into a slot around the wheel
            t = (u.y - ms_wheel[0]) / (ms_wheel[1] - ms_wheel[0])
            ph = side * (ms_seam + (0.11 * math.sin(math.pi * t) ** 0.6 if 0 < t < 1 else 0))
        elif not ring or abs(ph) > ms_side - 0.15:
            ph -= side * ms_seam
        if ring:
            th -= ms_seam
        return Vector((math.sin(th) * math.sin(ph), math.cos(th), math.sin(th) * math.cos(ph)))

    return f


msx, msz = kx + kb_w / 2 + 0.115, kz + 0.015
mouse_parts = [
    mouse_part("mouse_body", lambda c: not on_button(c, 1) and not on_button(c, -1) and c.z > -0.35, mouse_shape, lambda u: u, M["mouse_shell"], "props"),
    mouse_part("mouse_base", lambda c: c.z <= -0.35, mouse_shape, lambda u: u, M["plastic_black"], "props"),
    mouse_part("mouse_btn_l", lambda c: on_button(c, -1), mouse_shape, button_nudge(-1), M["mouse_shell"], "props"),
    mouse_part("mouse_btn_r", lambda c: on_button(c, 1), mouse_shape, button_nudge(1), M["mouse_shell"], "props"),
]
wy = (ms_wheel[0] + ms_wheel[1]) / 2
wheel_top = mouse_shape(Vector((0, wy, math.sqrt(1 - wy * wy))))
wheel_r = 0.0085
wc = wheel_top - Vector((0, 0, wheel_r - 0.0022))
wheel = rod("mouse_wheel", (wc.x - 0.0032, wc.z, -wc.y), (wc.x + 0.0032, wc.z, -wc.y), wheel_r, M["rubber"], "props", verts=28)
bevel(wheel, 0.0012, 2)
mouse = join("mouse", mouse_parts + [wheel])
mouse["uv_density"] = 2.0  # a smooth shell this small shows its uv seams at the default density
# a dark core just under the shell, seen through the seams and the wheel slot. It stays out of the
# atlas (the site draws unbaked meshes flat dark), so no black islands sit next to the shell's
mouse_core = mouse_part("mouse_core", lambda c: True, lambda u: mouse_shape(u, 0.965), lambda u: u, M["plastic_black"], "")
for o in (mouse, mouse_core):
    o.location = V(msx, top, msz)
    o.rotation_euler = rot_three((0, 0.12, 0))

# ---------------------------------------------------------------- lamp

lx, lz = dx - 0.57, WALL_Z + 0.16
base_y = top
lamp = [
    cylinder("lamp_base", 0.075, 0.022, (lx, base_y + 0.011, lz), M["lampshade"], "furniture", bev=0.004),
    rod("lamp_arm1", (lx, base_y + 0.02, lz), (lx + 0.05, base_y + 0.4, lz + 0.03), 0.007, M["alu"], "furniture"),
    sphere("lamp_joint", 0.013, (lx + 0.05, base_y + 0.4, lz + 0.03), M["alu"], "furniture"),
    rod("lamp_arm2", (lx + 0.05, base_y + 0.4, lz + 0.03), (lx + 0.26, base_y + 0.47, lz + 0.14), 0.006, M["alu"], "furniture"),
]
lamp_body = join("lamp", lamp)
# the shade points down at the desk
head = Vector((lx + 0.3, base_y + 0.44, lz + 0.16))
aim = Vector((lx + 0.36, top, lz + 0.28))
shade = lathe("lamp_shade", [(0.012, 0.0), (0.02, -0.012), (0.035, -0.05), (0.068, -0.12), (0.066, -0.122), (0.033, -0.052), (0.018, -0.014), (0.01, -0.003)], (0, 0, 0), M["lampshade"], "furniture", steps=40)
shade.data.materials.append(M["lamp_inner"])
for f in shade.data.polygons:
    # inner faces look towards the axis
    c = f.center
    if Vector((c.x, c.y, 0)).dot(Vector((f.normal.x, f.normal.y, 0))) < 0:
        f.material_index = 1
dirv = V(*aim) - V(*head)
shade.location = V(*head)
shade.rotation_euler = (-dirv).to_track_quat("Z", "Y").to_euler()
bulb = sphere("lamp_bulb", 0.022, (0, 0, 0), M["bulb"], "", seg=16)
bpy.context.view_layer.update()
bulb.location = V(*head) + dirv.normalized() * 0.075
spot = bpy.data.lights.new("lamp_spot", "SPOT")
spot.energy = 55
spot.color = hexc("#FFC48A")
spot.spot_size = math.radians(115)
spot.spot_blend = 0.6
spot.shadow_soft_size = 0.03
spot_o = bpy.data.objects.new("lamp_spot", spot)
coll.objects.link(spot_o)
spot_o.location = bulb.location
spot_o.rotation_euler = (-dirv).to_track_quat("Z", "Y").to_euler()
glow = bpy.data.lights.new("lamp_glow", "POINT")
glow.energy = 6
glow.color = hexc("#FFB878")
glow.shadow_soft_size = 0.02
glow_o = bpy.data.objects.new("lamp_glow", glow)
coll.objects.link(glow_o)
glow_o.location = V(*head) + Vector((0, 0, 0.02))

# ---------------------------------------------------------------- moka, cup, phone, plant

mox, moz = dx + 0.38, WALL_Z + 0.15
s = 1.0
moka = lathe(
    "moka",
    [(0.0, 0.0), (0.042, 0.0), (0.044, 0.004), (0.04, 0.07), (0.03, 0.078), (0.032, 0.086), (0.04, 0.092), (0.047, 0.16), (0.045, 0.166), (0.035, 0.168), (0.0, 0.17)],
    (mox, top, moz),
    M["alu"],
    "props",
    steps=8,
    smooth=False,
)
bevel(moka, 0.0025, 2, angle=30)
moka_parts = [
    moka,
    box("moka_handle", (0.016, 0.075, 0.012), (mox + 0.072, top + 0.12, moz), M["bakelite"], "props", bev=0.004),
    box("moka_handle_arm", (0.03, 0.012, 0.012), (mox + 0.055, top + 0.155, moz), M["bakelite"], "props", bev=0.003),
    sphere("moka_knob", 0.011, (mox, top + 0.175, moz), M["bakelite"], "props"),
]
moka = join("moka", moka_parts)
moka.rotation_euler = rot_three((0, 0.5, 0))

cupx, cupz = dx + 0.6, DESK_Z + 0.06
cup = [
    lathe("saucer", [(0.0, 0.0), (0.045, 0.0), (0.058, 0.008), (0.06, 0.01), (0.05, 0.007), (0.0, 0.006)], (cupx, top, cupz), M["ceramic"], "props"),
    lathe("cup", [(0.0, 0.006), (0.022, 0.006), (0.03, 0.02), (0.033, 0.05), (0.031, 0.052), (0.029, 0.022), (0.02, 0.012), (0.0, 0.012)], (cupx, top, cupz), M["ceramic"], "props"),
    lathe("coffee", [(0.0, 0.04), (0.029, 0.04)], (cupx, top, cupz), M["bakelite"], "props", steps=24),
]
cup_o = join("cup", cup)
handle_c = box("cup_handle", (0.016, 0.022, 0.006), (cupx + 0.037, top + 0.035, cupz), M["ceramic"], "props", bev=0.0025)
cup_o = join("cup", [cup_o, handle_c])

phx, phz = dx + 0.5, DESK_Z + 0.24
phone = join(
    "phone",
    [
        box("phone_body", (0.072, 0.0075, 0.15), (phx, top + 0.00375, phz), M["alu_dark"], "props", bev=0.003),
        box("phone_glass", (0.069, 0.001, 0.147), (phx, top + 0.0078, phz), M["glass_black"], "props", bev=0.0004, seg=1),
    ],
)
phone.rotation_euler = rot_three((0, 0.35, 0))

# small succulent
px, pz = dx + 0.6, WALL_Z + 0.12
pot = lathe("pot_small", [(0.0, 0.0), (0.036, 0.0), (0.046, 0.075), (0.049, 0.078), (0.049, 0.084), (0.043, 0.084), (0.04, 0.07), (0.0, 0.07)], (px, top, pz), M["ceramic_green"], "props")
plant_small = [pot]
for i in range(16):
    a = i * 2.4
    ring = 0.35 + 0.65 * (i / 16)
    L = 0.022 + 0.03 * ring
    lf = sphere(f"succ{i}", 1.0, (0, 0, 0), M["succulent"], "props", scale=(0.011 + 0.006 * ring, 0.006, L / 2), seg=12)
    rot = Matrix.Rotation(a - math.pi / 2, 3, "Z") @ Matrix.Rotation(1.25 - 0.95 * ring, 3, "X")
    lf.rotation_euler = rot.to_euler()
    lf.location = V(px, top + 0.074, pz) + rot @ Vector((0, L * 0.45, 0))
    plant_small.append(lf)
join("plant_small", plant_small)

# ---------------------------------------------------------------- floor plant (snake plant)

fpx, fpz = W0 + 0.3, WALL_Z + 0.3
fpot = lathe("pot_floor", [(0.0, 0.0), (0.12, 0.0), (0.16, 0.34), (0.165, 0.345), (0.165, 0.36), (0.15, 0.36), (0.147, 0.33), (0.0, 0.33)], (fpx, 0, fpz), M["terracotta"], "furniture")
soil = cylinder("soil", 0.148, 0.01, (fpx, 0.325, fpz), M["soil"], "furniture", bev=0)
blades = []
for i in range(11):
    a = rng.uniform(0, math.tau)
    rr = rng.uniform(0, 0.08)
    L = rng.uniform(0.55, 0.95)
    W = rng.uniform(0.045, 0.065)
    lean = rng.uniform(0.03, 0.22)
    bm = bmesh.new()
    segs = 8
    prev = None
    for sgi in range(segs + 1):
        t = sgi / segs
        width = W * (1 - t**2.2) * (0.6 + 0.4 * math.sin(math.pi * min(1, t * 1.6)))
        y = t * L
        off = lean * t * t
        twist = 0.8 * t
        ca, sa = math.cos(twist), math.sin(twist)
        l = bm.verts.new((-width * ca + off, -width * sa, y))
        r_ = bm.verts.new((width * ca + off, width * sa, y))
        if prev:
            bm.faces.new((prev[0], prev[1], r_, l))
        prev = (l, r_)
    o = obj_from_bm(f"blade{i}", bm, [M["leaf"]], "furniture")
    o.location = V(fpx + math.cos(a) * rr, 0.32, fpz + math.sin(a) * rr)
    o.rotation_euler = (0, 0, a)
    sol = o.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = 0.004
    o.data.shade_smooth()
    blades.append(o)
join("plant_floor", [fpot, soil] + blades)

# ---------------------------------------------------------------- chair

chx, chz = dx - 0.15, DESK_Z + 0.72


def curved(name, w, h, depth, bend, at, mat, atlas, tilt=0.0, bev=0.02):
    """A cushion curved around the sitter: a bent grid, thickened and rounded."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=16, y_segments=8, size=0.5)
    for v in bm.verts:
        x, y = v.co.x * w, v.co.y * h
        v.co = Vector((x, bend * (2 * x / w) ** 2, y))
    o = obj_from_bm(name, bm, [mat], atlas)
    sol = o.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = depth
    sol.offset = 0
    o.modifiers.new("sub", "SUBSURF").levels = 2
    o.location = V(*at)
    o.rotation_euler = rot_three((tilt, 0, 0))
    o.data.shade_smooth()
    return o


chair_parts = [
    box("seat", (0.5, 0.09, 0.48), (0, 0.48, 0), M["fabric"], "furniture", bev=0.04, seg=5),
    curved("back", 0.47, 0.52, 0.06, 0.07, (0, 0.82, 0.25), M["fabric"], "furniture", tilt=-0.12),
    box("back_bar", (0.06, 0.34, 0.025), (0, 0.6, 0.29), M["plastic_black"], "furniture", bev=0.008, rot=(-0.12, 0, 0)),
    cylinder("post", 0.024, 0.32, (0, 0.27, 0), M["alu"], "furniture", bev=0.003),
    cylinder("post_sleeve", 0.035, 0.12, (0, 0.17, 0), M["plastic_black"], "furniture", bev=0.004),
    box("seat_plate", (0.24, 0.03, 0.24), (0, 0.42, 0), M["plastic_black"], "furniture", bev=0.006),
]


def star_leg(name, a, mat, atlas, r0=0.03, r1=0.29, w0=0.052, w1=0.03, y0=(0.086, 0.124), y1=(0.075, 0.097)):
    """One arm of the five-star base, from the hub out to a caster, tapering and sloping down."""
    bm = bmesh.new()
    vs = []
    for r, w, (yb, yt) in ((r0, w0, y0), (r1, w1, y1)):
        for z in (yb, yt):
            for s in (-1, 1):
                vs.append(bm.verts.new((r, s * w / 2, z)))
    for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([vs[i] for i in q])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm(name, bm, [mat], atlas)
    o.rotation_euler = (0, 0, a)
    return bevel(o, 0.007, 3)


def caster(name, r, a, swivel, mat, atlas, wheel=0.025, floor=0.01):
    """A twin-wheel caster under the tip of a leg at radius r; its wheels sit on `floor`."""
    sx, sz = r * math.cos(a), -r * math.sin(a)  # three.js x/z of the stem
    dx_, dz_ = math.cos(swivel) * 0.016, math.sin(swivel) * 0.016  # wheels trail the stem
    ax, az = -math.sin(swivel), math.cos(swivel)  # axle direction
    cx_, cy_, cz_ = sx + dx_, floor + wheel - 0.0005, sz + dz_
    parts = [rod(f"{name}_stem", (sx, 0.078, sz), (sx, cy_ + 0.012, sz), 0.0055, M["alu"], atlas, verts=12)]
    for i, k in enumerate((-1, 1)):
        o = k * 0.0135
        parts.append(rod(f"{name}_w{i}", (cx_ + ax * (o - 0.0055), cy_, cz_ + az * (o - 0.0055)), (cx_ + ax * (o + 0.0055), cy_, cz_ + az * (o + 0.0055)), wheel, mat, atlas, verts=24))
        bevel(parts[-1], 0.003, 2)
    hood = box(f"{name}_hood", (0.016, 0.034, 0.046), (cx_, cy_ + 0.005, cz_), mat, atlas, bev=0.007, seg=3, rot=(0, math.pi / 2 - swivel, 0))
    return parts + [hood]


for i in range(5):
    a = math.pi / 2 + i * math.tau / 5
    chair_parts.append(star_leg(f"leg{i}", a, M["plastic_black"], "furniture"))
    chair_parts += caster(f"caster{i}", 0.275, a, a + (0.9, -1.4, 2.6, 0.3, -2.2)[i], M["plastic_black"], "furniture")
chair_parts.append(cylinder("hub", 0.046, 0.06, (0, 0.105, 0), M["plastic_black"], "furniture", bev=0.006, r2=0.036))
for sx in (-1, 1):
    x = sx * 0.27
    chair_parts += [
        rod(f"arm_post{sx}", (sx * 0.2, 0.45, 0.04), (x, 0.665, 0.02), 0.016, M["plastic_black"], "furniture"),
        box(f"arm_pad{sx}", (0.06, 0.03, 0.26), (x, 0.675, 0.0), M["plastic_black"], "furniture", bev=0.012, seg=4),
    ]
chair = join("chair", chair_parts)
set_origin(chair, (0, 0, 0))
chair.location = V(chx, 0, chz)
chair.rotation_euler = rot_three((0, 0.55, 0))

# ---------------------------------------------------------------- tech posters

# Three framed prints left of the world map, drawn by blender/export-tech.mts from the site's
# technology list. They bake into their own small atlas so the logos stay sharp.
POSTERS = [
    # image, centre x, centre y, width, height (the image keeps the same aspect)
    ("poster_main", -0.62, 1.68, 0.46, 0.62),
    ("poster_b", -1.15, 1.82, 0.30, 0.357),
    ("poster_c", -1.15, 1.40, 0.30, 0.323),
]
FR = 0.016  # frame moulding width


def poster_mat(name):
    n = N(name)
    tex = n.node("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(HERE, "posters", f"{name}.png"))
    uv = n.node("ShaderNodeUVMap")
    uv.uv_map = "label"
    n.link(uv.outputs["UV"], tex.inputs["Vector"])
    n.link(tex.outputs["Color"], n.bsdf.inputs["Base Color"])
    n.set("Roughness", 0.7)
    return n.m


for name, px, py, pw, ph in POSTERS:
    parts = [
        box(f"{name}_t", (pw + 2 * FR, FR, 0.02), (px, py + ph / 2 + FR / 2, WALL_Z + 0.01), M["plastic_black"], "posters", bev=0.002),
        box(f"{name}_b", (pw + 2 * FR, FR, 0.02), (px, py - ph / 2 - FR / 2, WALL_Z + 0.01), M["plastic_black"], "posters", bev=0.002),
        box(f"{name}_l", (FR, ph, 0.02), (px - pw / 2 - FR / 2, py, WALL_Z + 0.01), M["plastic_black"], "posters", bev=0.002),
        box(f"{name}_r", (FR, ph, 0.02), (px + pw / 2 + FR / 2, py, WALL_Z + 0.01), M["plastic_black"], "posters", bev=0.002),
    ]
    join(f"{name}_frame", parts)
    art = plane(name, pw, ph, (px, py, WALL_Z + 0.014), poster_mat(name), "posters", "+z")
    art.data.uv_layers[0].name = "label"
    # the print gets more texels than the frame
    art["uv_scale"] = 2.2

# ---------------------------------------------------------------- bookshelf

sx_, sw, sh, sd, st = SHELF["x"], SHELF["w"], SHELF["h"], SHELF["d"], SHELF["t"]
shelf_z = WALL_Z + sd / 2 + 0.01
sp = [
    box("side_l", (st, sh, sd), (sx_ - sw / 2 + st / 2, sh / 2, shelf_z), M["shelf"], "furniture", bev=0.003),
    box("side_r", (st, sh, sd), (sx_ + sw / 2 - st / 2, sh / 2, shelf_z), M["shelf"], "furniture", bev=0.003),
    box("top", (sw, st, sd), (sx_, sh - st / 2, shelf_z), M["shelf"], "furniture", bev=0.003),
    box("back", (sw - 2 * st, sh - st, 0.01), (sx_, (sh - st) / 2, shelf_z - sd / 2 + 0.005), M["shelf"], "furniture", bev=0.001),
    box("kick", (sw - 2 * st, 0.06, 0.02), (sx_, 0.03, shelf_z + sd / 2 - 0.03), M["shelf"], "furniture", bev=0.002),
]
for i, y in enumerate(SHELF["rows"]):
    sp.append(box(f"board{i}", (sw - 2 * st, st, sd - 0.012), (sx_, y - st / 2, shelf_z + 0.006), M["shelf"], "furniture", bev=0.002))
join("bookshelf", sp)

# ---------------------------------------------------------------- books

FONTS = [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf",
    "/System/Library/Fonts/Supplemental/GillSans.ttc",
    "/System/Library/Fonts/Supplemental/Baskerville.ttc",
    "/System/Library/Fonts/Avenir Next Condensed.ttc",
]
FILLER = ["#4A5161", "#8C7B6B", "#C9C2B2", "#5F6F64", "#7A4B45", "#2F3542", "#A1876A", "#3E4A5C"]


def lum(h):
    r, g, b = hexc(h)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def render_label(i, text, color, thick, height):
    """Render a spine with Cycles in a scratch scene and return the image."""
    H = 1024
    Wp = max(96, round(H * thick / height))
    path = os.path.join(OUT, f"spine_{i:02d}.png")
    ls = bpy.data.scenes.new(f"label{i}")
    ls.render.engine = "CYCLES"
    ls.cycles.device = "GPU"
    ls.cycles.samples = 16
    ls.render.resolution_x = Wp
    ls.render.resolution_y = H
    ls.render.film_transparent = False
    ls.view_settings.view_transform = "Standard"
    ls.render.image_settings.file_format = "PNG"
    ls.render.filepath = path
    w_ = bpy.data.worlds.new(f"lw{i}")
    w_.node_tree.nodes["Background"].inputs[1].default_value = 0
    ls.world = w_
    cam = bpy.data.cameras.new(f"lc{i}")
    cam.type = "ORTHO"
    cam.ortho_scale = max(thick, height)
    co = bpy.data.objects.new(f"lc{i}", cam)
    ls.collection.objects.link(co)
    co.location = (0, 0, 1)
    ls.camera = co
    bg = emission(f"lbg{i}", color, 1.0)
    ink = "#1A1D25" if lum(color) > 0.25 else "#F2EEE4"
    fg = emission(f"lfg{i}", ink, 1.0)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(thick, height, 1), verts=bm.verts)
    me = bpy.data.meshes.new(f"lp{i}")
    bm.to_mesh(me)
    bm.free()
    p = bpy.data.objects.new(f"lp{i}", me)
    me.materials.append(bg)
    ls.collection.objects.link(p)
    # two thin rules near the ends, like a cloth binding
    for yy in (height / 2 - 0.035, -height / 2 + 0.035):
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        bmesh.ops.scale(bm, vec=(thick, 0.0025, 1), verts=bm.verts)
        me = bpy.data.meshes.new("rule")
        bm.to_mesh(me)
        bm.free()
        r = bpy.data.objects.new("rule", me)
        me.materials.append(fg)
        r.location = (0, yy, 0.001)
        ls.collection.objects.link(r)
    if text:
        cu = bpy.data.curves.new(f"lt{i}", "FONT")
        cu.body = text
        cu.align_x = "CENTER"
        cu.align_y = "CENTER"
        cu.font = bpy.data.fonts.load(FONTS[i % len(FONTS)], check_existing=True)
        cu.size = 1.0
        t = bpy.data.objects.new(f"lt{i}", cu)
        t.data.materials.append(fg)
        coll.objects.link(t)
        bpy.context.view_layer.update()
        tw, th = t.dimensions.x, t.dimensions.y
        coll.objects.unlink(t)
        ls.collection.objects.link(t)
        t.rotation_euler = (0, 0, math.pi / 2)
        t.location = (0, 0, 0.002)
        cu.size = min((height - 0.1) / max(tw, 1e-6), thick * 0.5 / max(th, 1e-6))
    bpy.ops.render.render(write_still=True, scene=ls.name)
    img = bpy.data.images.load(path, check_existing=False)
    bpy.data.scenes.remove(ls)
    return img


def spine_mat(i, text, color, thick, height):
    n = N(f"spine{i}")
    img = render_label(i, text, color, thick, height)
    tex = n.node("ShaderNodeTexImage")
    tex.image = img
    uv = n.node("ShaderNodeUVMap")
    uv.uv_map = "label"
    n.link(uv.outputs["UV"], tex.inputs["Vector"])
    n.link(tex.outputs["Color"], n.bsdf.inputs["Base Color"])
    n.set("Roughness", 0.55)
    return n.m


def cover_mat(name, color):
    return textured(name, color, rough=0.6, scale=900, amount=0.06, bump=0.12)


def book(name, thick, h, d, at, color, spine_text=None, idx=0, lying=False):
    """A hardback: spine faces the room (+z), pages on top, bottom and back."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(thick, d, h), verts=bm.verts)
    o = obj_from_bm(name, bm, [cover_mat(f"{name}_cover", color), M["pages"]], "books")
    if spine_text is not None:
        o.data.materials.append(spine_mat(idx, spine_text, color, thick, h))
    else:
        o.data.materials.append(o.data.materials[0])
    for f in o.data.polygons:
        n = f.normal
        if n.y < -0.9:
            f.material_index = 2  # spine, towards three +z
        elif abs(n.x) > 0.9:
            f.material_index = 0  # boards
        else:
            f.material_index = 1  # page edges
    # label uv: spine face spans x (thickness) and z (height)
    uv = o.data.uv_layers.new(name="label")
    for f in o.data.polygons:
        for li in f.loop_indices:
            co = o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv = ((co.x + thick / 2) / thick, (co.z + h / 2) / h)
    o.location = V(*at)
    o["spine_face"] = 2
    return bevel(o, 0.0015, 2)


def fill_shelves():
    inner = sw - 2 * st - 0.02
    r2 = random.Random(7)
    for r, y in enumerate(SHELF["rows"]):
        row = [{"proj": i} for i, b in enumerate(BOOKS) if b["row"] == r]
        for _ in range(3 + r2.randrange(3)):
            row.insert(r2.randrange(len(row) + 1), {"proj": -1})
        for b in row:
            b["thick"] = 0.05 + r2.random() * 0.014 if b["proj"] >= 0 else 0.022 + r2.random() * 0.026
            b["gap"] = 0.035 if r2.random() > 0.8 else 0.003
        used = sum(b["thick"] + b["gap"] for b in row)
        x = -inner / 2 + max(0, (inner - used) * (0.75 if r % 2 else 0.1))
        for j, b in enumerate(row):
            proj = b["proj"] >= 0
            h = 0.28 + r2.random() * 0.07 if proj else 0.2 + r2.random() * 0.13
            d = 0.2 + r2.random() * 0.05
            color = BOOKS[b["proj"]]["color"] if proj else FILLER[r2.randrange(len(FILLER))]
            at = (sx_ + x + b["thick"] / 2, y + h / 2, shelf_z + sd / 2 - d / 2 - 0.02)
            if proj:
                book(f"book_{b['proj']:02d}", b["thick"], h, d, at, color, BOOKS[b["proj"]]["spine"], b["proj"])
            else:
                book(f"filler_{r}_{j}", b["thick"], h, d, at, color)
            x += b["thick"] + b["gap"]
    # a small stack lying on top of the bookshelf
    yy = sh
    for k, (t, w_, d_, c) in enumerate([(0.035, 0.24, 0.17, "#7A4B45"), (0.028, 0.21, 0.15, "#C9C2B2"), (0.04, 0.19, 0.14, "#2F3542")]):
        o = book(f"stack_{k}", t, w_, d_, (0, 0, 0), c)
        o.rotation_euler = rot_three((0, 0.08 * (k - 1), math.pi / 2))
        o.location = V(sx_ - 0.18, yy + t / 2, shelf_z + 0.02)
        yy += t


fill_shelves()

# ---------------------------------------------------------------- the things that make it my room

# Basketball, a shield, a world map and a game controller: the hobbies from the "Chi sono" stickers.
# They share the "decor" atlas.


def math_node(n, op, a, b=None):
    m = n.node("ShaderNodeMath", operation=op)
    for sock, v in zip(m.inputs, (a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            sock.default_value = v
        else:
            n.link(v, sock)
    return m.outputs[0]


def band(n, v, at, w):
    """1 where |v - at| < w, for a painted line."""
    return math_node(n, "LESS_THAN", math_node(n, "ABSOLUTE", math_node(n, "SUBTRACT", v, at)), w)


BALL_R = 0.12


def basketball_mat():
    n = N("basketball")
    tc = n.node("ShaderNodeTexCoord")
    sep = n.node("ShaderNodeSeparateXYZ")
    n.link(tc.outputs["Object"], sep.inputs[0])
    x, y = sep.outputs["X"], sep.outputs["Y"]
    w = 0.0032
    # two great circles crossing at the poles, plus the two curved seams on the sides, which bow
    # towards the middle as they near the poles: |x| = R (0.74 - 0.38 (y / R)^2)
    seams = math_node(n, "MAXIMUM", band(n, x, 0.0, w), band(n, y, 0.0, w))
    y2 = math_node(n, "POWER", math_node(n, "DIVIDE", y, BALL_R), 2.0)
    curve = math_node(n, "MULTIPLY", math_node(n, "SUBTRACT", 0.74, math_node(n, "MULTIPLY", y2, 0.38)), BALL_R)
    seams = math_node(n, "MAXIMUM", seams, band(n, math_node(n, "ABSOLUTE", x), curve, w))
    # pebbled leather
    vor = n.node("ShaderNodeTexVoronoi")
    n.link(tc.outputs["Object"], vor.inputs["Vector"])
    vor.inputs["Scale"].default_value = 1400
    nz = n.noise(tc.outputs["Object"], scale=40, detail=4)
    _, f, a, b, leather = mix(n)
    n.link(nz.outputs["Fac"], f)
    a.default_value = (*hexc("#A9481F"), 1)
    b.default_value = (*hexc("#CF6A35"), 1)
    _, f2, a2, b2, col = mix(n)
    n.link(seams, f2)
    n.link(leather, a2)
    b2.default_value = (*hexc("#16120F"), 1)
    n.link(col, n.bsdf.inputs["Base Color"])
    n.set("Roughness", 0.72)
    # seams sit a little lower than the pebbles
    h = math_node(n, "SUBTRACT", vor.outputs["Distance"], math_node(n, "MULTIPLY", seams, 1.5))
    n.bump(h, strength=0.45, distance=0.0012)
    return n.m


SHIELD_R = 0.2


def shield_mat():
    n = N("shield")
    tc = n.node("ShaderNodeTexCoord")
    sep = n.node("ShaderNodeSeparateXYZ")
    n.link(tc.outputs["Object"], sep.inputs[0])
    cmb = n.node("ShaderNodeCombineXYZ")
    n.link(sep.outputs["X"], cmb.inputs["X"])
    n.link(sep.outputs["Y"], cmb.inputs["Y"])
    ln = n.node("ShaderNodeVectorMath", operation="LENGTH")
    n.link(cmb.outputs[0], ln.inputs[0])
    k = math_node(n, "DIVIDE", ln.outputs["Value"], SHIELD_R)
    col = n.ramp(k, [(0.0, "#1C3670"), (0.385, "#A01F27"), (0.605, "#E3DDD0"), (0.805, "#A01F27")])
    col.node.color_ramp.interpolation = "CONSTANT"
    # a little wear on the paint
    nz = n.noise(tc.outputs["Object"], scale=90, detail=8)
    _, f, a, b, out = mix(n, "MULTIPLY")
    f.default_value = 0.12
    n.link(col, a)
    n.link(nz.outputs["Color"], b)
    n.link(out, n.bsdf.inputs["Base Color"])
    n.set("Roughness", 0.36)
    n.set("Metallic", 0.35)
    n.set("Coat Weight", 0.3)
    return n.m


def dome(r):
    return 0.03 * (1 - (r / SHIELD_R) ** 2)


# a shallow dome with a groove between the rings
profile = [(0.0, dome(0.0))]
for edge in (0.077, 0.121, 0.161):
    for r_, dip in ((edge - 0.004, 0.0), (edge, -0.0018), (edge + 0.004, 0.0)):
        profile.append((r_, dome(r_) + dip))
profile += [(SHIELD_R - 0.003, dome(SHIELD_R - 0.003)), (SHIELD_R, -0.002), (SHIELD_R - 0.004, -0.007), (0.0, -0.007)]
shield = lathe("shield", profile, (0, 0, 0), shield_mat(), "decor", steps=96)
# the star in the middle, cut from the same steel
bm = bmesh.new()
pts = []
for i in range(10):
    a = math.pi / 2 + i * math.pi / 5
    r_ = 0.072 if i % 2 == 0 else 0.028
    pts.append(bm.verts.new((r_ * math.cos(a), r_ * math.sin(a), dome(0.0) - 0.0005)))
face = bm.faces.new(pts)
ext = bmesh.ops.extrude_face_region(bm, geom=[face])
bmesh.ops.translate(bm, vec=(0, 0, 0.003), verts=[v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
star = obj_from_bm("shield_star", bm, [plain("shield_star", "#E3DDD0", rough=0.36, metal=0.35, coat=0.3)], "decor")
shield = join("shield", [shield, star])
# on the floor under the window, leaning back against the wall
lean = 0.25
shield.rotation_euler = (0, math.pi / 2 - lean, 0)
shield.location = V(W0 + SHIELD_R * math.sin(lean) + 0.018, SHIELD_R * math.cos(lean) + 0.01, WIN["z"] + 0.05)

# basketball on the floor between the desk and the bookshelf
ball = sphere("basketball", BALL_R, (0.7, BALL_R, -0.08), basketball_mat(), "decor", seg=64)
ball.rotation_euler = (0.35, 0.15, 0.5)
ball["uv_scale"] = 1.4

# world map on the back wall over the desk, where a pinboard used to be
MAP_W, MAP_H = 0.75, 0.42
mx, my = DESK["x"] + 0.42, 1.52
map_parts = [
    box("map_t", (MAP_W + 2 * FR, FR, 0.02), (mx, my + MAP_H / 2 + FR / 2, WALL_Z + 0.01), M["shelf"], "decor", bev=0.002),
    box("map_b", (MAP_W + 2 * FR, FR, 0.02), (mx, my - MAP_H / 2 - FR / 2, WALL_Z + 0.01), M["shelf"], "decor", bev=0.002),
    box("map_l", (FR, MAP_H, 0.02), (mx - MAP_W / 2 - FR / 2, my, WALL_Z + 0.01), M["shelf"], "decor", bev=0.002),
    box("map_r", (FR, MAP_H, 0.02), (mx + MAP_W / 2 + FR / 2, my, WALL_Z + 0.01), M["shelf"], "decor", bev=0.002),
]
join("map_frame", map_parts)
world_map = plane("world_map", MAP_W, MAP_H, (mx, my, WALL_Z + 0.014), poster_mat("world_map"), "decor", "+z")
world_map.data.uv_layers[0].name = "label"
world_map["uv_scale"] = 2.2

# game controller lying on the free end of the third shelf
gx, gy, gz = sx_ - 0.27, SHELF["rows"][1], shelf_z + 0.04
pad = textured("pad", "#2A2D34", rough=0.5, scale=600, amount=0.05, bump=0.04)
pad_dark = plain("pad_dark", "#15171B", rough=0.45)
parts = [box("pad_body", (0.098, 0.026, 0.052), (gx, gy + 0.016, gz - 0.004), pad, "decor", bev=0.012, seg=4)]
for side in (-1, 1):
    g = sphere(f"pad_grip{side}", 1.0, (gx + side * 0.047, gy + 0.016, gz + 0.016), pad, "decor", scale=(0.024, 0.0135, 0.04), seg=32)
    g.rotation_euler = rot_three((0, side * 0.38, 0))
    parts.append(g)
    parts.append(cylinder(f"pad_stick{side}", 0.0085, 0.01, (gx + side * 0.019, gy + 0.031, gz + 0.012), pad_dark, "decor", verts=24, bev=0.001))
    parts.append(cylinder(f"pad_cap{side}", 0.0105, 0.004, (gx + side * 0.019, gy + 0.037, gz + 0.012), pad_dark, "decor", verts=24, bev=0.0015))
parts += [
    box("pad_dpad_a", (0.022, 0.004, 0.0072), (gx - 0.037, gy + 0.03, gz - 0.008), pad_dark, "decor", bev=0.001),
    box("pad_dpad_b", (0.0072, 0.004, 0.022), (gx - 0.037, gy + 0.03, gz - 0.008), pad_dark, "decor", bev=0.001),
]
for i, (ox, oz, c) in enumerate([(0, 0.0085, "#3E8A4A"), (0.0085, 0, "#B23A33"), (-0.0085, 0, "#3A5FA8"), (0, -0.0085, "#C9A23A")]):
    parts.append(sphere(f"pad_btn{i}", 0.0042, (gx + 0.037 + ox, gy + 0.029, gz - 0.008 + oz), plain(f"pad_btn{i}", c, rough=0.3, coat=0.4), "decor", seg=16))
controller = join("controller", parts)
controller["uv_density"] = 1.6
set_origin(controller, (gx, gy, gz))
controller.rotation_euler = rot_three((0, 0.45, 0))
controller.scale = (1.25, 1.25, 1.25)

# Iron Man: a Mark I arc reactor on a little display stand, on the free right end of the
# second shelf from the top.
# Built facing Blender +Z around the origin, then stood up towards the room.


def local_box(name, size, at, angle, mat, bev=0.0008):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(angle, 3, "Z"), verts=bm.verts)
    bmesh.ops.translate(bm, vec=at, verts=bm.verts)
    return bevel(obj_from_bm(name, bm, [mat], "decor"), bev, 2)


ARC_R = 0.066
copper = plain("copper", "#B4693A", rough=0.28, metal=1.0)
arc_glow = emission("arc_glow", "#8FDFFF", 10.0)
arc_core = emission("arc_core", "#E6FAFF", 22.0)
arc = [
    # steel casing: a shallow can with a raised lip
    lathe("arc_case", [(0.0, -0.012), (ARC_R, -0.012), (ARC_R + 0.002, -0.008), (ARC_R + 0.002, 0.008), (ARC_R - 0.004, 0.011), (ARC_R - 0.007, 0.006), (0.0, 0.004)], (0, 0, 0), M["alu_dark"], "decor", steps=64),
    # the glowing ring the coils sit on
    lathe("arc_ring", [(0.019, 0.006), (0.027, 0.006), (0.027, 0.009), (0.019, 0.009)], (0, 0, 0), arc_glow, "decor", steps=64),
    # the core under a steel collar
    lathe("arc_collar", [(0.0115, 0.006), (0.019, 0.006), (0.0175, 0.0145), (0.0115, 0.0145)], (0, 0, 0), M["alu"], "decor", steps=48),
    lathe("arc_core", [(0.0, 0.0135), (0.0115, 0.0135), (0.0, 0.0155)], (0, 0, 0), arc_core, "decor", steps=48),
]
# ten copper coils wound around the ring
for i in range(10):
    a = i * math.tau / 10
    c = Vector((math.cos(a), math.sin(a), 0)) * 0.043
    # each coil is a stack of rounded windings, so the wire reads in the light
    for k in range(7):
        r_ = 0.0315 + k * 0.0037
        w_ = Vector((math.cos(a), math.sin(a), 0)) * r_
        arc.append(local_box(f"arc_coil{i}_{k}", (0.0034, 0.0135, 0.0125), (w_.x, w_.y, 0.0112), a, copper, bev=0.0014))
    # the wire between the coils, steel spokes
    s_ = Vector((math.cos(a + math.pi / 10), math.sin(a + math.pi / 10), 0)) * 0.043
    arc.append(local_box(f"arc_spoke{i}", (0.02, 0.003, 0.004), (s_.x, s_.y, 0.008), a + math.pi / 10, M["alu"]))
reactor = join("arc_reactor", arc)
ax_, az_ = sx_ + 0.3, shelf_z + 0.04
top_y = SHELF["rows"][2] + 0.012
reactor.location = V(ax_, top_y + ARC_R + 0.012, az_)
# stood up and leaning back a little, turned towards the room
reactor.rotation_euler = (math.pi / 2 - 0.22, 0, -0.35)
reactor["uv_density"] = 2.0
# a black acrylic stand: base and a lip that holds the bottom of the reactor
stand = join(
    "arc_stand",
    [
        box("arc_stand_base", (0.12, 0.012, 0.08), (ax_, top_y - 0.006, az_), M["plastic_black"], "decor", bev=0.003),
        box("arc_stand_lip", (0.08, 0.016, 0.012), (ax_, top_y + 0.008, az_ + 0.028), M["plastic_black"], "decor", bev=0.003),
    ],
)
stand.rotation_euler = rot_three((0, 0.35, 0))
set_origin(stand, (ax_, top_y, az_))
stand.rotation_euler = rot_three((0, 0.35, 0))

# ---------------------------------------------------------------- Clawd

# Built around its own origin (bottom centre), then placed on the desk.
CW, CH, CD = 0.17, 0.092, 0.1
LEG = 0.03
body = box("clawd_body", (CW, CH, CD), (0, LEG + CH / 2, 0), M["clawd"], "props", bev=0.008, seg=4)
legs = []
for lxp in (-0.062, -0.034, 0.034, 0.062):
    legs.append(box(f"cl_leg{lxp}", (0.016, LEG + 0.01, 0.05), (lxp, (LEG + 0.01) / 2, 0.0), M["clawd"], "props", bev=0.004))
clawd_body = join("clawd_body", [body] + legs)
eyes = join(
    "clawd_eyes",
    [box(f"cl_eye{ex}", (0.013, 0.03, 0.006), (ex, LEG + CH * 0.68, CD / 2 + 0.0015), M["clawd_eye"], "props", bev=0.002) for ex in (-0.036, 0.036)],
)
set_origin(eyes, (0, LEG + CH * 0.68, CD / 2))
arms = []
for side in (-1, 1):
    a = box(f"clawd_arm_{'l' if side < 0 else 'r'}", (0.032, 0.03, 0.06), (side * (CW / 2 + 0.012), LEG + CH * 0.36, 0), M["clawd"], "props", bev=0.006)
    set_origin(a, (side * (CW / 2 - 0.006), LEG + CH * 0.36, 0))
    arms.append(a)
clawd = empty("clawd", (0, 0, 0))
for o in [clawd_body, eyes] + arms:
    parent(o, clawd)
clawd.location = V(dx - 0.4, top, DESK_Z + 0.07)
clawd.rotation_euler = rot_three((0, 0.42, 0))

# ---------------------------------------------------------------- cables

def cable(name, pts, r=0.003):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp_ = cu.splines.new("BEZIER")
    sp_.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp_.bezier_points, pts):
        bp.co = V(*p)
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, cu)
    coll.objects.link(o)
    o.data.materials.append(M["cable"])
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    m = bpy.data.objects.new(name, me)
    coll.objects.link(m)
    bpy.data.objects.remove(o)
    m["atlas"] = "furniture"
    m.data.shade_smooth()
    return m


cable("cable_monitor", [(mx, top + 0.15, mz - 0.05), (mx + 0.05, top + 0.02, mz - 0.1), (mx + 0.12, top + 0.004, WALL_Z + 0.06), (mx + 0.2, top - 0.05, WALL_Z + 0.03), (mx + 0.25, 0.3, WALL_Z + 0.03), (mx + 0.3, 0.004, WALL_Z + 0.08)])
cable("cable_lamp", [(lx, top + 0.01, lz - 0.07), (lx - 0.03, top + 0.004, WALL_Z + 0.04), (lx - 0.06, top - 0.06, WALL_Z + 0.02), (lx - 0.1, 0.004, WALL_Z + 0.06)])

# ---------------------------------------------------------------- lights

win_light = bpy.data.lights.new("window", "AREA")
win_light.shape = "RECTANGLE"
win_light.size = WIN["w"]
win_light.size_y = WIN["h"]
win_light.energy = 55
win_light.color = hexc("#9EA9DA")
wl = bpy.data.objects.new("window", win_light)
coll.objects.link(wl)
wl.location = V(W0 - dpt + 0.005, WIN["y"], WIN["z"])
wl.rotation_euler = Vector((1, 0, 0)).to_track_quat("-Z", "Y").to_euler()  # shine along three +x

fill = bpy.data.lights.new("fill", "AREA")
fill.shape = "RECTANGLE"
fill.size = 2.5
fill.size_y = 2.5
fill.energy = 24
fill.color = hexc("#C7B9A8")
fo = bpy.data.objects.new("fill", fill)
coll.objects.link(fo)
fo.location = V(0.4, CEIL - 0.02, 1.4)

# ---------------------------------------------------------------- preview renders

POSES = {
    "ciao": ((1.55, 1.75, 3.35), (0.4, 0.88, -0.3), 38),
    "lavori": ((0.62, 1.12, 2.15), (1.3, 0.98, -0.45), 46),
    "posters": ((-0.3, 1.6, 1.4), (-0.85, 1.6, -0.62), 46),
    "decor": ((0.3, 1.25, 1.6), (1.7, 1.0, -0.1), 50),
    "metodo": ((-0.12, 1.32, 0.62), (-0.22, 1.0, -0.42), 46),
    "chi": ((0.55, 1.05, 0.55), (0.2, 0.86, -0.3), 46),
    "contatti": ((-0.25, 1.9, 2.2), (-0.4, 0.9, -0.2), 38),
}


def look(cam_o, p, t):
    cam_o.location = V(*p)
    cam_o.rotation_euler = (V(*t) - V(*p)).to_track_quat("-Z", "Y").to_euler()


if PREVIEW:
    cam = bpy.data.cameras.new("cam")
    cam.sensor_fit = "VERTICAL"
    co = bpy.data.objects.new("cam", cam)
    coll.objects.link(co)
    scene.camera = co
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 700
    scene.render.image_settings.file_format = "PNG"
    only = [a for a in argv if a in POSES] or list(POSES)
    for k in only:
        p, t, fov = POSES[k]
        cam.angle = math.radians(fov)
        look(co, p, t)
        scene.render.filepath = os.path.join(OUT, f"preview_{k}.png")
        bpy.ops.render.render(write_still=True)
        print("wrote", scene.render.filepath)
    sys.exit(0)

# ---------------------------------------------------------------- bake

for o in list(coll.objects):
    apply_modifiers(o)

ATLASES = {}
for o in coll.objects:
    if o.type == "MESH" and o.get("atlas"):
        ATLASES.setdefault(o["atlas"], []).append(o)


def unwrap(objs):
    for o in objs:
        me = o.data
        for l in list(me.uv_layers):
            if l.name != "label":
                me.uv_layers.remove(l)
        me.uv_layers.new(name="bake")
        me.uv_layers.active = me.uv_layers["bake"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale()
    # some surfaces matter more than others: spines get more pixels, the ceiling fewer
    for o in objs:
        bm = bmesh.from_edit_mesh(o.data)
        uvl = bm.loops.layers.uv["bake"]
        k = o.get("uv_scale", 1.0)
        spine = o.get("spine_face")
        # small curved props close to the camera ask for more texels as a whole (islands stay intact)
        dens = o.get("uv_density", 1.0)
        if dens != 1.0:
            for f in bm.faces:
                for l in f.loops:
                    l[uvl].uv *= dens
        for f in bm.faces:
            kk = k * (2.6 if spine is not None and f.material_index == spine else 1.0)
            if kk == 1.0:
                continue
            c = sum((l[uvl].uv for l in f.loops), Vector((0, 0))) / len(f.loops)
            for l in f.loops:
                l[uvl].uv = c + (l[uvl].uv - c) * kk
        bmesh.update_edit_mesh(o.data)
    bpy.ops.uv.pack_islands(rotate=True, margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")


# the posters fill a small atlas on their own; everything else uses the full size
ATLAS_RES = {"posters": RES // 2}


def bake(name, objs):
    res = ATLAS_RES.get(name, RES)
    size = res * SS
    img = bpy.data.images.new(f"bake_{name}", size, size, float_buffer=True, alpha=False)
    for o in objs:
        # every object gets its own copy of its materials so the target node is unique
        for slot in o.material_slots:
            m = slot.material.copy()
            slot.material = m
            tn = m.node_tree.nodes.new("ShaderNodeTexImage")
            tn.image = img
            uvn = m.node_tree.nodes.new("ShaderNodeUVMap")
            uvn.uv_map = "bake"
            m.node_tree.links.new(uvn.outputs["UV"], tn.inputs["Vector"])
            m.node_tree.nodes.active = tn
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    scene.cycles.samples = SAMPLES
    scene.render.bake.margin = 6 * SS
    scene.render.bake.margin_type = "EXTEND"
    print(f"baking {name}: {len(objs)} objects at {size}px, {SAMPLES} samples")
    t0 = time.time()
    bpy.ops.object.bake(type="COMBINED", use_clear=True)
    print(f"  baked {name} in {time.time() - t0:.0f}s")
    # apply the scene's view transform (AgX) so the texture is display ready
    path = os.path.join(OUT, f"bake_{name}.png")
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "16"
    img.save_render(path, scene=scene)
    out = bpy.data.images.load(path, check_existing=False)
    out.name = f"room_{name}"
    if SS > 1:
        out.scale(res, res)
    return out


baked = {}
for name, objs in ATLASES.items():
    unwrap(objs)
    baked[name] = bake(name, objs)

# swap every material for a single unlit-ready one per atlas
for name, objs in ATLASES.items():
    m = bpy.data.materials.new(f"baked_{name}")
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    t = m.node_tree
    tex = t.nodes.new("ShaderNodeTexImage")
    tex.image = baked[name]
    t.links.new(tex.outputs["Color"], t.nodes["Principled BSDF"].inputs["Base Color"])
    t.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1.0
    for o in objs:
        me = o.data
        me.materials.clear()
        me.materials.append(m)
        for p in me.polygons:
            p.material_index = 0
        for l in list(me.uv_layers):
            if l.name != "bake":
                me.uv_layers.remove(l)

# lights and helpers stay out of the GLB
for o in list(coll.objects):
    if o.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(o)


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_image_format="WEBP",
        export_image_quality=86,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=False,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_texcoord_quantization=14,
    )
    print("wrote", path, os.path.getsize(path) // 1024, "KB")


models = os.path.join(ROOT, "public", "models")
export(os.path.join(models, "room.glb"))
# phones get half size textures
for img in baked.values():
    img.scale(img.size[0] // 2, img.size[1] // 2)
export(os.path.join(models, "room-mobile.glb"))
