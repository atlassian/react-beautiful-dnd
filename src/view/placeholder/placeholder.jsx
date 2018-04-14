// @flow
import React, { PureComponent } from 'react';
import type { Placeholder as PlaceholderType } from '../../types';

type Props = {|
  placeholder: PlaceholderType,
|}

export default class Placeholder extends PureComponent<Props> {
  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const { borderBox, margin, display, tagName } = placeholder;

    const style = {
      display,
      // These are the computed borderBox width and height properties
      // at the time of a drag start
      // borderBox = content + padding + border
      width: borderBox.width,
      height: borderBox.height,
      // We apply the margin separately to maintain margin collapsing
      // behavior of the original element
      marginTop: margin.top,
      marginLeft: margin.left,
      marginBottom: margin.bottom,
      marginRight: margin.right,
      // Because we are not applying padding or borders we can use any box sizing we like
      // Using border-box to be super explicit
      boxSizing: 'border-box',
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

    return React.createElement(tagName, { style });
  }
}
