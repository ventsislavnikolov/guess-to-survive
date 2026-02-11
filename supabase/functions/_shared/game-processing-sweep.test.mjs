import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGameSweepTargets,
  shouldProcessGameStatus,
} from "./game-processing-sweep.mjs";

test("includes only pending/active games and resolves a round", () => {
  const targets = buildGameSweepTargets([
    {
      current_round: null,
      id: "g1",
      starting_round: 26,
      status: "pending",
    },
    {
      current_round: 27,
      id: "g2",
      starting_round: 26,
      status: "active",
    },
    {
      current_round: 27,
      id: "g3",
      starting_round: 26,
      status: "completed",
    },
    {
      current_round: null,
      id: "g4",
      starting_round: null,
      status: "active",
    },
  ]);

  assert.deepEqual(targets, [
    { gameId: "g1", round: 26 },
    { gameId: "g2", round: 27 },
  ]);
});

test("marks only pending and active statuses as processable", () => {
  assert.equal(shouldProcessGameStatus("pending"), true);
  assert.equal(shouldProcessGameStatus("active"), true);
  assert.equal(shouldProcessGameStatus("completed"), false);
  assert.equal(shouldProcessGameStatus("cancelled"), false);
});
