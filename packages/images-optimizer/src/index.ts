import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { extname, join, resolve, sep } from 'pathe'
import { filename } from 'pathe/utils'
import sharp, { type FormatEnum } from 'sharp'
import { DEFAULT_OPTIONS, type Options } from './constants'
import { merge, readAllFiles } from './utils'

export async function OptimizeImage(entryPath: string, optionsParam: Options = {}) {
  const options: Options = merge(optionsParam, DEFAULT_OPTIONS)

  /* SVGO transformation */
  const optimizeSVGO = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const { optimize } = await import('svgo')
    return Buffer.from(
      optimize(buffer.toString(), {
        path: filePath,
        ...options.svg,
      }).data
    )
  }

  /* Sharp transformation */
  const optimizeImages = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const extName: string = extname(filePath).replace('.', '').toLowerCase()
    return await sharp(buffer, { animated: extName === 'gif' })
      .toFormat(extName as keyof FormatEnum, options[extName])
      .toBuffer()
  }

  /* Optimize file process */
  const processFile = async (filePath: string, buffer: Buffer) => {
    try {
      const engine = /\.svg$/.test(filePath) ? optimizeSVGO : optimizeImages
      return await engine(filePath, buffer)
    } catch {
      throw new Error('Optimization process error!')
    }
  }

  const getFilesToProcess = (allFiles: string[]) => {
    return allFiles.reduce((acc: string[], filePath: string) => {
      if (options.test?.test(filePath)) acc.push(filePath)
      return acc
    }, [])
  }

  const directory = resolve(entryPath)
  const allFiles: string[] = readAllFiles(directory)
  const files: string[] = getFilesToProcess(allFiles)

  if (files.length === 0) return console.error('No files found!')
  const handles = files.map(async (publicFilePath: string) => {
    const filePath: string = publicFilePath.replace(directory + sep, '')
    const fullFilePath: string = join(directory, filePath)
    if (fs.existsSync(fullFilePath) === false) return

    console.log(`Optimizing file: ${filename(filePath)}`)
    const buffer: Buffer = await fsp.readFile(directory + sep + filePath)
    const content = await processFile(filePath, buffer)

    if (content.length > 0) {
      await fsp.writeFile(fullFilePath, content)
    }
  })
  await Promise.all(handles)

  return console.log('Finish!')
}
