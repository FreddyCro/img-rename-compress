import require from './utils/require.js';
import download from 'image-downloader';
import normalizePath from 'normalize-path';
import pathParse from 'path-parse';
import Jimp from 'jimp';
import { faker } from '@faker-js/faker';
const { Select, Input } = require('enquirer');

const types = [
  'abstract',
  'animals',
  'avatar',
  'business',
  'cats',
  'city',
  'food',
  'people',
  'nature',
  'technics',
  'transport',
];

// input type of images
const typePrompt = new Select({
  name: 'type',
  message: 'Input type of images:',
  choices: types,
  initial: 'abstract',
});

// input amount of images
const amountPrompt = new Input({
  name: 'amount',
  message: 'Input amount of images:',
  initial: '1',
  validate: (value) => {
    return +value > 0;
  },
});

// input width of image
const widthPrompt = new Input({
  name: 'width',
  message: 'Input width of image:',
  initial: '640',
  validate: (value) => {
    return +value > 0;
  },
});

// input height of image
const heightPrompt = new Input({
  name: 'height',
  message: 'Input height of image:',
  initial: '480',
  validate: (value) => {
    return +value > 0;
  },
});

const printResolution = new Input({
  name: 'printResolution',
  message: 'Print resolution?',
  choices: ['yes', 'no'],
  initial: 'yes',
});

// input use 2x resolution
const highResolutionPrompt = new Select({
  name: '2x',
  message: 'Use 2x resolution?',
  choices: ['yes', 'no'],
  initial: 'yes',
});

const getImagesUrl = ({ type, amount, w, h, use2x }) => {
  let images = [];

  for (let i = 0; i < amount; i++) {
    images.push(faker.image[type](w, h));
  }

  return images;
};

const downloadImage = ({ url, use2x, w, h, printResolution, delay }) => {
  const ROOT_DIR = process.cwd();
  const OUTPUT_DIR = normalizePath(`${ROOT_DIR}/output`);
  const filename = `faker_${w}x${h}_${Date.now()}`;
  const ext = '.jpg';
  const dist = normalizePath(`${OUTPUT_DIR}/${filename}${ext}`);

  return new Promise((resolve) => {
    setTimeout(() => {
      download
        .image({
          url,
          dest: dist,
        })
        .then(({ distname }) => {
          Jimp.read(dist, (err, inputImg) => {
            if (err) throw err;

            Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then((font) => {
              inputImg.greyscale().blur(5).brightness(0.5).quality(60);

              if (printResolution === 'yes') {
                inputImg.print(font, 10, 10, `${w}x${h}`);
              }

              inputImg.write(normalizePath(`${OUTPUT_DIR}/${filename}${ext}`));
              console.log('Saved to', `${filename}${ext}`);

              if (use2x === 'yes') {
                inputImg
                  .scale(2)
                  .write(normalizePath(`${OUTPUT_DIR}/${filename}@2x${ext}`));

                console.log('Saved to', `${filename}@2x${ext}`);
              }

              resolve();
            });
          });
        })
        .catch((err) => console.error(err));
    }, delay);
  });
};

const runFaker = () => {
  typePrompt.run().then((type) => {
    amountPrompt.run().then((amount) => {
      widthPrompt.run().then((w) => {
        heightPrompt.run().then((h) => {
          printResolution.run().then((printResolution) => {
            highResolutionPrompt.run().then(async (use2x) => {
              const images = getImagesUrl({ type, amount, w, h, use2x });

              for (let i = 0; i < images.length; i++) {
                await downloadImage({
                  url: images[i],
                  use2x,
                  w,
                  h,
                  printResolution,
                  delay: 1000,
                });
              }
            });
          });
        });
      });
    });
  });
};

export { runFaker };
