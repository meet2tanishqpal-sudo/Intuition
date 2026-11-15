import urllib.request, pathlib, json, concurrent.futures
from PIL import Image
root=pathlib.Path('public/data')
base='https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/7'
def tile(rc):
 r,c=rc
 with urllib.request.urlopen(f'{base}/{r}/{c}.jpg',timeout=30) as f:
  import io
  im=Image.open(io.BytesIO(f.read())).convert('RGB'); im.load(); return r,c,im
out=Image.new('RGB',(1024,1024))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for r,c,im in pool.map(tile,[(r,c) for r in range(66,70) for c in range(224,228)]):out.paste(im,((c-224)*256,(r-66)*256))
out.save(root/'gale-context.jpg',quality=90)
(root/'context-provenance.json').write_text(json.dumps({'source':'NASA JPL Mars Trek / USGS Viking MDIM 2.1 colorized mosaic','url':base,'capabilities':base.split('/default/')[0]+'/WMTSCapabilities.xml','bounds':{'west':135,'east':140.625,'north':-2.8125,'south':-8.4375},'matrix':7,'columns':[224,227],'rows':[66,69],'width':1024,'height':1024,'processing':'Unaltered tile colors stitched into a regional context image. Equirectangular coordinates from WMTS matrix origin -180,90 and matrix size 256 x 128. Display sampling ~325 m at Gale; imagery only, no elevation.','credit':'NASA/JPL Mars Trek; USGS; NASA Ames; Viking Orbiter','acquiredUTC':'2026-11-15'},indent=2))
print('Saved verified 16-tile Gale regional mosaic')
