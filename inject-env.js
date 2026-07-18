const fs = require('fs');
const path = require('path');

// Target IP/domain defaults to '10.10.20.56' if not provided as CLI argument
const target = process.argv[2] || '10.10.20.56';

console.log('==========================================================');
console.log(`Injecting Target IP/Domain: ${target} into module .env files...`);
console.log('==========================================================');

const modules = [
  'sso-platform',
  'reference-data',
  'pmb-platform',
  'siakad-platform',
  'lms-platform',
  'keuangan-platform',
  'hris-platform',
  'bank-konten-platform'
];

modules.forEach((module) => {
  const moduleDir = path.join(__dirname, module);
  if (!fs.existsSync(moduleDir)) {
    console.log(`-> [Skip] ${module} (directory does not exist)`);
    return;
  }

  const envExamplePath = path.join(moduleDir, '.env.example');
  const envPath = path.join(moduleDir, '.env');

  let templateContent = '';

  if (fs.existsSync(envExamplePath)) {
    console.log(`-> Processing ${module} using .env.example...`);
    templateContent = fs.readFileSync(envExamplePath, 'utf8');
  } else if (fs.existsSync(envPath)) {
    console.log(`-> Processing ${module} (.env.example not found, copying current .env as backup/template)...`);
    // Copy .env to .env.example to serve as the template for future runs
    fs.copyFileSync(envPath, envExamplePath);
    templateContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    console.log(`-> [Skip] ${module} (neither .env nor .env.example found)`);
    return;
  }

  // Perform replacements:
  // 1. Replace 'localhost' with target
  // 2. Replace '127.0.0.1' with target
  // 3. Replace any existing IPv4 addresses with target
  const replacedContent = templateContent
    .replace(/localhost/g, target)
    .replace(/127\.0\.0\.1/g, target)
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, target);

  fs.writeFileSync(envPath, replacedContent, 'utf8');
  console.log(`   Successfully wrote updated configuration to ${envPath}`);
});

console.log('==========================================================');
console.log('Env injection completed successfully!');
console.log('==========================================================');
