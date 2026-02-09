import { generatorHandler } from '@prisma/generator-helper';
import { generate } from './generator';

generatorHandler({
  onManifest() {
    return {
      prettyName: 'Prisma Python Generator',
      defaultOutput: './generated/prisma_models',
    };
  },
  onGenerate: generate,
});
