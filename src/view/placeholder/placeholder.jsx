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

// TODO: does this exist elsewhere?
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
  mountFrameId: ?AnimationFrameID = null;

  constructor(props: Props, context: mixed) {
    super(props, context);

    const state: State = {
      size:
        this.props.animate === 'open' ? empty : getSize(this.props.placeholder),
    };

    console.log('PLACEHOLDER: mount.', props.placeholderId, state);

    this.state = state;
  }

  // called before render() on initial mount and updates
  static getDerivedStateFromProps(props: Props, state: State): State {
    if (props.animate === 'close') {
      console.info('PLACEHOLDER: animating closed');
      return {
        size: empty,
      };
    }

    if(props.)

    return state;
  }

  componentDidMount() {
    if (this.props.animate !== 'open') {
      return;
    }

    // Ensuring there is one browser update with an empty size
    // .setState in componentDidMount will cause two react renders
    // but only a single browser update
    // https://reactjs.org/docs/react-component.html#componentdidmount
    this.mountFrameId = requestAnimationFrame(() => {
      this.mountFrameId = null;
      if (this.props.animate === 'open') {
        this.setState({
          size: getSize(this.props.placeholder),
        });
      }
    });
  }

  componentWillUnmount() {
    if (!this.mountFrameId) {
      return;
    }
    cancelAnimationFrame(this.mountFrameId);
    this.mountFrameId = null;
  }

  onTransitionEnd = () => {
    if (this.props.animate === 'close') {
      console.log('CLOSING');
      this.props.onClose();
    }
  };

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const size: Size = this.state.size;
    console.error(
      'Placeholder: render',
      this.props.placeholderId,
      size,
      this.props.animate,
    );
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

      transition: 'height 2s ease, margin 2s ease',
    };

    return React.createElement(tagName, {
      style,
      onTransitionEnd: this.onTransitionEnd,
      ref: this.props.innerRef,
    });
  }
}
