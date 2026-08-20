/**
 * jsdom (28) parses `<dialog>` but implements none of its behaviour, so the day detail dialog
 * would blow up under test on a method every browser has. Stand in the two calls the app makes,
 * driving the same `open` property the real element exposes.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
