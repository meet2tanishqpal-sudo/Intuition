"""Acquire a small, georeferenced grayscale raster; no full mosaic download."""
import os, json, math, pathlib, concurrent.futures, threading, time
os.environ['GDAL_DISABLE_READDIR_ON_OPEN']='EMPTY_DIR'
os.environ['CPL_VSIL_CURL_ALLOWED_EXTENSIONS']='.tif'
os.environ['GDAL_HTTP_TIMEOUT']='25'
os.environ['GDAL_HTTP_MAX_RETRY']='1'
import numpy as np
import rasterio
from rasterio.windows import Window
from rasterio.warp import transform_bounds
from pyproj import CRS, Transformer
from PIL import Image
start=time.monotonic()
source='https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif'
terrain=json.loads(pathlib.Path('public/data/terrain-local.json').read_text())
b=terrain['bounds']; width,height=1024,768
with rasterio.open('/vsicurl/'+source) as ds:
    transform=ds.transform; crs=ds.crs; geo=CRS.from_wkt(crs.to_wkt()).geodetic_crs
    source_bounds=transform_bounds(crs,geo,*ds.bounds)
    nodata=ds.nodata
projection=Transformer.from_crs(geo,crs,always_xy=True)
lons=b['west']+(np.arange(width)+.5)/width*(b['east']-b['west'])
lats=b['north']-(np.arange(height)+.5)/height*(b['north']-b['south'])
x,_=projection.transform(lons,np.full(width,-4.5895)); _,y=projection.transform(np.full(height,137.4417),lats)
cols=np.floor((x-transform.c)/transform.a).astype(int); rows=np.floor((y-transform.f)/transform.e).astype(int)
thread=threading.local()
def sample(row):
    if time.monotonic()-start>360: raise TimeoutError('Imagery acquisition cap reached')
    if not hasattr(thread,'ds'):thread.ds=rasterio.open('/vsicurl/'+source)
    v=thread.ds.read(1,window=Window(int(cols.min()),int(row),int(cols.max()-cols.min()+1),1))[0]
    return v[cols-cols.min()]
arr=np.zeros((height,width),dtype=np.uint8)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for i,v in enumerate(pool.map(sample,rows)):
        arr[i]=v
        if i%100==0:print('imagery rows',i,'seconds',round(time.monotonic()-start),flush=True)
rgba=np.stack([arr,arr,arr,np.where(arr==nodata,0,255).astype(np.uint8)],axis=-1)
Image.fromarray(rgba).save('public/data/orthophoto-local.png',optimize=True)
metadata={'source':source,'catalogue':'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm','sourceCRS':crs.to_wkt(),'sourceTransform':list(transform)[:6],'sourceBounds':dict(zip(['west','south','east','north'],source_bounds)),'sourceNoData':nodata,'bounds':b,'width':width,'height':height,'displayCellMeters':12000/width,'processing':'Nearest source pixel at each output cell centre; grayscale unchanged; alpha 0 where source NoData=0. UI tint is cartographic, not true colour.','validSampledCells':int((arr!=nodata).sum()),'totalSampledCells':int(arr.size),'authors':'Fred J. Calef III and Timothy Parker; NASA/JPL-Caltech, USGS, University of Arizona; CTX NASA/JPL/MSSS and HRSC ESA/DLR/FU Berlin','acquiredUTC':'2026-11-15'}
pathlib.Path('public/data/imagery-provenance.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
terrain['imageFile']='orthophoto-local.png'
pathlib.Path('public/data/terrain-local.json').write_text(json.dumps(terrain,separators=(',',':')),encoding='utf8')
print('SAVED image',width,height,'valid',metadata['validSampledCells'],'seconds',round(time.monotonic()-start),flush=True)
