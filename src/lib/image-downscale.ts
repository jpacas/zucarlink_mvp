export interface DownscaledImage {
  blob: Blob
  extension: 'webp' | 'jpg'
  contentType: 'image/webp' | 'image/jpeg'
}

// Redimensiona la imagen a un máximo de `maxSize` px (lado mayor) manteniendo
// proporción y la comprime a WEBP (con fallback a JPEG). El servidor no aplica
// transformaciones (función de plan de pago no habilitada), así que escalamos en
// el cliente al subir. El recorte/encaje visual lo hace el CSS al mostrarla.
export async function downscaleImage(file: File, maxSize: number): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('No fue posible procesar la imagen.')
    }

    context.drawImage(bitmap, 0, 0, width, height)

    // Safari no soporta codificar a WebP desde canvas.toBlob(): ante un tipo no
    // soportado, el spec obliga al navegador a caer a PNG silenciosamente, pero
    // el Blob resultante reporta type 'image/png'. Sin este chequeo, el archivo
    // quedaría subido con extensión/Content-Type "webp" pero bytes PNG reales,
    // y Safari falla al decodificarlo ("The source image could not be decoded").
    const webp = await canvasToBlob(canvas, 'image/webp')

    if (webp && webp.type === 'image/webp') {
      return { blob: webp, extension: 'webp', contentType: 'image/webp' }
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg')

    if (jpeg) {
      return { blob: jpeg, extension: 'jpg', contentType: 'image/jpeg' }
    }

    throw new Error('No fue posible procesar la imagen.')
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, 0.8)
  })
}
