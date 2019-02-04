// @flow
import React, { PureComponent } from 'react';
import type { Spacing } from 'css-box-model';
import type {
  Placeholder as PlaceholderType,
  InOutAnimationMode,
} from '../../types';
import type { PlaceholderStyle } from './placeholder-types';
import { transitions } from '../animation';
import { noSpacing } from '../../state/spacing';

type Props = {|
  placeholder: PlaceholderType,
  animate: InOutAnimationMode,
  onClose: () => void,
  innerRef?: () => ?HTMLElement,
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
  mountTimerId: ?TimeoutID = null;

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
    console.log('state', this.state);
    if (!this.state.shouldMountEmptyAndOpen) {
      return;
    }

    // Ensuring there is one browser update with an empty size
    // .setState in componentDidMount will cause two react renders
    // but only a single browser update
    // https://reactjs.org/docs/react-component.html#componentdidmount
    this.mountTimerId = setTimeout(() => {
      this.mountTimerId = null;
      if (this.state.shouldMountEmptyAndOpen) {
        this.setState({
          shouldMountEmptyAndOpen: false,
          useEmpty: false,
        });
      }
    });
  }

  componentWillUnmount() {
    if (!this.mountTimerId) {
      return;
    }
    clearTimeout(this.mountTimerId);
    this.mountTimerId = null;
  }

  onTransitionEnd = (event: TransitionEvent) => {
    // We transition height, width and margin
    // each of those transitions will independently call this callback
    // Because they all have the same duration we can just respond to one of them
    // 'height' was chosen for no particular reason :D
    if (event.propertyName !== 'height') {
      return;
    }

    console.log('PLACEHOLDER ANIMATION FINISHED');
    this.props.onTransitionEnd();

    if (this.props.animate === 'close') {
      console.log('CLOSED');
      this.props.onClose();
    }
  };

  render() {
    console.log('animate?', this.props.animate);
    const placeholder: PlaceholderType = this.props.placeholder;
    const size: Size = this.state.useEmpty ? empty : getSize(placeholder);
    console.log('size', size);
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
    };

    return React.createElement(tagName, {
      style,
      onTransitionEnd: this.onTransitionEnd,
      ref: this.props.innerRef,
    });
  }
}
