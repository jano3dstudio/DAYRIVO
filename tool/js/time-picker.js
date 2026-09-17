'use strict';

// Keep a native select as the form value, with a popup whose size and initial
// scroll position are controllable across desktop and mobile browsers.
class TimePicker {
  static active = null;

  constructor(field) {
    this.field = field;
    this.dialog = field.closest('dialog');
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.id = field.id + 'Button';
    this.button.className = 'time-trigger';
    this.button.setAttribute('aria-haspopup','listbox');
    this.button.setAttribute('aria-expanded','false');
    this.button.setAttribute('aria-controls',field.id + 'List');
    field.after(this.button);
    this.list = document.createElement('div');
    this.list.id = field.id + 'List';
    this.list.className = 'time-options';
    this.list.setAttribute('role','listbox');
    this.list.setAttribute('aria-label',field.id === 'itemStart' ? t("Von: Uhrzeit") : t("Bis: Uhrzeit"));
    this.list.tabIndex = -1;
    this.list.hidden = true;
    this.dialog.append(this.list);
    this.button.onclick = () => this.list.hidden ? this.open() : this.close();
    this.button.onkeydown = event => {
      if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); this.open(); }
    };
    this.list.onclick = event => {
      const option = event.target.closest('[role="option"]');
      if (option) this.commit(Number(option.dataset.index));
    };
    this.list.onkeydown = event => this.keydown(event);
    field.addEventListener('change',() => this.sync());
    document.addEventListener('pointerdown',event => {
      if (!this.list.hidden && !this.list.contains(event.target) && !this.button.contains(event.target)) this.close(false);
    });
    document.addEventListener('focusin',event => {
      if (!this.list.hidden && event.target !== this.list && event.target !== this.button) this.close(false);
    });
    this.dialog.addEventListener('cancel',event => {
      if (!this.list.hidden) { event.preventDefault(); this.close(); }
    });
    this.dialog.addEventListener('close',() => this.close(false));
    this.dialog.addEventListener('scroll',() => this.close(false));
    window.addEventListener('resize',() => this.close(false));
  }

  sync() {
    this.button.textContent = this.field.value;
    this.button.setAttribute('aria-label',(this.field.id === 'itemStart' ? t("Von: ") : t("Bis: ")) + this.field.value);
  }

  open() {
    TimePicker.active?.close(false);
    TimePicker.active = this;
    this.options = [...this.field.options];
    this.list.replaceChildren(...this.options.map((option,index) => {
      const row = document.createElement('div');
      row.id = this.field.id + 'Option' + index;
      row.setAttribute('role','option');
      row.dataset.index = index;
      row.textContent = option.textContent;
      return row;
    }));
    const bounds = this.button.getBoundingClientRect();
    const height = Math.min(376,window.innerHeight - 24);
    const width = Math.min(Math.max(bounds.width,150),window.innerWidth - 24);
    Object.assign(this.list.style,{
      height:height + 'px',width:width + 'px',
      left:Math.max(12,Math.min(bounds.left,window.innerWidth - width - 12)) + 'px',
      top:Math.max(12,Math.min(bounds.top + bounds.height / 2 - height / 2,window.innerHeight - height - 12)) + 'px'
    });
    this.list.hidden = false;
    // Padding keeps times at the beginning/end of the day centered as well.
    this.list.style.paddingBlock = (this.list.clientHeight - 22) / 2 + 'px';
    this.button.setAttribute('aria-expanded','true');
    this.highlight(Math.max(0,this.field.selectedIndex));
    this.list.focus({preventScroll:true});
  }

  highlight(index) {
    this.index = Math.max(0,Math.min(this.options.length - 1,index));
    [...this.list.children].forEach((row,i) => row.setAttribute('aria-selected',String(i === this.index)));
    const row = this.list.children[this.index];
    this.list.setAttribute('aria-activedescendant',row.id);
    const bounds = this.list.getBoundingClientRect(), selected = row.getBoundingClientRect();
    this.list.scrollTop += selected.top + selected.height / 2 - bounds.top - bounds.height / 2;
  }

  commit(index) {
    const value = this.options[index].value, changed = value !== this.field.value;
    this.field.value = value;
    this.sync();
    this.close();
    if (changed) this.field.dispatchEvent(new Event('change',{bubbles:true}));
  }

  keydown(event) {
    const offsets = {ArrowUp:-1,ArrowDown:1,PageUp:-8,PageDown:8};
    if (event.key in offsets) { event.preventDefault(); this.highlight(this.index + offsets[event.key]); }
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); this.highlight(event.key === 'Home' ? 0 : this.options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.commit(this.index); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); }
    else if (event.key === 'Tab') this.close();
  }

  close(restoreFocus = true) {
    if (this.list.hidden) return;
    this.list.hidden = true;
    this.button.setAttribute('aria-expanded','false');
    if (TimePicker.active === this) TimePicker.active = null;
    if (restoreFocus) this.button.focus({preventScroll:true});
  }
}
