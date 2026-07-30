import imageCompression from 'browser-image-compression';

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  const compressedBlob = await imageCompression(file, options);
  const cleanName = file.name.replace(/\.[^/.]+$/, '');

  return new File([compressedBlob], `${cleanName}.webp`, {
    type: 'image/webp',
  });
}
