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
    message = message || expected;
    const passed = value === expected;

    this.report?.assertion({ passed, message: String(message ?? ''), value, expected });

    if (!passed && fatal) {
      throw new AssertionFailure(String(message ?? 'UNIT TEST ERROR'));
    }
  }

  assertNotEquals(value: any, unexpected: any, message?: string, fatal: boolean = true) {
    const passed = value !== unexpected;

    this.report?.assertion({ passed, message: String(message ?? ''), value, expected: `anything but ${JSON.stringify(unexpected)}` });

    if (!passed && fatal) {
      throw new AssertionFailure(String(message ?? 'UNIT TEST ERROR'));
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
