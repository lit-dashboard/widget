import { WebbitConfig } from './element-config';

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
  if (typeof elementConfig === 'undefined') {
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
