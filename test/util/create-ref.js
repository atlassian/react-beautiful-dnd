// @flow
export default function createRef() {
  let ref: ?HTMLElement = null;

  const setRef = (supplied: ?HTMLElement) => {
    ref = supplied;
  };

  const getRef = (): ?HTMLElement => ref;

  return { ref, setRef, getRef };
}
