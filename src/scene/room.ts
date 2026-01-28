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
  leather: THREE.MeshStandardMaterial;
  bookcase: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  plant: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  door: THREE.MeshStandardMaterial;
  windowFrame: THREE.MeshStandardMaterial;
  wallTrim: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
};

const TEXTURE_SIZE = 256;
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";

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

const createCeilingTexture = () =>
  createCanvasTexture((ctx) => {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.strokeStyle = "rgba(210, 220, 230, 0.5)";
    for (let i = 0; i < TEXTURE_SIZE; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(TEXTURE_SIZE, i);
      ctx.stroke();
    }
  });

const loadTexture = (
  url: string,
  options: { repeat?: number; colorSpace?: THREE.ColorSpace } = {}
) => {
  const texture = textureLoader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const repeat = options.repeat ?? 1;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  if (options.colorSpace) {
    texture.colorSpace = options.colorSpace;
  }
  return texture;
};

const loadPbrTextures = (urls: { color: string; roughness: string; normal: string }, repeat = 1) => ({
  map: loadTexture(urls.color, { repeat, colorSpace: THREE.SRGBColorSpace }),
  roughnessMap: loadTexture(urls.roughness, { repeat, colorSpace: THREE.NoColorSpace }),
  normalMap: loadTexture(urls.normal, { repeat, colorSpace: THREE.NoColorSpace })
});

export function createRoom(scene: THREE.Scene, layout: RoomLayout, items: ItemDetail[]): RoomAssets {
  const roomSize = new THREE.Vector3(...layout.roomSize);
  const woodTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dark_wooden_planks/dark_wooden_planks_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dark_wooden_planks/dark_wooden_planks_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dark_wooden_planks/dark_wooden_planks_nor_gl_1k.jpg"
    },
    2.2
  );
  const fabricTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/denim_fabric/denim_fabric_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/denim_fabric/denim_fabric_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/denim_fabric/denim_fabric_nor_gl_1k.jpg"
    },
    1.6
  );
  const leatherTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/fabric_leather_01/fabric_leather_01_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/fabric_leather_01/fabric_leather_01_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/fabric_leather_01/fabric_leather_01_nor_gl_1k.jpg"
    },
    1.4
  );
  const metalTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate/metal_plate_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate/metal_plate_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate/metal_plate_nor_gl_1k.jpg"
    },
    1.2
  );
  const bookcaseTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_shelves/painted_wooden_shelves_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_shelves/painted_wooden_shelves_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_shelves/painted_wooden_shelves_nor_gl_1k.jpg"
    },
    1.4
  );
  const windowFrameTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_metal_shutter/painted_metal_shutter_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_metal_shutter/painted_metal_shutter_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_metal_shutter/painted_metal_shutter_nor_gl_1k.jpg"
    },
    1.6
  );
  const doorTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_cabinet_02/painted_wooden_cabinet_02_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_cabinet_02/painted_wooden_cabinet_02_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/painted_wooden_cabinet_02/painted_wooden_cabinet_02_nor_gl_1k.jpg"
    },
    1.8
  );
  const wallTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_plaster_wall/painted_plaster_wall_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_plaster_wall/painted_plaster_wall_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_plaster_wall/painted_plaster_wall_nor_gl_1k.jpg"
    },
    1.8
  );
  const rugTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dirty_carpet/dirty_carpet_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dirty_carpet/dirty_carpet_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dirty_carpet/dirty_carpet_nor_gl_1k.jpg"
    },
    2.6
  );
  const floorGeometry = new THREE.PlaneGeometry(roomSize.x, roomSize.z);
  const floorMaterial = new THREE.MeshStandardMaterial({
    ...woodTextures,
    color: new THREE.Color(0xf1e4d2),
    roughness: 0.55
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    ...wallTextures,
    roughness: 0.9
  });

  const materials: FurnitureMaterials = {
    wood: new THREE.MeshStandardMaterial({
      ...woodTextures,
      roughness: 0.5
    }),
    fabricBlue: new THREE.MeshStandardMaterial({
      ...fabricTextures,
      color: new THREE.Color(0x93c5fd),
      roughness: 0.9
    }),
    fabricWarm: new THREE.MeshStandardMaterial({
      ...fabricTextures,
      color: new THREE.Color(0xf3cba5),
      roughness: 0.88
    }),
    fabricGray: new THREE.MeshStandardMaterial({
      ...fabricTextures,
      color: new THREE.Color(0xcbd5f0),
      roughness: 0.9
    }),
    leather: new THREE.MeshStandardMaterial({
      ...leatherTextures,
      color: new THREE.Color(0x7c5b4c),
      roughness: 0.7
    }),
    bookcase: new THREE.MeshStandardMaterial({
      ...bookcaseTextures,
      color: new THREE.Color(0xf8fafc),
      roughness: 0.6
    }),
    metal: new THREE.MeshStandardMaterial({
      ...metalTextures,
      metalness: 0.6,
      roughness: 0.35
    }),
    plastic: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35
    }),
    plant: new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.75
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 1
    }),
    rug: new THREE.MeshStandardMaterial({
      ...rugTextures,
      roughness: 0.95
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.35,
      roughness: 0.12,
      metalness: 0,
      transmission: 0.95,
      thickness: 0.15,
      ior: 1.5,
      clearcoat: 0.25,
      clearcoatRoughness: 0.2
    }),
    door: new THREE.MeshStandardMaterial({
      ...doorTextures,
      color: new THREE.Color(0xfdf6ed),
      metalness: 0.1,
      roughness: 0.45
    }),
    windowFrame: new THREE.MeshStandardMaterial({
      ...windowFrameTextures,
      color: new THREE.Color(0xf1f5f9),
      metalness: 0.25,
      roughness: 0.5
    }),
    wallTrim: new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.7
    }),
    ceiling: new THREE.MeshStandardMaterial({
      map: createCeilingTexture(),
      roughness: 0.95
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

  const { interactionMeshes } = addRoomDetails(scene, roomSize, wallThickness, materials);

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

    if (layoutItem.type !== "rug") {
      const collider = new THREE.Box3().setFromObject(group);
      colliders.push(collider);
    }
  });

  interactionMeshes.forEach((mesh) => {
    furniture.push(mesh);
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
    leather,
    bookcase: bookcaseMaterial,
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
        fabricGray
      );
      mattress.position.y = frame.position.y + frameHeight / 2 + mattressHeight / 2;

      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.9, mattressHeight * 0.2, size.z * 0.6),
        fabricWarm
      );
      blanket.position.set(0, mattress.position.y + mattressHeight * 0.15, size.z * 0.12);

      const headboard = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, headboardHeight, size.z * 0.2),
        fabricBlue
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
      group.add(frame, mattress, blanket, headboard, pillow);
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
        leather
      );
      seat.position.y = -size.y / 2 + seatHeight / 2;

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.55, size.z * 0.2),
        leather
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
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        bookcaseMaterial
      );
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.9, size.y * 0.08, size.z * 0.9),
        bookcaseMaterial
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
        leather
      );
      base.position.y = -size.y / 2 + size.y * 0.35 / 2;
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y * 0.5, size.z * 0.3),
        leather
      );
      back.position.set(0, -size.y / 2 + size.y * 0.35 + size.y * 0.5 / 2, -size.z / 2 + size.z * 0.15);
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.15, size.y * 0.4, size.z),
        leather
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
      const potHeight = size.y * 0.38;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.32, size.x * 0.4, potHeight, 16),
        fabricWarm
      );
      pot.position.y = -size.y / 2 + potHeight / 2;
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(size.x * 0.36, size.x * 0.04, 10, 24),
        fabricWarm
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = pot.position.y + potHeight / 2 - size.x * 0.03;
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.3, size.x * 0.33, size.y * 0.07, 12),
        soilMaterial
      );
      soil.position.y = pot.position.y + potHeight * 0.18;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.045, size.x * 0.06, size.y * 0.45, 10),
        plantMaterial
      );
      stem.position.y = pot.position.y + potHeight * 0.6;
      const leafGeometry = new THREE.ConeGeometry(size.x * 0.18, size.y * 0.35, 12, 1, true);
      const leafOffsets = [
        { angle: 0.2, height: 0.1 },
        { angle: 1.2, height: 0.18 },
        { angle: 2.2, height: 0.05 },
        { angle: 3.1, height: 0.2 },
        { angle: 4.0, height: 0.12 }
      ];
      leafOffsets.forEach(({ angle, height }, index) => {
        const leaf = new THREE.Mesh(leafGeometry, plantMaterial);
        leaf.position.set(
          Math.cos(angle) * size.x * 0.18,
          stem.position.y + size.y * (0.12 + height),
          Math.sin(angle) * size.x * 0.18
        );
        leaf.rotation.set(Math.PI * 0.5, angle, (index % 2 === 0 ? 1 : -1) * 0.4);
        group.add(leaf);
      });
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(size.x * 0.28, 16, 16),
        plantMaterial
      );
      crown.position.y = stem.position.y + size.y * 0.35;
      interactionMesh = pot;
      group.add(pot, rim, soil, stem, crown);
      break;
    }
    case "lamp": {
      const baseHeight = size.y * 0.06;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.22, size.x * 0.28, baseHeight, 16),
        metalMaterial
      );
      base.position.y = -size.y / 2 + baseHeight / 2;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.045, size.x * 0.055, size.y * 0.7, 10),
        metalMaterial
      );
      pole.position.y = base.position.y + size.y * 0.38;
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.035, size.x * 0.04, size.x * 0.6, 10),
        metalMaterial
      );
      arm.rotation.z = Math.PI / 2.4;
      arm.position.set(size.x * 0.2, pole.position.y + size.y * 0.22, 0);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.36, size.x * 0.28, size.y * 0.35, 20, 1, true),
        fabricWarm
      );
      shade.position.set(size.x * 0.38, arm.position.y + size.y * 0.1, 0);
      shade.rotation.z = Math.PI / 14;
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(size.x * 0.12, size.y * 0.08, 16),
        fabricWarm
      );
      cap.position.set(shade.position.x, shade.position.y + size.y * 0.18, 0);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(size.x * 0.09, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfef3c7,
          emissive: new THREE.Color(0xfde68a),
          emissiveIntensity: 0.8,
          roughness: 0.4
        })
      );
      bulb.position.set(shade.position.x, shade.position.y, 0);
      interactionMesh = shade;
      group.add(base, pole, arm, shade, cap, bulb);
      break;
    }
    case "wardrobe": {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        bookcaseMaterial
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
      const frame = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), bookcaseMaterial);
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.9, size.y * 0.07, size.z * 0.9),
        bookcaseMaterial
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

function addRoomDetails(
  scene: THREE.Scene,
  roomSize: THREE.Vector3,
  wallThickness: number,
  materials: FurnitureMaterials
): { interactionMeshes: THREE.Mesh[] } {
  const interactionMeshes: THREE.Mesh[] = [];
  const ceilingGeometry = new THREE.PlaneGeometry(roomSize.x, roomSize.z);
  const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomSize.y;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  const trimHeight = 0.08;
  const trimGeometry = new THREE.BoxGeometry(roomSize.x, trimHeight, wallThickness / 2);
  const trimBack = new THREE.Mesh(trimGeometry, materials.wallTrim);
  trimBack.position.set(0, trimHeight / 2, -roomSize.z / 2 + wallThickness / 4);
  const trimFront = trimBack.clone();
  trimFront.position.z = roomSize.z / 2 - wallThickness / 4;
  scene.add(trimBack, trimFront);

  const sideTrimGeometry = new THREE.BoxGeometry(wallThickness / 2, trimHeight, roomSize.z);
  const trimLeft = new THREE.Mesh(sideTrimGeometry, materials.wallTrim);
  trimLeft.position.set(-roomSize.x / 2 + wallThickness / 4, trimHeight / 2, 0);
  const trimRight = trimLeft.clone();
  trimRight.position.x = roomSize.x / 2 - wallThickness / 4;
  scene.add(trimLeft, trimRight);

  const doorGroup = new THREE.Group();
  const doorWidth = 1.4;
  const doorHeight = 2.4;
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.2, 0.1),
    materials.door
  );
  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, 0.08),
    materials.door
  );
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12),
    materials.metal
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(doorWidth * 0.25, 0, 0.06);
  doorGroup.add(doorFrame, doorPanel, handle);
  doorGroup.position.set(-roomSize.x / 6, doorHeight / 2, roomSize.z / 2 - wallThickness / 2);
  scene.add(doorGroup);
  doorPanel.userData = {
    itemId: "door-001",
    baseColor: 0xfdf6ed
  };
  interactionMeshes.push(doorPanel);

  const windowWidth = 1.8;
  const windowHeight = 1.1;
  const windowGroup = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(windowWidth + 0.15, windowHeight + 0.15, 0.08),
    materials.windowFrame
  );
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(windowWidth, windowHeight, 0.05),
    materials.glass
  );
  glass.name = "window-glass";
  windowGroup.add(frame, glass);
  windowGroup.position.set(0, 1.6, -roomSize.z / 2 + wallThickness / 2);
  scene.add(windowGroup);
  glass.userData = {
    itemId: "window-001",
    baseColor: 0xe0f2fe
  };
  interactionMeshes.push(glass);

  const sideWindow = windowGroup.clone();
  sideWindow.rotation.y = Math.PI / 2;
  sideWindow.position.set(roomSize.x / 2 - wallThickness / 2, 1.7, 0.8);
  scene.add(sideWindow);
  const sideGlass = sideWindow.children.find(
    (child) => child instanceof THREE.Mesh && child.name === "window-glass"
  ) as THREE.Mesh | undefined;
  if (sideGlass) {
    sideGlass.userData = {
      itemId: "window-001",
      baseColor: 0xe0f2fe
    };
    interactionMeshes.push(sideGlass);
  }

  const tvGroup = new THREE.Group();
  const tvWidth = 2.4;
  const tvHeight = 1.4;
  const tvDepth = 0.08;
  const tvScreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.3,
    metalness: 0.2,
    emissive: new THREE.Color(0x0f172a),
    emissiveIntensity: 0.35
  });
  const tvFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.4
  });
  const tvFrame = new THREE.Mesh(
    new THREE.BoxGeometry(tvWidth + 0.08, tvHeight + 0.08, tvDepth),
    tvFrameMaterial
  );
  const tvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(tvWidth, tvHeight),
    tvScreenMaterial
  );
  tvScreen.position.z = tvDepth / 2 + 0.01;
  tvGroup.add(tvFrame, tvScreen);
  tvGroup.position.set(2.6, 1.8, roomSize.z / 2 - wallThickness / 2 - 0.08);
  scene.add(tvGroup);
  tvScreen.userData = {
    itemId: "tv-001",
    baseColor: 0x111827
  };
  interactionMeshes.push(tvScreen);

  const consoleGroup = new THREE.Group();
  const consoleWidth = 2.8;
  const consoleHeight = 0.6;
  const consoleDepth = 0.6;
  const consoleBody = new THREE.Mesh(
    new THREE.BoxGeometry(consoleWidth, consoleHeight, consoleDepth),
    materials.wood
  );
  const consoleTop = new THREE.Mesh(
    new THREE.BoxGeometry(consoleWidth + 0.05, 0.05, consoleDepth + 0.05),
    materials.metal
  );
  consoleTop.position.y = consoleHeight / 2 + 0.03;
  const consoleLegGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10);
  const legOffsets = [
    [-consoleWidth / 2 + 0.2, -consoleDepth / 2 + 0.2],
    [consoleWidth / 2 - 0.2, -consoleDepth / 2 + 0.2],
    [-consoleWidth / 2 + 0.2, consoleDepth / 2 - 0.2],
    [consoleWidth / 2 - 0.2, consoleDepth / 2 - 0.2]
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = new THREE.Mesh(consoleLegGeometry, materials.metal);
    leg.position.set(x, -consoleHeight / 2 + 0.1, z);
    consoleGroup.add(leg);
  });
  consoleGroup.add(consoleBody, consoleTop);
  consoleGroup.position.set(2.6, consoleHeight / 2, roomSize.z / 2 - wallThickness / 2 - 0.4);
  scene.add(consoleGroup);
  consoleBody.userData = {
    itemId: "tv-console-001",
    baseColor: 0xf1e4d2
  };
  interactionMeshes.push(consoleBody);

  return { interactionMeshes };
}
