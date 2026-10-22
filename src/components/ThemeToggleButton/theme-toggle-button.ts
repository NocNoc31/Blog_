import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { lightThemeIcon, darkThemeIcon } from './icons';

@customElement('theme-toggle-button')
export class ThemeToggleButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      line-height: 0;
    }

    button {
      width: 34px;
      height: 34px;
      padding: 0.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border: var(--bw) solid var(--line-strong);
      border-radius: var(--r-sm);
      background-color: var(--paper);
      color: var(--ink);
      fill: currentcolor;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
    }

    button:hover {
      background-color: var(--accent-3);
      color: #1b2a21;
      transform: translateY(-1px);
    }

    svg {
      width: 16px;
      height: 16px;
    }
  `;

  private _doc = document.firstElementChild;

  @property({ type: String })
  theme: string | null = null;

  firstUpdated() {
    this._getCurrentTheme();
  }

  private _getCurrentTheme() {
    const stored = localStorage.getItem('theme');
    const preferred =
      stored ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    this._setTheme(preferred, stored !== null);
  }

  private _setTheme(theme: string, persist = true) {
    this.theme = theme;
    this._doc?.setAttribute('color-scheme', theme);
    if (persist) localStorage.setItem('theme', theme);
  }

  private _toggleTheme() {
    this._setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  render() {
    const next = this.theme === 'dark' ? 'sáng' : 'tối';

    return html`
      <button
        @click=${this._toggleTheme}
        aria-label=${`Chuyển sang giao diện ${next}`}
        title=${`Chuyển sang giao diện ${next}`}
      >
        ${this.theme === 'dark' ? lightThemeIcon : darkThemeIcon}
      </button>
    `;
  }
}
