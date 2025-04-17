<template>
  <div class="three-container w-full h-full flex items-center justify-center">
    
    <div ref="threeContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import * as THREE from "three";

const threeContainer = ref(null);
const isLoaded = ref(false);
let renderer, scene, camera, model;
let animationId = null;

onMounted(() => {
  // Inicializar la escena
  scene = new THREE.Scene();
  
  // Usar un fondo blanco sólido para mejor rendimiento
  scene.background = new THREE.Color(0xffffff);

  // Configurar cámara
  camera = new THREE.PerspectiveCamera(
    60, 
    threeContainer.value.clientWidth / threeContainer.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  camera.position.y = 0.5;

  // Configurar renderer con mejor rendimiento
  renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    alpha: false // Mejor rendimiento sin alpha
  });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);

  // Agregar luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Crear un modelo 3D más interesante - una forma geométrica
  createGeometricModel();

  // Manejar el cambio de tamaño de la ventana
  window.addEventListener('resize', onWindowResize);

  // Marcar como cargado
  isLoaded.value = true;

  // Iniciar animación
  animate();
});

onBeforeUnmount(() => {
  // Limpiar recursos cuando el componente se desmonta
  window.removeEventListener('resize', onWindowResize);
  cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
  }
});

function createGeometricModel() {
  // Crear un grupo para contener múltiples formas
  model = new THREE.Group();
  
  // Colores que coinciden con el esquema del sitio
  const primaryColor = new THREE.Color(0x00a86b); // Color primario (ajusta según tu esquema)
  const secondaryColor = new THREE.Color(0x3d4852); // Color secundario (gris oscuro)
  
  // Crear un dodecaedro (forma de 12 caras)
  const dodecahedronGeometry = new THREE.DodecahedronGeometry(1, 0);
  const dodecahedronMaterial = new THREE.MeshStandardMaterial({ 
    color: primaryColor,
    metalness: 0.3,
    roughness: 0.4
  });
  const dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
  model.add(dodecahedron);
  
  // Añadir anillos decorativos
  const torusGeometry = new THREE.TorusGeometry(1.5, 0.08, 16, 50);
  const torusMaterial = new THREE.MeshStandardMaterial({ 
    color: secondaryColor,
    metalness: 0.5,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7
  });
  
  // Primer anillo
  const torus1 = new THREE.Mesh(torusGeometry, torusMaterial);
  torus1.rotation.x = Math.PI / 2;
  model.add(torus1);
  
  // Segundo anillo
  const torus2 = new THREE.Mesh(torusGeometry, torusMaterial);
  torus2.rotation.y = Math.PI / 2;
  model.add(torus2);
  
  scene.add(model);
}

function onWindowResize() {
  if (camera && renderer && threeContainer.value) {
    camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  if (model) {
    // Rotación suave del modelo
    model.rotation.y += 0.005;
    model.rotation.z += 0.002;
    
    // Movimiento ondulante suave
    model.position.y = Math.sin(Date.now() * 0.001) * 0.2;
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
</script>

<style scoped>
.three-container {
  background-color: white;
  position: relative;
}

/* Aplicar estilos al canvas de Three.js para que respete los bordes redondeados */
canvas {
  border-radius: 0.5rem;
  display: block;
}
</style>