import * as THREE from "three";
import type { ItemDetail } from "../ui/modal";

export type LayoutItem = {
  id: string;
  type: string;
  itemId: string;
  position: [number, number, number];
  size: [number, number, number];
  rotationY?: number;
};

export type RoomLayout = {
  roomSize: [number, number, number];
  items: LayoutItem[];
};

export type RoomAssets = {
  walls: THREE.Mesh[];
  floor: THREE.Mesh;
  furniture: THREE.Mesh[];
  colliders: THREE.Box3[];
  itemMap: Map<string, ItemDetail>;
};

type FurnitureBuild = {
  group: THREE.Group;
  interactionMesh: THREE.Mesh;
};

type FurnitureMaterials = {
  wood: THREE.MeshStandardMaterial;
  fabricBlue: THREE.MeshStandardMaterial;
  fabricWarm: THREE.MeshStandardMaterial;
  fabricGray: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  plant: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
};

const TEXTURE_SIZE = 256;

const createCanvasTexture = (draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  return texture;
};

const createWoodTexture = () =>
  createCanvasTexture((ctx) => {
    ctx.fillStyle = "#d6c2a0";
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    for (let i = 0; i < 12; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#c9b08a" : "#bfa078";
      ctx.fillRect(0, (TEXTURE_SIZE / 12) * i, TEXTURE_SIZE, TEXTURE_SIZE / 12);
    }
    ctx.strokeStyle = "rgba(120, 90, 60, 0.25)";
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, (TEXTURE_SIZE / 18) * i + 4);
      ctx.bezierCurveTo(
        TEXTURE_SIZE * 0.3,
        (TEXTURE_SIZE / 18) * i + 10,
        TEXTURE_SIZE * 0.6,
        (TEXTURE_SIZE / 18) * i - 4,
        TEXTURE_SIZE,
        (TEXTURE_SIZE / 18) * i + 6
      );
      ctx.stroke();
    }
  });

const createFabricTexture = (base: string, accent: string) =>
  createCanvasTexture((ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < TEXTURE_SIZE; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, TEXTURE_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(TEXTURE_SIZE, i);
      ctx.stroke();
    }
  });

const createWallTexture = () =>
  createCanvasTexture((ctx) => {
    ctx.fillStyle = "#e7ecf3";
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    for (let i = 0; i < 200; i += 1) {
      const x = Math.random() * TEXTURE_SIZE;
      const y = Math.random() * TEXTURE_SIZE;
      ctx.fillStyle = "rgba(180, 190, 205, 0.2)";
      ctx.fillRect(x, y, 2, 2);
    }
  });

const createRugTexture = () =>
  createCanvasTexture((ctx) => {
    ctx.fillStyle = "#f1d5b1";
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.strokeStyle = "rgba(180, 110, 70, 0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, TEXTURE_SIZE - 32, TEXTURE_SIZE - 32);
    ctx.strokeStyle = "rgba(120, 80, 60, 0.3)";
    for (let i = 0; i < TEXTURE_SIZE; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, TEXTURE_SIZE);
      ctx.stroke();
    }
  });

export function createRoom(scene: THREE.Scene, layout: RoomLayout, items: ItemDetail[]): RoomAssets {
  const roomSize = new THREE.Vector3(...layout.roomSize);
  const floorGeometry = new THREE.PlaneGeometry(roomSize.x, roomSize.z);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    roughness: 0.7
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    map: createWallTexture(),
    roughness: 0.95
  });

  const materials: FurnitureMaterials = {
    wood: new THREE.MeshStandardMaterial({
      map: createWoodTexture(),
      roughness: 0.6
    }),
    fabricBlue: new THREE.MeshStandardMaterial({
      map: createFabricTexture("#94c5f4", "#6aa3de"),
      roughness: 0.8
    }),
    fabricWarm: new THREE.MeshStandardMaterial({
      map: createFabricTexture("#f3cba5", "#d3a47a"),
      roughness: 0.85
    }),
    fabricGray: new THREE.MeshStandardMaterial({
      map: createFabricTexture("#cbd5f0", "#9aa5c8"),
      roughness: 0.85
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.3
    }),
    plastic: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45
    }),
    plant: new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.8
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 1
    }),
    rug: new THREE.MeshStandardMaterial({
      map: createRugTexture(),
      roughness: 0.9
    })
  };

  const walls: THREE.Mesh[] = [];
  const wallThickness = 0.3;
  const wallHeight = roomSize.y;

  const wallData: Array<{ size: THREE.Vector3; position: THREE.Vector3 }> = [
    {
      size: new THREE.Vector3(roomSize.x, wallHeight, wallThickness),
      position: new THREE.Vector3(0, wallHeight / 2, -roomSize.z / 2)
    },
    {
      size: new THREE.Vector3(roomSize.x, wallHeight, wallThickness),
      position: new THREE.Vector3(0, wallHeight / 2, roomSize.z / 2)
    },
    {
      size: new THREE.Vector3(wallThickness, wallHeight, roomSize.z),
      position: new THREE.Vector3(-roomSize.x / 2, wallHeight / 2, 0)
    },
    {
      size: new THREE.Vector3(wallThickness, wallHeight, roomSize.z),
      position: new THREE.Vector3(roomSize.x / 2, wallHeight / 2, 0)
    }
  ];

  wallData.forEach((wallInfo) => {
    const geometry = new THREE.BoxGeometry(wallInfo.size.x, wallInfo.size.y, wallInfo.size.z);
    const wall = new THREE.Mesh(geometry, wallMaterial);
    wall.position.copy(wallInfo.position);
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);
    walls.push(wall);
  });

  const itemMap = new Map<string, ItemDetail>();
  items.forEach((item) => itemMap.set(item.id, item));

  const furniture: THREE.Mesh[] = [];
  const colliders: THREE.Box3[] = [];

  layout.items.forEach((layoutItem) => {
    const { group, interactionMesh } = createFurniture(layoutItem, materials);
    group.position.set(...layoutItem.position);
    group.rotation.y = layoutItem.rotationY ?? 0;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    interactionMesh.userData = {
      itemId: layoutItem.itemId,
      baseColor: 0xffffff
    };
    furniture.push(interactionMesh);
    scene.add(group);

    const collider = new THREE.Box3().setFromObject(group);
    colliders.push(collider);
  });

  walls.forEach((wall) => {
    const collider = new THREE.Box3().setFromObject(wall);
    colliders.push(collider);
  });

  return {
    walls,
    floor,
    furniture,
    colliders,
    itemMap
  };
}

function createFurniture(layoutItem: LayoutItem, materials: FurnitureMaterials): FurnitureBuild {
  const size = new THREE.Vector3(...layoutItem.size);
  const {
    wood: woodMaterial,
    fabricBlue,
    fabricWarm,
    fabricGray,
    metal: metalMaterial,
    plastic: plasticWhite,
    plant: plantMaterial,
    soil: soilMaterial,
    rug: rugMaterial
  } = materials;

  const group = new THREE.Group();
  let interactionMesh: THREE.Mesh;

  switch (layoutItem.type) {
    case "bed": {
      const frameHeight = size.y * 0.3;
      const mattressHeight = size.y * 0.35;
      const headboardHeight = size.y * 0.45;
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, frameHeight, size.z),
        woodMaterial
      );
      frame.position.y = -size.y / 2 + frameHeight / 2;

      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.95, mattressHeight, size.z * 0.95),
        fabricBlue
      );
      mattress.position.y = frame.position.y + frameHeight / 2 + mattressHeight / 2;

      const headboard = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, headboardHeight, size.z * 0.2),
        fabricGray
      );
      headboard.position.set(
        0,
        -size.y / 2 + headboardHeight / 2,
        -size.z / 2 + size.z * 0.1
      );

      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.35, mattressHeight * 0.35, size.z * 0.2),
        fabricWarm
      );
      pillow.position.set(-size.x * 0.2, mattress.position.y + mattressHeight * 0.35, -size.z * 0.25);

      interactionMesh = mattress;
      group.add(frame, mattress, headboard, pillow);
      break;
    }
    case "desk": {
      const topHeight = size.y * 0.15;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, topHeight, size.z),
        woodMaterial
      );
      top.position.y = size.y / 2 - topHeight / 2;

      const legGeometry = new THREE.CylinderGeometry(size.x * 0.04, size.x * 0.04, size.y * 0.7, 8);
      const legPositions = [
        [-size.x / 2 + size.x * 0.1, 0, -size.z / 2 + size.z * 0.1],
        [size.x / 2 - size.x * 0.1, 0, -size.z / 2 + size.z * 0.1],
        [-size.x / 2 + size.x * 0.1, 0, size.z / 2 - size.z * 0.1],
        [size.x / 2 - size.x * 0.1, 0, size.z / 2 - size.z * 0.1]
      ];
      legPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeometry, metalMaterial);
        leg.position.set(x, -size.y / 2 + (size.y * 0.7) / 2, z);
        group.add(leg);
      });

      const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.35, size.y * 0.35, size.z * 0.7),
        woodMaterial
      );
      drawer.position.set(size.x * 0.25, -size.y / 2 + size.y * 0.35 / 2, 0);

      interactionMesh = top;
      group.add(top, drawer);
      break;
    }
    case "chair": {
      const seatHeight = size.y * 0.25;
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, seatHeight, size.z),
        fabricWarm
      );
      seat.position.y = -size.y / 2 + seatHeight / 2;

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.55, size.z * 0.2),
        fabricGray
      );
      back.position.set(0, seat.position.y + seatHeight / 2 + size.y * 0.55 / 2, -size.z / 2 + size.z * 0.1);

      const legGeometry = new THREE.CylinderGeometry(size.x * 0.08, size.x * 0.08, size.y * 0.6, 8);
      const legOffsets = [
        [-size.x * 0.35, -size.z * 0.35],
        [size.x * 0.35, -size.z * 0.35],
        [-size.x * 0.35, size.z * 0.35],
        [size.x * 0.35, size.z * 0.35]
      ];
      legOffsets.forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry, metalMaterial);
        leg.position.set(x, -size.y / 2 + size.y * 0.6 / 2, z);
        group.add(leg);
      });

      interactionMesh = seat;
      group.add(seat, back);
      break;
    }
    case "fridge": {
      const body = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), plasticWhite);
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.08, size.y * 0.5, size.z * 0.08),
        metalMaterial
      );
      handle.position.set(size.x * 0.35, 0, size.z * 0.4);
      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.95, size.y * 0.02, size.z * 1.01),
        metalMaterial
      );
      divider.position.set(0, -size.y * 0.1, 0);
      interactionMesh = body;
      group.add(body, handle, divider);
      break;
    }
    case "shelf": {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), woodMaterial);
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.9, size.y * 0.08, size.z * 0.9),
        woodMaterial
      );
      const shelf2 = shelf.clone();
      shelf.position.y = -size.y * 0.15;
      shelf2.position.y = size.y * 0.2;
      interactionMesh = frame;
      group.add(frame, shelf, shelf2);
      break;
    }
    case "sofa": {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.35, size.z),
        fabricBlue
      );
      base.position.y = -size.y / 2 + size.y * 0.35 / 2;
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.5, size.z * 0.3),
        fabricBlue
      );
      back.position.set(0, -size.y / 2 + size.y * 0.35 + size.y * 0.5 / 2, -size.z / 2 + size.z * 0.15);
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.15, size.y * 0.4, size.z),
        fabricBlue
      );
      const arm2 = arm.clone();
      arm.position.set(-size.x / 2 + size.x * 0.075, -size.y / 2 + size.y * 0.4 / 2, 0);
      arm2.position.set(size.x / 2 - size.x * 0.075, -size.y / 2 + size.y * 0.4 / 2, 0);
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.4, size.y * 0.15, size.z * 0.6),
        fabricWarm
      );
      cushion.position.set(-size.x * 0.15, base.position.y + size.y * 0.2, 0);
      interactionMesh = base;
      group.add(base, back, arm, arm2, cushion);
      break;
    }
    case "coffee-table": {
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.2, size.z),
        woodMaterial
      );
      top.position.y = size.y / 2 - size.y * 0.1;
      const legGeometry = new THREE.CylinderGeometry(size.x * 0.05, size.x * 0.05, size.y * 0.7, 8);
      const legOffsets = [
        [-size.x * 0.4, -size.z * 0.4],
        [size.x * 0.4, -size.z * 0.4],
        [-size.x * 0.4, size.z * 0.4],
        [size.x * 0.4, size.z * 0.4]
      ];
      legOffsets.forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry, metalMaterial);
        leg.position.set(x, -size.y / 2 + size.y * 0.35, z);
        group.add(leg);
      });
      interactionMesh = top;
      group.add(top);
      break;
    }
    case "plant": {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.3, size.x * 0.4, size.y * 0.35, 12),
        fabricWarm
      );
      pot.position.y = -size.y / 2 + size.y * 0.175;
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.28, size.x * 0.3, size.y * 0.05, 12),
        soilMaterial
      );
      soil.position.y = pot.position.y + size.y * 0.1;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.05, size.x * 0.06, size.y * 0.4, 8),
        plantMaterial
      );
      stem.position.y = pot.position.y + size.y * 0.35;
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(size.x * 0.35, 12, 12),
        plantMaterial
      );
      leaves.position.y = stem.position.y + size.y * 0.25;
      interactionMesh = pot;
      group.add(pot, soil, stem, leaves);
      break;
    }
    case "lamp": {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.2, size.x * 0.25, size.y * 0.05, 12),
        metalMaterial
      );
      base.position.y = -size.y / 2 + size.y * 0.025;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.05, size.x * 0.05, size.y * 0.6, 8),
        metalMaterial
      );
      pole.position.y = base.position.y + size.y * 0.35;
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(size.x * 0.35, size.y * 0.35, 16),
        fabricWarm
      );
      shade.position.y = pole.position.y + size.y * 0.3;
      interactionMesh = shade;
      group.add(base, pole, shade);
      break;
    }
    case "wardrobe": {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        woodMaterial
      );
      const handle1 = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.05, size.y * 0.3, size.z * 0.05),
        metalMaterial
      );
      const handle2 = handle1.clone();
      handle1.position.set(-size.x * 0.15, 0, size.z * 0.45);
      handle2.position.set(size.x * 0.15, 0, size.z * 0.45);
      interactionMesh = body;
      group.add(body, handle1, handle2);
      break;
    }
    case "rug": {
      const rug = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        rugMaterial
      );
      interactionMesh = rug;
      group.add(rug);
      break;
    }
    case "bookcase": {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), woodMaterial);
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.9, size.y * 0.07, size.z * 0.9),
        woodMaterial
      );
      const shelf2 = shelf.clone();
      const shelf3 = shelf.clone();
      shelf.position.y = -size.y * 0.2;
      shelf2.position.y = 0;
      shelf3.position.y = size.y * 0.2;
      interactionMesh = frame;
      group.add(frame, shelf, shelf2, shelf3);
      break;
    }
    default: {
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        woodMaterial
      );
      interactionMesh = fallback;
      group.add(fallback);
    }
  }

  return { group, interactionMesh };
}
