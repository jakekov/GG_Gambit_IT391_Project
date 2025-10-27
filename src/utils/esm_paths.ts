// src/utils/esmPaths.ts
import {fileURLToPath} from 'url';
import {dirname} from 'path';

export const _filename = fileURLToPath(import.meta.url);
export const _dirname = dirname(_filename);
