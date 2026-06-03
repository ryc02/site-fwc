import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Setup básico da Cena
const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

// Câmera
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
camera.position.set(0, 0, 4);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 1;
controls.maxDistance = 10;

// Desativa o zoom automático se o usuário interagir com o controle
controls.addEventListener('start', () => { autoAdjustCamera = false; });
renderer.domElement.addEventListener('wheel', () => { autoAdjustCamera = false; });
renderer.domElement.addEventListener('touchstart', () => { autoAdjustCamera = false; });

// Iluminação Realista (PBR)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Lógica de Configuração Atual (Física Elástica)
let targetLength = 2.4;
let currentLength = 2.4;
let autoAdjustCamera = true;
let targetDiameter = 0.019;
let currentDiameter = 0.019;
let currentColor = 'chrome';
let currentSupportType = '1p';
let targetBrackets = 3;
let currentBrackets = 3;

// Referências Persistentes aos Objetos 3D
let rodMesh = null;
let leftFinial = null;
let rightFinial = null;
let bracketsArray = [];

// Materiais Físicos de Alta Qualidade
const materials = {
    'chrome': new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.15,
        envMapIntensity: 1.0
    }),
    'gold': new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        metalness: 1.0,
        roughness: 0.2,
        envMapIntensity: 1.0
    }),
    'black': new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.3,
        roughness: 0.6,
        envMapIntensity: 0.5
    }),
    'white': new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.1,
        roughness: 0.4,
        envMapIntensity: 0.5
    })
};

let varaoGroup = new THREE.Group();
scene.add(varaoGroup);

function rebuildGeometries() {
    // Limpa o modelo atual completamente quando mudamos diâmetro ou cor (que são mudanças raras/pesadas)
    while(varaoGroup.children.length > 0){ 
        const child = varaoGroup.children[0];
        if(child.geometry) child.geometry.dispose();
        varaoGroup.remove(child); 
    }
    bracketsArray = [];

    const material = materials[currentColor];
    const rodRadius = targetDiameter / 2;

    // Tubo Principal (Criado com tamanho 1 e escalado via Y=Length)
    const geometry = new THREE.CylinderGeometry(rodRadius, rodRadius, 1, 128);
    rodMesh = new THREE.Mesh(geometry, material);
    rodMesh.rotation.z = Math.PI / 2;
    rodMesh.castShadow = true;
    rodMesh.receiveShadow = true;
    varaoGroup.add(rodMesh);

    // Ponteiras (Dedal)
    const points = [];
    const r = rodRadius;
    const L = targetDiameter * 1.2; 
    points.push(new THREE.Vector2(r, 0)); 
    points.push(new THREE.Vector2(r * 1.4, 0)); 
    points.push(new THREE.Vector2(r * 1.4, L * 0.15)); 
    points.push(new THREE.Vector2(r * 1.2, L * 0.25)); 
    points.push(new THREE.Vector2(r * 1.2, L * 0.5)); 
    points.push(new THREE.Vector2(r * 1.12, L * 0.5)); 
    points.push(new THREE.Vector2(r * 1.12, L * 0.75)); 
    points.push(new THREE.Vector2(r * 0.9, L * 0.9)); 
    points.push(new THREE.Vector2(r * 0.5, L * 0.98)); 
    points.push(new THREE.Vector2(0, L)); 
    const finialGeometry = new THREE.LatheGeometry(points, 64);
    
    leftFinial = new THREE.Mesh(finialGeometry, material);
    leftFinial.rotation.z = Math.PI / 2;
    leftFinial.castShadow = true;
    leftFinial.receiveShadow = true;
    varaoGroup.add(leftFinial);

    rightFinial = new THREE.Mesh(finialGeometry, material);
    rightFinial.rotation.z = -Math.PI / 2;
    rightFinial.castShadow = true;
    rightFinial.receiveShadow = true;
    varaoGroup.add(rightFinial);

    // Pré-criação de um pool de suportes (até 10 para lidar com tamanhos grandes)
    for (let i = 0; i < 10; i++) {
        const group = new THREE.Group();
        
        const ringThickness = targetDiameter * 0.15;
        const ringRadius = rodRadius + ringThickness;
        const ringGeo = new THREE.TorusGeometry(ringRadius, ringThickness, 32, 64);
        const ring = new THREE.Mesh(ringGeo, material);
        ring.rotation.y = Math.PI / 2;
        ring.castShadow = true;
        ring.receiveShadow = true;
        group.add(ring);
        
        const stalkLength = 0.08; 
        const stalkGeo = new THREE.BoxGeometry(0.015, 0.015, stalkLength);
        const stalk = new THREE.Mesh(stalkGeo, material);
        stalk.position.set(0, 0, -stalkLength / 2 - targetDiameter);
        stalk.castShadow = true;
        stalk.receiveShadow = true;
        group.add(stalk);
        
        let baseGeo, base;
        if (currentSupportType === '1p') {
            baseGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 64);
            base = new THREE.Mesh(baseGeo, material);
            base.rotation.x = Math.PI / 2;
        } else {
            // Suporte 2p (2 furos) com base retangular (vertical)
            baseGeo = new THREE.BoxGeometry(0.025, 0.07, 0.01);
            base = new THREE.Mesh(baseGeo, material);
        }
        
        base.position.set(0, 0, -stalkLength - targetDiameter);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Suportes nascem escondidos (escala 0)
        group.scale.set(0, 0, 0);
        varaoGroup.add(group);
        bracketsArray.push(group);
    }
}

// Inicializa o modelo
rebuildGeometries();

// Animação/Render Loop com Física Elástica (LERP)
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Lerp suave para o comprimento do varão (Efeito Elástico)
    currentLength += (targetLength - currentLength) * 0.1;
    
    // Atualiza o 3D se os objetos já foram inicializados
    if (rodMesh && leftFinial && rightFinial) {
        // Estica o varão usando a escala Y (já que ele foi deitado em Z)
        rodMesh.scale.y = currentLength;
        
        // Posiciona as ponteiras nas pontas esticadas
        leftFinial.position.x = -currentLength / 2;
        rightFinial.position.x = currentLength / 2;
        
        // Física dos suportes deslizando e "nascendo"
        const padding = 0.05;
        const startX = -currentLength / 2 + padding;
        const endX = currentLength / 2 - padding;
        const span = endX - startX;
        
        for (let i = 0; i < bracketsArray.length; i++) {
            const bracket = bracketsArray[i];
            
            // Se o bracket deve existir nesta configuração (índice menor que o target)
            if (i < targetBrackets) {
                // Calcula a posição ideal que ele deve assumir
                let targetX = 0;
                if (targetBrackets > 1) {
                    targetX = startX + (span / (targetBrackets - 1)) * i;
                }
                
                // Desliza suavemente no eixo X
                bracket.position.x += (targetX - bracket.position.x) * 0.1;
                // Nasce suavemente (Scale 0 -> 1)
                bracket.scale.x += (1 - bracket.scale.x) * 0.1;
                bracket.scale.y += (1 - bracket.scale.y) * 0.1;
                bracket.scale.z += (1 - bracket.scale.z) * 0.1;
            } else {
                // Se o bracket for excedente (ex: passou de 5 para 3 suportes), ele murcha e some
                bracket.scale.x += (0 - bracket.scale.x) * 0.2;
                bracket.scale.y += (0 - bracket.scale.y) * 0.2;
                bracket.scale.z += (0 - bracket.scale.z) * 0.2;
            }
        }
        
        // Câmera afasta suavemente se o varão for muito grande
        if (autoAdjustCamera) {
            const targetCamZ = Math.max(3, currentLength * 1.2);
            camera.position.z += (targetCamZ - camera.position.z) * 0.05;
            if (Math.abs(targetCamZ - camera.position.z) < 0.01) {
                autoAdjustCamera = false;
            }
        }
    }

    // Gira lentamente sozinho para demonstrar o material metálico
    if (!controls.state && varaoGroup) {
        varaoGroup.rotation.x += 0.002;
    }

    renderer.render(scene, camera);
}
animate();

// Responsividade
window.addEventListener('resize', () => {
    const container = document.querySelector('.canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// ==========================================
// INTEGRAÇÃO COM A INTERFACE (DOM)
// ==========================================

// 1. Calculadora de Tamanho
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
            selectedKit = kits[kits.length - 1]; // Usa os specs de 4m para renderizar no 3D
            exceeded = true;
        }

        const formattedSize = selectedKit.size.toFixed(2).replace('.', ',') + 'mt';
        textVarao.innerText = formattedSize;
        
        document.getElementById('qtd-barras').innerText = selectedKit.barsText;
        document.getElementById('qtd-suportes').innerText = selectedKit.brackets + " suportes";
        document.getElementById('aviso-maximo').style.display = exceeded ? 'block' : 'none';

        divResultado.style.display = 'block';

        // Atualiza 3D
        // Atualiza as variáveis de Alvo (Target) para a Física agir
        targetLength = selectedKit.size;
        targetBrackets = selectedKit.brackets;
        autoAdjustCamera = true;
    } else {
        divResultado.style.display = 'none';
        currentLength = 2.4; // Default
        currentBrackets = 3;
        rebuildGeometries();
        autoAdjustCamera = true;
    }
}

inputJanela.addEventListener('input', calcularMedida);
selectUnidade.addEventListener('change', () => {
    // Ajusta o placeholder para a unidade escolhida
    inputJanela.placeholder = selectUnidade.value === 'm' ? 'Ex: 2.00' : 'Ex: 200';
    calcularMedida();
});

// 2. Mudança de Cor
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualiza a Cor e reconstrói as geometrias
        currentColor = e.target.getAttribute('data-color');
        rebuildGeometries();
    });
});

// 3. Mudança de Espessura
document.querySelectorAll('.size-btn:not(.support-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        document.querySelectorAll('.size-btn:not(.support-btn)').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualiza a Espessura e reconstrói as geometrias
        const sizeMM = parseInt(e.target.getAttribute('data-size'));
        targetDiameter = sizeMM / 1000;
        rebuildGeometries();
    });
});

// 4. Mudança de Tipo de Suporte
document.querySelectorAll('.support-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        document.querySelectorAll('.support-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualiza o tipo de suporte e reconstrói as geometrias
        currentSupportType = e.target.getAttribute('data-support');
        rebuildGeometries();
    });
});
