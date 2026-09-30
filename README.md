# symfony_loader_demo

Version: 6.0.1

`wexample/symfony-loader-testing` is a Symfony bundle that ships the fixture pages used to exercise `wexample/symfony-loader` and `wexample/symfony-design-system` in a real browser: layouts, components, Vue views, translations and responsive stylesheets, served by three controllers mounted under `_loader/test/`, `_loader/demo/` and `_loader/translations/`. Loading the test index runs the suite client-side — assets/pages/test/index.ts hands a list of test classes to `TestManagerPage.runTests()`, which reports each assertion in the console — so adaptive rendering, routing, usages, overlays or the no-JS fallback are checked against a rendered page rather than a mock.

It is meant for people working on the loader stack itself, not for application code: install it in a development Symfony app when you need to see what the renderer actually produces.

## Table of Contents

- [Architecture](#architecture)
- [Integration in the Suite](#integration-in-the-suite)
- [Dependencies](#dependencies)
- [Versioning & Compatibility Policy](#versioning--compatibility-policy)
- [License](#license)
- [About us](#about-us)
- [Migration Notes](#migration-notes)

## Architecture

The bundle is two halves of very unequal weight. `src/` holds six PHP classes — a bundle, an extension, a trait and three controllers — and does little more than expose routes and hand a template path to the loader. `assets/` holds what is actually under test: layouts, pages, components, Vue views, stylesheets and translation files whose *filenames* the loader is supposed to discover on its own, plus the TypeScript classes that assert it did. There is no PHP test suite and no bundler config here; assertions run in a browser when you open a page.

### The bundle registers assets and routes, nothing else

src/WexampleSymfonyLoaderTestingBundle.php implements `LoaderBundleInterface` and returns one front path:

```php
BundleHelper::getBundleCssAlias(static::class) => __DIR__.'/../assets/',
```

That line is what makes `@WexampleSymfonyLoaderTestingBundle/pages/test/index` resolve into `assets/`. Every template reference in the fixtures goes through this alias, so moving `assets/` breaks all of them at once.

src/DependencyInjection/WexampleSymfonyLoaderTestingExtension.php calls `$this->loadConfig(__DIR__, $container)`, which picks up src/Resources/config/services.yaml — the `Controller/` directory, autowired and tagged `controller.service_arguments`. src/Resources/config/routes.yaml then declares two route sources, not one:

```yaml
loader_testing_controllers:
    resource: '../../Controller/'
    type: attribute

template_routes:
    resource: .
    type: template_based_routes
```

The second loader, `template_based_routes`, comes from `wexample/symfony-loader`: routes derived from templates rather than from a controller method. It is the reason the services config has to be loaded for routing to work at all.

### Two controllers, two prefixes

| Controller | Prefix | Purpose |
| --- | --- | --- |
| src/Controller/Pages/TestController.php | `_loader/test/` | the suite: `index`, `adaptive`, `view`, `error-missing-view` |
| src/Controller/Pages/DemoController.php | `_loader/demo/` | a documented showcase of the component-init variants |

Both extend `AbstractPagesController` and `use SymfonyLoaderTestingBundleClassTrait`, whose entire body is:

```php
public static function getBundleClassName(): string
{
    return WexampleSymfonyLoaderTestingBundle::class;
}
```

so `renderPage()` looks for views under this bundle rather than under the host application.

Both ways of configuring a render pass are exercised on purpose. `DemoController` overrides the hook, `protected function configureRenderPass(RenderPass $renderPass): RenderPass`, and sets `$renderPass->setUseJs($this->useJs)` there. `TestController::index()` builds the pass by hand instead, with `$this->createRenderPass($this->buildControllerTemplatePath(self::ROUTE_INDEX))`, then passes it as `renderPage(self::ROUTE_INDEX, renderPass: $renderPass)`. `adaptive()` turns a rendering mode into a query parameter — `if ($request->get('no-js')) { $renderPass->setUseJs(false); }` — and `errorMissingVue()` deliberately renders a route whose template does not exist: the missing-view error is a fixture like any other.

### The asset tree is the fixture

Files are grouped by render node, not by extension. A node named `x` in a directory owns `x.html.twig`, `x.ts`, `x.scss` and `x.en.yml` / `x.fr.yml`, and the loader finds them by name alone. The suffix conventions are themselves the thing being tested:

- responsive variants — assets/pages/test/index-xs.scss through `index-xxl.scss`, each colouring one `.test-responsive-<size>` block green, and `index-xs.ts` … `index-xxl.ts`, each a `PageResponsiveDisplay` incrementing `this.page.vars.responsiveSizesCounters.xs` on enter;
- usage variants — assets/layouts/demo/layout.color-scheme.dark.scss and `layout.color-scheme.light.scss`: the layout ships one file per value of an axis, and the loader picks the one the current usage names. Only the colour scheme is exercised here; the other axes are left to the design system, which declares real values for them.
- Vue views come in pairs — assets/vue/test-vue.vue for the `<script>` (props, data, `components`) and assets/vue/test-vue.vue.twig for the template, where server rendering and Vue bindings mix through the `vue_key` filter.

Two layouts sit above the pages. `layouts/test/layout.html.twig` extends `layouts/demo/layout.html.twig`, which extends `'@front/layouts/private/layout.html.twig'` — supplied by the host application. The bundle cannot render anything on its own; it needs a Symfony app providing `@front`.

Shared client classes live in assets/js/Class/TestApp.ts, `UnitTest.ts`, `TestManagerPage.ts` and `TestComponent.ts`. Fixtures reach them either relatively (`import UnitTest from '../../../js/Class/UnitTest'`) or through the npm name (`import TestComponent from '@wexample/symfony-loader-testing/js/Class/TestComponent'`) — the same directory, resolved by the consuming application's build, since nothing here compiles assets.

### What a request to `_loader/test/` does

1. `TestController::index()` creates the render pass, sets the `demo` fonts usage, and returns `renderPage('index')`.
2. The loader resolves `@WexampleSymfonyLoaderTestingBundle/pages/test/index.html.twig`, which extends the test layout, which extends the demo layout, which extends the host app's `@front` layout.
3. The `layout_config` and `page_config` blocks push state to the client: `var_export` for variables (`initialPageVar`, `demoVariableInteger`, `demoVariableObject`) and `trans_js` for translations, including the wildcard form `'@page::firstGroup.*'`.
4. `page_body` renders the component fixture with `component(render_pass, '@WexampleSymfonyLoaderTestingBundle/components/test-component', {testOption:true})` and leaves `<div id="test-playground"></div>` empty for tests to inject into.
5. The layout entry point assets/layouts/test/layout.ts sets `window["TEST_LAYOUT_ENTRYPOINT_LOADED"] = true;` and exports `new App()`, where `App` is `TestApp` — a loader `App` with `VueService` appended to `getServices()`.
6. The page entry point assets/pages/test/index.ts extends `TestManagerPage`; its `pageReady()` awaits `this.runTests({ AdaptiveRenderingTest, AppTest, … VueTest })`.

### The client-side runner

assets/js/Class/TestManagerPage.ts is twenty lines: for each value of the object it receives it does `new testDefinition(this.app)`, calls `test.init()`, then awaits every method returned by `test.getTestMethods()`. Order is the declaration order in the object literal passed from `index.ts`, and registering a new test class means adding it there.

assets/js/Class/UnitTest.ts is the assertion base, extending the loader's `AppChild` so `this.app` is available. It offers `assertEquals`, `assertTrue`, `assertFalse`, and reports to the console with coloured `%c Success ` / `%c Fail ` labels. A failed assertion is fatal by default and does `throw new Error('UNIT TEST ERROR')`, which aborts the whole run at that point — there is no aggregated report, the console is the output.

assets/pages/test/class/AbstractTest.ts sits between `UnitTest` and the concrete tests and supplies the pivot most of them turn on: two ways to load the same route. `fetchAdaptiveAjaxPage()` goes through `this.app.services.adaptive.get(path)` and yields a `LayoutInterface` of render data; `fetchAdaptiveHtmlPage()` uses plain `fetch` to fake a non-AJAX request and yields an HTML document. Its `init()` resolves the route client-side, `this.app.services.routing.path('_loader_test_adaptive')`.

`AdaptiveRenderingTest` is by far the largest of the concrete tests and the one to read first: it walks a page loaded into a modal, checking `pageFocused.view`, the modal's parent chain, page and layout variables, computed colours, component and Vue translations, then `await modal.close()`. `VariablesTest`, `TranslationTest`, `LayoutTest`, `NoJsTest`, `RoutingTest`, `VueTest`, `AppTest` and `TestTest` each cover one axis in a few dozen lines. `ResponsiveTest` is the exception in shape — it drives `responsiveSet()` across every breakpoint and reads `getComputedStyle` — and in state: only `this.testModale` is registered, `testDefault` and `testDisplays` are commented out. `HelperTest`, `IconTest`, `OverlayTest`, `ModalInModalTest` and `UsageTest` are registered but return an empty `getTestMethods()`.

### Expected values live in the fixtures

Nothing is mocked, so an assertion's expected value is a literal placed in a template or a translation file. `assets/layouts/test/layout.en.yml` maps `string.client_side` to `CLIENT_SIDE_LAYOUT_TRANSLATION`, which is exactly what `TranslationTest` compares against; `adaptive.en.yml` sets `page_title: ADAPTIVE_PAGE_TITLE`, read back from the modal header; `adaptive.html.twig` emits `NO_JS_TEXT` under `{% if not render_pass.useJs %}`, which is all `NoJsTest` looks for. The same holds for colours: the responsive and adaptive stylesheets apply green, and tests assert the string `'rgb(0, 128, 0)'`. Changing a fixture string, a colour or a filename is changing a test.

## Integration in the Suite

This package is part of the Wexample Suite — a collection of high-quality, modular tools designed to work seamlessly together across multiple languages and environments.

### Related Packages

The suite includes packages for configuration management, file handling, prompts, and more. Each package can be used independently or as part of the integrated suite.

Visit the [Wexample Suite documentation](https://docs.wexample.com) for the complete package ecosystem.

## Dependencies

- php: >=8.5
- wexample/symfony-loader: >=15.0.0
- wexample/symfony-design-system: >=23.0.0

## Versioning & Compatibility Policy

Wexample packages follow **Semantic Versioning** (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

We maintain backward compatibility within major versions and provide clear migration guides for breaking changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Free to use in both personal and commercial projects.

## About us

[Wexample](https://wexample.com) stands as a cornerstone of the digital ecosystem — a collective of seasoned engineers, researchers, and creators driven by a relentless pursuit of technological excellence. More than a media platform, it has grown into a vibrant community where innovation meets craftsmanship, and where every line of code reflects a commitment to clarity, durability, and shared intelligence.

This packages suite embodies this spirit. Trusted by professionals and enthusiasts alike, it delivers a consistent, high-quality foundation for modern development — open, elegant, and battle-tested. Its reputation is built on years of collaboration, refinement, and rigorous attention to detail, making it a natural choice for those who demand both robustness and beauty in their tools.

Wexample cultivates a culture of mastery. Each package, each contribution carries the mark of a community that values precision, ethics, and innovation — a community proud to shape the future of digital craftsmanship.

## Migration Notes

When upgrading between major versions, refer to the migration guides in the documentation.

Breaking changes are clearly documented with upgrade paths and examples.
