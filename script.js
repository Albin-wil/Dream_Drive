/* ---------------- PRICE SYSTEM ---------------- */

let modelPrice = 20000;
let enginePrice = 0;
let interiorPrice = 0;
let colorPrice = 0;

const priceEl = document.getElementById("price");

document.getElementById("model").onchange = e=>{
  modelPrice = Number(e.target.value);
  updatePrice();
};

document.getElementById("engine").onchange = e=>{
  enginePrice = Number(e.target.value);
  updatePrice();
};

document.getElementById("interior").onchange = e=>{
  interiorPrice = Number(e.target.value);
  updatePrice();
};

function updatePrice(){
  priceEl.innerText =
    modelPrice + enginePrice + interiorPrice + colorPrice;
}

/* ---------------- SAVE / EDIT ---------------- */

function saveConfig(){
  const config={
    model:model.value,
    engine:engine.value,
    interior:interior.value,
    color:colorPicker.value
  };
  localStorage.setItem("carConfig",JSON.stringify(config));
  alert("Needs Saved ✅");
}

function editConfig(){
  const c=JSON.parse(localStorage.getItem("carConfig"));
  if(!c) return;

  model.value=c.model;
  engine.value=c.engine;
  interior.value=c.interior;
  colorPicker.value=c.color;

  car.material.color.set(c.color);

  modelPrice=Number(c.model);
  enginePrice=Number(c.engine);
  interiorPrice=Number(c.interior);

  updatePrice();
}

/* ---------------- FEEDBACK ---------------- */

function saveFeedback(){
  localStorage.setItem(
    "feedback",
    document.getElementById("feedback").value
  );
  alert("Feedback Submitted 🙌");
}

/* ---------------- 3D CAR ---------------- */

let scene=new THREE.Scene();
let camera=new THREE.PerspectiveCamera(
  75,
  car3d.clientWidth/car3d.clientHeight,
  0.1,
  1000
);

let renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(car3d.clientWidth,car3d.clientHeight);
document.getElementById("car3d").appendChild(renderer.domElement);

/* LIGHT */
let light=new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,5,5);
scene.add(light);

/* CAR BODY (Demo Model) */
let geometry=new THREE.BoxGeometry(4,1.2,2);
let material=new THREE.MeshPhongMaterial({color:0xff0000});
let car=new THREE.Mesh(geometry,material);
scene.add(car);

/* WHEELS */
let wheelGeo=new THREE.CylinderGeometry(0.5,0.5,0.5,32);
let wheelMat=new THREE.MeshPhongMaterial({color:0x000000});

function wheel(x,z){
  let w=new THREE.Mesh(wheelGeo,wheelMat);
  w.rotation.z=Math.PI/2;
  w.position.set(x,-0.8,z);
  scene.add(w);
}
wheel(1.5,1);
wheel(-1.5,1);
wheel(1.5,-1);
wheel(-1.5,-1);

/* CAMERA */
camera.position.z=6;

/* CONTROLS */
let controls=new THREE.OrbitControls(
  camera,
  renderer.domElement
);

/* COLOR CHANGE */
colorPicker.oninput=e=>{
  car.material.color.set(e.target.value);
};

/* ANIMATION */
function animate(){
  requestAnimationFrame(animate);
  car.rotation.y+=0.003;
  renderer.render(scene,camera);
}
animate();