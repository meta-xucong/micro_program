import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type Character = {
  mesh: THREE.Group;
  collider: THREE.Box3;
  velocity: THREE.Vector3;
};

export function createCharacter(): Character {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const geometry = new THREE.CapsuleGeometry(0.35, 0.9, 6, 12);
  const material = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    flatShading: true
  });
  const placeholder = new THREE.Mesh(geometry, material);
  placeholder.position.set(0, 0.95, 0);
  placeholder.castShadow = true;
  group.add(placeholder);

  const loader = new GLTFLoader();
  const modelUrls = [
    "/models/RiggedFigure.glb",
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/RiggedFigure/glTF-Binary/RiggedFigure.glb"
  ];

  const applyModel = (model: THREE.Object3D) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = 1.7;
    const scale = targetHeight / (size.y || 1);
    model.scale.setScalar(scale);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const min = new THREE.Vector3();
    scaledBox.getMin(min);
    model.position.y -= min.y;
    placeholder.visible = false;
    group.add(model);
  };

  const loadModel = (index: number) => {
    if (index >= modelUrls.length) {
      return;
    }
    loader.load(
      modelUrls[index],
      (gltf) => {
        applyModel(gltf.scene);
      },
      undefined,
      () => {
        loadModel(index + 1);
      }
    );
  };

  loadModel(0);

  const collider = new THREE.Box3().setFromCenterAndSize(
    group.position.clone(),
    new THREE.Vector3(0.8, 1.8, 0.8)
  );

  return {
    mesh: group,
    collider,
    velocity: new THREE.Vector3()
  };
}

export function updateCharacterCollider(character: Character) {
  character.collider.setFromCenterAndSize(
    character.mesh.position.clone(),
    new THREE.Vector3(0.8, 1.8, 0.8)
  );
}
