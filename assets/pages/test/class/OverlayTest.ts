import AbstractTest from "./AbstractTest";
import ModalComponent from '@wexample/symfony-design-system/components/modal/modal';
import Page from '@wexample/symfony-loader/js/Class/Page';

export default class OverlayTest extends AbstractTest {
  public getTestMethods() {
    return [
      this.testModalTakesAndGivesBackFocus,
      this.testModalInModal,
    ];
  }

  // A page loaded in a modal is focused once the modal is open — not while it
  // still fades in — and the page that asked for it is focused again once it
  // closes.
  async testModalTakesAndGivesBackFocus() {
    const layoutPage = this.app.layout.page;

    await this.fetchAdaptiveAjaxPage();

    const page = this.app.layout.pageFocused;
    const modal = page.parentRenderNode as ModalComponent;

    this.assertTrue(modal instanceof ModalComponent, 'The page is loaded in a modal');
    this.assertTrue(page !== layoutPage, 'The modal page is focused as soon as the request resolves');
    this.assertTrue(modal.el.classList.contains('is-open'), 'The modal is open as soon as the request resolves');
    this.assertEquals(modal.callerPage, layoutPage, 'The modal knows the page that opened it');

    await modal.close();

    this.assertEquals(this.app.layout.pageFocused, layoutPage, 'Closing gives the focus back to the page that opened it');
    // Closed with its animation, a modal is destroyed rather than hidden.
    this.assertFalse(
      !!modal.el?.isConnected && modal.el.classList.contains('is-open'),
      'The modal is no longer open in the document'
    );
  }

  // A modal opened from a modal page stacks on it, and closing them unwinds
  // the focus one level at a time.
  async testModalInModal() {
    const layoutPage = this.app.layout.page;

    await this.fetchAdaptiveAjaxPage();
    const firstPage = this.app.layout.pageFocused as Page;
    const firstModal = firstPage.parentRenderNode as ModalComponent;

    await this.fetchAdaptiveAjaxPage();
    const secondPage = this.app.layout.pageFocused as Page;
    const secondModal = secondPage.parentRenderNode as ModalComponent;

    this.assertTrue(secondPage !== firstPage, 'The second request opens a new page');
    this.assertTrue(secondModal !== firstModal, 'The second page has a modal of its own');
    this.assertEquals(secondModal.callerPage, firstPage, 'The second modal was opened by the first modal page');
    this.assertTrue(firstModal.el.classList.contains('is-open'), 'The first modal stays open beneath');

    await secondModal.close();

    this.assertEquals(this.app.layout.pageFocused, firstPage, 'Closing the second modal focuses the first modal page');
    this.assertTrue(firstModal.el.classList.contains('is-open'), 'The first modal is still open');

    await firstModal.close();

    this.assertEquals(this.app.layout.pageFocused, layoutPage, 'Closing the first modal focuses the layout page');
  }
}
