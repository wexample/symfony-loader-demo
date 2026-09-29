import AbstractTest from "./AbstractTest";

export default class NoJsTest extends AbstractTest {
  public getTestMethods() {
    return [
      this.testRenderedWithoutJs,
    ];
  }

  // A render pass without javascript draws what stands in for it, and ships
  // no script to run.
  async testRenderedWithoutJs() {
    const html = await this.fetchAdaptiveHtmlPage(`${this.pathCoreTestAdaptive}?no-js=1`);

    this.assertTrue(
      html.includes('NO_JS_TEXT'),
      'The page rendered without javascript shows its no-js content'
    );

    const htmlWithJs = await this.fetchAdaptiveHtmlPage();

    this.assertFalse(
      htmlWithJs.includes('NO_JS_TEXT'),
      'The page rendered with javascript does not'
    );
  }
}
