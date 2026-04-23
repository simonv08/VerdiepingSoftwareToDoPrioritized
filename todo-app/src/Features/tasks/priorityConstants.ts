/**
 * Priority scoring constants.
 * Adjust these values to tune the priority algorithm behavior.
 */

export const PRIORITY_CONSTANTS = {
  // Manual priority boost values
  manualPriority: {
    critical: 1200,
    high: 650,
    medium: 250,
    low: 80,
  },

  // Penalty scores
  penalties: {
    archived: -1_000_000,
    completed: -100_000,
  },

  // Repeat interval day multipliers
  repeatInterval: {
    weekly: 7,
    monthly: 30,
  },

  // Overdue scoring
  overdue: {
    baseMultiplier: 500,
    countMultiplier: 120,
  },

  // Due soon scoring
  dueSoon: {
    past: 1000,
    today: 600,
    within3Days: {
      baseScore: 400,
      dayPenalty: 80,
    },
    within7Days: {
      baseScore: 120,
      dayPenalty: 8,
    },
  },

  // Repeat interval urgency boost
  repeatUrgency: {
    boost: 200,
  },
}
