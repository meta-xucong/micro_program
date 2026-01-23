import * as THREE from "three";
import "./ui/modal.css";
import { createRoom, type RoomLayout } from "./scene/room";
import { createCharacter, updateCharacterCollider } from "./scene/character";
import { InputSystem } from "./systems/input";
import { InteractionSystem } from "./systems/interaction";
import { ItemModal, type ItemDetail } from "./ui/modal";

const app = document.getElementById("app");
if (!app) {
  throw new Error("App container not found");
}

const overlay = document.createElement("div");
overlay.className = "ui-overlay";
app.appendChild(overlay);

const hint = document.createElement("div");
hint.className = "hud-hint";
hint.innerHTML = "WASD / 摇杆移动<br/>点击家具查看详情";
overlay.appendChild(hint);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  50
);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 8, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const modal = new ItemModal(app);
const input = new InputSystem(overlay);

async function loadData() {
  const [itemsRes, layoutRes] = await Promise.all([
    fetch("/data/items.json"),
    fetch("/data/room_layout.json")
  ]);

  const items = (await itemsRes.json()) as ItemDetail[];
  const layout = (await layoutRes.json()) as RoomLayout;

  return { items, layout };
}

function setupScene(items: ItemDetail[], layout: RoomLayout) {
  const room = createRoom(scene, layout, items);
  const character = createCharacter();
  scene.add(character.mesh);

  const interaction = new InteractionSystem(renderer, camera, room, modal);

  const baseCameraOffset = new THREE.Vector3(0, 4.2, 6.2);

  const tmpBox = new THREE.Box3();
  const moveSpeed = 2.1;
  let targetRotation = character.mesh.rotation.y;

  const roomBounds = {
    minX: -layout.roomSize[0] / 2 + 0.7,
    maxX: layout.roomSize[0] / 2 - 0.7,
    minZ: -layout.roomSize[2] / 2 + 0.7,
    maxZ: layout.roomSize[2] / 2 - 0.7
  };

  const colliders = room.colliders;

  let lastTime = performance.now();

  const animate = () => {
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    const direction = input.getDirection();
    const moveVector = new THREE.Vector3(direction.x, 0, direction.z);
    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(moveSpeed * delta);
      attemptMove(character, moveVector, colliders, roomBounds, tmpBox);
      targetRotation = Math.atan2(moveVector.x, moveVector.z);
    }

    updateCharacterCollider(character);
    character.mesh.rotation.y = rotateTowards(
      character.mesh.rotation.y,
      targetRotation,
      6 * delta
    );

    const targetCamera = character.mesh.position.clone().add(baseCameraOffset);
    camera.position.lerp(targetCamera, 0.1);
    camera.lookAt(character.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)));

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
  return { interaction };
}

function rotateTowards(current: number, target: number, step: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  const next = current + Math.min(Math.abs(delta), step) * Math.sign(delta);
  return next;
}

function attemptMove(
  character: ReturnType<typeof createCharacter>,
  deltaMove: THREE.Vector3,
  colliders: THREE.Box3[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  tmpBox: THREE.Box3
) {
  const original = character.mesh.position.clone();

  const tryAxis = (axis: "x" | "z") => {
    character.mesh.position[axis] += deltaMove[axis];
    character.mesh.position.x = THREE.MathUtils.clamp(
      character.mesh.position.x,
      bounds.minX,
      bounds.maxX
    );
    character.mesh.position.z = THREE.MathUtils.clamp(
      character.mesh.position.z,
      bounds.minZ,
      bounds.maxZ
    );

    tmpBox.setFromCenterAndSize(
      character.mesh.position.clone(),
      new THREE.Vector3(0.8, 1.8, 0.8)
    );

    const collided = colliders.some((collider) => tmpBox.intersectsBox(collider));
    if (collided) {
      character.mesh.position[axis] = original[axis];
    }
  };

  tryAxis("x");
  tryAxis("z");
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", onResize);

loadData()
  .then(({ items, layout }) => {
    setupScene(items, layout);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to load data", error);
  });
