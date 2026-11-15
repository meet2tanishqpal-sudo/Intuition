"""Build small, explicitly resampled local grids from the published USGS GeoTIFF.

Uses remote range reads of selected rows, never downloads the full 3.6 GB source.
Requires rasterio, numpy, pyproj. Run from repository root with network access.
Output grid edges are planetocentric, east-positive coordinates. Each value is a
nearest-neighbour source sample at the output cell centre. Null is never filled.
"""
import concurrent.futures, json, math, os, pathlib, threading, time
os.environ['GDAL_DISABLE_READDIR_ON_OPEN']='EMPTY_DIR'
os.environ['CPL_VSIL_CURL_ALLOWED_EXTENSIONS']='.tif'
os.environ['GDAL_HTTP_TIMEOUT']='25'
os.environ['GDAL_HTTP_MAX_RETRY']='1'
os.environ['VSI_CACHE']='TRUE'
import numpy as np
import rasterio
from rasterio.windows import Window
from rasterio.warp import transform_bounds
from pyproj import Transformer, CRS

SOURCE='https://planetarymaps.usgs.gov/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif'
PAGE='https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m'
START=time.monotonic()
thread=threading.local()
with rasterio.open('/vsicurl/'+SOURCE) as ds:
    transform=ds.transform
    source_crs=ds.crs
    geographic=CRS.from_wkt(source_crs.to_wkt()).geodetic_crs
    bounds_geo=transform_bounds(source_crs,geographic,*ds.bounds)
    metadata={'url':SOURCE,'catalogue':PAGE,'sourceCRS':ds.crs.to_wkt(),'sourceTransform':list(ds.transform)[:6],'sourceShape':list(ds.shape),'sourceNodata':ds.nodata,'sourceBounds':dict(zip(['west','south','east','north'],bounds_geo)),'sourcePixelSizeMeters':1,'method':'Nearest-neighbour source samples at output cell centres; null outside source bounds or where sampled source value is NoData. Not a full-resolution coverage inventory.','acquiredUTC':'2026-11-15','authors':'Timothy Parker and Fred J. Calef III; JPL-Caltech / NASA / USGS / University of Arizona','productVersion':3}
    source_width,source_height=ds.width,ds.height
project=Transformer.from_crs(geographic,source_crs,always_xy=True)

def get_row(row):
    if time.monotonic()-START>750: raise TimeoutError('Acquisition capped at 12.5 minutes')
    if not hasattr(thread,'ds'): thread.ds=rasterio.open('/vsicurl/'+SOURCE)
    return row,thread.ds.read(1,window=Window(0,row,source_width,1))[0]

def acquire(name,width,height,half_width_km,half_height_km):
    lat,lon=-4.5895,137.4417
    dlat=half_height_km/3389.5*180/math.pi
    dlon=half_width_km/(3389.5*math.cos(math.radians(lat)))*180/math.pi
    bounds={'west':lon-dlon,'east':lon+dlon,'south':lat-dlat,'north':lat+dlat}
    xlon=np.linspace(bounds['west'],bounds['east'],width,endpoint=False)+(bounds['east']-bounds['west'])/width/2
    ylat=np.linspace(bounds['north'],bounds['south'],height,endpoint=False)-(bounds['north']-bounds['south'])/height/2
    x,_=project.transform(xlon,np.full(width,lat))
    _,y=project.transform(np.full(height,lon),ylat)
    cols=np.floor((x-transform.c)/transform.a).astype(int)
    rows=np.floor((y-transform.f)/transform.e).astype(int)
    col_valid=(cols>=0)&(cols<source_width)
    row_indices={int(row) for row in rows if 0<=row<source_height}
    sampled={}
    print(name,'requesting',len(row_indices),'source rows',flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for i,(row,values) in enumerate(pool.map(get_row,sorted(row_indices))):
            sampled[row]=values
            if i%60==0: print(name,'rows',i,'seconds',round(time.monotonic()-START),flush=True)
    out=np.full((height,width),np.nan)
    for i,row in enumerate(rows):
        if row not in sampled: continue
        vals=sampled[row][cols[col_valid]].astype(float)
        vals[(vals==metadata['sourceNodata'])|(~np.isfinite(vals))]=np.nan
        out[i,col_valid]=vals
    valid=np.isfinite(out)
    spacing=half_width_km*2000/width
    result={'width':width,'height':height,'bounds':bounds,'values':[round(float(v),1) if np.isfinite(v) else None for v in out.flat],'evidence':'derived','source':'USGS MSL Gale merged DEM v3 (2016), Parker & Calef','description':f'Nearest-sampled USGS merged DEM v3, tied to MOLA. {spacing:.1f} m display cells; source detail varies from HiRISE through CTX, HRSC and MOLA. Missing samples are masked.','resolution':f'{spacing:.1f} m display grid · variable source detail · not 1 m accuracy','min':math.floor(float(np.nanmin(out))/10)*10,'max':math.ceil(float(np.nanmax(out))/10)*10,'provenance':metadata,'coverage':{'validCells':int(valid.sum()),'totalCells':int(out.size),'fraction':float(valid.mean()),'displayCellMeters':spacing}}
    path=pathlib.Path('public/data')/name
    path.write_text(json.dumps(result,separators=(',',':')),encoding='utf8')
    print('SAVED',name,'valid',valid.sum(),'/',out.size,'range',np.nanmin(out),np.nanmax(out),'bytes',path.stat().st_size,flush=True)
    return result

local=acquire('terrain-local.json',512,384,6,4.5)
wide=acquire('terrain-coverage.json',640,480,20,15)
pathlib.Path('public/data/terrain-provenance.json').write_text(json.dumps({'source':metadata,'local':{k:v for k,v in local.items() if k not in ['values','provenance']},'coverage':{k:v for k,v in wide.items() if k not in ['values','provenance']}},indent=2),encoding='utf8')
print('COMPLETE seconds',round(time.monotonic()-START),flush=True)
