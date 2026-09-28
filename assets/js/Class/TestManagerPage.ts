import Page from '@wexample/symfony-loader/js/Class/Page';
import UnitTest, { AssertionFailure } from './UnitTest';
import TestReport from './TestReport';

export default class TestManagerPage extends Page {
  // Every method runs, whatever the ones before it did: a failure ends the
  // method it happens in and nothing else, so one run shows everything broken.
  async runTests(tests) {
    const report = new TestReport(this.el.querySelector('.test-report'));

    for (const [name, testDefinition] of Object.entries(tests) as [string, any][]) {
      console.log("===============================");
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
        console.log("---");
        report.methodStart(method.name.replace(/^bound /, '') || 'anonymous');

        try {
          await method.apply(test);
          report.methodEnd();
        } catch (error) {
          // The assertion that threw is already in the report.
          report.methodEnd(error instanceof AssertionFailure ? undefined : error, error instanceof AssertionFailure);
        }
      }

      report.suiteEnd();
    }

    report.runEnd();
  }
}
