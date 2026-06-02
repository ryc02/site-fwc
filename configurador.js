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

// Lógica de Configuração Atual
let currentLength = 2.4; // Metros
let currentDiameter = 0.019; // 19mm em metros
let currentColor = 'chrome';

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
    const geometry = new THREE.CylinderGeometry(currentDiameter, currentDiameter, visualLength, 64);
    const varaoMesh = new THREE.Mesh(geometry, material);
    varaoMesh.rotation.z = Math.PI / 2; // Deita o cilindro horizontalmente
    varaoGroup.add(varaoMesh);

    // Ponteiras (Acabamentos nas pontas)
    const finialRadius = currentDiameter * 1.4;
    const finialGeometry = new THREE.SphereGeometry(finialRadius, 32, 32);
    
    const leftFinial = new THREE.Mesh(finialGeometry, material);
    leftFinial.position.x = -visualLength / 2;
    varaoGroup.add(leftFinial);

    const rightFinial = new THREE.Mesh(finialGeometry, material);
    rightFinial.position.x = visualLength / 2;
    varaoGroup.add(rightFinial);

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
const divResultado = document.getElementById('resultado-medida');
const textVarao = document.getElementById('varao-recomendado');

inputJanela.addEventListener('input', (e) => {
    const janela = parseFloat(e.target.value);
    if (janela > 0) {
        // Cálculo padrão: Largura da janela + 20cm de cada lado (total + 40cm)
        const ideal = janela + 0.4;
        textVarao.innerText = ideal.toFixed(2) + 'm';
        
        // Lógica de suportes e emendas
        let suportes = 2;
        let emendas = 0;
        let exceeded = false;

        if (ideal <= 1.5) {
            suportes = 2;
            emendas = 0;
        } else if (ideal <= 2.5) {
            suportes = 3;
            emendas = 1;
        } else if (ideal <= 3.5) {
            suportes = 4;
            emendas = 2;
        } else if (ideal <= 4.0) {
            suportes = 5;
            emendas = 3;
        } else {
            // Acima de 4 metros (máximo permitido por kit)
            suportes = Math.ceil(ideal / 1.0) + 1;
            emendas = suportes - 2;
            exceeded = true;
        }

        document.getElementById('qtd-suportes').innerText = suportes;
        document.getElementById('qtd-emendas').innerText = emendas;
        document.getElementById('aviso-maximo').style.display = exceeded ? 'block' : 'none';

        divResultado.style.display = 'block';

        // Atualiza 3D (limitando a 4 metros no visual para não estourar a tela ou bugar se for muito gigante)
        currentLength = Math.min(ideal, 4.0);
        rebuildModel();
    } else {
        divResultado.style.display = 'none';
        currentLength = 2.4; // Default
        rebuildModel();
    }
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
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualiza 3D (converte mm para metros para o Three.js)
        const sizeMM = parseInt(e.target.getAttribute('data-size'));
        currentDiameter = sizeMM / 1000;
        rebuildModel();
    });
});
