// @flow

export default (message: string) => `
  ${message.trim()}

  👷‍ This is a development only message. It will be removed in production builds.
`;
