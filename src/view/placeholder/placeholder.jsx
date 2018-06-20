// @flow
import React, { PureComponent } from 'react';
import type { Placeholder as PlaceholderType } from '../../types';

type Props = {|
  placeholder: PlaceholderType,
|}

export default class Placeholder extends PureComponent<Props> {
  // eslint-disable-next-line react/sort-comp
  ref: ?HTMLElement = null

  show = () => {
    if (!this.ref) {
      return;
    }
    this.ref.style.display = this.props.placeholder.display;
  }

  hide = () => {
    if (!this.ref) {
      return;
    }
    this.ref.style.display = 'none';
  }

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const { client, display, tagName } = placeholder;

    const style = {
      display,
      boxSizing: 'border-box',
      width: client.borderBox.width,
      height: client.borderBox.height,
      marginTop: client.margin.top,
      marginRight: client.margin.right,
      marginBottom: client.margin.bottom,
      marginLeft: client.margin.left,

      // Avoiding the collapsing or growing of this element when pushed by flex child siblings.
      // We have already taken a snapshot the current dimensions we do not want this element
      // to recalculate its dimensions
      // It is okay for these properties to be applied on elements that are not flex children
      flexShrink: '0',
      flexGrow: '0',
      // Just a little performance optimisation: avoiding the browser needing
      // to worry about pointer events for this element
      pointerEvents: 'none',
    };

    return React.createElement(tagName, {
      style,
      ref: this.setRef,
    });
  }
}
