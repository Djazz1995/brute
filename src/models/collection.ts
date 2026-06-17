/** User-named goal grouping. See AGENTS.md §4.1 (Collection vs category). */

/**
 * A user-named ambition that groups goals (e.g. "Getting fit", "Run a
 * marathon"). Distinct from `GoalCategory`, which sets roast tone — a goal
 * has one category and an optional collection.
 */
export type Collection = {
  id: string;
  name: string;
  /** Optional accent color (hex) for grouping headers. */
  color?: string;
};
