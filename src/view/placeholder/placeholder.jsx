// @flow
import React, { useState, useRef, useEffect } from 'react';
import type { Spacing } from 'css-box-model';
import type {
  Placeholder as PlaceholderType,
  InOutAnimationMode,
} from '../../types';
import { transitions } from '../../animation';
import { noSpacing } from '../../state/spacing';

export type PlaceholderStyle = {|
  display: string,
  boxSizing: 'border-box',
  width: number,
  height: number,
  marginTop: number,
  marginRight: number,
  marginBottom: number,
  marginLeft: number,
  flexShrink: '0',
  flexGrow: '0',
  pointerEvents: 'none',
  transition: string,
|};
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

type HelperArgs = {|
  isAnimatingOpenOnMount: boolean,
  placeholder: PlaceholderType,
  animate: InOutAnimationMode,
|};

const empty: Size = {
  width: 0,
  height: 0,
  margin: noSpacing,
};

const getSize = ({
  isAnimatingOpenOnMount,
  placeholder,
  animate,
}: HelperArgs): Size => {
  if (isAnimatingOpenOnMount) {
    return empty;
  }

  if (animate === 'close') {
    return empty;
  }

  return {
    height: placeholder.client.borderBox.height,
    width: placeholder.client.borderBox.width,
    margin: placeholder.client.margin,
  };
};

const getStyle = ({
  isAnimatingOpenOnMount,
  placeholder,
  animate,
}: HelperArgs): PlaceholderStyle => {
  const size: Size = getSize({ isAnimatingOpenOnMount, placeholder, animate });

  return {
    display: placeholder.display,
    // ## Recreating the box model
    // We created the borderBox and then apply the margins directly
    // this is to maintain any margin collapsing behaviour

    // creating borderBox
    // background: 'green',
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
};

const Placeholder = React.memo(function Placeholder(props: Props) {
  const mountTimer = useRef<?TimeoutID>(null);

  const [isAnimatingOpenOnMount, setIsAnimatingOpenOnMount] = useState<boolean>(
    props.animate === 'open',
  );

  useEffect(() => {
    const clear = () => {
      if (mountTimer.current) {
        clearTimeout(mountTimer.current);
        mountTimer.current = null;
      }
    };

    if (!isAnimatingOpenOnMount) {
      return clear;
    }

    mountTimer.current = setTimeout(() => {
      mountTimer.current = null;

      setIsAnimatingOpenOnMount(false);
    });

    return clear;
  }, [isAnimatingOpenOnMount]);

  const onTransitionEnd = (event: TransitionEvent) => {
    // We transition height, width and margin
    // each of those transitions will independently call this callback
    // Because they all have the same duration we can just respond to one of them
    // 'height' was chosen for no particular reason :D
    if (event.propertyName !== 'height') {
      return;
    }

    props.onTransitionEnd();

    if (props.animate === 'close') {
      props.onClose();
    }
  };

  const style: PlaceholderStyle = getStyle({
    isAnimatingOpenOnMount,
    animate: props.animate,
    placeholder: props.placeholder,
  });

  return React.createElement(props.placeholder.tagName, {
    style,
    onTransitionEnd,
    ref: props.innerRef,
  });
});

export default Placeholder;
