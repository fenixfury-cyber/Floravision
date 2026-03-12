import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { put } from "@vercel/blob";

const SUPPORTED_STORAGE_PROVIDERS = ["local", "blob"] as const;

export type FloraVisionStorageProvider = (typeof SUPPORTED_STORAGE_PROVIDERS)[number];

function getStorageProvider(): FloraVisionStorageProvider {
  const provider = process.env.FLORAVISION_STORAGE_PROVIDER ?? "local";

  if ((SUPPORTED_STORAGE_PROVIDERS as readonly string[]).includes(provider)) {
    return provider as FloraVisionStorageProvider;
  }

  throw new Error(
    `Unsupported FLORAVISION_STORAGE_PROVIDER "${provider}". Expected one of: ${SUPPORTED_STORAGE_PROVIDERS.join(", ")}.`,
  );
}

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "upload";
}

function getFileExtension(file: File) {
  const fromName = extname(file.name || "").toLowerCase();

  if (fromName) {
    return fromName;
  }

  switch (file.type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".bin";
  }
}

function assertSupportedImage(file: File) {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

  if (!supportedTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, and GIF uploads are supported right now.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image uploads must be 8MB or smaller.");
  }
}

async function saveLocalUpload(file: File, segments: string[]) {
  const extension = getFileExtension(file);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const relativeDirectory = join("uploads", ...segments.map(sanitizeSegment));
  const absoluteDirectory = join(process.cwd(), "public", relativeDirectory);
  const absolutePath = join(absoluteDirectory, filename);

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return `/${join(relativeDirectory, filename).replaceAll("\\", "/")}`;
}

async function saveBlobUpload(file: File, segments: string[]) {
  const extension = getFileExtension(file);
  const pathname = [...segments.map(sanitizeSegment), `${Date.now()}-${randomUUID()}${extension}`].join("/");
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required when FLORAVISION_STORAGE_PROVIDER=blob.");
  }

  const blob = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function saveImageUpload(file: File, segments: string[]) {
  assertSupportedImage(file);

  const provider = getStorageProvider();

  if (provider === "local") {
    return saveLocalUpload(file, segments);
  }

  return saveBlobUpload(file, segments);
}

export function getStorageReadiness() {
  const provider = getStorageProvider();

  return {
    storageProvider: provider,
    usesLocalStorage: provider === "local",
    hasBlobToken: provider === "blob" ? Boolean(process.env.BLOB_READ_WRITE_TOKEN) : true,
  };
}
