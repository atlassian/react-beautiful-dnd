// @flow
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import type { Rect } from 'css-box-model';
import type { Placeholder as PlaceholderType } from '../../types';
import { styleContextKey } from '../context-keys';

type Props = {|
  placeholder: PlaceholderType,
|}

export default class Placeholder extends PureComponent<Props> {
  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [styleContextKey]: PropTypes.string.isRequired,
  }

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const { client, display, tagName, boxSizing } = placeholder;

    const size: Rect = boxSizing === 'border-box' ? client.borderBox : client.contentBox;

    const style = {
      display,
      boxSizing,
      // ContentBox
      width: size.width,
      height: size.height,
      // PaddingBox
      paddingTop: client.padding.top,
      paddingRight: client.padding.right,
      paddingBottom: client.padding.bottom,
      paddingLeft: client.padding.left,
      // BorderBox
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderTopWidth: client.border.top,
      borderRightWidth: client.border.right,
      borderBottomWidth: client.border.bottom,
      borderLeftWidth: client.border.left,
      // MarginBox
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

    return React.createElement(tagName, { style });
  }
}
