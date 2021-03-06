import fs from 'fs';
import require from './utils/require.js';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import pathParse from 'path-parse';
import consola from 'consola';
import chalk from 'chalk';
import normalizePath from 'normalize-path';
import Jimp from 'jimp';

import { readFiles } from './utils/file.js';
import { rename, rename2x } from './utils/rename.js';
import { runRename } from './run-rename.js';

const { Input } = require('enquirer');

let imagesInfo = [];

const renameOutputWebp = (file) => {
  if (!file) return;

  const { dir, name, ext } = pathParse(file);
  const newName = rename2x(name);

  try {
    fs.renameSync(
      normalizePath(file),
      normalizePath(`${dir}/${newName}${ext}`)
    );

    console.log(
      `${name + ext} has converted to ${chalk.green(name + '.webp')}`
    );
  } catch {
    consola.error(`${file} could not be renamed`);
  }
};

const handleWebp = (quality) => {
  const ROOT_DIR = process.cwd();
  const INPUT_DIR = normalizePath(`${ROOT_DIR}/input`);
  const OUTPUT_DIR = normalizePath(`${ROOT_DIR}/output`);
  const { files } = readFiles(INPUT_DIR);

  try {
    const pAll = files.map((file) => {
      return new Promise((resolve, reject) => {
        const { dir, name, ext } = pathParse(file);
        const newDir =
          dir === INPUT_DIR ? '' : rename(dir.replace(INPUT_DIR, ''));

        imagemin([normalizePath(file)], {
          destination: normalizePath(`${OUTPUT_DIR}/${newDir}`),
          plugins: [imageminWebp({ quality })],
          method: 6,
        }).then(async (e) => {
          if (e.length === 0) {
            consola.error(`${chalk.red(name + ext)} was failure.`);
          } else {
            renameOutputWebp(e[0].destinationPath);
          }

          resolve();
        });
      });
    });

    Promise.all(pAll).then(() => {
      consola.success('All files was done.');
    });
  } catch (e) {
    consola.error(e);
  }

  // handle generate image info
  try {
    const pAll = files.map((file) => {
      if (file.includes('@2x')) return;

      return new Promise((resolve, reject) => {
        Jimp.read(file).then((img) => {
          const { dir, name, ext } = pathParse(file);

          const info = {
            src: `${name}`,
            width: img.bitmap.width,
            height: img.bitmap.height,
          };

          imagesInfo.push(info);
          resolve();
        });
      });
    });

    Promise.all(pAll).then(() => {
      fs.writeFile(
        normalizePath(`${OUTPUT_DIR}/info.json`),
        JSON.stringify(imagesInfo, null, 2),
        (err) => {
          if (err) console.log(err);
          consola.success('All info was writed.');
        }
      );
    });
  } catch (e) {
    consola.error(e);
  }
};

const runWebp = () => {
  const prompt = new Input({
    type: 'input',
    name: 'webp quality prompt',
    message: 'Input webp quality(0~100):',
    initial: '90',
    validate: (value) => {
      return +value >= 0 && +value <= 100;
    },
  });

  prompt
    .run()
    .then(() => runRename())
    .then((quality) => handleWebp(+quality))
    .catch(console.error);
};

export { runWebp };
