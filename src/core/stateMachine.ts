// src/core/stateMachine.ts

export interface StateNode<S extends string, E> {
  state: S;
  on: (event: E) => S | null;
}

export interface StateMachine<S extends string, E> {
  current: S;
  send(event: E): S;
  reset(initial: S): void;
}

export function createStateMachine<S extends string, E>(
  initial: S,
  nodes: Map<S, StateNode<S, E>>,
): StateMachine<S, E> {
  let current = initial;

  function send(event: E): S {
    const node = nodes.get(current);
    if (!node) return current;
    const next = node.on(event);
    if (!next) return current;
    current = next;
    return current;
  }

  function reset(initialState: S): void {
    current = initialState;
  }

  return {
    get current() {
      return current;
    },
    send,
    reset,
  };
}
