import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//const controls = new OrbitControls(camera, renderer.domElement);

const buildings = [];
const buildingSpeed = 0.05;
let planeSpeed = 0.30;
let airplane; // Definir a variável para o modelo do avião
let audioPlayed = false; // Variável para garantir que o áudio toque apenas uma vez
let bomb; // Variável para a bomba
let explosionOccurred = false; // Variável para indicar se a explosão ocorreu

// Função para carregar textura com callbacks
function loadTexture(path) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      path,
      (texture) => {
        console.log(`Texture loaded from ${path}`);
        resolve(texture);
      },
      undefined,
      (err) => {
        console.error(`Error loading texture from ${path}`, err);
        reject(err);
      }
    );
  });
}

async function loadTextures() {
  let planeTexture, groundTexture;
  try {
    planeTexture = await loadTexture('./plane_texture.jpg');
    groundTexture = await loadTexture('./ground_texture.jpg'); // Carregar textura do chão
  } catch (err) {
    console.error('Failed to load textures', err);
    return null;
  }
  return { planeTexture, groundTexture };
}

function loadGLTFModel(path) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        console.log(`Model loaded from ${path}`);
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.error(`Error loading model from ${path}`, err);
        reject(err);
      }
    );
  });
}

// Função para adicionar o modelo GLTF à cena
async function addGLTFModel(planeTexture) {
  try {
    airplane = await loadGLTFModel('./models/plane.glb');
    airplane.position.set(60, 15, -30); // Começa antes da cena
    airplane.rotation.x = 0; // Rotacionar 45 graus em torno do eixo x
    airplane.rotation.y = 4.6;
    airplane.rotation.z = 0;
    airplane.traverse(node => {
      if (node.isMesh) node.material.map = planeTexture;
    });
    scene.add(airplane);
  } catch (err) {
    console.error('Failed to load GLTF model', err);
  }
}

// Função para criar e adicionar um novo prédio à cena e ao array
async function createBuilding() {
  let building;

  try {
    building = await loadGLTFModel('./models/building.glb');
  } catch (err) {
    console.error('Failed to load building model', err);
    return;
  }

  // Gerar uma altura aleatória para o prédio
  const heightScale = Math.random() * (1.5 - 0.5) + 0.5; // Escala aleatória entre 0.5 e 1.5
  building.scale.set(0.25, heightScale * 0.28, 0.15);

  // Definir a posição inicial x do novo prédio em relação ao prédio anterior
  const previousBuilding = buildings[buildings.length - 1];
  building.position.x = previousBuilding ? previousBuilding.position.x - 3 : -window.innerWidth / 100;

  building.position.y = -2; // Manter posição y constante
  building.position.z = 0; // Manter no mesmo plano z

  buildings.push(building);
  scene.add(building);
  console.log('Building created at position:', building.position.x, building.position.y, building.position.z, 'with height scale:', heightScale);
}

// Função para criar e adicionar o chão à cena
async function createGround(groundTexture) {
  const geometry = new THREE.PlaneGeometry(200, 10);
  const material = new THREE.MeshStandardMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(geometry, material);

  ground.rotation.x = -Math.PI / 2; // Rotacionar para ficar horizontal
  ground.position.y = -2; // Ajustar posição para coincidir com a base dos prédios

  scene.add(ground);
}

// Função para criar uma bomba
function createBomb() {
  const bombGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const bombMesh = new THREE.Mesh(bombGeometry, bombMaterial);

  const fuseGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 32);
  const fuseMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const fuseMesh = new THREE.Mesh(fuseGeometry, fuseMaterial);

  fuseMesh.position.set(0, 0.35, 0);
  bombMesh.add(fuseMesh);

  bombMesh.position.set(0, 10, 0); // Definir posição inicial da bomba
  scene.add(bombMesh);

  return bombMesh;
}

// Função para aplicar o efeito de explosão
function explode() {
  explosionOccurred = true; // Indicar que a explosão ocorreu

  // Remover todos os prédios da cena
  buildings.forEach(building => {
    scene.remove(building);
  });

  // Adicionar fragmentos da explosão
  for (let i = 0; i < 100; i++) {
    const fragmentGeometry = new THREE.SphereGeometry();
    const fragmentMaterial = new THREE.MeshStandardMaterial({ color: "orange" });
    const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);

    fragment.position.set(
      (Math.random() - 0.5) * 4, // Posição aleatória em torno da explosão
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );

    fragment.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );

    scene.add(fragment);

    // Animação dos fragmentos
    fragment.animate = function () {
      fragment.position.add(fragment.velocity);
      fragment.velocity.y -= 0.005; // Simular gravidade
    };

    buildings.push(fragment); // Usar o array buildings para armazenar os fragmentos
  }
}

// Carregar a textura de fundo da cidade
loadTexture('./city-back.jpeg').then((cityTexture) => {
  scene.background = cityTexture;
}).catch((err) => {
  console.error('Failed to load city background texture', err);
});

// Adicionar uma luz à cena
const light = new THREE.DirectionalLight(0xffffff, 2);
const light2 = new THREE.DirectionalLight(0xffffff, 2);

light.position.set(2, 0, 3).normalize();
light2.position.set(-2, 2, 0).normalize();
scene.add(light);
scene.add(light2);

// Inicialmente criar alguns prédios
for (let i = 0; i < 10; i++) {
  createBuilding();
}

async function init() {
  const textures = await loadTextures();
  if (textures) {
    await createGround(textures.groundTexture); // Passar a textura do chão
    await addGLTFModel(textures.planeTexture);
    animate();
  }

  // Tocar o áudio após 11 segundos
  setTimeout(() => {
    if (!audioPlayed) {
      const audio = new Audio('./sounds/celso_portiolli.mp3'); // Substitua pelo caminho do seu arquivo de áudio
      audio.play();
      audioPlayed = true; // Garantir que o áudio toque apenas uma vez
    }
  }, 11000);

  // Criar e soltar a bomba após 32 segundos
  setTimeout(() => {
    planeSpeed = 2;
    bomb = createBomb();
    setTimeout(() => {
      const bomb_audio = new Audio('./sounds/bomb.mp3'); // Substitua pelo caminho do seu arquivo de áudio
      bomb_audio.play();
    }, 1800)
  }, 30000);
}

camera.position.z = 5;

function animate() {
  if (!explosionOccurred) { // Verificar se a explosão ocorreu
    requestAnimationFrame(animate);

    // Atualizar a posição de cada prédio ou fragmento
    buildings.forEach((building, index) => {
      if (building.animate) {
        building.animate(); // Animação dos fragmentos
      } else {
        building.position.x += buildingSpeed; // Mover horizontalmente

        // Remover prédio se ele sair de vista e criar um novo
        if (building.position.x > window.innerWidth / 100) {
          scene.remove(building);
          buildings.splice(index, 1);
          createBuilding();
        }
      }
    });

    // Atualizar a posição do avião (se carregado)
    if (airplane) {
      airplane.position.x -= planeSpeed; // Ajuste a velocidade conforme necessário

      // Remover o avião se ele sair de vista
      if (airplane.position.x < window.innerWidth / -10) {
        airplane.position.x = -window.innerWidth / -10; // Reposiciona o avião para o início
      }
    }

    // Atualizar a posição da bomba (se criada)
    if (bomb) {
      bomb.position.y -= 0.1; // Velocidade de queda da bomba
      if (bomb.position.y < -2) {
        scene.remove(bomb); // Remover a bomba se ela cair abaixo do chão
        bomb = null; // Redefinir a variável para garantir que não haja movimentação adicional
        explode(); // Chamar a função de explosão
      }
    }

    //controls.update(); // Atualizar controles de órbita
    renderer.render(scene, camera);
  }
}

init();
