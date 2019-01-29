// @flow
import React, { PureComponent } from 'react';
import type { Spacing } from 'css-box-model';
import type {
  Placeholder as PlaceholderType,
  InOutAnimationMode,
} from '../../types';
import type { PlaceholderStyle } from './placeholder-types';

type Props = {|
  placeholder: PlaceholderType,
  animate: InOutAnimationMode,
  onClose: () => void,
  innerRef?: () => ?HTMLElement,
|};

type Size = {|
  width: number,
  height: number,
  // Need to animate in/out animation as well as size
  margin: Spacing,
|};

type State = {|
  size: Size,
|};

const noSpacing: Spacing = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const empty: Size = {
  width: 0,
  height: 0,
  margin: noSpacing,
};

const getSize = (placeholder: PlaceholderType): Size => ({
  height: placeholder.client.borderBox.height,
  width: placeholder.client.borderBox.width,
  margin: placeholder.client.margin,
});

export default class Placeholder extends PureComponent<Props, State> {
  state: State = {
    size:
      this.props.animate === 'show' ? empty : getSize(this.props.placeholder),
  };

  // updates after initial mount
  static getDerivedStateFromProps(props: Props): State {
    if (props.animate === 'close') {
      return empty;
    }

    return getSize(props.placeholder);
  }

  componentDidMount() {
    if (this.props.animate === 'show') {
      this.setState({
        size: getSize(this.props.placeholder),
      });
    }
  }

  onTransitionEnd = () => {
    console.warn('ON TRANSITION END');
    if (this.props.animate === 'close') {
      this.props.onClose();
    }
  };

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const size: Size = this.state.size;
    const { display, tagName } = placeholder;

    // The goal of the placeholder is to take up the same amount of space
    // as the original draggable
    const style: PlaceholderStyle = {
      display,
      // ## Recreating the box model
      // We created the borderBox and then apply the margins directly
      // this is to maintain any margin collapsing behaviour

      // creating borderBox
      boxSizing: 'border-box',
      width: size.width,
      height: size.height,
      // creating marginBox
      marginTop: size.margin.top,
      marginRight: size.margin.right,
      marginBottom: size.margin.bottom,
      marginLeft: size.margin.left,

      // ## Avoiding collapsing
      // Avoiding the collapsing or growing of this element when pushed by flex child siblings.
      // We have already taken a snapshot the current dimensions we do not want this element
      // to recalculate its dimensions
      // It is okay for these properties to be applied on elements that are not flex children
      flexShrink: '0',
      flexGrow: '0',
      // Just a little performance optimisation: avoiding the browser needing
      // to worry about pointer events for this element
      pointerEvents: 'none',

      transition: 'margin height 4s ease',
    };

    return React.createElement(tagName, {
      style,
      onTransitionEnd: this.onTransitionEnd,
      ref: this.props.innerRef,
    });
  }
}
