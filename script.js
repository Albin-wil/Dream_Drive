/* ============================================
   3D CAR CUSTOMIZER - JAVASCRIPT ENGINE
   ============================================ */

// State management
const carState = {
  model: 'sedan',
  bodyColor: '#ff0000',
  wheelStyle: 'standard',
  rimSize: 0.55,
  suspension: 0.8,
  windowTint: 0,
  headlightType: 'standard',
  headlightColor: '#ffffff',
  spoilerEnabled: false,
  bodyKitEnabled: false,
  exhaustType: 'single',
  interiorColor: '#cccccc'
};

// DOM element references
const elements = {
  carContainer: document.getElementById('car3d'),
  loadingScreen: document.getElementById('loading-screen'),
  carModelSelect: document.getElementById('car-model'),
  bodyColorInput: document.getElementById('body-color'),
  wheelStyleSelect: document.getElementById('wheel-style'),
  rimSizeSlider: document.getElementById('rim-size'),
  rimSizeDisplay: document.getElementById('rim-size-display'),
  suspensionSlider: document.getElementById('suspension'),
  suspensionDisplay: document.getElementById('suspension-display'),
  windowTintSlider: document.getElementById('window-tint'),
  tintDisplay: document.getElementById('tint-display'),
  headlightTypeSelect: document.getElementById('headlight-type'),
  headlightColorInput: document.getElementById('headlight-color'),
  spoilerToggle: document.getElementById('spoiler-toggle'),
  bodyKitToggle: document.getElementById('body-kit-toggle'),
  exhaustTypeSelect: document.getElementById('exhaust-type'),
  interiorColorSelect: document.getElementById('interior-color'),
  priceDisplay: document.getElementById('price-display'),
  saveConfigBtn: document.getElementById('save-config-btn'),
  loadConfigBtn: document.getElementById('load-config-btn'),
  resetConfigBtn: document.getElementById('reset-config-btn'),
  screenshotBtn: document.getElementById('screenshot-btn'),
  resetViewBtn: document.getElementById('reset-view-btn')
};

// Three.js scene variables
let scene, camera, renderer, controls;
let carGroup;
let wheelMeshes = [];
let exhaustMeshes = [];
let lightMeshes = [];

/**
 * Initialize Three.js scene
 */
function initScene() {
  try {
    const container = elements.carContainer;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 3, 8);

    renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-15, 10, 15);
    scene.add(pointLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.update();

    // Car group
    carGroup = new THREE.Group();
    scene.add(carGroup);

    // Resize handler
    window.addEventListener('resize', onWindowResize);
    
    console.log('Scene initialized successfully');
  } catch (error) {
    console.error('Error initializing scene:', error);
    alert('Error initializing 3D scene: ' + error.message);
  }
}

function onWindowResize() {
  const container = elements.carContainer;
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Helper functions
function getCarDimensions() {
  const models = {
    sedan: { length: 4.8, width: 2.0, height: 1.6 },
    suv: { length: 5.5, width: 2.2, height: 2.0 },
    sports: { length: 5.0, width: 2.0, height: 1.5 },
    electric: { length: 4.8, width: 2.1, height: 1.8 }
  };
  return models[carState.model];
}

function getWheelColor() {
  const colors = {
    standard: 0x1a1a1a,
    sport: 0x666666,
    luxury: 0xaaaaaa,
    racing: 0xff6b35
  };
  return colors[carState.wheelStyle] || 0x1a1a1a;
}

function getExhaustCount() {
  const counts = {
    single: 1,
    dual: 2,
    quad: 4
  };
  return counts[carState.exhaustType] || 1;
}

function calculatePrice() {
  let price = 45000;

  const modelPrices = {
    sedan: 0,
    suv: 8000,
    sports: 15000,
    electric: 10000
  };
  price += modelPrices[carState.model] || 0;

  const wheelPrices = {
    standard: 0,
    sport: 1500,
    luxury: 2500,
    racing: 3500
  };
  price += wheelPrices[carState.wheelStyle] || 0;

  if (carState.spoilerEnabled) price += 2000;
  if (carState.bodyKitEnabled) price += 1500;
  if (carState.exhaustType === 'dual') price += 1200;
  if (carState.exhaustType === 'quad') price += 2500;

  return price;
}

function updatePrice() {
  const price = calculatePrice();
  elements.priceDisplay.textContent = '$' + price.toLocaleString();
}

// Clear car parts
function clearCar() {
  while (carGroup.children.length > 0) {
    carGroup.remove(carGroup.children[0]);
  }
  wheelMeshes = [];
  exhaustMeshes = [];
  lightMeshes = [];
}

// Build car body
function buildCarBody() {
  let dims = getCarDimensions();

  const bodyGeo = new THREE.BoxGeometry(dims.length, dims.height, dims.width);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: carState.bodyColor,
    shininess: 90,
    flatShading: false
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = carState.suspension + 0.3;
  body.castShadow = true;
  body.receiveShadow = true;
  carGroup.add(body);

  const hoodGeo = new THREE.BoxGeometry(0.8, 0.1, dims.width - 0.2);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(dims.length / 2 - 0.4, carState.suspension + 0.3, 0);
  hood.castShadow = true;
  carGroup.add(hood);

  const trunkGeo = new THREE.BoxGeometry(0.6, 0.1, dims.width - 0.2);
  const trunk = new THREE.Mesh(trunkGeo, bodyMat);
  trunk.position.set(-dims.length / 2 + 0.3, carState.suspension + 0.3, 0);
  trunk.castShadow = true;
  carGroup.add(trunk);
}

// Build doors
function buildDoors() {
  let dims = getCarDimensions();
  const doorMat = new THREE.MeshPhongMaterial({
    color: carState.bodyColor,
    shininess: 80
  });

  // Front left door
  const frontLeftDoorGeo = new THREE.BoxGeometry(0.08, 1.0, 1.0);
  const frontLeftDoor = new THREE.Mesh(frontLeftDoorGeo, doorMat);
  frontLeftDoor.position.set(0.3, carState.suspension + 0.3, -dims.width / 2 - 0.04);
  frontLeftDoor.rotation.x = Math.PI / 2;
  frontLeftDoor.castShadow = true;
  carGroup.add(frontLeftDoor);

  // Front right door
  const frontRightDoor = new THREE.Mesh(frontLeftDoorGeo, doorMat);
  frontRightDoor.position.set(0.3, carState.suspension + 0.3, dims.width / 2 + 0.04);
  frontRightDoor.rotation.x = Math.PI / 2;
  frontRightDoor.castShadow = true;
  carGroup.add(frontRightDoor);

  // Rear left door
  const rearLeftDoorGeo = new THREE.BoxGeometry(0.08, 1.0, 1.0);
  const rearLeftDoor = new THREE.Mesh(rearLeftDoorGeo, doorMat);
  rearLeftDoor.position.set(-0.8, carState.suspension + 0.3, -dims.width / 2 - 0.04);
  rearLeftDoor.rotation.x = Math.PI / 2;
  rearLeftDoor.castShadow = true;
  carGroup.add(rearLeftDoor);

  // Rear right door
  const rearRightDoor = new THREE.Mesh(rearLeftDoorGeo, doorMat);
  rearRightDoor.position.set(-0.8, carState.suspension + 0.3, dims.width / 2 + 0.04);
  rearRightDoor.rotation.x = Math.PI / 2;
  rearRightDoor.castShadow = true;
  carGroup.add(rearRightDoor);

  // Door handles
  const handleGeo = new THREE.BoxGeometry(0.05, 0.08, 0.3);
  const handleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  
  const doorHandlePositions = [
    [0.3, carState.suspension + 0.2, -dims.width / 2 - 0.08],
    [0.3, carState.suspension + 0.2, dims.width / 2 + 0.08],
    [-0.8, carState.suspension + 0.2, -dims.width / 2 - 0.08],
    [-0.8, carState.suspension + 0.2, dims.width / 2 + 0.08]
  ];

  doorHandlePositions.forEach(pos => {
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(handle);
  });
}

// Build windows
function buildWindows() {
  const tintOpacity = Math.max(0.15, 0.75 - carState.windowTint);
  const windowMat = new THREE.MeshPhongMaterial({
    color: 0x4a90e2,
    opacity: tintOpacity,
    transparent: true,
    shininess: 100,
    side: THREE.DoubleSide
  });

  let dims = getCarDimensions();

  // Front windshield
  const frontGeo = new THREE.BoxGeometry(0.05, 0.7, dims.width - 0.4);
  const front = new THREE.Mesh(frontGeo, windowMat);
  front.position.set(dims.length / 2 - 0.7, carState.suspension + 0.5, 0);
  front.rotation.z = 0.35;
  carGroup.add(front);

  // Rear windshield
  const rearGeo = new THREE.BoxGeometry(0.05, 0.6, dims.width - 0.4);
  const rear = new THREE.Mesh(rearGeo, windowMat);
  rear.position.set(-dims.length / 2 + 0.5, carState.suspension + 0.45, 0);
  rear.rotation.z = -0.25;
  carGroup.add(rear);

  // Front left window (door window)
  const sideWindowGeo = new THREE.BoxGeometry(0.05, 0.5, 0.9);
  const frontLeftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
  frontLeftWindow.position.set(0.3, carState.suspension + 0.5, -dims.width / 2 - 0.05);
  carGroup.add(frontLeftWindow);

  // Front right window (door window)
  const frontRightWindow = new THREE.Mesh(sideWindowGeo, windowMat);
  frontRightWindow.position.set(0.3, carState.suspension + 0.5, dims.width / 2 + 0.05);
  carGroup.add(frontRightWindow);

  // Rear left window (door window)
  const rearLeftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
  rearLeftWindow.position.set(-0.8, carState.suspension + 0.5, -dims.width / 2 - 0.05);
  carGroup.add(rearLeftWindow);

  // Rear right window (door window)
  const rearRightWindow = new THREE.Mesh(sideWindowGeo, windowMat);
  rearRightWindow.position.set(-0.8, carState.suspension + 0.5, dims.width / 2 + 0.05);
  carGroup.add(rearRightWindow);
}

// Build bumpers
function buildBumpers() {
  const bumperMat = new THREE.MeshPhongMaterial({ 
    color: 0x2a2a2a,
    shininess: 40
  });
  let dims = getCarDimensions();

  const frontBumperGeo = new THREE.BoxGeometry(0.3, 0.3, dims.width + 0.2);
  const frontBumper = new THREE.Mesh(frontBumperGeo, bumperMat);
  frontBumper.position.set(dims.length / 2 + 0.15, carState.suspension * 0.5, 0);
  frontBumper.castShadow = true;
  carGroup.add(frontBumper);

  const rearBumperGeo = new THREE.BoxGeometry(0.3, 0.3, dims.width + 0.2);
  const rearBumper = new THREE.Mesh(rearBumperGeo, bumperMat);
  rearBumper.position.set(-dims.length / 2 - 0.15, carState.suspension * 0.5, 0);
  rearBumper.castShadow = true;
  carGroup.add(rearBumper);
}

// Build mirrors
function buildMirrors() {
  const frameMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const glassMat = new THREE.MeshPhongMaterial({
    color: 0x666666,
    metalness: 0.8,
    roughness: 0.2
  });

  let dims = getCarDimensions();
  const mirrorZ = [dims.width / 2 + 0.15, -dims.width / 2 - 0.15];

  mirrorZ.forEach((z) => {
    const frameGeo = new THREE.BoxGeometry(0.08, 0.25, 0.12);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0.2, carState.suspension + 0.5, z);
    carGroup.add(frame);

    const glassGeo = new THREE.BoxGeometry(0.02, 0.2, 0.15);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0.25, carState.suspension + 0.5, z);
    carGroup.add(glass);
  });
}

// Build wheels
function buildWheels() {
  const wheelGeom = new THREE.CylinderGeometry(
    carState.rimSize,
    carState.rimSize,
    0.35,
    32
  );

  let wheelColor = getWheelColor();
  const wheelMat = new THREE.MeshPhongMaterial({
    color: wheelColor,
    shininess: 50
  });

  let dims = getCarDimensions();
  // Wheels positioned at correct axle points
  const wheelPositions = [
    [dims.length / 2 - 1.2, carState.suspension, -dims.width / 2 + 0.1],   // Front left
    [dims.length / 2 - 1.2, carState.suspension, dims.width / 2 - 0.1],    // Front right
    [-dims.length / 2 + 1.0, carState.suspension, -dims.width / 2 + 0.1],  // Rear left
    [-dims.length / 2 + 1.0, carState.suspension, dims.width / 2 - 0.1]    // Rear right
  ];

  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    carGroup.add(wheel);
    wheelMeshes.push(wheel);
  });

  // Tire (rubber ring - same as wheel)
  const tireGeom = new THREE.TorusGeometry(carState.rimSize, 0.08, 16, 32);
  const tireMat = new THREE.MeshPhongMaterial({ 
    color: wheelColor,
    shininess: 50
  });

  wheelPositions.forEach(pos => {
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.y = Math.PI;
    tire.position.set(pos[0], pos[1], pos[2]);
    tire.castShadow = true;
    carGroup.add(tire);
  });
}

// Build roof
function buildRoof() {
  let dims = getCarDimensions();
  const roofGeo = new THREE.BoxGeometry(2.2, 0.08, dims.width - 0.4);
  const roofMat = new THREE.MeshPhongMaterial({
    color: carState.bodyColor,
    shininess: 80
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, carState.suspension + 0.9, 0);
  roof.castShadow = true;
  carGroup.add(roof);
}

// Build headlights
function buildHeadlights() {
  const lightGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ 
    color: carState.headlightColor,
    intensity: 2.0
  });

  let dims = getCarDimensions();
  const headlightPositions = [
    [dims.length / 2 + 0.1, carState.suspension + 0.4, -dims.width / 3],
    [dims.length / 2 + 0.1, carState.suspension + 0.4, dims.width / 3]
  ];

  headlightPositions.forEach(pos => {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(light);
    lightMeshes.push(light);
  });
}

// Build tail lights
function buildTailLights() {
  const tailGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });

  let dims = getCarDimensions();
  const tailPositions = [
    [-dims.length / 2 - 0.1, carState.suspension + 0.4, -dims.width / 3],
    [-dims.length / 2 - 0.1, carState.suspension + 0.4, dims.width / 3],
    [-dims.length / 2 - 0.1, carState.suspension + 0.55, 0]
  ];

  tailPositions.forEach(pos => {
    const light = new THREE.Mesh(tailGeo, tailMat);
    light.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(light);
  });
}

// Build exhaust
function buildExhaust() {
  const exhaustMat = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 30
  });

  let dims = getCarDimensions();
  const exhaustCount = getExhaustCount();
  const exhaustGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16);

  if (exhaustCount === 1) {
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust.position.set(-dims.length / 2 - 0.25, carState.suspension * 0.3, 0);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.castShadow = true;
    carGroup.add(exhaust);
    exhaustMeshes.push(exhaust);
  } else if (exhaustCount === 2) {
    [-0.5, 0.5].forEach(offset => {
      const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaust.position.set(-dims.length / 2 - 0.25, carState.suspension * 0.3, offset);
      exhaust.rotation.z = Math.PI / 2;
      exhaust.castShadow = true;
      carGroup.add(exhaust);
      exhaustMeshes.push(exhaust);
    });
  } else {
    [-0.6, -0.2, 0.2, 0.6].forEach(offset => {
      const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaust.position.set(-dims.length / 2 - 0.25, carState.suspension * 0.3, offset);
      exhaust.rotation.z = Math.PI / 2;
      exhaust.castShadow = true;
      carGroup.add(exhaust);
      exhaustMeshes.push(exhaust);
    });
  }
}

// Build interior
function buildInterior() {
  const rimGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
  const rimMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(1.0, carState.suspension + 0.5, -0.8);
  carGroup.add(rim);

  const spokeGeo = new THREE.BoxGeometry(0.04, 0.7, 0.04);
  const spokeMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(
      1.0 + Math.sin(angle) * 0.2,
      carState.suspension + 0.5 + Math.cos(angle) * 0.25,
      -0.8
    );
    carGroup.add(spoke);
  }

  const seatGeo = new THREE.BoxGeometry(0.6, 0.35, 0.5);
  const seatMat = new THREE.MeshPhongMaterial({
    color: carState.interiorColor,
    shininess: 15
  });

  const seatPositions = [
    [1.0, carState.suspension + 0.2, -0.5],
    [1.0, carState.suspension + 0.2, 0.5],
    [-0.5, carState.suspension + 0.2, -0.5],
    [-0.5, carState.suspension + 0.2, 0.5]
  ];

  seatPositions.forEach(pos => {
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(seat);
  });
}

// Build spoiler
function buildSpoiler() {
  const spoilerGeo = new THREE.BoxGeometry(0.08, 0.6, 1.6);
  const spoilerMat = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 60
  });
  const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoiler.position.set(-2.3, carState.suspension + 0.7, 0);
  spoiler.castShadow = true;
  carGroup.add(spoiler);
}

// Build body kit
function buildBodyKit() {
  const kitMat = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 40
  });

  let dims = getCarDimensions();
  const kitGeo = new THREE.BoxGeometry(dims.length - 0.5, 0.1, 0.1);

  const leftKit = new THREE.Mesh(kitGeo, kitMat);
  leftKit.position.set(0, carState.suspension, -dims.width / 2 - 0.1);
  leftKit.castShadow = true;
  carGroup.add(leftKit);

  const rightKit = new THREE.Mesh(kitGeo, kitMat);
  rightKit.position.set(0, carState.suspension, dims.width / 2 + 0.1);
  rightKit.castShadow = true;
  carGroup.add(rightKit);
}

// Build complete car
function buildCar() {
  try {
    clearCar();
    buildCarBody();
    buildDoors();
    buildWindows();
    buildBumpers();
    buildMirrors();
    buildWheels();
    buildRoof();
    buildHeadlights();
    buildTailLights();
    buildExhaust();
    buildInterior();
    
    if (carState.spoilerEnabled) buildSpoiler();
    if (carState.bodyKitEnabled) buildBodyKit();
    
    console.log('Car built successfully');
  } catch (error) {
    console.error('Error building car:', error);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

// Reset state
function resetState() {
  carState.model = 'sedan';
  carState.bodyColor = '#ff0000';
  carState.wheelStyle = 'standard';
  carState.rimSize = 0.55;
  carState.suspension = 0.8;
  carState.windowTint = 0;
  carState.headlightType = 'standard';
  carState.headlightColor = '#ffffff';
  carState.spoilerEnabled = false;
  carState.bodyKitEnabled = false;
  carState.exhaustType = 'single';
  carState.interiorColor = '#cccccc';
}

// Sync UI with state
function syncUIWithState() {
  elements.carModelSelect.value = carState.model;
  elements.bodyColorInput.value = carState.bodyColor;
  elements.wheelStyleSelect.value = carState.wheelStyle;
  elements.rimSizeSlider.value = carState.rimSize;
  elements.rimSizeDisplay.textContent = carState.rimSize.toFixed(2);
  elements.suspensionSlider.value = carState.suspension;
  elements.suspensionDisplay.textContent = carState.suspension.toFixed(1);
  elements.windowTintSlider.value = carState.windowTint;
  elements.tintDisplay.textContent = Math.round(carState.windowTint * 100) + '%';
  elements.headlightTypeSelect.value = carState.headlightType;
  elements.headlightColorInput.value = carState.headlightColor;
  elements.spoilerToggle.checked = carState.spoilerEnabled;
  elements.bodyKitToggle.checked = carState.bodyKitEnabled;
  elements.exhaustTypeSelect.value = carState.exhaustType;
  elements.interiorColorSelect.value = carState.interiorColor;
}

// Setup event listeners
function setupEventListeners() {
  elements.carModelSelect.addEventListener('change', (e) => {
    carState.model = e.target.value;
    buildCar();
    updatePrice();
  });

  elements.bodyColorInput.addEventListener('input', (e) => {
    carState.bodyColor = e.target.value;
    buildCar();
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      carState.bodyColor = e.target.dataset.color;
      elements.bodyColorInput.value = e.target.dataset.color;
      buildCar();
    });
  });

  elements.wheelStyleSelect.addEventListener('change', (e) => {
    carState.wheelStyle = e.target.value;
    buildCar();
    updatePrice();
  });

  elements.rimSizeSlider.addEventListener('input', (e) => {
    carState.rimSize = parseFloat(e.target.value);
    elements.rimSizeDisplay.textContent = carState.rimSize.toFixed(2);
    buildCar();
  });

  elements.suspensionSlider.addEventListener('input', (e) => {
    carState.suspension = parseFloat(e.target.value);
    elements.suspensionDisplay.textContent = carState.suspension.toFixed(1);
    buildCar();
  });

  elements.windowTintSlider.addEventListener('input', (e) => {
    carState.windowTint = parseFloat(e.target.value);
    const tintPercent = Math.round(carState.windowTint * 100);
    elements.tintDisplay.textContent = tintPercent + '%';
    buildCar();
  });

  elements.headlightTypeSelect.addEventListener('change', (e) => {
    carState.headlightType = e.target.value;
    const colors = {
      standard: '#ffffff',
      led: '#ffff99',
      laser: '#00ffff'
    };
    carState.headlightColor = colors[e.target.value];
    elements.headlightColorInput.value = colors[e.target.value];
    buildCar();
  });

  elements.headlightColorInput.addEventListener('input', (e) => {
    carState.headlightColor = e.target.value;
    buildCar();
  });

  elements.spoilerToggle.addEventListener('change', (e) => {
    carState.spoilerEnabled = e.target.checked;
    buildCar();
    updatePrice();
  });

  elements.bodyKitToggle.addEventListener('change', (e) => {
    carState.bodyKitEnabled = e.target.checked;
    buildCar();
    updatePrice();
  });

  elements.exhaustTypeSelect.addEventListener('change', (e) => {
    carState.exhaustType = e.target.value;
    buildCar();
    updatePrice();
  });

  elements.interiorColorSelect.addEventListener('change', (e) => {
    carState.interiorColor = e.target.value;
    buildCar();
  });

  elements.saveConfigBtn.addEventListener('click', () => {
    localStorage.setItem('carConfig', JSON.stringify(carState));
    alert('✅ Configuration saved successfully!');
  });

  elements.loadConfigBtn.addEventListener('click', () => {
    const saved = localStorage.getItem('carConfig');
    if (saved) {
      Object.assign(carState, JSON.parse(saved));
      syncUIWithState();
      buildCar();
      updatePrice();
      alert('✅ Configuration loaded!');
    } else {
      alert('❌ No saved configuration found.');
    }
  });

  elements.resetConfigBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all customizations?')) {
      resetState();
      syncUIWithState();
      buildCar();
      updatePrice();
    }
  });

  elements.screenshotBtn.addEventListener('click', () => {
    renderer.domElement.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `car-customizer-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  elements.resetViewBtn.addEventListener('click', () => {
    camera.position.set(0, 3, 8);
    controls.target.set(0, carState.suspension + 0.3, 0);
    controls.update();
  });
}

// Main initialization
function init() {
  try {
    console.log('Initializing application...');
    
    const saved = localStorage.getItem('carConfig');
    if (saved) {
      Object.assign(carState, JSON.parse(saved));
    }

    initScene();
    buildCar();
    setupEventListeners();
    syncUIWithState();
    updatePrice();
    animate();

    console.log('Application initialized successfully');
    
    // Hide loading screen
    setTimeout(() => {
      elements.loadingScreen.style.display = 'none';
    }, 500);
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Error initializing application: ' + error.message);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
