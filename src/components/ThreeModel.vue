<template>
  <div class="three-container w-full h-full flex items-center justify-center">
    <!-- Indicador de carga -->
    <div v-if="!isLoaded && !loadingError" class="loading-indicator absolute z-10">
      <div class="loading-text">Cargando modelo 3D: {{ loadingProgress }}%</div>
      <div class="loading-bar">
        <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
      </div>
    </div>
    
    <!-- Mensaje de error -->
    <div v-if="loadingError" class="error-message absolute z-10">
      {{ loadingError }}
    </div>
    
    <div ref="threeContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const threeContainer = ref(null);
const isLoaded = ref(false);
const loadingProgress = ref(0);
const loadingError = ref(null);
let renderer, scene, camera, model;
let controls; // Controles orbitales
let animationId = null;
let mixer; // Para animaciones
let texture; // Para la textura

// Variables para la animación de oscilación
let oscillationAngle = 0;
let oscillationDirection = 1;
const oscillationSpeed = 0.0005;
const maxOscillationAngle = Math.PI / 4; // 45 grados en radianes

onMounted(() => {
  console.log('Componente ThreeModel montado');
  
  // Inicializar la escena
  scene = new THREE.Scene();
  
  // Usar un fondo con color para distinguir mejor
  scene.background = new THREE.Color(0xffffff);

  // Configurar cámara
  camera = new THREE.PerspectiveCamera(
    60, 
    threeContainer.value.clientWidth / threeContainer.value.clientHeight, 
    0.1, 
    1000
  );
  // Posicionar la cámara más cerca para ver mejor el modelo
  camera.position.set(0, 3, 6);
  camera.lookAt(0, 0, 0);

  // Configurar renderer con mejor rendimiento
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false // Mejor rendimiento sin alpha
  });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);

  // Mejorar la iluminación para ver mejor el modelo
  // Luz ambiental más intensa
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  // Luz direccional principal
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);
  
  // Luz adicional desde otro ángulo para mejorar visibilidad
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-5, 3, -10);
  scene.add(fillLight);
  
  // Configurar controles orbitales limitados
  controls = new OrbitControls(camera, renderer.domElement);
  
  // Desactivar rotación en X (vertical) - solo permitir rotación en Y (horizontal)
  controls.enableRotate = true;
  controls.minPolarAngle = Math.PI / 2; // 90 grados (horizontal)
  controls.maxPolarAngle = Math.PI / 2; // 90 grados (horizontal)
  
  // Limitar la rotación en Y a 45 grados hacia cada lado
  controls.minAzimuthAngle = -Math.PI / 4; // -45 grados
  controls.maxAzimuthAngle = Math.PI / 4;  // +45 grados
  
  // Desactivar zoom y pan
  controls.enableZoom = false;
  controls.enablePan = false;
  
  // Agregar amortiguación para movimientos más suaves
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Actualizar controles
  controls.update();

  // Cargar el modelo GLB
  loadGLBModel();

  // Manejar el cambio de tamaño de la ventana
  window.addEventListener('resize', onWindowResize);

  // Iniciar animación
  animate();
});

onBeforeUnmount(() => {
  // Limpiar recursos cuando el componente se desmonta
  window.removeEventListener('resize', onWindowResize);
  cancelAnimationFrame(animationId);
  if (controls) {
    controls.dispose();
  }
  if (renderer) {
    renderer.dispose();
  }
});

function loadGLBModel() {
  // Crear un gestor de carga para mostrar el progreso
  const loadingManager = new THREE.LoadingManager();
  
  loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    loadingProgress.value = Math.floor((itemsLoaded / itemsTotal) * 100);
  };
  
  loadingManager.onError = (url) => {
    loadingError.value = `Error al cargar: ${url}`;
    console.error(`Error al cargar: ${url}`);
  };
  
  // Cargar la textura primero
  const textureLoader = new TextureLoader(loadingManager);
  texture = textureLoader.load('/textures/cat1_0.png', 
    // Callback de éxito - textura cargada
    () => {
      console.log('Textura cargada correctamente');
      // Configurar la textura
      // Nota: sRGBEncoding está obsoleto en Three.js reciente, usar sRGBColorSpace
      try {
        if (THREE.sRGBColorSpace) {
          texture.colorSpace = THREE.sRGBColorSpace;
        } else {
          texture.encoding = THREE.sRGBEncoding;
        }
      } catch (e) {
        console.warn('Error al configurar colorSpace:', e);
        texture.encoding = THREE.sRGBEncoding;
      }
      texture.flipY = true; // Probar con true para ver si mejora
      
      // Ahora cargar el modelo GLB
      loadGLTFWithTexture();
    },
    // Callback de progreso
    (xhr) => {
      console.log(`Cargando textura: ${Math.floor((xhr.loaded / xhr.total) * 100)}%`);
    },
    // Callback de error
    (error) => {
      loadingError.value = 'Error al cargar la textura';
      console.error('Error al cargar la textura:', error);
    }
  );
}

function loadGLTFWithTexture() {
  console.log('Iniciando carga del modelo GLB');
  
  // Crear un cargador GLTF
  const loader = new GLTFLoader();
  
  // Cargar el modelo GLB
  loader.setPath('/source/');
  loader.load(
    'bongo.glb',
    (gltf) => {
      console.log('Modelo GLB cargado exitosamente:', gltf);
      model = gltf.scene;
      
      // Aumentar la escala del modelo para que se vea más grande
      model.scale.set(4, 4, 4); // Escala aumentada para mejor visualización
      
      // Centrar el modelo
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;
      
      // Ajustar posición vertical para centrar mejor en la vista
      model.position.y = -1; // Bajar ligeramente para que se vea completo
      
      // Girar el modelo 10 grados en X para que mire hacia la pantalla
      model.rotation.x = Math.PI * 25 / 180; // Convertir 10 grados a radianes
      
      // Agregar el modelo a la escena
      scene.add(model);
      
      // Configurar animaciones si el modelo las tiene
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
      
      isLoaded.value = true;
    },
    (xhr) => {
      // Progreso de carga
      loadingProgress.value = Math.floor((xhr.loaded / xhr.total) * 100);
    },
    (error) => {
      // Error de carga
      loadingError.value = 'Error al cargar el modelo FBX';
      console.error('Error al cargar el modelo FBX:', error);
    }
  );
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
  
  // Actualizar controles orbitales si existen
  if (controls) {
    controls.update();
  }
  
  // Animar la oscilación del modelo entre -45 y 45 grados
  if (model) {
    // Actualizar el ángulo de oscilación
    oscillationAngle += oscillationSpeed * oscillationDirection;
    
    // Cambiar dirección si alcanza los límites
    if (oscillationAngle >= maxOscillationAngle) {
      oscillationAngle = maxOscillationAngle;
      oscillationDirection = -1;
    } else if (oscillationAngle <= -maxOscillationAngle) {
      oscillationAngle = -maxOscillationAngle;
      oscillationDirection = 1;
    }
    
    // Aplicar la rotación al modelo
    model.rotation.y = oscillationAngle;
    
    // Actualizar el mezclador de animaciones si existe
    if (mixer) {
      mixer.update(0.01); // Actualizar animaciones
    }
  }
  
  if (renderer && scene && camera) {
    try {
      renderer.render(scene, camera);
    } catch (error) {
      console.error('Error al renderizar:', error);
    }
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

/* Estilos para el indicador de carga */
.loading-indicator {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.loading-text {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.loading-bar {
  width: 200px;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background-color: #00a86b;
  transition: width 0.3s ease;
}

/* Estilos para mensaje de error */
.error-message {
  background-color: rgba(254, 226, 226, 0.9);
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 500;
}
</style>