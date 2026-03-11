const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const destinationPath = path.join(
  projectRoot,
  'android',
  'app',
  'google-services.json',
);

const candidatePaths = [
  process.env.GOOGLE_SERVICES_JSON,
  path.join(projectRoot, 'google-services.json'),
].filter(Boolean);

const writeJsonString = rawValue => {
  fs.mkdirSync(path.dirname(destinationPath), {recursive: true});
  fs.writeFileSync(destinationPath, rawValue);
  console.log('Wrote google-services.json from environment variable content');
  process.exit(0);
};

if (fs.existsSync(destinationPath)) {
  console.log(`Using existing google-services.json at ${destinationPath}`);
  process.exit(0);
}

for (const candidatePath of candidatePaths) {
  const trimmedValue = candidatePath.trim();

  if (trimmedValue.startsWith('{')) {
    writeJsonString(trimmedValue);
  }

  if (!fs.existsSync(candidatePath)) {
    continue;
  }

  fs.mkdirSync(path.dirname(destinationPath), {recursive: true});
  fs.copyFileSync(candidatePath, destinationPath);
  console.log(`Copied google-services.json from ${candidatePath}`);
  process.exit(0);
}

throw new Error(
  'Missing google-services.json. Keep ./google-services.json present for local EAS uploads, or provide GOOGLE_SERVICES_JSON as an EAS file/text variable.',
);
