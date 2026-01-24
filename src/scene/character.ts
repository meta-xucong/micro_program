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
  group.position.set(-2, 0, -1);

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
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0/CesiumMan/glTF-Binary/CesiumMan.glb",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMan/glTF-Binary/CesiumMan.glb"
  ];

  const knownHeights: Record<string, number> = {
    "CesiumMan.glb": 1.8
  };

  const applyModel = (model: THREE.Object3D, sourceUrl: string) => {
    model.visible = true;
    const forceNeutralMaterial = false;
    model.traverse((child) => {
      child.visible = true;
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        if (forceNeutralMaterial) {
          const material = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.6,
            metalness: 0.1
          });
          if ("isSkinnedMesh" in child && (child as THREE.SkinnedMesh).isSkinnedMesh) {
            material.skinning = true;
          }
          child.material = material;
        } else {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => {
            material.transparent = false;
            material.opacity = 1;
          });
        }
      }
    });
    const container = new THREE.Group();
    container.add(model);
    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if ("isSkinnedMesh" in child && (child as THREE.SkinnedMesh).isSkinnedMesh) {
          (child as THREE.SkinnedMesh).computeBoundingBox();
          const skinnedBox = (child as THREE.SkinnedMesh).boundingBox;
          if (skinnedBox) {
            meshBox.copy(skinnedBox);
            meshBox.applyMatrix4(child.matrixWorld);
            box.union(meshBox);
          }
          return;
        }
        if (!child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        if (child.geometry.boundingBox) {
          meshBox.copy(child.geometry.boundingBox);
          meshBox.applyMatrix4(child.matrixWorld);
          box.union(meshBox);
        }
      }
    });
    const size = new THREE.Vector3();
    box.getSize(size);
    if (!Number.isFinite(size.y) || size.y <= 0) {
      console.warn("Character model has invalid bounds, keeping placeholder.");
      return false;
    }
    const knownHeight = Object.entries(knownHeights).find(([key]) =>
      sourceUrl.includes(key)
    )?.[1];
    const baseHeight = knownHeight ?? size.y;
    const scale = targetHeight / baseHeight;
    if (!Number.isFinite(scale) || scale <= 0) {
      console.warn("Character model has invalid scale, keeping placeholder.");
      return false;
    }
    container.scale.setScalar(scale);
    container.updateWorldMatrix(true, true);
    const scaledBox = new THREE.Box3().setFromObject(container);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    if (
      !knownHeight &&
      Number.isFinite(scaledSize.y) &&
      scaledSize.y > 0 &&
      Math.abs(scaledSize.y - targetHeight) / targetHeight < 1
    ) {
      const correction = targetHeight / scaledSize.y;
      container.scale.multiplyScalar(correction);
      container.updateWorldMatrix(true, true);
    }
    const finalBox = new THREE.Box3().setFromObject(container);
    const finalSize = new THREE.Vector3();
    finalBox.getSize(finalSize);
    if (!Number.isFinite(finalSize.y) || finalSize.y <= 0) {
      console.warn("Character model has invalid scaled bounds, keeping placeholder.");
      return false;
    }
    const center = new THREE.Vector3();
    finalBox.getCenter(center);
    if (Number.isFinite(center.x) && Number.isFinite(center.z)) {
      container.position.x -= center.x;
      container.position.z -= center.z;
    }
    container.position.y -= finalBox.min.y;
    group.add(container);
    placeholder.visible = false;
    return true;
  };

  const loadModel = (index: number) => {
    if (index >= modelUrls.length) {
      return;
    }
    loader.load(
      modelUrls[index],
      (gltf) => {
        const applied = applyModel(gltf.scene, modelUrls[index]);
        if (!applied) {
          loadModel(index + 1);
          return;
        }
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
