import type { FormatEnum } from 'sharp';
import type { Options } from './constants';
import sharp from 'sharp';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DEFAULT_OPTIONS, CACHE_LOCATION } from './constants';
import { resolve, extname, join, dirname, sep } from 'pathe';
import { merge, readAllFiles } from './utils';

async function ImageOptimizer(outputPath: string, optionsParam: Options = {}) {
  const options: Options = merge(optionsParam, DEFAULT_OPTIONS);

  /* SVGO transformation */
  const optimizeSVGO = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const { optimize } = await import('svgo');
    return Buffer.from(
      optimize(buffer.toString(), {
        path: filePath,
        ...options.svg,
      }).data
    );
  };

  /* Sharp transformation */
  const optimizeImages = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const extName: string = extname(filePath).replace('.', '').toLowerCase();
    return await sharp(buffer, { animated: extName === 'gif' })
      .toFormat(extName as keyof FormatEnum, options[extName])
      .toBuffer();
  };

  /* Optimize file process */
  const processFile = async (filePath: string, buffer: Buffer) => {
    try {
      let newBuffer: Buffer;
      let isCached: boolean;

      if (!options.cacheLocation) throw new Error("Option 'cacheLocation' invalid!");

      const cachedFilePath = join(options.cacheLocation, filePath);
      if (options.cache === true && fs.existsSync(cachedFilePath)) {
        newBuffer = await fsp.readFile(cachedFilePath);
        isCached = true;
      } else {
        const engine = /\.svg$/.test(filePath) ? optimizeSVGO : optimizeImages;
        newBuffer = await engine(filePath, buffer);
        isCached = false;
      }
      if (options.cache === true && !isCached) {
        if (!fs.existsSync(dirname(cachedFilePath))) {
          await fsp.mkdir(dirname(cachedFilePath), { recursive: true });
        }
        await fsp.writeFile(cachedFilePath, newBuffer);
      }

      return {
        content: newBuffer,
      };
    } catch {
      return {};
    }
  };

  const getFilesToProcess = (allFiles: string[]) => {
    return allFiles.reduce((acc: string[], filePath: string) => {
      if (options.test?.test(filePath)) acc.push(filePath);
      return acc;
    }, []);
  };

  const directory = resolve(join('..', '..', outputPath));
  const allFiles: string[] = readAllFiles(directory);
  const files: string[] = getFilesToProcess(allFiles);

  if (files.length === 0) return console.error('No files found!');
  const handles = files.map(async (publicFilePath: string) => {
    const filePath: string = publicFilePath.replace(directory + sep, '');
    const fullFilePath: string = join(directory, filePath);
    if (fs.existsSync(fullFilePath) === false) return;

    const buffer: Buffer = await fsp.readFile(directory + sep + filePath);
    const { content } = await processFile(filePath, buffer);

    if (content && content.length > 0) {
      await fsp.writeFile(fullFilePath, content);
    }
  });
  await Promise.all(handles);

  return console.log('Finish!');
}

const outputPath = 'assets';
await ImageOptimizer(outputPath, { cache: true, cacheLocation: CACHE_LOCATION });
