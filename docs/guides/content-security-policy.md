# Setting up Content Security Policy with react-beautiful-dnd

Content Security Policy (CSP) is a way of whitelisting what resources the browser should allow to load (and reach out to). There are many excellent resources on CSP for more information. [This explanation](https://helmetjs.github.io/docs/csp/) is a good place to start.

In general, you should start with `Content-Security-Policy: default-src 'self';` and enable things as needed from there.

In the case of JSS, we need to set the `style-src` CSP directive. We don't want to just set it to `unsafe-inline` which will allow everything.

The solution is to include a _nonce_ (number used once):

[MDN/CSP/style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src) notes the following:

> 'nonce-{base64-value}'
> A whitelist for specific inline scripts using a cryptographic nonce (number used once). **The server must generate a unique nonce value each time it transmits a policy. It is critical to provide an unguessable nonce, as bypassing a resource’s policy is otherwise trivial**. See [unsafe inline](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#Unsafe_inline_script) script for example.

Because the nonce must be generated to be unique and random for every request, this is not something that we can do at build time. Previously the docs suggested using the `__webpack_nonce__` variable with Webpack. However that is insecure because it never changes, so it could be trivially bypassed by an attacker, as noted in the Mozilla docs above.

To communicate the nonce value to react-beautiful-dnd, we're going use some basic templating with an express server.

1.  Create a ReactContext to provide the nonce throughout the application.

    ```js
    export const NonceContext = React.createContext('');

    export function StyleNonceProvider(props) {
      const getCSPNonce = () => {
        const element = document.getElementById('csp-nonce');
        if (element) return element.getAttribute('content') || '';
        return '';
      };

      const nonce = props.nonce || getCSPNonce();

      return (
        <NonceContext.Provider value={nonce}>
          {props.children}
        </NonceContext.Provider>
      );
    }
    ```

    Don't use this provider in production it is not save enough!

1.  Now use the previous provider to inject the nonce into the <DragDropContext>

    ```js
    export function App(props) {
      return (
        <NonceContext.Consumer>
          {nonce => (
            <DragDropContext {...props} nonce={nonce}>
              ...
            </DragDropContext>
          )}
        </NonceContext.Consumer>
      );
    }
    ```

    Of couse you can make this into a reusable component

## Inspired by JSS

Introduction and resources are gracefully copied from [JSS](https://cssinjs.org/csp/)

## Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet CSP configuration](https://helmetjs.github.io/docs/csp/)
- [Webpack nonce support PR](https://github.com/webpack/webpack/pull/3210)
- [JSS nonce support discussion](https://github.com/cssinjs/jss/issues/559)

[← Back to documentation](/README.md#documentation-)
