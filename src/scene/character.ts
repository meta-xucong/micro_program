import * as THREE from "three";

export type Character = {
  mesh: THREE.Mesh;
  collider: THREE.Box3;
  velocity: THREE.Vector3;
};

export function createCharacter(): Character {
  const geometry = new THREE.CapsuleGeometry(0.4, 0.9, 6, 12);
  const material = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    flatShading: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.95, 0);
  mesh.castShadow = true;

  const collider = new THREE.Box3().setFromCenterAndSize(
    mesh.position.clone(),
    new THREE.Vector3(0.8, 1.8, 0.8)
  );

  return {
    mesh,
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
