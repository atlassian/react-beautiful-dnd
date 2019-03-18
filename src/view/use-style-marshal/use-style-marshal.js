// @flow
import { useRef, useCallback, useEffect, useMemo } from 'react';
import invariant from 'tiny-invariant';
import memoizeOne from 'memoize-one';
import getStyles, { type Styles } from './get-styles';
import { prefix } from '../data-attributes';
import type { StyleMarshal } from './style-marshal-types';
import type { DropReason } from '../../types';

const getHead = (): HTMLHeadElement => {
  const head: ?HTMLHeadElement = document.querySelector('head');
  invariant(head, 'Cannot find the head to append a style to');
  return head;
};

const createStyleEl = (): HTMLStyleElement => {
  const el: HTMLStyleElement = document.createElement('style');
  el.type = 'text/css';
  return el;
};

export default function useStyleMarshal(uniqueId: number) {
  const uniqueContext: string = useMemo(() => `${uniqueId}`, [uniqueId]);
  const styles: Styles = useMemo(() => getStyles(uniqueContext), [
    uniqueContext,
  ]);
  const alwaysRef = useRef<?HTMLStyleElement>(null);
  const dynamicRef = useRef<?HTMLStyleElement>(null);

  // TODO: need to check if the memoize one is working
  const setDynamicStyle = useCallback(
    // Using memoizeOne to prevent frequent updates to textContext
    memoizeOne((proposed: string) => {
      const el: ?HTMLStyleElement = dynamicRef.current;
      invariant(el, 'Cannot set dynamic style element if it is not set');
      el.textContent = proposed;
    }),
    [],
  );

  const setAlwaysStyle = useCallback((proposed: string) => {
    const el: ?HTMLStyleElement = alwaysRef.current;
    invariant(el, 'Cannot set dynamic style element if it is not set');
    el.textContent = proposed;
  }, []);

  useEffect(() => {
    invariant(
      !alwaysRef.current && !dynamicRef.current,
      'style elements already mounted',
    );

    const always: HTMLStyleElement = createStyleEl();
    const dynamic: HTMLStyleElement = createStyleEl();

    // store their refs
    alwaysRef.current = always;
    dynamicRef.current = dynamic;

    // for easy identification
    always.setAttribute(`${prefix}-always`, uniqueContext);
    dynamic.setAttribute(`${prefix}-dynamic`, uniqueContext);

    // add style tags to head
    getHead().appendChild(always);
    getHead().appendChild(dynamic);

    // set initial style
    setAlwaysStyle(styles.always);
    setDynamicStyle(styles.resting);

    return () => {
      const remove = ref => {
        const current: ?HTMLStyleElement = ref.current;
        invariant(current, 'Cannot unmount ref as it is not set');
        getHead().removeChild(current);
        ref.current = null;
      };

      remove(alwaysRef);
      remove(dynamicRef);
    };
  }, [
    setAlwaysStyle,
    setDynamicStyle,
    styles.always,
    styles.resting,
    uniqueContext,
  ]);

  const dragging = useCallback(() => setDynamicStyle(styles.dragging), [
    setDynamicStyle,
    styles.dragging,
  ]);
  const dropping = useCallback(
    (reason: DropReason) => {
      if (reason === 'DROP') {
        setDynamicStyle(styles.dropAnimating);
        return;
      }
      setDynamicStyle(styles.userCancel);
    },
    [setDynamicStyle, styles.dropAnimating, styles.userCancel],
  );
  const resting = useCallback(() => setDynamicStyle(styles.resting), [
    setDynamicStyle,
    styles.resting,
  ]);

  const marshal: StyleMarshal = useMemo(
    () => ({
      dragging,
      dropping,
      resting,
      styleContext: uniqueContext,
    }),
    [dragging, dropping, resting, uniqueContext],
  );

  return marshal;
}
