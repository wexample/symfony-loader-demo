import AbstractTest from "./AbstractTest";
import { timeSleep } from '@wexample/js-helpers/Helper/Time';
import { domAppendInnerHtml } from '@wexample/js-helpers/Helper/Dom';
import RenderNode from '@wexample/symfony-loader/js/Class/RenderNode';
import Component from '@wexample/symfony-loader/js/Class/Component';
import { RenderNodeResponsiveType } from '@wexample/symfony-loader/js/Services/ResponsiveService';
import Page from '@wexample/symfony-loader/js/Class/Page';

export default class ResponsiveTest extends AbstractTest {
  responsiveActivationWaitDuration: number = 20;
  responsiveSizes: string[];

  public getTestMethods() {
    return [
      this.testDefault,
      this.testModale,
      this.testDisplays,
      this.testInstancesAtDifferentSizes,
    ];
  }

  public init() {
    super.init()

    this.responsiveSizes = Object.keys(this.app.layout.vars.displayBreakpoints);
  }

  resetPageResponsiveSizesCounters() {
    this.app.layout.page.vars.responsiveSizesCounters = {};
    this.responsiveSizes.forEach((size: string) => {
      this.app.layout.page.vars.responsiveSizesCounters[size] = 0;
    });
  }

  async testDefault() {
    this.assertTrue(
      document
        .getElementById('layout-initial')
        .classList.contains(
        `responsive-${this.app.layout.responsiveSizeCurrent}`
      ),
      `The default responsive size of "responsive-${this.app.layout.responsiveSizeCurrent}" has been applied to layout body`
    );

    await this.assertResponsiveSwitchWorks(
      this.app.layout,
      '#test-playground',
      this.app.layout.page.findChildRenderNodeByView(
        '@WexampleSymfonyLoaderTestingBundle/components/test-component'
      ) as Component & RenderNodeResponsiveType,
      'background-color',
      'rgb(0, 128, 0)'
    );
  }

  async assertResponsiveSwitchWorks(
    mainRenderNode: RenderNode & RenderNodeResponsiveType,
    mainPlaygroundSelector: string,
    component: Component & RenderNodeResponsiveType,
    mainResponsiveStyle: string,
    mainResponsiveColor: string
  ) {
    let elPlayground = mainRenderNode.el.querySelector(
      mainPlaygroundSelector
    ) as HTMLElement;
    let breakPoints = this.responsiveSizes;
    let elTesterLayout = this.generateResponsiveTester(elPlayground);
    let elTesterComponent = this.generateResponsiveTester(component.el);

    for (let layoutResponsiveSize of breakPoints) {
      await mainRenderNode.responsiveSet(layoutResponsiveSize, true);

      this.assertMainResponsiveApplyStyle(
        layoutResponsiveSize,
        elTesterLayout,
        mainResponsiveStyle,
        mainResponsiveColor
      );

      // Test component responsive.
      for (let componentResponsiveSize of breakPoints) {
        await component.responsiveSet(componentResponsiveSize, false);

        this.assertMainResponsiveApplyStyle(
          componentResponsiveSize,
          elTesterComponent,
          mainResponsiveStyle,
          mainResponsiveColor,
          // Only active if same of main layout
          componentResponsiveSize !== layoutResponsiveSize
        );

        this.assertResponsiveTestZoneHaveStyle(
          componentResponsiveSize,
          elTesterComponent,
          'color',
          'rgb(0, 255, 0)'
        );
      }
    }

    elTesterLayout.remove();
    elTesterComponent.remove();
  }

  async testModale() {
    return await this.fetchAdaptiveAjaxPage()
      .then(async () => {
        let elPlayground = this.app.layout.el.querySelector(
          '#test-playground'
        ) as HTMLElement;
        let elTesterLayout = this.generateResponsiveTester(elPlayground);
        let breakPoints = this.responsiveSizes;

        for (let responsiveSize of breakPoints) {
          await this.app.layout.responsiveSet(responsiveSize, true);

          this.assertMainResponsiveApplyStyle(
            responsiveSize,
            elTesterLayout,
            'background-color',
            'rgb(0, 128, 0)'
          );

          await this.assertResponsiveSwitchWorks(
            (this.app.layout.pageFocused) as Page & RenderNodeResponsiveType,
            '.adaptive-page-playground',
            this.app.layout.pageFocused.findChildRenderNodeByView(
              '@WexampleSymfonyLoaderTestingBundle/components/test-component'
            ) as Component & RenderNodeResponsiveType,
            'border-color',
            'rgb(0, 255, 0)'
          );
        }

        elTesterLayout.remove();
      });
  }

  // Instances of one component share its stylesheets. Two of them at two
  // sizes each keep the sheet of their own: switching one never takes the
  // other's away, even while it is still loading.
  async testInstancesAtDifferentSizes() {
    const [first, second] = this.responsiveSizes.slice(-2);
    const pageComponent = this.app.layout.page.findChildRenderNodeByView(
      '@WexampleSymfonyLoaderTestingBundle/components/test-component'
    ) as Component & RenderNodeResponsiveType;

    await this.fetchAdaptiveAjaxPage();

    const modalComponent = this.app.layout.pageFocused.findChildRenderNodeByView(
      '@WexampleSymfonyLoaderTestingBundle/components/test-component'
    ) as Component & RenderNodeResponsiveType;

    const pageTester = this.generateResponsiveTester(pageComponent.el);
    const modalTester = this.generateResponsiveTester(modalComponent.el);

    // Not awaited one after the other: both switches are under way at once.
    await Promise.all([
      pageComponent.responsiveSet(first, false),
      modalComponent.responsiveSet(second, false),
    ]);

    this.assertResponsiveTestZoneHaveStyle(first, pageTester, 'color', 'rgb(0, 255, 0)');
    this.assertResponsiveTestZoneHaveStyle(second, modalTester, 'color', 'rgb(0, 255, 0)');

    pageTester.remove();
    modalTester.remove();

    await pageComponent.responsiveUpdate(false);
  }

  async testDisplays() {
    let breakPoints = this.responsiveSizes;
    const page = this.app.layout.page as Page & RenderNodeResponsiveType

    this.resetPageResponsiveSizesCounters();
    page.vars.responsiveSizesCounters[
      page.responsiveSizeCurrent
      ]++;

    for (let responsiveSize of breakPoints) {
      await this.app.layout.responsiveSet(responsiveSize, true);

      this.assertEquals(
        page.vars.responsiveSizesCounters[responsiveSize],
        1,
        `Size ${responsiveSize} display set 1`
      );

      await timeSleep(this.responsiveActivationWaitDuration * 10);
    }
  }

  assertTestZoneHaveStyle(
    elTestZoneName: string,
    elTestZone: HTMLElement,
    property: string,
    expectedColorValue: string
  ) {
    const computedStyle = getComputedStyle(elTestZone)[property];

    this.assertEquals(
      computedStyle,
      expectedColorValue,
      ` property "${property}" for size "${elTestZoneName}" has value ${expectedColorValue}`
    );
  }

  assertResponsiveTestZoneHaveStyle(
    elTestZoneSize: string,
    elPlayground: HTMLElement,
    property: string,
    expectedColorValue: string
  ) {
    this.assertTestZoneHaveStyle(
      elTestZoneSize,
      elPlayground.querySelector(`.test-responsive-${elTestZoneSize}`),
      property,
      expectedColorValue
    );
  }

  // An idle chip is whatever the page's own stylesheet draws: only the colour
  // of the active one belongs to the test.
  assertMainResponsiveApplyStyle(
    size: string,
    elPlayground: HTMLElement,
    activeStyle: string,
    activeColor: string,
    reverse: boolean = false
  ) {
    if (!reverse) {
      this.assertResponsiveTestZoneHaveStyle(size, elPlayground, activeStyle, activeColor);

      return;
    }

    this.assertNotEquals(
      getComputedStyle(elPlayground.querySelector(`.test-responsive-${size}`))[activeStyle],
      activeColor,
      ` property "${activeStyle}" for size "${size}" is not lit`
    );
  }

  generateResponsiveTester(elPlayground: HTMLElement): HTMLElement {
    let html = '<div class="responsive-tester">';
    let breakPoints = this.responsiveSizes;

    for (let size of breakPoints) {
      html += `<div class="test-responsive test-responsive-${size}">${size}</div>`;
    }

    html += '</div>';

    domAppendInnerHtml(elPlayground, html);

    return elPlayground.querySelector('.responsive-tester');
  }
}
