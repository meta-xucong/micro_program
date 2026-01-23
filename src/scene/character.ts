import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type Character = {
  mesh: THREE.Group;
  collider: THREE.Box3;
  velocity: THREE.Vector3;
  colliderSize: THREE.Vector3;
  mixer?: THREE.AnimationMixer;
  actions?: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
  };
};

export function createCharacter(): Character {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const targetHeight = 1.6;
  const colliderSize = new THREE.Vector3(0.6, targetHeight, 0.6);
  const capsuleRadius = colliderSize.x / 2;
  const capsuleLength = targetHeight - capsuleRadius * 2;
  const geometry = new THREE.CapsuleGeometry(capsuleRadius, capsuleLength, 6, 12);
  const material = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    flatShading: true
  });
  const placeholder = new THREE.Mesh(geometry, material);
  placeholder.position.set(0, targetHeight / 2, 0);
  placeholder.castShadow = true;
  group.add(placeholder);

  const character: Character = {
    mesh: group,
    collider: new THREE.Box3().setFromCenterAndSize(
      group.position.clone(),
      colliderSize.clone()
    ),
    velocity: new THREE.Vector3(),
    colliderSize
  };

  const loader = new GLTFLoader();
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const resolvedBaseUrl = new URL(baseUrl, window.location.origin).toString();
  const pageBaseUrl = new URL("./", window.location.href).toString();
  const modelUrls = [
    new URL("models/UrbanCharacter.glb", resolvedBaseUrl).toString(),
    new URL("models/UrbanCharacter.glb", pageBaseUrl).toString(),
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r155/examples/models/gltf/Soldier.glb",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb"
  ];

  const applyModel = (model: THREE.Object3D) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y <= 0) {
      console.warn("Character model has invalid bounds, keeping placeholder.");
      return;
    }
    const baseHeight = size.y;
    const scale = targetHeight / baseHeight;
    model.scale.setScalar(scale);
    model.updateWorldMatrix(true, true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    if (scaledSize.y > 0) {
      const correction = targetHeight / scaledSize.y;
      model.scale.multiplyScalar(correction);
      model.updateWorldMatrix(true, true);
    }
    const finalBox = new THREE.Box3().setFromObject(model);
    const finalSize = new THREE.Vector3();
    finalBox.getSize(finalSize);
    if (finalSize.y <= 0) {
      console.warn("Character model has invalid scaled bounds, keeping placeholder.");
      return;
    }
    model.position.y -= finalBox.min.y;
    group.add(model);
    placeholder.visible = false;
  };

  const loadModel = (index: number) => {
    if (index >= modelUrls.length) {
      return;
    }
    loader.load(
      modelUrls[index],
      (gltf) => {
        applyModel(gltf.scene);
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(gltf.scene);
          const normalizedName = (name: string) => name.toLowerCase();
          const idleClip =
            gltf.animations.find((clip) =>
              normalizedName(clip.name).includes("idle")
            ) ?? gltf.animations[0];
          const walkClip = gltf.animations.find((clip) => {
            const name = normalizedName(clip.name);
            return name.includes("walk") || name.includes("run");
          });
          const idleAction = mixer.clipAction(idleClip);
          idleAction.play();
          let walkAction: THREE.AnimationAction | undefined;
          if (walkClip && walkClip !== idleClip) {
            walkAction = mixer.clipAction(walkClip);
            walkAction.play();
            walkAction.setEffectiveWeight(0);
          }
          character.mixer = mixer;
          character.actions = { idle: idleAction, walk: walkAction };
        }
      },
      undefined,
      (error) => {
        console.warn("Failed to load character model:", modelUrls[index], error);
        loadModel(index + 1);
      }
    );
  };

  loadModel(0);

  return character;
}

export function updateCharacterCollider(character: Character) {
  character.collider.setFromCenterAndSize(
    character.mesh.position.clone(),
    character.colliderSize
  );
}

export function updateCharacterAnimation(
  character: Character,
  delta: number,
  isMoving: boolean
) {
  if (!character.mixer || !character.actions) {
    return;
  }

  const hasWalk = Boolean(character.actions.walk);
  const walkWeight = isMoving && hasWalk ? 1 : 0;
  const idleWeight = hasWalk ? 1 - walkWeight : 1;

  if (character.actions.idle) {
    character.actions.idle.setEffectiveWeight(idleWeight);
  }
  if (character.actions.walk) {
    character.actions.walk.setEffectiveWeight(walkWeight);
  }

  character.mixer.update(delta);
}
