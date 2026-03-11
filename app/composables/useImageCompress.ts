/**
 * Compresses an image file to approximately targetSizeKB (default 300KB)
 * Returns a base64 data URL string
 */
export function useImageCompress() {
  const compressImage = (file: File, targetSizeKB = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')

          // Calculate dimensions — max 1200px on longest side
          const MAX_DIM = 1200
          let { width, height } = img
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width)
              width = MAX_DIM
            }
            else {
              width = Math.round((width * MAX_DIM) / height)
              height = MAX_DIM
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)

          // Binary search for the right quality
          let quality = 0.7
          let result = canvas.toDataURL('image/jpeg', quality)
          const targetBytes = targetSizeKB * 1024
          const base64Overhead = 1.37 // base64 is ~37% larger

          // If already under target, return
          if (result.length / base64Overhead <= targetBytes) {
            resolve(result)
            return
          }

          // Try decreasing quality
          let lo = 0.1
          let hi = 0.8
          for (let i = 0; i < 8; i++) {
            quality = (lo + hi) / 2
            result = canvas.toDataURL('image/jpeg', quality)
            if (result.length / base64Overhead > targetBytes) {
              hi = quality
            }
            else {
              lo = quality
            }
          }

          resolve(result)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  return { compressImage }
}
