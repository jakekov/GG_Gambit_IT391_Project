// src/utils/esmPaths.ts
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

export const _filename = fileURLToPath(import.meta.url);
export const _dirname = dirname(_filename);
export const _rootDir = resolve(_dirname, '..');
