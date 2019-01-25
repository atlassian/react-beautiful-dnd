// @flow
// $FlowFixMe - flow does not know what a SVGElement is
export default (doc: HTMLElement): SVGElement =>
  doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
