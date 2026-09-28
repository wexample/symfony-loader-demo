import AppChild from '@wexample/symfony-loader/js/Class/AppChild';
import TestReport from './TestReport';

// Thrown by a fatal assertion: it ends the test method it happens in, and the
// manager goes on with the next one. Told apart from any other error, which is
// the test itself breaking rather than what it checks being wrong.
export class AssertionFailure extends Error {}

export default abstract class extends AppChild {
  // Where the run is drawn, set by the manager before the first method runs.
  public report?: TestReport;

  assertEquals(value: any, expected: any, message?: string, fatal: boolean = true) {
    let styleDefault = 'border-radius:10rem;';
    message = message || expected;
    const passed = value === expected;

    this.report?.assertion({ passed, message: String(message ?? ''), value, expected });

    if (!passed) {
      console.log(
        '%c Fail ',
        `background: #FFCCCC; color: #880000; ${styleDefault}`,
        `Assertion failed, ${value} is not equal to expected value : ${expected}. ${message || ''}`
      );

      if (fatal) {
        throw new AssertionFailure(String(message ?? 'UNIT TEST ERROR'));
      }
    } else {
      console.log(
        '%c Success ',
        `background: #00FF00; color: #002200; ${styleDefault}`,
        message || expected
      );
    }
  }

  assertTrue(value, message?: string) {
    this.assertEquals(value, true, message);
  }

  assertFalse(value, message?: string) {
    this.assertEquals(value, false, message);
  }

  public init() {
    // To override.
  }

  public abstract getTestMethods();
}
