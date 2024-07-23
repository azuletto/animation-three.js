import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cubes = [];
const cubeSpeed = 0.05;

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

// Função para criar e adicionar um novo cubo à cena e ao array
async function createCube() {
  const height = Math.random() * (5 - 2) + 2; // Altura aleatória entre 2 e 5
  const geometry = new THREE.BoxGeometry(1, height, 0.5);
  let buildingTexture;

  try {
    buildingTexture = await loadTexture('./texture.jpg');
  } catch (err) {
    console.error('Failed to load building texture', err);
    return;
  }

  const material = new THREE.MeshStandardMaterial({ map: buildingTexture });
  const cube = new THREE.Mesh(geometry, material);

  // Definir a posição inicial x do novo cubo em relação ao cubo anterior
  const previousCube = cubes[cubes.length - 1];
  cube.position.x = previousCube ? previousCube.position.x - 3 : -window.innerWidth / 100;

  cube.position.y = height / 2 - 1.6; // Manter posição y constante
  cube.position.z = 0; // Manter no mesmo plano z

  cubes.push(cube);
  scene.add(cube);
  console.log('Cube created at position:', cube.position.x, cube.position.y, cube.position.z, 'with height:', height);
}

// Carregar a textura de fundo da cidade
loadTexture('./city-back.jpeg').then((cityTexture) => {
  scene.background = cityTexture;
}).catch((err) => {
  console.error('Failed to load city background texture', err);
});

// Adicionar uma luz à cena
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 1).normalize();
scene.add(light);

// Inicialmente criar alguns cubos
for (let i = 0; i < 10; i++) {
  createCube();
}

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  // Atualizar a posição de cada cubo
  cubes.forEach((cube, index) => {
    cube.position.x += cubeSpeed; // Mover horizontalmente

    // Remover cubo se ele sair de vista e criar um novo
    if (cube.position.x > window.innerWidth / 100) {
      scene.remove(cube);
      cubes.splice(index, 1);
      createCube();
    }
  });

  renderer.render(scene, camera);
}

animate();
