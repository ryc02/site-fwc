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
let currentColor = 'branco';
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
    'azul': new THREE.MeshStandardMaterial({ color: 0x85b8eb, metalness: 0.1, roughness: 0.4, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'branco': new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.4, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'cerejeira': new THREE.MeshStandardMaterial({ color: 0xbb7b01, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'imbuia': new THREE.MeshStandardMaterial({ color: 0x351f14, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'marfim': new THREE.MeshStandardMaterial({ color: 0xcec741, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'mogno': new THREE.MeshStandardMaterial({ color: 0x870d13, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'ouro_velho': new THREE.MeshStandardMaterial({ color: 0x4f3b11, metalness: 0.8, roughness: 0.3, envMapIntensity: 1.0, side: THREE.DoubleSide }),
    'palha': new THREE.MeshStandardMaterial({ color: 0xddd57c, metalness: 0.1, roughness: 0.5, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'preto': new THREE.MeshStandardMaterial({ color: 0x1b1619, metalness: 0.3, roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'rosa': new THREE.MeshStandardMaterial({ color: 0xe49bc9, metalness: 0.1, roughness: 0.4, envMapIntensity: 0.5, side: THREE.DoubleSide }),
    'titanio': new THREE.MeshStandardMaterial({ color: 0x9e9fa4, metalness: 0.8, roughness: 0.2, envMapIntensity: 1.0, side: THREE.DoubleSide }),
    'verde': new THREE.MeshStandardMaterial({ color: 0xa7e2b5, metalness: 0.1, roughness: 0.4, envMapIntensity: 0.5, side: THREE.DoubleSide })
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

    // Tubo Principal (Criado com tamanho 1 e escalado via Y=Length, oco/aberto nas pontas)
    const geometry = new THREE.CylinderGeometry(rodRadius, rodRadius, 1, 128, 1, true);
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
        
        // Novo anel em formato de "C" (Aberto em cima/frente)
        const ringGeo = new THREE.TorusGeometry(ringRadius, ringThickness, 32, 64, Math.PI * 1.3);
        const ring = new THREE.Mesh(ringGeo, material);
        ring.rotation.y = Math.PI / 2;
        ring.rotation.x = Math.PI * 0.85; // Ajuste para deixar a abertura virada para cima/frente
        
        // Arredondando as pontas do C (pontas injetadas suaves)
        const sphereGeo = new THREE.SphereGeometry(ringThickness, 16, 16);
        const sphere1 = new THREE.Mesh(sphereGeo, material);
        sphere1.position.set(ringRadius, 0, 0); 
        ring.add(sphere1);
        
        const sphere2 = new THREE.Mesh(sphereGeo, material);
        const endAngle = Math.PI * 1.3;
        sphere2.position.set(ringRadius * Math.cos(endAngle), ringRadius * Math.sin(endAngle), 0);
        ring.add(sphere2);
        
        ring.castShadow = true;
        ring.receiveShadow = true;
        group.add(ring);
        
        const stalkLength = 0.08; 
        
        // Nova haste cônica (base mais grossa, topo mais fino)
        const stalkGeo = new THREE.CylinderGeometry(0.008, 0.018, stalkLength, 32);
        const stalk = new THREE.Mesh(stalkGeo, material);
        stalk.rotation.x = Math.PI / 2;
        stalk.position.set(0, 0, -stalkLength / 2 - rodRadius);
        stalk.castShadow = true;
        stalk.receiveShadow = true;
        group.add(stalk);
        
        let baseGroup = new THREE.Group();
        if (currentSupportType === '1p') {
            // Suporte 1p: Base circular oca com duto central
            const radius = 0.025; // raio da base circular
            const wall = 0.002; // espessura da parede da base
            
            // 1. Casca Externa (Cilindro Oco)
            const outerShape = new THREE.Shape();
            outerShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
            
            const innerShape = new THREE.Path();
            innerShape.absarc(0, 0, radius - wall, 0, Math.PI * 2, false);
            outerShape.holes.push(innerShape);
            
            const shellExtrudeSettings = { depth: 0.015, bevelEnabled: false };
            const shellGeo = new THREE.ExtrudeGeometry(outerShape, shellExtrudeSettings);
            shellGeo.center();
            const shell = new THREE.Mesh(shellGeo, material);
            baseGroup.add(shell);
            
            // 2. Placa Frontal com Furo Central Vazado
            const frontShape = new THREE.Shape();
            frontShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
            
            const screwHole = new THREE.Path();
            screwHole.absarc(0, 0, 0.0025, 0, Math.PI * 2, false);
            frontShape.holes.push(screwHole);
            
            const frontExtrudeSettings = { depth: 0.002, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.0005, bevelThickness: 0.0005 };
            const frontGeo = new THREE.ExtrudeGeometry(frontShape, frontExtrudeSettings);
            frontGeo.center();
            const frontPlate = new THREE.Mesh(frontGeo, material);
            frontPlate.position.set(0, 0, 0.0075 + 0.001);
            baseGroup.add(frontPlate);
            
            // 3. Duto do Parafuso Central (Pilar Vazado interno)
            const postShape = new THREE.Shape();
            postShape.absarc(0, 0, 0.0045, 0, Math.PI * 2, false);
            const postHole = new THREE.Path();
            postHole.absarc(0, 0, 0.0025, 0, Math.PI * 2, false);
            postShape.holes.push(postHole);
            
            const postGeo = new THREE.ExtrudeGeometry(postShape, { depth: 0.015, bevelEnabled: false });
            postGeo.center();
            
            const post = new THREE.Mesh(postGeo, material);
            post.position.set(0, 0, 0); // No centro exato
            baseGroup.add(post);
            
            // 4. Parafuso Metálico Embutido (Saindo pela parte de trás)
            // Usamos uma textura ou simplesmente um material metálico claro
            const screwGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.04, 16);
            const screwMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.4 });
            const screwMesh = new THREE.Mesh(screwGeo, screwMat);
            screwMesh.rotation.x = Math.PI / 2;
            // A base termina em Z = -0.0075 (local), então o parafuso começa dali para trás
            screwMesh.position.set(0, 0, -0.0075 - 0.02); 
            screwMesh.castShadow = true;
            screwMesh.receiveShadow = true;
            baseGroup.add(screwMesh);
        } else {
            // Suporte 2p: Estrutura CAD (Oca e Vazada)
            const w = 0.030; // largura máxima
            const h = 0.065; // altura total
            const indent = 0.005; // curva para dentro nas laterais
            const wall = 0.002; // espessura da parede da base
            
            // 1. Casca Externa (Parede Oca)
            const outerShape = new THREE.Shape();
            outerShape.moveTo(w/2, h/2);
            outerShape.quadraticCurveTo((w/2) - indent, 0, w/2, -h/2);
            outerShape.lineTo(-w/2, -h/2);
            outerShape.quadraticCurveTo((-w/2) + indent, 0, -w/2, h/2);
            outerShape.lineTo(w/2, h/2);
            
            const innerShape = new THREE.Path();
            const iw = w - wall * 2;
            const ih = h - wall * 2;
            const iindent = indent * 0.8;
            innerShape.moveTo(iw/2, ih/2);
            innerShape.quadraticCurveTo((iw/2) - iindent, 0, iw/2, -ih/2);
            innerShape.lineTo(-iw/2, -ih/2);
            innerShape.quadraticCurveTo((-iw/2) + iindent, 0, -iw/2, ih/2);
            innerShape.lineTo(iw/2, ih/2);
            outerShape.holes.push(innerShape);
            
            const shellExtrudeSettings = { depth: 0.015, bevelEnabled: false };
            const shellGeo = new THREE.ExtrudeGeometry(outerShape, shellExtrudeSettings);
            shellGeo.center(); // centraliza no eixo Z também (-0.0075 a +0.0075)
            const shell = new THREE.Mesh(shellGeo, material);
            baseGroup.add(shell);
            
            // 2. Placa Frontal com Furos Atravessados
            const frontShape = new THREE.Shape();
            frontShape.moveTo(w/2, h/2);
            frontShape.quadraticCurveTo((w/2) - indent, 0, w/2, -h/2);
            frontShape.lineTo(-w/2, -h/2);
            frontShape.quadraticCurveTo((-w/2) + indent, 0, -w/2, h/2);
            frontShape.lineTo(w/2, h/2);
            
            const screwHole1 = new THREE.Path();
            screwHole1.absarc(0, h/2 - 0.008, 0.0025, 0, Math.PI * 2, false);
            frontShape.holes.push(screwHole1);
            
            const screwHole2 = new THREE.Path();
            screwHole2.absarc(0, -h/2 + 0.008, 0.0025, 0, Math.PI * 2, false);
            frontShape.holes.push(screwHole2);
            
            const frontExtrudeSettings = { depth: 0.002, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.0005, bevelThickness: 0.0005 };
            const frontGeo = new THREE.ExtrudeGeometry(frontShape, frontExtrudeSettings);
            frontGeo.center();
            const frontPlate = new THREE.Mesh(frontGeo, material);
            frontPlate.position.set(0, 0, 0.0075 + 0.001); // Encosta na frente da casca
            baseGroup.add(frontPlate);
            
            // 3. Dutos dos Parafusos (Pilares Vazados)
            const postShape = new THREE.Shape();
            postShape.absarc(0, 0, 0.0045, 0, Math.PI * 2, false);
            const postHole = new THREE.Path();
            postHole.absarc(0, 0, 0.0025, 0, Math.PI * 2, false);
            postShape.holes.push(postHole);
            
            const postGeo = new THREE.ExtrudeGeometry(postShape, { depth: 0.015, bevelEnabled: false });
            postGeo.center();
            
            const post1 = new THREE.Mesh(postGeo, material);
            post1.position.set(0, h/2 - 0.008, 0); // No eixo Z, como foi centrado, preenche exatamente o espaço interno da casca
            const post2 = new THREE.Mesh(postGeo, material);
            post2.position.set(0, -h/2 + 0.008, 0);
            
            baseGroup.add(post1);
            baseGroup.add(post2);
        }
        
        baseGroup.position.set(0, 0, -stalkLength - rodRadius);
        baseGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        group.add(baseGroup);

        // Suportes nascem escondidos (escala 0)
        group.scale.set(0, 0, 0);
        varaoGroup.add(group);
        bracketsArray.push(group);
    }
}

// Inicializa o modelo
rebuildGeometries();

// Animação/Render Loop com Física Elástica (LERP)
renderer.setAnimationLoop(animate);
function animate(timestamp, frame) {
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

    // Lógica do WebXR Hit Test
    if (xrHitTestSource && frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(xrHitTestSource);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            xrReticle.visible = true;
            xrReticle.matrix.fromArray(pose.transform.matrix);
        } else {
            xrReticle.visible = false;
        }
    }

    renderer.render(scene, camera);
}

// Responsividade
window.addEventListener('resize', () => {
    const container = document.querySelector('.canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// ==========================================
// INTEGRAÇÃO COM A INTERFACE (DOM) E LINKS DINÂMICOS
// ==========================================

function updateStoreLinks() {
    const shopeeBtn = document.getElementById('shopee-btn');
    if (!shopeeBtn || !targetLength) return;

    const corMap = {
        'azul': 'Azul',
        'branco': 'Branco',
        'cerejeira': 'Cerejeira',
        'imbuia': 'Imbuia',
        'marfim': 'Marfim',
        'mogno': 'Mogno',
        'ouro_velho': 'Ouro Velho',
        'palha': 'Palha',
        'preto': 'Preto',
        'rosa': 'Rosa',
        'titanio': 'Titânio',
        'verde': 'Verde'
    };
    
    const espessura = targetDiameter === 0.019 ? '19mm' : '28mm';
    const cor = corMap[currentColor];
    const tamanho = targetLength.toFixed(2).replace('.', ',') + 'm';
    
    // Constrói o termo de busca dinâmico para a Shopee
    const keyword = `varao ${tamanho} ${cor} ${espessura}`;
    
    shopeeBtn.href = `https://shopee.com.br/fwcsolucoesemmanutencaoltda?entryPoint=ShopBySearch&searchKeyword=${encodeURIComponent(keyword)}`;
}

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
        updateStoreLinks();
    } else {
        divResultado.style.display = 'none';
        currentLength = 2.4; // Default
        currentBrackets = 3;
        rebuildGeometries();
        autoAdjustCamera = true;
        updateStoreLinks();
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
        updateStoreLinks();
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
        updateStoreLinks();
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
        updateStoreLinks();
    });
});

// Atualiza o link pela primeira vez no carregamento
updateStoreLinks();

// Resolve problema de links do TikTok no Desktop (about:blank)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (!isMobile) {
    const tiktokLinks = document.querySelectorAll('a[href*="vt.tiktok.com"]');
    tiktokLinks.forEach(link => {
        link.href = "https://www.tiktok.com/@fwcsolucoes";
    });
}

// 5. Compartilhamento via WhatsApp
const whatsappBtn = document.getElementById('whatsapp-share-btn');
if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
        const cor = currentColor.charAt(0).toUpperCase() + currentColor.slice(1).replace('_', ' ');
        const espessura = Math.round(targetDiameter * 1000) + 'mm';
        const suporte = currentSupportType === '1p' ? '1 Furo' : '2 Furos';
        
        let texto = `*Acabei de simular o varão de cortina ideal para minha casa!* 🤩🏡\n\n`;
        texto += `✅ *Cor:* ${cor}\n`;
        texto += `✅ *Espessura:* ${espessura}\n`;
        texto += `✅ *Suporte:* ${suporte}\n\n`;
        texto += `Dá uma olhada em como ficou ou monte o seu no simulador oficial da F.W.C Soluções 👇\n\n`;
        texto += `🔗 https://fwcsolucoes.vercel.app/configurador.html`;

        const encodedText = encodeURIComponent(texto);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    });
}


// --------------------------------------------------------
// Lógica de Realidade Aumentada (Câmera Fundo Básica)
// --------------------------------------------------------
const arBtn = document.getElementById('ar-toggle-btn');
const arVideo = document.getElementById('ar-video');
const canvasContainer = document.getElementById('canvas-container');
let cameraStream = null;
let isARActive = false;

if (arBtn && arVideo && canvasContainer) {
    arBtn.addEventListener('click', async () => {
        if (!isARActive) {
            try {
                // Solicita acesso à câmera traseira (environment)
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                
                arVideo.srcObject = cameraStream;
                arVideo.style.display = 'block';
                
                // Torna o container transparente para o vídeo aparecer atrás do canvas (o WebGLRenderer já possui alpha: true)
                canvasContainer.style.background = 'transparent';
                
                // UX Melhorada: Esconder painel lateral e forçar 100vh
                const configPanel = document.querySelector('.config-panel');
                if (configPanel) configPanel.style.display = 'none';
                canvasContainer.style.height = '100vh'; // Força altura total no celular
                
                // Muda comportamento do OrbitControls: Arrastar para mover (Pan) em vez de girar
                controls.enableRotate = false;
                controls.enablePan = true;
                
                // Atualiza o botão
                arBtn.innerHTML = '<iconify-icon icon="mdi:camera-off-outline" style="font-size: 1.2rem;"></iconify-icon> Sair da Parede';
                arBtn.style.background = 'rgba(238, 77, 45, 0.9)'; // Vermelho Shopee
                
                // Avisa o usuário na tela sobre as novas ações
                const viewControls = document.querySelector('.view-controls');
                if (viewControls) {
                    viewControls.innerHTML = '<span><iconify-icon icon="mdi:cursor-move"></iconify-icon> Arraste para mover</span><span><iconify-icon icon="mdi:magnify-plus-outline"></iconify-icon> Pinça p/ Zoom</span>';
                }
                
                // Redimensiona o canvas para nova área cheia
                renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
                camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
                camera.updateProjectionMatrix();

                isARActive = true;
                
            } catch (err) {
                console.error("Erro ao acessar a câmera: ", err);
                alert("Não foi possível acessar a câmera do seu dispositivo. Verifique as permissões do seu navegador.");
            }
        } else {
            // Desativa a câmera
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            
            arVideo.style.display = 'none';
            arVideo.srcObject = null;
            
            // Restaura o fundo cinza/branco original
            canvasContainer.style.background = '';
            
            // Restaura o painel lateral
            const configPanel = document.querySelector('.config-panel');
            if (configPanel) configPanel.style.display = 'flex';
            canvasContainer.style.height = ''; // Remove 100vh forçado
            
            // Restaura comportamento do OrbitControls: Girar em vez de Arrastar
            controls.enableRotate = true;
            controls.enablePan = false;
            
            // Restaura o botão
            arBtn.innerHTML = '<iconify-icon icon="mdi:camera-outline" style="font-size: 1.2rem;"></iconify-icon> Ver na Minha Parede';
            arBtn.style.background = 'rgba(0,0,0,0.7)';
            
            // Restaura labels na tela
            const viewControls = document.querySelector('.view-controls');
            if (viewControls) {
                viewControls.innerHTML = '<span><iconify-icon icon="mdi:gesture-swipe-horizontal"></iconify-icon> Girar</span><span><iconify-icon icon="mdi:magnify-plus-outline"></iconify-icon> Zoom</span>';
            }
            
            // Redimensiona de volta
            setTimeout(() => {
                renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
                camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
                camera.updateProjectionMatrix();
            }, 50); // Pequeno atraso para o flexbox se reajustar
            
            isARActive = false;
        }
    });
}

// --------------------------------------------------------
// Lógica de Trena Virtual (WebXR API - Android Apenas)
// --------------------------------------------------------
renderer.xr.enabled = true;
let xrHitTestSource = null;
let xrHitTestSourceRequested = false;
let xrPoint1 = null;
let xrPoint2 = null;

// Cria o retículo (alvo) de mira
const xrReticle = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.06, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
xrReticle.matrixAutoUpdate = false;
xrReticle.visible = false;
scene.add(xrReticle);

const xrMeasureBtn = document.getElementById('xr-measure-btn');

// Checa suporte nativo
if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported && xrMeasureBtn) {
            xrMeasureBtn.style.display = 'flex'; // Mostra botão
        }
    });
}

if (xrMeasureBtn) {
    xrMeasureBtn.addEventListener('click', () => {
        // Esconde o painel para a câmera ficar em tela cheia
        const configPanel = document.querySelector('.config-panel');
        if (configPanel) configPanel.style.display = 'none';
        canvasContainer.style.height = '100vh';
        document.body.classList.add('ar-mode');

        // Inicia a sessão AR pedindo dom-overlay para podermos usar HTML em cima da câmera
        navigator.xr.requestSession('immersive-ar', { 
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        }).then(onSessionStarted).catch(err => {
            console.error("Erro no WebXR", err);
            alert("Erro ao abrir a câmera AR: " + err.message);
            if (configPanel) configPanel.style.display = 'flex';
            canvasContainer.style.height = '';
            document.body.classList.remove('ar-mode');
        });
    });
}

const controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelectPoint);
scene.add(controller);

function onSelectPoint() {
    if (xrReticle.visible) {
        if (!xrPoint1) {
            xrPoint1 = new THREE.Vector3().setFromMatrixPosition(xrReticle.matrix);
            xrReticle.material.color.setHex(0xff0000); // Fica vermelho após o primeiro clique
            
            // Avisa via DOM em vez de alert
            const viewControls = document.querySelector('.view-controls');
            if (viewControls) {
                viewControls.innerHTML = '<span style="color:red; font-size: 1.2rem;">Ponto 1 marcado! Toque na outra ponta.</span>';
            }
        } else if (!xrPoint2) {
            xrPoint2 = new THREE.Vector3().setFromMatrixPosition(xrReticle.matrix);
            
            // Calcula a distância em metros
            const distance = xrPoint1.distanceTo(xrPoint2);
            
            // Atualiza o input da interface
            const inputField = document.getElementById('janela-width');
            const unitSelect = document.getElementById('medida-unidade');
            
            if (inputField) {
                unitSelect.value = 'm';
                inputField.value = distance.toFixed(2);
                calcularMedida(); // Atualiza os resultados
            }
            
            // Mostra o resultado grande na tela antes de fechar
            const viewControls = document.querySelector('.view-controls');
            if (viewControls) {
                viewControls.innerHTML = `<span style="color:#25D366; font-size: 1.5rem; font-weight: bold;">${distance.toFixed(2)}m! Fechando...</span>`;
            }
            
            // Encerra a sessão XR após 2 segundos
            setTimeout(() => {
                const session = renderer.xr.getSession();
                if (session) {
                    session.end();
                }
            }, 2000);
        }
    }
}

function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);
    renderer.xr.setReferenceSpaceType('local');
    renderer.xr.setSession(session);
    
    // Reseta variaveis
    xrPoint1 = null;
    xrPoint2 = null;
    xrHitTestSourceRequested = false;
    xrHitTestSource = null;
    xrReticle.material.color.setHex(0x00ff00);
    
    // Muda a instrução na tela
    const viewControls = document.querySelector('.view-controls');
    if (viewControls) {
        viewControls.innerHTML = '<span style="font-size:1.1rem;">Escaneie o chão/parede e toque no Anel Verde.</span>';
    }

    session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            xrHitTestSource = source;
        });
    });
}

function onSessionEnded() {
    xrHitTestSourceRequested = false;
    xrHitTestSource = null;
    xrReticle.visible = false;
    
    // Restaura o painel lateral
    const configPanel = document.querySelector('.config-panel');
    if (configPanel) configPanel.style.display = 'flex';
    canvasContainer.style.height = ''; 
    document.body.classList.remove('ar-mode');
    
    // Restaura labels originais
    const viewControls = document.querySelector('.view-controls');
    if (viewControls) {
        viewControls.innerHTML = '<span><iconify-icon icon="mdi:gesture-swipe-horizontal"></iconify-icon> Girar</span><span><iconify-icon icon="mdi:magnify-plus-outline"></iconify-icon> Zoom</span>';
    }
    
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
}

