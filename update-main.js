const fs = require('fs');
const { execSync } = require('child_process');

function updateMain() {
    // 1. Processa index.html
    let indexHtml = fs.readFileSync('index.html', 'utf-8');
    
    // Pega o conteúdo do script inline real (no final do arquivo)
    const indexScriptMatch = indexHtml.match(/<script>\s*\/\/\s*FAQ Accordion[\s\S]*?<\/script>/);
    if (indexScriptMatch) {
        const indexScriptContent = indexScriptMatch[0].replace(/<\/?script>/g, '').trim();
        fs.writeFileSync('main.js', indexScriptContent);
        console.log('main.js atualizado com o script do index.html');
        
        execSync('npx javascript-obfuscator main.js --output main.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
        
        indexHtml = indexHtml.replace(indexScriptMatch[0], '<script defer src="main.obf.js"></script>');
        fs.writeFileSync('index.html', indexHtml);
        console.log('index.html atualizado para usar main.obf.js');
    }

    // 2. Processa configurador.html
    let confHtml = fs.readFileSync('configurador.html', 'utf-8');
    
    // Como app3d.js já é importado e editado isoladamente, vamos apenas ofuscá-lo com segurança
    if (fs.existsSync('app3d.js')) {
        let app3d = fs.readFileSync('app3d.js', 'utf-8');

        // Extrai os imports para não quebrar a sintaxe de módulo ES6 na ofuscação
        const importRegex = /^import\s+.*?;/gm;
        let imports = '';
        let match;
        while ((match = importRegex.exec(app3d)) !== null) {
            imports += match[0] + '\n';
        }

        const codeWithoutImports = app3d.replace(importRegex, '');
        fs.writeFileSync('app3d-temp.js', codeWithoutImports);

        execSync('npx javascript-obfuscator app3d-temp.js --output app3d-temp.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });

        const obfuscatedCode = fs.readFileSync('app3d-temp.obf.js', 'utf-8');
        fs.writeFileSync('app3d.obf.js', imports + '\n' + obfuscatedCode);

        fs.unlinkSync('app3d-temp.js');
        fs.unlinkSync('app3d-temp.obf.js');

        console.log('app3d.obf.js gerado com segurança (mantendo os imports no topo).');
    }
}

updateMain();
