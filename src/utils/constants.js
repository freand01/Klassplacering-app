// Storage
export const STORAGE_KEY = 'classroom_seating_data_v7';

// Grid defaults
export const DEFAULT_ROWS = 10;
export const DEFAULT_COLS = 12;

// Algorithm constants
export const ALGORITHM_CONSTANTS = {
  OPTIMIZATION_ITERATIONS: 3000,
  HARD_CONSTRAINT_PENALTY: 5000,
  ISOLATION_PENALTY: 500,
  HISTORY_PENALTY: 50,
  ROW_PENALTY_MULTIPLIER: 20,
  ACCEPTANCE_PROBABILITY: 0.05
};

// Design brush types
export const DESIGN_BRUSH_TYPES = {
  SINGLE: 'single',
  PAIR: 'pair',
  GROUP_4: 'group4',
  GROUP_5: 'group5',
  GROUP_6: 'group6',
  ERASER: 'eraser'
};

// Constraint types
export const CONSTRAINT_TYPES = {
  AVOID: 'avoid',
  PAIR: 'pair'
};

// Tab IDs
export const TAB_IDS = {
  STUDENTS: 'students',
  CONSTRAINTS: 'constraints',
  LAYOUT: 'layout',
  HISTORY: 'history'
};
