const fs = require('fs');
const { execSync } = require('child_process');

let indexHtml = fs.readFileSync('index.html', 'utf-8');

// Restore Vercel Analytics
indexHtml = indexHtml.replace('<script defer src="main.obf.js"></script>', '<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>');

// Find the actual inline script at the end
const scriptRegex = /<script>\s*\/\/\s*FAQ Accordion[\s\S]*?<\/script>/;
const match = indexHtml.match(scriptRegex);

if (match) {
    // Save to main.js
    const scriptContent = match[0].replace(/<\/?script>/g, '').trim();
    fs.writeFileSync('main.js', scriptContent);
    console.log('main.js updated with correct script');
    
    // Obfuscate
    execSync('npx javascript-obfuscator main.js --output main.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
    
    // Replace in HTML
    indexHtml = indexHtml.replace(scriptRegex, '<script defer src="main.obf.js"></script>');
    fs.writeFileSync('index.html', indexHtml);
    console.log('index.html updated successfully!');
} else {
    console.log('Script not found at the end of index.html');
}
