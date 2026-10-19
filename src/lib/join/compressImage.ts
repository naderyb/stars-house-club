/** Shrinks a photo before uploading: max 1800px on the long side, JPEG.
 *  If anything goes wrong it returns the original file untouched. */
export async function compressImage(
  file: File,
  maxEdge = 1800,
  quality = 0.85,
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    // keep the original when it is already smaller than our version
    if (!blob || (blob.size >= file.size && file.type === "image/jpeg"))
      return file;

    return new File([blob], "id.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
