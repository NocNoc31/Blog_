import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('copy-code-button')
export class CopyCodeButton extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-flex;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        margin: 0;
        padding: 0.45rem 0.6rem;
        background: color-mix(in srgb, var(--code-fg) 14%, transparent);
        border: 1px solid color-mix(in srgb, var(--code-fg) 28%, transparent);
        border-radius: var(--r-sm);
        color: var(--code-fg);
        cursor: pointer;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    `,
  ];

  @state()
  _isCopied = false;

  copyCode() {
    this._isCopied = true;
    const pre = this.parentElement;
    let code = pre.querySelector('code');
    const range = document.createRange();
    range.selectNode(code);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    // check if the browser supports clipboard API
    if (!navigator.clipboard) {
      // if not use the old commandExec() way
      document.execCommand('copy');
    } else {
      try {
        navigator.clipboard.writeText(range.toString());
      } catch (error) {
        console.error(error);
      }
    }
    window.getSelection().removeAllRanges();
    setTimeout(() => {
      this._isCopied = false;
    }, 1000);
  }

  render() {
    return html`
      <button @click=${this.copyCode}>${this._isCopied ? 'Đã chép' : 'Sao chép'}</button>
    `;
  }
}
