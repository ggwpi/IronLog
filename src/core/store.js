export function createStore(initialState) {
  let state = structuredClone(initialState);
  const listeners = new Set();

  const getState = () => state;

  const setState = (updater) => {
    const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    if (Object.is(next, state)) return;
    state = next;
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
