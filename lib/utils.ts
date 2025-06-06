// Archivo: lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Readable } from "stream" // Importante añadir esto

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- FUNCIÓN ESENCIAL ---
// Esta es la función que es necesaria para que la API de transcripción funcione.
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on("error", (err) => reject(err))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
  })
}
