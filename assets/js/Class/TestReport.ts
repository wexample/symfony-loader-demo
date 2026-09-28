export type TestAssertion = {
  passed: boolean;
  message: string;
  value?: unknown;
  expected?: unknown;
};

type Counts = { passed: number; failed: number };

// The run as a reader wants it: what failed first and in full, what passed
// folded away under its count. It draws in the report the page renders, from
// the markers and icons the page hands it as templates — the design system's
// own markup, never rebuilt here.
export default class TestReport {
  private readonly root: HTMLElement;
  private readonly suitesEl: HTMLElement;
  private readonly startedAt = performance.now();
  private total: Counts = { passed: 0, failed: 0 };
  private suite?: { el: HTMLDetailsElement; counts: Counts; methods: HTMLElement };
  private method?: { el: HTMLElement; list: HTMLElement; failed: boolean };

  constructor(root: HTMLElement) {
    this.root = root;
    this.suitesEl = root.querySelector('.test-report--suites') as HTMLElement;
    this.setState('running');
  }

  suiteStart(name: string): void {
    const el = document.createElement('details');
    el.className = 'test-report--suite';
    el.innerHTML = '<summary class="test-report--suite-head">'
      + '<span class="test-report--suite-icon"></span>'
      + '<span class="test-report--suite-name"></span>'
      + '<span class="test-report--suite-count"></span>'
      + '</summary><div class="test-report--methods"></div>';
    el.querySelector('.test-report--suite-name')!.textContent = name;
    el.querySelector('.test-report--suite-icon')!.append(this.template('icon-running'));
    this.suitesEl.append(el);
    this.suite = { el, counts: { passed: 0, failed: 0 }, methods: el.querySelector('.test-report--methods') as HTMLElement };
    this.updateSuiteCount();
  }

  methodStart(name: string): void {
    const el = document.createElement('div');
    el.className = 'test-report--method';
    el.innerHTML = '<div class="test-report--method-name"></div><ul class="test-report--assertions"></ul>';
    el.querySelector('.test-report--method-name')!.textContent = name;
    this.suite?.methods.append(el);
    this.method = { el, list: el.querySelector('.test-report--assertions') as HTMLElement, failed: false };
  }

  assertion(result: TestAssertion): void {
    const item = this.item(result.passed ? 'pass' : 'fail', result.message);

    if (!result.passed) {
      const diff = document.createElement('dl');
      diff.className = 'test-report--diff';
      [['expected', result.expected], ['received', result.value]].forEach(([key, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = this.label(key as string);
        const dd = document.createElement('dd');
        const code = document.createElement('code');
        code.textContent = TestReport.show(value);
        dd.append(code);
        diff.append(dt, dd);
      });
      item.append(diff);
    }

    this.count(result.passed);
  }

  // An error the test did not expect — the code under test threw, or the test
  // itself is broken. `failed` alone: an assertion ended it, already drawn.
  methodEnd(error?: unknown, failed: boolean = false): void {
    if (error !== undefined) {
      const item = this.item('error', `${this.label('error')} — ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof Error && error.stack) {
        const stack = document.createElement('pre');
        stack.className = 'test-report--stack';
        stack.textContent = error.stack.split('\n').slice(0, 8).join('\n');
        item.append(stack);
      }

      this.count(false);
    } else if (failed && this.method) {
      this.method.failed = true;
    }

    this.method?.el.classList.toggle('test-report--method--failed', !!this.method?.failed);
    this.method = undefined;
  }

  suiteEnd(): void {
    if (!this.suite) {
      return;
    }

    const failed = this.suite.counts.failed > 0;
    const icon = this.suite.el.querySelector('.test-report--suite-icon')!;
    icon.replaceChildren(this.template(failed ? 'icon-fail' : 'icon-pass'));
    this.suite.el.classList.add(failed ? 'test-report--suite--failed' : 'test-report--suite--passed');
    // What failed is what one opens the report for: it comes open.
    this.suite.el.open = failed;
    this.suite = undefined;
  }

  runEnd(): void {
    this.setState(this.total.failed ? 'failed' : 'passed');
    const seconds = (performance.now() - this.startedAt) / 1000;
    this.root.querySelector('.test-report--duration')!.textContent = `${seconds.toFixed(1)} s`;
  }

  private item(state: 'pass' | 'fail' | 'error', message: string): HTMLElement {
    const li = document.createElement('li');
    li.className = `test-report--assertion test-report--assertion--${state}`;
    li.append(this.template(`icon-${state}`));
    const text = document.createElement('span');
    text.className = 'test-report--message';
    text.textContent = message;
    li.append(text);
    this.method?.list.append(li);

    if (state !== 'pass' && this.method) {
      this.method.failed = true;
    }

    return li;
  }

  private count(passed: boolean): void {
    const key = passed ? 'passed' : 'failed';
    this.total[key]++;

    if (this.suite) {
      this.suite.counts[key]++;
      this.updateSuiteCount();
    }

    this.root.querySelectorAll<HTMLElement>(`.test-report--total-${key} .marker--count`)
      .forEach((el) => {
        el.textContent = String(this.total[key]);
      });
  }

  private updateSuiteCount(): void {
    if (!this.suite) {
      return;
    }

    const { passed, failed } = this.suite.counts;
    this.suite.el.querySelector('.test-report--suite-count')!.textContent = `${passed} / ${passed + failed}`;
  }

  private setState(state: 'running' | 'passed' | 'failed'): void {
    this.root.dataset.state = state;
    this.root.querySelector('.test-report--state')?.replaceChildren(this.template(`state-${state}`));
  }

  private template(name: string): Node {
    const template = this.root.querySelector<HTMLTemplateElement>(`template[data-name="${name}"]`);

    return template ? template.content.cloneNode(true) : document.createTextNode('');
  }

  private label(key: string): string {
    return this.root.dataset[`label${key.charAt(0).toUpperCase()}${key.slice(1)}`] ?? key;
  }

  private static show(value: unknown): string {
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }

    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }
}
