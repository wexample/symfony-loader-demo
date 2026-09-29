import AbstractTest from "./AbstractTest";
import { domCreateHtmlDocumentFromHtml } from "@wexample/js-helpers/Helper/Dom";

export default class LayoutTest extends AbstractTest {
  public getTestMethods() {
    return [
      this.testDocumentHead,
    ];
  }

  // What a page sets of the document it is rendered in, read from the html a
  // plain request gets.
  async testDocumentHead() {
    const elHtml = domCreateHtmlDocumentFromHtml(await this.fetchAdaptiveHtmlPage());

    this.assertEquals(
      elHtml.querySelector('head title').textContent,
      'ADAPTIVE_DOCUMENT_TITLE',
      'The page sets the document title'
    );

    this.assertEquals(
      (elHtml.querySelector('head meta[name=description]') as HTMLMetaElement).content,
      'DOCUMENT_META_DESCRIPTION',
      'The page sets the meta description'
    );
  }
}
