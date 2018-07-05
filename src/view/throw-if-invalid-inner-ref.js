// @flow
import invariant from 'tiny-invariant';

export default (ref: ?mixed) => {
  if (process.env.NODE_ENV !== 'production') {
    // $FlowFixMe - flow does not support SVGElement
    if (ref instanceof SVGElement) {
      console.error(`
        A ref passed to provided.innerRef cannot be an SVGElement
        for accessability and cross browser support

        More information: https://github.com/atlassian/react-beautiful-dnd/tree/master/docs/guides/using-svgs.md
      `);
    }
  }

  invariant(
    ref && ref instanceof HTMLElement,
    `
    provided.innerRef has not been provided with a HTMLElement.

    You can find a guide on using the innerRef callback functions at:
    https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/using-inner-ref.md
  `,
  );
};
