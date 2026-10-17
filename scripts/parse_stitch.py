import json

with open('stitch_project.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

si = d.get('data', {}).get('screenInstances', [])
print(f"Total screenInstances in project: {len(si)}\n")

for i, s in enumerate(si):
    nid = s.get('id', '')
    source = s.get('sourceScreen', '')
    screen_id = source.split('/')[-1] if '/screens/' in source else nid
    w = s.get('width', 0)
    h = s.get('height', 0)
    label = s.get('label', '')
    stype = s.get('type', '')
    print(f"{i+1:02d}. [{stype}] screen_id: {screen_id:32} | {w}x{h} | label: {label[:60]}")
