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

// Lógica de Configuração Atual
let currentLength = 2.4; // Metros
let currentDiameter = 0.019; // 19mm em metros
let currentColor = 'chrome';
let currentBrackets = 3; // Padrão para 2.4m
let currentBackground = 'studio'; // 'studio' ou 'wall'

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

function rebuildModel() {
    // Limpa o modelo atual
    while(varaoGroup.children.length > 0){ 
        const child = varaoGroup.children[0];
        child.geometry.dispose();
        varaoGroup.remove(child); 
    }

    const material = materials[currentColor];

    // O comprimento visual é reduzido em escala para caber na tela 
    // mas a proporção comprimento/espessura é mantida.
    // Para caber na tela, definimos que 1 metro virtual = 1 unidade 3D
    const visualLength = currentLength;

    // Tubo Principal
    const geometry = new THREE.CylinderGeometry(currentDiameter, currentDiameter, visualLength, 128);
    const varaoMesh = new THREE.Mesh(geometry, material);
    varaoMesh.rotation.z = Math.PI / 2; // Deita o cilindro horizontalmente
    varaoMesh.castShadow = true;
    varaoMesh.receiveShadow = true;
    varaoGroup.add(varaoMesh);

    // Ponteiras (Acabamentos nas pontas)
    const finialRadius = currentDiameter * 1.4;
    const finialGeometry = new THREE.SphereGeometry(finialRadius, 64, 64);
    
    const leftFinial = new THREE.Mesh(finialGeometry, material);
    leftFinial.position.x = -visualLength / 2;
    leftFinial.castShadow = true;
    leftFinial.receiveShadow = true;
    varaoGroup.add(leftFinial);

    const rightFinial = new THREE.Mesh(finialGeometry, material);
    rightFinial.position.x = visualLength / 2;
    rightFinial.castShadow = true;
    rightFinial.receiveShadow = true;
    varaoGroup.add(rightFinial);

    // Suportes (Brackets)
    const padding = 0.05; // 5cm das bordas
    const startX = -visualLength / 2 + padding;
    const endX = visualLength / 2 - padding;
    const span = endX - startX;
    
    for (let i = 0; i < currentBrackets; i++) {
        let posX = 0;
        if (currentBrackets === 1) {
            posX = 0;
        } else {
            posX = startX + (span / (currentBrackets - 1)) * i;
        }
        
        // Argola do suporte (Torus ao redor do varão)
        const ringGeo = new THREE.TorusGeometry(currentDiameter * 1.1, currentDiameter * 0.2, 32, 64);
        const ring = new THREE.Mesh(ringGeo, material);
        ring.rotation.y = Math.PI / 2; // Gira para abraçar o varão no eixo X
        ring.position.x = posX;
        ring.castShadow = true;
        ring.receiveShadow = true;
        varaoGroup.add(ring);
        
        // Haste do suporte (estendendo para a "parede" atrás -Z)
        const stalkLength = 0.08; // 8cm
        const stalkGeo = new THREE.BoxGeometry(0.015, 0.015, stalkLength);
        const stalk = new THREE.Mesh(stalkGeo, material);
        stalk.position.set(posX, 0, -stalkLength / 2 - currentDiameter);
        stalk.castShadow = true;
        stalk.receiveShadow = true;
        varaoGroup.add(stalk);
        
        // Base do suporte (encosta na parede)
        const baseGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 64);
        const base = new THREE.Mesh(baseGeo, material);
        base.rotation.x = Math.PI / 2;
        base.position.set(posX, 0, -stalkLength - currentDiameter);
        base.castShadow = true;
        base.receiveShadow = true;
        varaoGroup.add(base);
    }

    if (currentBackground === 'wall') {
        // Parede de Fundo Lisa e Elegante (Estilo Studio Arquitetônico)
        const wallGeo = new THREE.PlaneGeometry(30, 20);
        // Cor de parede de luxo (cinza quente / off-white)
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0xf0ece1, 
            roughness: 1.0, 
            metalness: 0.0 
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        // Posiciona a parede exatamente onde a base do suporte encosta
        wall.position.z = -0.08 - currentDiameter;
        wall.receiveShadow = true;
        varaoGroup.add(wall);
    }

    // Ajusta a câmera para focar no varão inteiro
    camera.position.z = Math.max(3, visualLength * 1.2);
}

// Inicializa o modelo
rebuildModel();

// Animação/Render Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // required if controls.enableDamping is true
    
    // Gira lentamente sozinho para demonstrar o material
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
        currentLength = selectedKit.size;
        currentBrackets = selectedKit.brackets;
        rebuildModel();
    } else {
        divResultado.style.display = 'none';
        currentLength = 2.4; // Default
        currentBrackets = 3;
        rebuildModel();
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

        // Atualiza 3D
        currentColor = e.target.getAttribute('data-color');
        rebuildModel();
    });
});

// 3. Mudança de Espessura
document.querySelectorAll('.size-btn:not(.bg-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        document.querySelectorAll('.size-btn:not(.bg-btn)').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualiza 3D (converte mm para metros para o Three.js)
        const sizeMM = parseInt(e.target.getAttribute('data-size'));
        currentDiameter = sizeMM / 1000;
        rebuildModel();
    });
});

// 4. Mudança de Ambiente
document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        currentBackground = e.target.getAttribute('data-bg');
        rebuildModel();
    });
});
