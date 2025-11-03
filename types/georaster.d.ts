declare module 'georaster' {
  interface GeoRaster {
    height: number;
    width: number;
    numberOfRasters: number;
    pixelHeight: number;
    pixelWidth: number;
    projection: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    noDataValue: number | null;
    mins: number[];
    maxs: number[];
    ranges: number[];
    getValues(options?: { left?: number; top?: number; right?: number; bottom?: number }): number[][];
  }

  function parseGeoraster(data: ArrayBuffer | File | string): Promise<GeoRaster>;
  
  export default parseGeoraster;
  export { GeoRaster };
}

declare module 'georaster-layer-for-leaflet' {
  import * as L from 'leaflet';
  import { GeoRaster } from 'georaster';

  interface GeoRasterLayerOptions {
    georaster: GeoRaster;
    opacity?: number;
    pixelValuesToColorFn?: (values: number[]) => string | null;
    resolution?: number;
  }

  class GeoRasterLayer extends L.Layer {
    constructor(options: GeoRasterLayerOptions);
    getBounds(): L.LatLngBounds;
  }

  export default GeoRasterLayer;
}
