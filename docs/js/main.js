import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascriptLanguage } from '@codemirror/lang-javascript';

import { LSPClient, languageServerExtensions } from '@codemirror/lsp-client';

/**
 * @param {Worker} worker
 * @returns {import("@codemirror/lsp-client").Transport}
 */
function createWorkerTransport(worker) {
  const subscribers = new Set();
  worker.addEventListener('message', ({ data }) => {
    subscribers.forEach((subscriber) => {
      subscriber(JSON.stringify(data));
    });
  });
  return {
    send(message) {
      worker.postMessage(JSON.parse(message));
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
    },
    unsubscribe(subscriber) {
      subscribers.delete(subscriber);
    },
  };
}

const worker = new Worker('./js/worker.js', {
  type: 'module',
});

const transport = createWorkerTransport(worker);

const logHandlers = new Map([
  [1, (msg) => console.error(msg)],
  [2, (msg) => console.warn(msg)],
  [3, (msg) => console.info(msg)],
]);

const client = new LSPClient({
  extensions: languageServerExtensions(),
  notificationHandlers: {
    // Worker からの window/logMessage を受け取って console に流す
    'window/logMessage': (client, { type, message }) => {
      (logHandlers.get(type) ?? ((msg) => console.log(msg)))(message);
      return true;
    },
  },
}).connect(transport);

const editor = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [basicSetup, javascriptLanguage, client.plugin('file:///main.ts')],
  }),
  parent: document.body,
});
