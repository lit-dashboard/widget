import { WebbitConfig } from './element-config';

type StringOrFalse = false | string;

type ElementConfig = {
  defaultSourceKey: StringOrFalse,
  defaultSourceProvider: StringOrFalse,
};

function isStringOrFalse(value: unknown): value is StringOrFalse {
  return value === false || typeof value === 'string';
}

function isElementConfig(config: Record<string, unknown>): config is ElementConfig {
  const { defaultSourceKey, defaultSourceProvider } = (config as ElementConfig);
  return isStringOrFalse(defaultSourceKey) && (typeof defaultSourceProvider === 'string' || typeof defaultSourceProvider === 'undefined');
}

function getMatchingElementConfig(
  elementConfigs: Map<string, WebbitConfig>,
  element: HTMLElement,
): WebbitConfig | undefined {
  const entry = [...elementConfigs.entries()]
    .find(([selector]) => element.matches(selector));
  return entry?.[1];
}

export function filterNode(
  node: Node,
  defaultSourceProvider: string | undefined,
  elementConfigs: Map<string, WebbitConfig>,
): number {
  const element = node as HTMLElement;

  const elementConfig = getMatchingElementConfig(elementConfigs, element);

  // Skip if there's no valid element config
  if (
    typeof elementConfig === 'undefined'
    || !isElementConfig(elementConfig)
  ) {
    return NodeFilter.FILTER_SKIP;
  }

  // Skip if the element does not have a source provider
  if (
    !element.hasAttribute('source-provider')
    && typeof elementConfig.defaultSourceProvider === 'undefined'
    && typeof defaultSourceProvider === 'undefined'
  ) {
    return NodeFilter.FILTER_SKIP;
  }

  // Skip if the element does not have a source key
  if (
    !element.hasAttribute('source-key')
    && typeof elementConfig.defaultSourceKey === 'undefined'
  ) {
    return NodeFilter.FILTER_SKIP;
  }

  return NodeFilter.FILTER_ACCEPT;
}

function createNodeFilter(
  defaultSourceProvider: string | undefined,
  elementConfigs: Map<string, WebbitConfig>,
): (node: Node) => number {
  return (node: Node): number => (
    filterNode(node, defaultSourceProvider, elementConfigs)
  );
}

export function getWebbitIterator(
  root: HTMLElement,
  defaultSourceProvider: string | undefined,
  elementConfigs: Map<string, WebbitConfig>,
): NodeIterator {
  return document.createNodeIterator(
    root,
    NodeFilter.SHOW_ELEMENT,
    createNodeFilter(defaultSourceProvider, elementConfigs),
  );
}

export function getWebbitTreeWalker(
  root: HTMLElement,
  defaultSourceProvider: string | undefined,
  elementConfigs: Map<string, WebbitConfig>,
): TreeWalker {
  return document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    createNodeFilter(defaultSourceProvider, elementConfigs),
  );
}
