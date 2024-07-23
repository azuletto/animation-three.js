import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cubes = [];
const cubeSpeed = 0.05;

// Function to create and add a new cube to the scene and array
function createCube() {
  const height = Math.random() * (5 - 2) + 2; // Random height between 1 and 3
  const geometry = new THREE.BoxGeometry(1, height, 0.5);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  const cube = new THREE.Mesh(geometry, material);

  // Set the initial x position of the new cube relative to the previous cube
  const previousCube = cubes[cubes.length - 1];
  cube.position.x = previousCube ? previousCube.position.x - 5 : -window.innerWidth / 100;
  
  cube.position.y = height/2 - 1.6; // Keep y position constant
  cube.position.z = 0; // Keep it on the same z-plane
  
  cubes.push(cube);
  scene.add(cube);
  console.log('Cube created at position:', cube.position.x, cube.position.y, cube.position.z, 'with height:', height);
}

// Initially create a few cubes
for (let i = 0; i < 5; i++) {
  createCube();
}

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  // Update the position of each cube
  cubes.forEach((cube, index) => {
    cube.position.x += cubeSpeed; // Move horizontally

    // Remove cube if it moves out of view and create a new one
    if (cube.position.x > window.innerWidth / 100) {
      scene.remove(cube);
      cubes.splice(index, 1);
      createCube();
    }
  });

  renderer.render(scene, camera);
}

animate();
