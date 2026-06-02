// ==========================================
// INTEGRAÇÃO COM A INTERFACE (DOM) - CÁLCULO DE MEDIDAS
// ==========================================

const inputJanela = document.getElementById('janela-width');
const selectUnidade = document.getElementById('medida-unidade');
const divResultado = document.getElementById('resultado-medida');
const textVarao = document.getElementById('varao-recomendado');

function calcularMedida() {
    let janela = parseFloat(inputJanela.value);
    
    if (janela > 0) {
        // Se a unidade for centímetros, converte para metros
        if (selectUnidade.value === 'cm') {
            janela = janela / 100;
        }

        // Cálculo da medida ideal: Largura da janela + 20cm de cada lado (total + 40cm)
        const ideal = janela + 0.4;
        
        // Kits padrão fornecidos pela fábrica
        const kits = [
            { size: 1.0, barsText: "1 barra de 1 mt", brackets: 2 },
            { size: 1.5, barsText: "2 barras de 75 cm", brackets: 3 },
            { size: 2.0, barsText: "2 barras de 1 mt", brackets: 3 },
            { size: 2.4, barsText: "2 barras de 1,20 mt", brackets: 3 },
            { size: 3.0, barsText: "3 barras de 1 mt", brackets: 4 },
            { size: 3.6, barsText: "3 barras de 1,20 mt", brackets: 4 },
            { size: 4.0, barsText: "4 barras de 1 mt", brackets: 5 }
        ];

        let selectedKit = null;
        let exceeded = false;

        // Encontra o menor kit padrão que atenda à medida ideal
        for (const kit of kits) {
            if (kit.size >= ideal) {
                selectedKit = kit;
                break;
            }
        }

        // Se passar do kit máximo de 4m
        if (!selectedKit) {
            selectedKit = kits[kits.length - 1]; // Usa os specs de 4m
            exceeded = true;
        }

        const formattedSize = selectedKit.size.toFixed(2).replace('.', ',') + 'mt';
        textVarao.innerText = formattedSize;
        
        document.getElementById('qtd-barras').innerText = selectedKit.barsText;
        document.getElementById('qtd-suportes').innerText = selectedKit.brackets + " suportes";
        document.getElementById('aviso-maximo').style.display = exceeded ? 'block' : 'none';

        divResultado.style.display = 'block';

    } else {
        divResultado.style.display = 'none';
    }
}

inputJanela.addEventListener('input', calcularMedida);
selectUnidade.addEventListener('change', () => {
    // Ajusta o placeholder para a unidade escolhida
    inputJanela.placeholder = selectUnidade.value === 'm' ? 'Ex: 2.00' : 'Ex: 200';
    calcularMedida();
});

// Apenas atualizar UI dos botões, já que o modelo agora é importado do Spline
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

document.querySelectorAll('.size-btn:not(.bg-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.size-btn:not(.bg-btn)').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});
