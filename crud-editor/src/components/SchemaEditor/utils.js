export const state2rs = value => ({ value, label: value });

export const rs2state = ({ value }) => value;

export const existingStates = transitions => transitions.reduce(
  (states, { from, to }) => [
    ...states,
    ...[from, to].filter(name => states.indexOf(name) === -1)
  ], []
).filter(Boolean)