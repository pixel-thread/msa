/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = process.cwd();
const BASE_PATH = path.join(ROOT, 'src', 'features');

const FOLDERS = [
  'components',
  'hooks',
  'services',
  'store',
  'pages',
  'types',
  'utils',
  'validators',
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('📁 Created:', dirPath);
  }
}

function createKeepFile(dirPath) {
  const keepFile = path.join(dirPath, '.keep');
  if (!fs.existsSync(keepFile)) {
    fs.writeFileSync(keepFile, '');
  }
}

function createIndexFile(featurePath) {
  const indexFile = path.join(featurePath, 'index.ts');
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, '// exports\n');
  }
}

function createFeature(feature) {
  const featurePath = path.join(BASE_PATH, feature);

  if (fs.existsSync(featurePath)) {
    console.log(`⚠️ Feature "${feature}" already exists`);
    return;
  }

  ensureDir(featurePath);

  FOLDERS.forEach((folder) => {
    const folderPath = path.join(featurePath, folder);
    ensureDir(folderPath);
    createKeepFile(folderPath);
  });

  createIndexFile(featurePath);

  console.log(`✅ Feature "${feature}" created`);
}

function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n🚀 Next.js Feature Generator\n');

  rl.question('📦 Enter feature name (comma separated): ', (input) => {
    const features = input
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    if (!features.length) {
      console.log('❌ No feature name provided');
      rl.close();
      return;
    }

    features.forEach(createFeature);

    console.log('\n🎉 Done!\n');
    rl.close();
  });
}

startCLI();
