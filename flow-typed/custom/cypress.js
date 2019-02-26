// There is currently no flowtype definition for cypress
// Currently just opting out of flow for the cy global
// https://github.com/cypress-io/cypress/issues/2732
// https://github.com/flow-typed/flow-typed/pull/3028
declare function cy(...any[]): any;
