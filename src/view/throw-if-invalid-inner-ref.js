// @flow
import invariant from 'tiny-invariant';

export default (ref: ?mixed) => {
  invariant(
    ref != null && ref instanceof HTMLElement,
    `
    provided.innerRef has not been provided with valid DOM ref.

    You can find a guide on using the innerRef callback functions at:
    https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/using-inner-ref.md
  `,
  );
};
