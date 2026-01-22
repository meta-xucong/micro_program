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

const COLOR_MAP: Record<string, number> = {
  bed: 0xfbbf24,
  desk: 0x60a5fa,
  chair: 0xa78bfa,
  fridge: 0xf87171,
  shelf: 0x34d399
};

export function createRoom(scene: THREE.Scene, layout: RoomLayout, items: ItemDetail[]): RoomAssets {
  const roomSize = new THREE.Vector3(...layout.roomSize);
  const floorGeometry = new THREE.PlaneGeometry(roomSize.x, roomSize.z);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.8
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.9
  });

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
    const size = new THREE.Vector3(...layoutItem.size);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const color = COLOR_MAP[layoutItem.type] ?? 0x94a3b8;
    const material = new THREE.MeshStandardMaterial({
      color,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...layoutItem.position);
    mesh.rotation.y = layoutItem.rotationY ?? 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      itemId: layoutItem.itemId,
      baseColor: color
    };
    furniture.push(mesh);
    scene.add(mesh);

    const collider = new THREE.Box3().setFromObject(mesh);
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
