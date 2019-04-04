// @flow
import { useLayoutEffect, useEffect } from 'react';

// https://github.com/reduxjs/react-redux/blob/v7-beta/src/components/connectAdvanced.js#L35
// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser. We need useLayoutEffect because we want
// `connect` to perform sync updates to a ref to save the latest props after
// a render is actually committed to the DOM.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
