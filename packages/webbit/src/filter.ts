
type StringOrFalse = false | string;

type ElementConfig = {
  defaultSourceKey: StringOrFalse,
  defaultSourceProvider: StringOrFalse,
};

function isStringOrFalse(value: any): value is StringOrFalse {
  return value === false || typeof value === 'string';
}

function isElementConfig(config: object): config is ElementConfig {
  const { defaultSourceKey, defaultSourceProvider } = (config as ElementConfig);
  return isStringOrFalse(defaultSourceKey) && isStringOrFalse(defaultSourceProvider);
}

function getMatchingElementConfig(
  elementConfigs: Map<string, object>,
  element: HTMLElement
): object | undefined {
  const entry = [...elementConfigs.entries()]
    .find(([selector]) => element.matches(selector));
  return entry?.[1];
}

export function filterNode(node: Node, defaultSourceProvider: StringOrFalse, elementConfigs: Map<string, object>): number {
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
  defaultSourceProvider: StringOrFalse,
  elementConfigs: Map<string, object>
): (node: Node) => number {
  return function (node: Node): number {
    return filterNode(node, defaultSourceProvider, elementConfigs);
  };
}

export function getWebbitIterator(
  root: HTMLElement,
  defaultSourceProvider: StringOrFalse,
  elementConfigs: Map<string, object>
) {
  return document.createNodeIterator(
    root,
    NodeFilter.SHOW_ELEMENT,
    createNodeFilter(defaultSourceProvider, elementConfigs)
  );
}

export function getWebbitTreeWalker(
  root: HTMLElement,
  defaultSourceProvider: StringOrFalse,
  elementConfigs: Map<string, object>
) {
  return document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    createNodeFilter(defaultSourceProvider, elementConfigs),
  );
}
