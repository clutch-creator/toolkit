'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export function revalidateAll() {
  revalidatePath('/', 'layout');
}

export function revalidateCache(tags: string[], paths: string[]): void {
  tags?.forEach(tag => revalidateTag(tag));
  paths?.forEach(path => revalidatePath(path));
}
