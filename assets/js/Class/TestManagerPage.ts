import Page from '@wexample/symfony-loader/js/Class/Page';
import RenderNode from '@wexample/symfony-loader/js/Class/RenderNode';
import AbstractOverlayPageManager from '@wexample/symfony-design-system/js/Class/AbstractOverlayPageManager';
import UnitTest, { AssertionFailure } from './UnitTest';
import TestReport from './TestReport';

export default class TestManagerPage extends Page {
  // Every method runs, whatever the ones before it did: a failure ends the
  // method it happens in and nothing else, so one run shows everything broken.
  async runTests(tests) {
    const report = new TestReport(this.el.querySelector('.test-report'));

    for (const [name, testDefinition] of Object.entries(tests) as [string, any][]) {
      report.suiteStart(name);

      let test: UnitTest;

      try {
        test = new testDefinition(this.app) as UnitTest;
        test.report = report;
        test.init();
      } catch (error) {
        report.methodStart('init');
        report.methodEnd(error);
        report.suiteEnd();
        continue;
      }

      for (const method of test.getTestMethods() as Function[]) {
        report.methodStart(method.name.replace(/^bound /, '') || 'anonymous');

        try {
          await method.apply(test);
          report.methodEnd();
        } catch (error) {
          // The assertion that threw is already in the report.
          report.methodEnd(error instanceof AssertionFailure ? undefined : error, error instanceof AssertionFailure);
        }

        await this.closeOverlays();
      }

      report.suiteEnd();
    }

    report.runEnd();
  }

  // A method that fails ends where it failed, before closing what it opened:
  // every modal and panel left open is closed after it, innermost first, so
  // the next one starts on the page alone — and the run ends on it.
  private async closeOverlays() {
    const overlays: AbstractOverlayPageManager[] = [];
    const collect = (node: RenderNode) => {
      for (const child of node.eachChildRenderNode()) {
        if (child instanceof AbstractOverlayPageManager && (child as any).overlayIsOpen()) {
          overlays.push(child);
        }

        collect(child);
      }
    };

    collect(this.app.layout);

    for (const overlay of overlays.reverse()) {
      await overlay.close({ instant: true });
    }
  }
}
