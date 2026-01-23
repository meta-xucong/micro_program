type JoystickState = {
  container: HTMLDivElement;
  thumb: HTMLDivElement;
  pointerId: number | null;
  value: { x: number; z: number };
};

export class InputSystem {
  private keys = new Set<string>();
  private joystick: JoystickState;
  private hasTouch = false;
  private isPointerDown = false;

  constructor(container: HTMLElement, pointerTarget?: HTMLElement) {
    this.joystick = this.createJoystick(container);

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    window.addEventListener(
      "touchstart",
      () => {
        this.hasTouch = true;
      },
      { passive: true }
    );

    const target = pointerTarget ?? container;
    target.addEventListener("pointerdown", (event) => {
      if ((event.target as HTMLElement | null)?.closest(".joystick")) {
        return;
      }
      this.isPointerDown = true;
    });

    const endPointer = () => {
      this.isPointerDown = false;
    };

    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    window.addEventListener("blur", endPointer);
  }

  getDirection() {
    const keyboard = {
      x:
        (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
        (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0),
      z:
        (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
        (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0)
    };

    const joy = this.joystick.value;
    const magnitude = Math.hypot(joy.x, joy.z);
    const joyVector = magnitude > 0.05 ? joy : { x: 0, z: 0 };

    return {
      x: keyboard.x + joyVector.x,
      z: keyboard.z + joyVector.z
    };
  }

  isViewAdjusting() {
    return this.isPointerDown;
  }

  private createJoystick(container: HTMLElement): JoystickState {
    const joystick = document.createElement("div");
    joystick.className = "joystick";

    const thumb = document.createElement("div");
    thumb.className = "joystick__thumb";
    joystick.appendChild(thumb);
    container.appendChild(joystick);

    const state: JoystickState = {
      container: joystick,
      thumb,
      pointerId: null,
      value: { x: 0, z: 0 }
    };

    const resetThumb = () => {
      state.thumb.style.transform = "translate(0px, 0px)";
      state.value = { x: 0, z: 0 };
    };

    joystick.addEventListener("pointerdown", (event) => {
      if (state.pointerId !== null) return;
      state.pointerId = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      this.hasTouch = true;
      this.updateThumb(event, state);
    });

    joystick.addEventListener("pointermove", (event) => {
      if (state.pointerId !== event.pointerId) return;
      this.updateThumb(event, state);
    });

    joystick.addEventListener("pointerup", (event) => {
      if (state.pointerId !== event.pointerId) return;
      state.pointerId = null;
      resetThumb();
    });

    joystick.addEventListener("pointercancel", (event) => {
      if (state.pointerId !== event.pointerId) return;
      state.pointerId = null;
      resetThumb();
    });

    return state;
  }

  private updateThumb(event: PointerEvent, state: JoystickState) {
    const rect = state.container.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const dx = event.clientX - center.x;
    const dy = event.clientY - center.y;
    const maxRadius = rect.width * 0.35;
    const distance = Math.min(Math.hypot(dx, dy), maxRadius);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    state.thumb.style.transform = `translate(${x}px, ${y}px)`;
    state.value = { x: x / maxRadius, z: y / maxRadius };
  }
}
