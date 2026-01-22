import * as THREE from "three";
import type { ItemModal } from "../ui/modal";
import type { RoomAssets } from "../scene/room";

export class InteractionSystem {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private highlighted: THREE.Mesh | null = null;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private camera: THREE.Camera,
    private room: RoomAssets,
    private modal: ItemModal
  ) {
    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      this.handlePointer(event);
    });
  }

  private handlePointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.room.furniture, false);

    if (hits.length === 0) {
      this.setHighlight(null);
      return;
    }

    const target = hits[0].object as THREE.Mesh;
    this.setHighlight(target);

    const itemId = target.userData.itemId as string | undefined;
    if (!itemId) return;
    const item = this.room.itemMap.get(itemId);
    if (!item) return;
    this.modal.openItemDetail(item);
  }

  private setHighlight(mesh: THREE.Mesh | null) {
    if (this.highlighted && this.highlighted !== mesh) {
      const baseColor = this.highlighted.userData.baseColor as number | undefined;
      if (baseColor !== undefined) {
        (this.highlighted.material as THREE.MeshStandardMaterial).color.setHex(baseColor);
      }
    }

    if (mesh) {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xfef08a);
    }

    this.highlighted = mesh;
  }
}
