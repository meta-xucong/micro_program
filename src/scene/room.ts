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
  const floorTextures = loadPbrTextures(
    {
      color:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/herringbone_parquet/herringbone_parquet_diff_1k.jpg",
      roughness:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/herringbone_parquet/herringbone_parquet_rough_1k.jpg",
      normal:
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/herringbone_parquet/herringbone_parquet_nor_gl_1k.jpg"
    },
    2.4
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
    ...floorTextures,
    roughness: 0.5
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
      opacity: 0.55,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.2,
      ior: 1.5,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15
    }),
    door: new THREE.MeshStandardMaterial({
      ...doorTextures,
      color: new THREE.Color(0xffffff),
      metalness: 0.1,
      roughness: 0.55
    }),
    windowFrame: new THREE.MeshStandardMaterial({
      ...windowFrameTextures,
      color: new THREE.Color(0xf8fafc),
      metalness: 0.2,
      roughness: 0.55
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

  addRoomDetails(scene, roomSize, wallThickness, materials);

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
    leather,
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

function addRoomDetails(
  scene: THREE.Scene,
  roomSize: THREE.Vector3,
  wallThickness: number,
  materials: FurnitureMaterials
) {
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
  doorGroup.position.set(-roomSize.x / 2 + doorWidth / 2 + 0.2, doorHeight / 2, roomSize.z / 2 - wallThickness / 2);
  scene.add(doorGroup);

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
  windowGroup.add(frame, glass);
  windowGroup.position.set(0, 1.6, -roomSize.z / 2 + wallThickness / 2);
  scene.add(windowGroup);

  const sideWindow = windowGroup.clone();
  sideWindow.rotation.y = Math.PI / 2;
  sideWindow.position.set(roomSize.x / 2 - wallThickness / 2, 1.7, 0.8);
  scene.add(sideWindow);
}
