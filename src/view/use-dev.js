// @flow

export default function useDev(useHook: () => void) {
  // Don't run any validation in production
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHook();
  }
}
