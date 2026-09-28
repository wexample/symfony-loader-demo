<?php

namespace Wexample\SymfonyLoaderTesting\Controller\Pages;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Wexample\SymfonyDesignSystem\Attribute\MenuItem;
use Wexample\SymfonyHelpers\Helper\VariableHelper;
use Wexample\SymfonyLoader\Controller\AbstractPagesController;
use Wexample\SymfonyLoader\Rendering\RenderPass;
use Wexample\SymfonyLoaderTesting\Traits\SymfonyLoaderTestingBundleClassTrait;

#[Route(path: 'loader/demo/', name: 'loader_demo_')]
final class DemoController extends AbstractPagesController
{
    use SymfonyLoaderTestingBundleClassTrait;

    final public const ROUTE_INDEX = VariableHelper::INDEX;

    private bool $useJs = true;

    #[MenuItem('loader_demo', 0)]
    #[Route(path: '', name: self::ROUTE_INDEX)]
    final public function index(): Response
    {
        return $this->renderPage(
            self::ROUTE_INDEX
        );
    }

    protected function configureRenderPass(
        RenderPass $renderPass
    ): RenderPass {
        $renderPass->setUseJs($this->useJs);

        return $renderPass;
    }
}
