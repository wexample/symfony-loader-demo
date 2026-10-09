import AdaptiveRenderingTest from './class/AdaptiveRenderingTest';
import AppTest from './class/AppTest';
import LayoutTest from './class/LayoutTest';
import NoJsTest from './class/NoJsTest';
import OverlayTest from './class/OverlayTest';
import ResponsiveTest from './class/ResponsiveTest';
import RoutingTest from './class/RoutingTest';
import TestTest from './class/TestTest';
import TranslationTest from './class/TranslationTest';
import VariablesTest from './class/VariablesTest';
import VueTest from './class/VueTest';
import TestManagerPage from '../../js/Class/TestManagerPage';

// The tests run when asked for (`?run=1`, the Run button): a page opened to be
// read is not a page that starts moving, and each run starts from a page
// loaded afresh, with nothing left by the one before.
export default class extends TestManagerPage {
  async pageReady() {
    if (!new URLSearchParams(window.location.search).has('run')) {
      return;
    }

    await this.runTests({
      TestTest,
      AppTest,
      RoutingTest,
      VariablesTest,
      TranslationTest,
      LayoutTest,
      NoJsTest,
      AdaptiveRenderingTest,
      OverlayTest,
      VueTest,
      ResponsiveTest,
    });
  }
}
