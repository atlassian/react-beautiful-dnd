// @flow
export default (myMock: any) => myMock.mock.calls[myMock.mock.calls.length - 1];
