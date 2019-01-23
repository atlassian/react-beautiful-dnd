// @flow
// $FlowFixMe - flow does not know what a SVGElement is
export default (doc: HTMLDocument): SVGElement =>
  doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
