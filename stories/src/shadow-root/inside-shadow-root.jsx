// @flow
import React, { Component, createContext } from 'react';
import * as ReactDOM from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

export const ShadowRootContext = createContext(null);

class MyCustomElement extends HTMLElement {
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

customElements.define('my-custom-element', MyCustomElement);

class CompoundCustomElement extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.childComponent = document.createElement('my-custom-element');
    this.root.appendChild(this.childComponent);
  }
}

customElements.define('compound-custom-element', CompoundCustomElement);

export function inShadowRoot(child: Component) {
  return (
    <my-custom-element
      ref={(node) => {
        if (node) {
          node.content = child;
        }
      }}
    />
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
    />
  );
}
