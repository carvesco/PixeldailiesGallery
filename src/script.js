import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import GUI from "lil-gui";
import JEASINGS from "jeasings";
import cardbackFragmenShader from "./shaders/cardBack/fragment.glsl";
import cardbackVertexShader from "./shaders/cardBack/vertex.glsl";
import pixeldailiesData from "./pixeldailiesLit.json"; // Import JSON directly from src folder

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 });
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();

/**
 * Environment map
 */
rgbeLoader.load("/spruit_sunrise.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = environmentMap;
});

/**
 * Helpers
 */
const helper = new THREE.AxesHelper(5);
scene.add(helper);

/**
 * Raycaster
 */
const mouse = new THREE.Vector2();

const raycaster = new THREE.Raycaster();

/**
 * Card
 */

// Load texture properly
const textureLoader = new THREE.TextureLoader();

// Use imported JSON data directly
const pixeldailies = pixeldailiesData.items; // Assuming your JSON has an "items" property
console.log("Loaded pixeldailies data:", pixeldailies);

// Load all textures from the imported JSON data
const pixelDailiesTextures = [];
pixeldailies.forEach((item, index) => {
  const texture = textureLoader.load(
    `/pixeldailies/${item.filename}`, // Assuming the JSON has a filename property
    () => {
      console.log(
        `Loaded texture ${index + 1}/${pixeldailies.length}: ${item.filename}`
      );
    },
    undefined,
    (error) => {
      console.error(`Failed to load texture: ${item.filename}`, error);
    }
  );
  pixelDailiesTextures.push(texture);
});
console.log("All textures loaded:", pixelDailiesTextures);

const bhsTextureTwo = textureLoader.load("/pixeldailies/Ammo.jpg");
console.log(bhsTextureTwo);
const cardGeometry = new THREE.PlaneGeometry(2, 2);
const cardGeometryTwo = new THREE.BoxGeometry(2, 2, 0);
const cardMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    
    void main() {
      vec4 textureColor = texture2D(uTexture, vUv);
      gl_FragColor = textureColor;
    }
  `,
  uniforms: {
    uTexture: { value: bhsTextureTwo },
  },
  /* side: THREE.DoubleSide, */
});
const cardBackMaterial = new THREE.ShaderMaterial({
  vertexShader: cardbackVertexShader,
  fragmentShader: cardbackFragmenShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uTexture: { value: bhsTextureTwo },
  },
  transparent: true,
});
const card = (texture) => {
  // Create unique materials for each card
  const uniqueCardMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uTexture;
      
      void main() {
        vec4 textureColor = texture2D(uTexture, vUv);
        gl_FragColor = textureColor;
      }
    `,
    uniforms: {
      uTexture: { value: texture },
    },
  });
  const sideMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.5,
  });

  const uniqueCardBackMaterial = new THREE.ShaderMaterial({
    vertexShader: cardbackVertexShader,
    fragmentShader: cardbackFragmenShader,
    uniforms: {
      uTime: new THREE.Uniform(0),
      uTexture: { value: texture },
    },
    transparent: true,
  });

  const object = new THREE.Mesh(cardGeometryTwo, [
    sideMaterial,
    sideMaterial,
    sideMaterial,
    sideMaterial,
    uniqueCardMaterial,
    uniqueCardBackMaterial,
  ]);

  return object;
};
console.log(pixelDailiesTextures.length);
const objects = [];
for (let i = 0; i < pixelDailiesTextures.length; i++) {
  /* let object = new THREE.Mesh(cardGeometry, cardMaterial); */
  const object = card(pixelDailiesTextures[i]);
  /* object.position.set(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  ); */
  objects.push(object);
}

const planeTwo = new THREE.Mesh(cardGeometryTwo, [
  null,
  null,
  null,
  null,
  cardMaterial,
  cardMaterial,
]);

scene.add(planeTwo);

var vector = new THREE.Vector3();

for (let i = 0; i < objects.length; i++) {
  const theta = i * 0.475 + Math.PI;
  const y = -(i * 0.3);
  objects[i].position.setFromCylindricalCoords(6, theta, y);
  vector.x = objects[i].position.x * 2;
  vector.y = objects[i].position.y;
  vector.z = objects[i].position.z * 2;
  objects[i].lookAt(vector);

  scene.add(objects[i]);
}

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
const theta = 0 * 0.475 + Math.PI;
const y = -(0 * 0.3);
camera.position.setFromCylindricalCoords(12, theta, y);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Controls
/* const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; */

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */

const clock = new THREE.Clock();
var index = 0;
var isAnimating = false; // Add animation state tracking

const moveAnimation = (newIndex) => {
  if (newIndex !== index) {
    index = newIndex;
    isAnimating = true; // Set animation state

    const theta = index * 0.475 + Math.PI;
    const y = -(index * 0.3);
    const r = 12; // radius
    const nextPos = new THREE.Vector3();
    nextPos.setFromCylindricalCoords(r, theta, y);
    console.log("Animating to position cylindrical(theta,r,z):", theta, r, y);

    new JEASINGS.JEasing(camera.position)
      .to(
        {
          x: nextPos.x,
          y: nextPos.y,
          z: nextPos.z,
        },
        200
      )
      .easing(JEASINGS.Quadratic.Out)
      .onUpdate(() => {
        camera.lookAt(0, nextPos.y, 0);
      })
      .onComplete(() => {
        isAnimating = false; // Reset animation state when complete
      })
      .start();
  }
};

const rightButton = document.getElementsByClassName("rightButton")[0];
const leftButton = document.getElementsByClassName("leftButton")[0];
rightButton.addEventListener("click", () => {
  moveAnimation(index + 1);
});
leftButton.addEventListener("click", () => {
  moveAnimation(index - 1);
});

addEventListener("wheel", (event) => {
  // Prevent default scrolling behavior
  event.preventDefault();

  // Ignore wheel events if currently animating
  if (isAnimating) return;

  let newIndex = index;
  if (event.deltaY > 0) {
    // Scroll down
    if (newIndex < objects.length - 1) newIndex++;
  } else {
    // Scroll up
    if (newIndex > 0) newIndex--;
  }

  // Only animate if index actually changed
  if (newIndex !== index) {
    index = newIndex;
    isAnimating = true; // Set animation state

    const theta = index * 0.475 + Math.PI;
    const y = -(index * 0.3);
    const r = 12; // radius
    const nextPos = new THREE.Vector3();
    nextPos.setFromCylindricalCoords(r, theta, y);
    console.log("Animating to position cylindrical(theta,r,z):", theta, r, y);

    new JEASINGS.JEasing(camera.position)
      .to(
        {
          x: nextPos.x,
          y: nextPos.y,
          z: nextPos.z,
        },
        200
      )
      .easing(JEASINGS.Quadratic.Out)
      .onUpdate(() => {
        camera.lookAt(0, nextPos.y, 0);
      })
      .onComplete(() => {
        isAnimating = false; // Reset animation state when complete
      })
      .start();
  }
});

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update time uniform for all card back materials
  objects.forEach((object) => {
    if (object.material[5] && object.material[5].uniforms.uTime) {
      object.material[5].uniforms.uTime.value = elapsedTime;
    }
  });

  // Reset all objects to normal scale first
  objects.forEach((object) => {
    object.scale.set(1, 1);
    // Reset cursor to default when not hovering over objects
    canvas.style.cursor = "default";
  });

  raycaster.setFromCamera(mouse, camera);
  const objectTotest = raycaster.intersectObjects(objects);
  if (objectTotest.length) {
    // If the raycaster intersects with an object, scale up the first intersected object
    objectTotest[0].object.scale.set(1.2, 1.2);
    // Change cursor to pointer when hovering over objects
    canvas.style.cursor = "pointer";
  }
  if (index > objects.length - 2) {
    rightButton.style.display = "none"; // Hide button if at the last index
  } else {
    rightButton.style.display = "block"; // Show button if not at the last index
  }
  if (index < 1) {
    leftButton.style.display = "none"; // Hide button if at the first index
  } else {
    leftButton.style.display = "block"; // Show button if not at the last index
  }
  // Update controls
  /* controls.update(); */

  JEASINGS.update(); // Update JEASINGS for animations

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
