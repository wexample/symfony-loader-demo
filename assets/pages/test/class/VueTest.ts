import AbstractTest from "./AbstractTest";
import VueComponent from '@wexample/symfony-loader/components/vue';
import ModalComponent from '@wexample/symfony-design-system/components/modal/modal';
import RenderNode from '@wexample/symfony-loader/js/Class/RenderNode';

export default class VueTest extends AbstractTest {
  public getTestMethods() {
    return [
      this.testVueMounted,
      this.testComponentsInsideVue,
      this.testEachVueReadsItsOwnTranslations,
    ];
  }

  private async openAdaptivePage(): Promise<VueComponent> {
    await this.fetchAdaptiveAjaxPage();

    return this.app.layout.pageFocused
      .findChildRenderNodeByView('@WexampleSymfonyLoaderBundle/components/vue') as VueComponent;
  }

  private async closeModal() {
    await (this.app.layout.pageFocused.parentRenderNode as ModalComponent).close();
  }

  async testVueMounted() {
    const vueComponent = await this.openAdaptivePage();

    this.assertTrue(!!vueComponent, 'The vue component exists');
    this.assertTrue(!!vueComponent.vue, 'The vue app is created');
    this.assertTrue(!!vueComponent.vue.app, 'The app is registered into the vue');

    await this.closeModal();
  }

  // A component written in the template of a vue is a render node like any
  // other: created under the vue, mounted on the element the vue drew. Asked
  // twice — the second render of a vue reuses what the first one sent.
  async testComponentsInsideVue() {
    for (const round of ['first', 'second']) {
      const vueComponent = await this.openAdaptivePage();
      const children = vueComponent.eachChildRenderNode()
        .filter((node: RenderNode) => node.view === '@WexampleSymfonyLoaderTestingBundle/components/test-component');

      this.assertTrue(children.length > 0, `${round} render: the components of the vue template are created`);

      children.forEach((child: RenderNode, index: number) => {
        this.assertTrue(child.isMounted, `${round} render: component ${index} inside the vue is mounted`);
        this.assertTrue(
          !!child.el && vueComponent.el.contains(child.el),
          `${round} render: component ${index} is mounted on an element of the vue`
        );
      });

      await this.closeModal();
    }
  }

  // `@vue::` names the domain of the vue holding the key: nested ones, and one
  // imported by its parent rather than named to the loader, each read theirs.
  async testEachVueReadsItsOwnTranslations() {
    const vueComponent = await this.openAdaptivePage();
    const read = (selector: string) => vueComponent.el.querySelector(selector)?.textContent?.trim();

    for (const suffix of ['', '-2', '-3', '-imported']) {
      const expected = suffix ? `CLIENT_SIDE_TEST_VUE_TRANSLATION${suffix.toUpperCase()}` : 'CLIENT_SIDE_TEST_VUE_TRANSLATION';

      this.assertEquals(
        read(`.test-vue-string-translated-client${suffix}`),
        expected,
        `test-vue${suffix} translates client side from its own domain`
      );

      this.assertEquals(
        read(`.test-vue-string-translated-server${suffix}`),
        expected.replace('CLIENT_SIDE', 'SERVER_SIDE'),
        `test-vue${suffix} translates server side from its own domain`
      );
    }

    await this.closeModal();
  }
}
