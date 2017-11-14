// @flow
export default (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};
