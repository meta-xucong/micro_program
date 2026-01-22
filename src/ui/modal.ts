export type ItemDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type MiniProgramEnv = {
  miniProgram?: {
    getEnv?: (cb: (res: { miniprogram: boolean }) => void) => void;
    navigateTo?: (options: { url: string }) => void;
  };
};

const MINI_PROGRAM_ENV: MiniProgramEnv | undefined = (window as unknown as { wx?: MiniProgramEnv }).wx;

export class ItemModal {
  private overlay: HTMLDivElement;
  private modal: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private descEl: HTMLDivElement;
  private metaEl: HTMLDivElement;
  private closeBtn: HTMLButtonElement;
  private isMiniProgram = false;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement("div");
    this.overlay.className = "ui-overlay";

    this.modal = document.createElement("div");
    this.modal.className = "item-modal";

    const card = document.createElement("div");
    card.className = "item-modal__card";

    this.titleEl = document.createElement("div");
    this.titleEl.className = "item-modal__title";

    this.descEl = document.createElement("div");
    this.descEl.className = "item-modal__desc";

    this.metaEl = document.createElement("div");
    this.metaEl.className = "item-modal__meta";

    const actions = document.createElement("div");
    actions.className = "item-modal__actions";

    this.closeBtn = document.createElement("button");
    this.closeBtn.className = "item-modal__close";
    this.closeBtn.textContent = "关闭";

    actions.appendChild(this.closeBtn);
    card.appendChild(this.titleEl);
    card.appendChild(this.descEl);
    card.appendChild(this.metaEl);
    card.appendChild(actions);
    this.modal.appendChild(card);
    this.overlay.appendChild(this.modal);
    container.appendChild(this.overlay);

    this.closeBtn.addEventListener("click", () => this.hide());
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    if (MINI_PROGRAM_ENV?.miniProgram?.getEnv) {
      MINI_PROGRAM_ENV.miniProgram.getEnv((res) => {
        this.isMiniProgram = Boolean(res?.miniprogram);
      });
    }
  }

  openItemDetail(item: ItemDetail) {
    window.postMessage({ type: "itemDetailOpen", itemId: item.id }, "*");

    if (this.isMiniProgram && MINI_PROGRAM_ENV?.miniProgram?.navigateTo) {
      MINI_PROGRAM_ENV.miniProgram.navigateTo({
        url: `/pages/itemDetail/index?itemId=${encodeURIComponent(item.id)}`
      });
      return;
    }

    this.titleEl.textContent = item.name;
    this.descEl.textContent = item.description;
    this.metaEl.textContent = `分类：${item.category} · ID：${item.id}`;
    this.modal.classList.add("is-open");
  }

  hide() {
    this.modal.classList.remove("is-open");
  }
}
