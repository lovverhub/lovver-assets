import type {
  PngOptions,
  JpegOptions,
  TiffOptions,
  GifOptions,
  WebpOptions,
  AvifOptions,
} from 'sharp';
import type { Config as SVGOConfig } from 'svgo';

export interface Options {
  /**
   * sharp opts for avif
   */
  avif?: AvifOptions;
  /**
   * cache optimized images or not
   */
  cache?: boolean;
  /**
   * path to the cache directory
   */
  cacheLocation?: string;
  /**
   * sharp opts for gif
   */
  gif?: GifOptions;
  /**
   * sharp opts for jpeg
   */
  jpeg?: JpegOptions;
  /**
   * sharp opts for jpg
   */
  jpg?: JpegOptions;
  /**
   * sharp opts for png
   */
  png?: PngOptions;
  /**
   * svgo opts
   */
  svg?: SVGOConfig;
  /**
   * test to match files against
   */
  test?: RegExp;
  /**
   * sharp opts for tiff
   */
  tiff?: TiffOptions;
  /**
   * sharp opts for webp
   */
  webp?: WebpOptions;
}

export const CACHE_LOCATION = __dirname + '../../../cache';
export const DEFAULT_OPTIONS = {
  avif: {
    // https://sharp.pixelplumbing.com/api-output#avif
    lossless: true,
  },

  cache: false,

  cacheLocation: undefined,

  // gif does not support lossless compression
  // https://sharp.pixelplumbing.com/api-output#gif
  gif: {},

  jpeg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  },

  jpg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  },

  png: {
    // https://sharp.pixelplumbing.com/api-output#png
    quality: 100,
  },
  svg: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          cleanupIDs: {
            minify: false,
            remove: false,
          },
          convertPathData: false,
          overrides: {
            cleanupNumericValues: false,
            removeViewBox: false, // https://github.com/svg/svgo/issues/1128
          },
        },
      },
      'sortAttrs',
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
        },
      },
    ],
  },
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  tiff: {
    // https://sharp.pixelplumbing.com/api-output#tiff
    quality: 100,
  },
  webp: {
    // https://sharp.pixelplumbing.com/api-output#webp
    lossless: true,
  },
};
