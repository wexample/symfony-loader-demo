<?php

namespace Wexample\SymfonyLoaderTesting\Controller\Pages;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Wexample\SymfonyDesignSystem\Attribute\MenuItem;
use Wexample\SymfonyHelpers\Helper\VariableHelper;
use Wexample\SymfonyLoader\Controller\AbstractPagesController;
use Wexample\SymfonyLoaderTesting\Traits\SymfonyLoaderTestingBundleClassTrait;

#[Route(path: 'loader/translations/', name: 'loader_translations_')]
final class TranslationsController extends AbstractPagesController
{
    use SymfonyLoaderTestingBundleClassTrait;

    final public const ROUTE_INDEX = VariableHelper::INDEX;

    #[MenuItem('loader_demo', 2)]
    #[Route(path: '', name: self::ROUTE_INDEX)]
    final public function index(): Response
    {
        return $this->renderPage(self::ROUTE_INDEX);
    }
}
