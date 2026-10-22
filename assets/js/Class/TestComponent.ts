import Component from '@wexample/symfony-loader/js/Class/Component';
import { RenderNodeLocaleType } from '@wexample/symfony-loader/js/Services/LocaleService';

export default class TestComponent extends Component {
  protected interval: ReturnType<typeof setInterval> | undefined;
  protected onIntervalProxy: (() => void) | undefined;
  protected elBlink: HTMLElement | undefined;
  protected suffix: string = '';

  async mounted() {
    await super.mounted();

    // Unmounted again while mounting — the vue holding it hid it meanwhile.
    if (!this.el) {
      return;
    }

    this.app.layout.vars.testComponentLoaded = true;

    const el = this.el.querySelector(`.test-component-test-js${this.suffix}`) as HTMLElement;
    el.style.backgroundColor = 'green';

    this.elBlink = this.el.querySelector(`.test-blink${this.suffix}`) as HTMLElement;
    this.onIntervalProxy = this.onInterval.bind(this);
    this.interval = setInterval(this.onIntervalProxy, 1000);

    const elTranslations = this.el.querySelector(
      `.test-component-string-translated-client${this.suffix}`
    ) as HTMLElement;
    elTranslations.innerText = (this as unknown as RenderNodeLocaleType).trans('@component::string.client_side');
  }

  async unmounted() {
    clearInterval(this.interval);
  }

  async exit() {
    await super.exit();

    delete this.app.layout.vars.testComponentLoaded;
  }

  onInterval() {
    if (!this.elBlink) return;
    this.elBlink.style.display = this.elBlink.style.display === 'none' ? 'inline' : 'none';
  }
}
