// @flow
import React, { PureComponent } from 'react';
import type { Spacing } from 'css-box-model';
import type {
  Placeholder as PlaceholderType,
  InOutAnimationMode,
} from '../../types';
import type { PlaceholderStyle } from './placeholder-types';
import { transitions, placeholderTransitionDelayTime } from '../animation';

type Props = {|
  placeholder: PlaceholderType,
  animate: InOutAnimationMode,
  onClose: () => void,
  innerRef?: () => ?HTMLElement,
  shouldDelayTransition: boolean,
  onTransitionEnd: () => void,
|};

type Size = {|
  width: number,
  height: number,
  // Need to animate in/out animation as well as size
  margin: Spacing,
|};

type State = {|
  shouldMountEmptyAndOpen: boolean,
  useEmpty: boolean,
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

  state: State = {
    shouldMountEmptyAndOpen: this.props.animate === 'open',
    useEmpty: this.props.animate === 'open',
  };

  // called before render() on initial mount and updates
  static getDerivedStateFromProps(props: Props, state: State): State {
    if (state.shouldMountEmptyAndOpen) {
      return state;
    }

    if (props.animate === 'close') {
      return {
        shouldMountEmptyAndOpen: false,
        useEmpty: true,
      };
    }

    return {
      shouldMountEmptyAndOpen: false,
      useEmpty: false,
    };
  }

  componentDidMount() {
    if (!this.state.shouldMountEmptyAndOpen) {
      return;
    }

    // Ensuring there is one browser update with an empty size
    // .setState in componentDidMount will cause two react renders
    // but only a single browser update
    // https://reactjs.org/docs/react-component.html#componentdidmount
    this.mountFrameId = requestAnimationFrame(() => {
      this.mountFrameId = null;
      if (this.state.shouldMountEmptyAndOpen) {
        this.setState({
          shouldMountEmptyAndOpen: false,
          useEmpty: false,
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
    console.log('PLACEHOLDER ANIMATION FINISHED');
    this.props.onTransitionEnd();

    if (this.props.animate === 'close') {
      console.log('CLOSED');
      this.props.onClose();
    }
  };

  render() {
    const placeholder: PlaceholderType = this.props.placeholder;
    const shouldDelayTransition: boolean = this.props.shouldDelayTransition;
    const size: Size = this.state.useEmpty ? empty : getSize(placeholder);
    const { display, tagName } = placeholder;

    // The goal of the placeholder is to take up the same amount of space
    // as the original draggable
    const style: PlaceholderStyle = {
      display,
      // ## Recreating the box model
      // We created the borderBox and then apply the margins directly
      // this is to maintain any margin collapsing behaviour

      // creating borderBox
      background: 'green',
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

      // Animate the placeholder size and margin
      transition: transitions.placeholder,

      // Conditionally put a delay on any transition
      // This is used on the Draggable placeholder so that it does not flicker
      // when quickly moving between drop targets
      transitionDelay: shouldDelayTransition
        ? `${placeholderTransitionDelayTime}s`
        : '0s',
    };

    return React.createElement(tagName, {
      style,
      onTransitionEnd: this.onTransitionEnd,
      ref: this.props.innerRef,
    });
  }
}
