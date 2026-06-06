import { createRoot, type Root } from 'react-dom/client';

import { VardiGameApp } from './components/VardiGameApp';

let vardiRoot: Root | null = null;
let mountedContainer: HTMLElement | null = null;

export function mountVardiGame(containerId: string, apiBaseUrl: string, authToken: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    unmountVardiGame();
    return;
  }

  if (!vardiRoot || mountedContainer !== container) {
    unmountVardiGame();
    vardiRoot = createRoot(container);
    mountedContainer = container;
  }

  vardiRoot.render(<VardiGameApp apiBaseUrl={apiBaseUrl} authToken={authToken} />);
}

export function unmountVardiGame() {
  if (vardiRoot) {
    vardiRoot.unmount();
  }
  vardiRoot = null;
  mountedContainer = null;
}
