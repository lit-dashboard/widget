import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebbitConnector } from '@webbitjs/webbit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';


type TreeNode = {
  node: HTMLElement,
  children: TreeNode[]
};

export function getNodeTree(treeWalker: TreeWalker): TreeNode {
  const node: TreeNode = {
    node: treeWalker.currentNode as HTMLElement,
    children: []
  };
  const firstChild = treeWalker.firstChild();
  if (!firstChild) {
    return node;
  }
  while (treeWalker.nextSibling()) {
    node.children.push(getNodeTree(treeWalker));
  }
  treeWalker.parentNode();
  return node;
}

function renderTreeWalkerNode(
  treeNode: TreeNode, 
  render: (node: HTMLElement, renderedChildren: any[], level: number) => any,
  level: number,
): any {
  const renderedContent = treeNode.children.map(child => {
    return renderTreeWalkerNode(child, render, level + 1);
  });
  return render(treeNode.node, renderedContent, level);
}

function renderTreeWalker(
  treeWalker: TreeWalker, 
  render: (node: HTMLElement, renderedChildren: any[], level: number) => any,
): any {
  const rootTreeNode = getNodeTree(treeWalker);
  return renderTreeWalkerNode(rootTreeNode, render, 0);
}

@customElement('webbit-element-tree')
export class ElementTree extends LitElement {

  @property() webbitConnector?: WebbitConnector;
  @property() private selectedElement?: HTMLElement;

  static styles = css`
    :host {
      font-family: sans-serif;
      font-size: 16px;
    }

    summary div {
      height: 25px;
      display: inline-flex;
      align-items: center;
      cursor: default;
    }

    details > summary {
      padding-left: calc(5px + 15px * var(--level));
    }

    .childless > summary {
      list-style: none;
    }

    details.selected > summary {
      background-color: #ddd;
    }

    details:not(.selected) > summary:hover button {
      display: inline-block;
    }

    button {
      display: none;
      border-radius: 10px;
      background-color: lightblue;
      border: none;
      margin-left: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    
  `;

  constructor() {
    super();
  }



  render() {
    // if (!this.webbitConnector) {
    //   return;
    // }

    const treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    return renderTreeWalker(treeWalker, (element, renderedChildren, level) => {
      return html`
        <details 
          style=${styleMap({
            '--level': `${level}`,
          })}
          class=${classMap({ 
            childless: renderedChildren.length === 0,
            selected: this.selectedElement === element,
          })}
        >
          <summary>
            <div>
              ${element.nodeName.toLowerCase()}
              <button
                @click=${() => {
                  this.selectedElement = element;
                }}
              >
                Select
              </button>
            </div>
          </summary>
          ${renderedChildren}
        </details>
      `;
    });
  }
}

