import fs from 'fs/promises'
import path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'data', 'images')

export function getImagesDir() {
  return IMAGES_DIR
}

export function getImageFilePath(imageUrlOrFilename: string) {
  const filename = path.basename(imageUrlOrFilename)
  return path.join(IMAGES_DIR, filename)
}

export async function imageExists(imageUrlOrFilename: string): Promise<boolean> {
  try {
    await fs.access(getImageFilePath(imageUrlOrFilename))
    return true
  } catch {
    return false
  }
}
