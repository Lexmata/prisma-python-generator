import fs from 'fs';
import path from 'path';
import type { DMMF, GeneratorOptions } from '@prisma/generator-helper';
import { generateEnumsFile } from './helpers/enum';
import { generateModel } from './helpers/model';
import { modelToFileName, fileHeader } from './utils';

/**
 * Check whether the generator is enabled via the GENERATE_PYTHON environment variable.
 * Defaults to false if the variable is absent or not set to "true".
 */
function isEnabled(): boolean {
  return process.env.GENERATE_PYTHON?.toLowerCase() === 'true';
}

/**
 * Main generator function — receives the full Prisma DMMF and generator config,
 * then writes Python files to the output directory.
 */
export async function generate(options: GeneratorOptions): Promise<void> {
  if (!isEnabled()) {
    console.log('prisma-python-generator: Skipping — set GENERATE_PYTHON=true to enable.');
    return;
  }

  const outputDir = options.generator.output?.value;
  if (!outputDir) {
    throw new Error('No output directory specified for prisma-python-generator');
  }

  // Ensure the output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const { datamodel } = options.dmmf;
  const enums = [...datamodel.enums] as DMMF.DatamodelEnum[];
  const models = [...datamodel.models] as DMMF.Model[];

  const allEnumNames = new Set(enums.map((e) => e.name));
  const generatedFiles: string[] = [];

  // --- Generate enums.py ---
  if (enums.length > 0) {
    const enumContent = fileHeader() + generateEnumsFile(enums);
    const enumPath = path.join(outputDir, 'enums.py');
    fs.writeFileSync(enumPath, enumContent);
    generatedFiles.push('enums');
  }

  // --- Generate a .py file for each model ---
  for (const model of models) {
    const modelContent = fileHeader() + generateModel(model, allEnumNames);
    const fileName = modelToFileName(model.name);
    const filePath = path.join(outputDir, `${fileName}.py`);
    fs.writeFileSync(filePath, modelContent);
    generatedFiles.push(fileName);
  }

  // --- Generate __init__.py ---
  const initLines: string[] = [];
  initLines.push(fileHeader());

  if (enums.length > 0) {
    for (const e of enums) {
      initLines.push(`from .enums import ${e.name}`);
    }
  }

  for (const model of models) {
    const fileName = modelToFileName(model.name);
    initLines.push(`from .${fileName} import ${model.name}`);
  }

  initLines.push('');

  // Build __all__
  const allExports = [
    ...enums.map((e) => e.name),
    ...models.map((m) => m.name),
  ];
  initLines.push(`__all__ = [`);
  for (const exp of allExports) {
    initLines.push(`    "${exp}",`);
  }
  initLines.push(`]`);
  initLines.push('');

  // Rebuild all models to resolve cross-module forward references
  if (models.length > 0) {
    initLines.push('# Resolve cross-module forward references');
    for (const model of models) {
      initLines.push(`${model.name}.model_rebuild()`);
    }
    initLines.push('');
  }

  fs.writeFileSync(path.join(outputDir, '__init__.py'), initLines.join('\n'));

  // --- Generate py.typed marker for PEP 561 ---
  fs.writeFileSync(path.join(outputDir, 'py.typed'), '');
}
