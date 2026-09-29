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

export default class extends TestManagerPage {
  async pageReady() {
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
