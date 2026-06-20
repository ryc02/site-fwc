const fs = require('fs');

function build() {
    // 1. Processa index_test.html -> index_prod.html
    let indexHtml = fs.readFileSync('index_test.html', 'utf-8');
    
    // Remove comentários HTML
    indexHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, '');
    
    // Altera o script para o ofuscado
    indexHtml = indexHtml.replace(/<script src="main\.js" defer><\/script>/g, '<script src="main.obf.js" defer></script>');
    
    // Remove linhas em branco extras criadas pela remoção
    indexHtml = indexHtml.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync('index_prod.html', indexHtml);
    console.log('index_prod.html criado!');

    // 2. Processa configurador_test.html -> configurador_prod.html
    let confHtml = fs.readFileSync('configurador_test.html', 'utf-8');
    
    // Remove comentários HTML
    confHtml = confHtml.replace(/<!--[\s\S]*?-->/g, '');
    
    // Substitui o script inline pelo script ofuscado
    // O script inline em configurador_test.html começa com <script type="module"> e termina em </script>
    // Fica no final do arquivo
    confHtml = confHtml.replace(/<script type="module">[\s\S]*?<\/script>/, '<script type="module" src="app3d.obf.js"></script>');
    
    // Remove linhas em branco extras
    confHtml = confHtml.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync('configurador_prod.html', confHtml);
    console.log('configurador_prod.html criado!');

    // 3. Roda a ofuscação do JavaScript
    console.log('Ofuscando JavaScript...');
    const { execSync } = require('child_process');
    try {
        execSync('npx javascript-obfuscator main.js --output main.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
        execSync('npx javascript-obfuscator app3d.js --output app3d.obf.js --compact true --control-flow-flattening true --string-array true', { stdio: 'inherit' });
        console.log('Ofuscação concluída com sucesso!');
    } catch (error) {
        console.error('Erro na ofuscação:', error);
    }
}

build();
