## Installation

### Enable services + routes

Make sure the bundle loads its services config so controllers are registered (required by `TemplateBasedRoutes`).

Routes import in the app:

```yaml
symfony_loader_testing:
    resource: '@WexampleSymfonyLoaderTestingBundle/Resources/config/routes.yaml'
```

### Front paths for templates

The bundle must implement `LoaderBundleInterface` and expose `getLoaderFrontPaths()` so the `@WexampleSymfonyLoaderTestingBundle` namespace is registered.
