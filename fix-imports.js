const fs = require('fs');
const { execSync } = require('child_process');

let app3d = fs.readFileSync('app3d.js', 'utf-8');

// Extract all import statements
const importRegex = /^import\s+.*?;/gm;
let imports = '';
let match;
while ((match = importRegex.exec(app3d)) !== null) {
    imports += match[0] + '\n';
}

// Remove imports from the code
const codeWithoutImports = app3d.replace(importRegex, '');

// Save to temp file
fs.writeFileSync('app3d-temp.js', codeWithoutImports);

// Obfuscate temp file
execSync('npx javascript-obfuscator app3d-temp.js --output app3d-temp.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });

// Read the obfuscated code and prepend imports
const obfuscatedCode = fs.readFileSync('app3d-temp.obf.js', 'utf-8');
const finalCode = imports + '\n' + obfuscatedCode;

fs.writeFileSync('app3d.obf.js', finalCode);

// Cleanup temp files
fs.unlinkSync('app3d-temp.js');
fs.unlinkSync('app3d-temp.obf.js');

console.log('app3d.obf.js regenerado com os imports no topo!');
