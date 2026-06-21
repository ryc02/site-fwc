const fs = require('fs');
const { execSync } = require('child_process');

function updateMain() {
    // 1. Processa index.html
    let indexHtml = fs.readFileSync('index.html', 'utf-8');
    
    // Pega o conteúdo do script inline
    const indexScriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
    if (indexScriptMatch) {
        const indexScriptContent = indexScriptMatch[1];
        fs.writeFileSync('main.js', indexScriptContent.trim());
        console.log('main.js atualizado com o script do index.html');
        
        // Obfusca
        execSync('npx javascript-obfuscator main.js --output main.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
        
        // Substitui no HTML
        indexHtml = indexHtml.replace(/<script>[\s\S]*?<\/script>/, '<script defer src="main.obf.js"></script>');
        fs.writeFileSync('index.html', indexHtml);
        console.log('index.html atualizado para usar main.obf.js');
    }

    // 2. Processa configurador.html
    let confHtml = fs.readFileSync('configurador.html', 'utf-8');
    
    // Pega o conteúdo do script inline
    const confScriptMatch = confHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
    if (confScriptMatch) {
        const confScriptContent = confScriptMatch[1];
        fs.writeFileSync('app3d.js', confScriptContent.trim());
        console.log('app3d.js atualizado com o script do configurador.html');
        
        // Obfusca
        execSync('npx javascript-obfuscator app3d.js --output app3d.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
        
        // Substitui no HTML
        confHtml = confHtml.replace(/<script type="module">[\s\S]*?<\/script>/, '<script type="module" src="app3d.obf.js"></script>');
        fs.writeFileSync('configurador.html', confHtml);
        console.log('configurador.html atualizado para usar app3d.obf.js');
    }
}

updateMain();
