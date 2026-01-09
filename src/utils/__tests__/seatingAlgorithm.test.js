import { describe, it, expect } from 'vitest';
import { SeatingOptimizer } from '../seatingAlgorithm';

describe('SeatingOptimizer', () => {
  const mockStudents = [
    { id: '1', name: 'Anna', needsFront: false, needsWall: false },
    { id: '2', name: 'Bertil', needsFront: true, needsWall: false },
    { id: '3', name: 'Cecilia', needsFront: false, needsWall: true }
  ];

  const mockSeatMap = [
    true, true, true,
    true, true, true,
    false, false, false
  ];

  const rows = 3;
  const cols = 3;

  it('should place students in available seats', () => {
    const optimizer = new SeatingOptimizer({
      students: mockStudents,
      constraints: [],
      seatMap: mockSeatMap,
      plans: [],
      lockedIndices: new Set(),
      rows,
      cols
    });

    const result = optimizer.generateSeating();

    expect(result.grid).toBeDefined();
    expect(result.grid.filter(s => s !== null).length).toBe(mockStudents.length);
  });

  it('should respect locked students', () => {
    const lockedStudent = mockStudents[0];
    const lockedIndex = 0;

    // Create a grid with locked student
    let initialGrid = Array(rows * cols).fill(null);
    initialGrid[lockedIndex] = lockedStudent;

    const optimizer = new SeatingOptimizer({
      students: mockStudents,
      constraints: [],
      seatMap: mockSeatMap,
      plans: [],
      lockedIndices: new Set([lockedIndex]),
      rows,
      cols
    });

    // Set the initial grid
    optimizer.initializeGrid = () => initialGrid;

    const result = optimizer.generateSeating();

    // The locked student should remain in place
    expect(result.grid[lockedIndex]).toEqual(lockedStudent);
  });

  it('should count hard conflicts correctly', () => {
    const constraints = [
      { student1: '1', student2: '2', type: 'avoid' }
    ];

    const optimizer = new SeatingOptimizer({
      students: mockStudents,
      constraints,
      seatMap: mockSeatMap,
      plans: [],
      lockedIndices: new Set(),
      rows,
      cols
    });

    // Create a grid where students 1 and 2 are neighbors
    const grid = Array(rows * cols).fill(null);
    grid[0] = mockStudents[0]; // Anna at index 0
    grid[1] = mockStudents[1]; // Bertil at index 1 (neighbors)

    const conflicts = optimizer.countHardConflicts(grid);

    expect(conflicts).toBe(1);
  });

  it('should identify neighbors correctly', () => {
    const optimizer = new SeatingOptimizer({
      students: mockStudents,
      constraints: [],
      seatMap: mockSeatMap,
      plans: [],
      lockedIndices: new Set(),
      rows,
      cols
    });

    // Horizontal neighbors
    expect(optimizer.areNeighbors(0, 1)).toBe(true);

    // Vertical neighbors
    expect(optimizer.areNeighbors(0, 3)).toBe(true);

    // Not neighbors
    expect(optimizer.areNeighbors(0, 2)).toBe(false);
    expect(optimizer.areNeighbors(0, 4)).toBe(false);
  });

  it('should validate student position based on preferences', () => {
    const optimizer = new SeatingOptimizer({
      students: mockStudents,
      constraints: [],
      seatMap: mockSeatMap,
      plans: [],
      lockedIndices: new Set(),
      rows,
      cols
    });

    const frontStudent = mockStudents[1]; // needsFront: true
    const wallStudent = mockStudents[2]; // needsWall: true

    // Front student should only be valid in row 0
    expect(optimizer.isValidPos(frontStudent, 0)).toBe(true); // row 0
    expect(optimizer.isValidPos(frontStudent, 3)).toBe(false); // row 1

    // Wall student should only be valid at edges (col 0 or col 2)
    expect(optimizer.isValidPos(wallStudent, 0)).toBe(true); // col 0
    expect(optimizer.isValidPos(wallStudent, 2)).toBe(true); // col 2
    expect(optimizer.isValidPos(wallStudent, 1)).toBe(false); // col 1 (middle)
  });
});
