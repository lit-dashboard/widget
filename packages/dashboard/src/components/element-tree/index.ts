/* eslint import/extensions: off */
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators/property.js';
import { customElement } from 'lit/decorators/custom-element.js';
import { WebbitConnector } from '@webbitjs/webbit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

type TreeNode = {
  node: HTMLElement,
  children: TreeNode[]
};

type TemplateResult = ReturnType<typeof html>;

export function getNodeTree(treeWalker: TreeWalker): TreeNode {
  const node: TreeNode = {
    node: treeWalker.currentNode as HTMLElement,
    children: [],
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
  render: (
    node: HTMLElement, renderedChildren: TemplateResult[], renderedLevel: number
  ) => TemplateResult,
  level: number,
): TemplateResult {
  const renderedContent = treeNode.children.map((child) => (
    renderTreeWalkerNode(child, render, level + 1)
  ));
  return render(treeNode.node, renderedContent, level);
}

function renderTreeWalker(
  treeWalker: TreeWalker,
  render: (node: HTMLElement, renderedChildren: TemplateResult[], level: number) => TemplateResult,
): TemplateResult {
  const rootTreeNode = getNodeTree(treeWalker);
  return renderTreeWalkerNode(rootTreeNode, render, 0);
}

@customElement('webbit-element-tree')
export class ElementTree extends LitElement {
  @property() webbitConnector?: WebbitConnector;

  @property() selectedElement?: HTMLElement;

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

  render(): ReturnType<typeof html> {
    // if (!this.webbitConnector) {
    //   return;
    // }

    const treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
    );

    return renderTreeWalker(treeWalker, (element, renderedChildren, level) => html`
      <details 
        style=${styleMap({ '--level': `${level}` })}
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
    `);
  }
}
