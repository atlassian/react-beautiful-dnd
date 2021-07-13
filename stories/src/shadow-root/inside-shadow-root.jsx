import createCache from '@emotion/cache';
import { Component, createContext } from 'react';
import * as ReactDOM from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

function BabelHTMLElement() {
  const newTarget = this.__proto__.constructor;
  return Reflect.construct(HTMLElement, [], newTarget);
}
Object.setPrototypeOf(BabelHTMLElement, HTMLElement);
Object.setPrototypeOf(BabelHTMLElement.prototype, HTMLElement.prototype);

export const ShadowRootContext = createContext(null);

class MyCustomElement extends BabelHTMLElement {
  constructor(component: Component) {
    super();
  }

  set content(c: Component) {
    this._content = c;
    this.updateComponent();
  }

  mountComponent() {
    if (!this.appContainer) {
      this.root = this.attachShadow({ mode: 'open' });
      this.appContainer = document.createElement('div');
      this.root.appendChild(this.appContainer);
    }

    if (this._content) {
      const myCache = createCache({
        // key: 'my-prefix-key',
        container: this.appContainer,
      });
      ReactDOM.render(
        <ShadowRootContext.Provider value={this.appContainer}>
          {this._content}
        </ShadowRootContext.Provider>,
        this.appContainer,
      );

      // needed for React versions before 17
      retargetEvents(this.root);
    }
  }

  unmountComponent() {
    if (this.appContainer) {
      ReactDOM.unmountComponentAtNode(this.appContainer);
    }
  }

  updateComponent() {
    this.unmountComponent();
    this.mountComponent();
  }

  connectedCallback() {
    this.mountComponent();
  }

  disconnectedCallback() {
    this.unmountComponent();
  }
}

!customElements.get('my-custom-element') &&
  customElements.define('my-custom-element', MyCustomElement);

class CompoundCustomElement extends BabelHTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.childComponent = document.createElement('my-custom-element');
    this.root.appendChild(this.childComponent);
  }
}

!customElements.get('compound-custom-element') &&
  customElements.define('compound-custom-element', CompoundCustomElement);

export function inShadowRoot(child: Component) {
  return (
    <my-custom-element
      ref={(node) => {
        if (node) {
          node.content = child;
        }
      }}
    ></my-custom-element>
  );
}

export function inNestedShadowRoot(child: Component) {
  return (
    <compound-custom-element
      ref={(node) => {
        if (node) {
          node.childComponent.content = child;
        }
      }}
    ></compound-custom-element>
  );
}
