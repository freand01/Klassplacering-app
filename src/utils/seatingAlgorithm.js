import { ALGORITHM_CONSTANTS } from './constants';

export class SeatingOptimizer {
  constructor({ students, constraints, seatMap, plans, lockedIndices, rows, cols }) {
    this.students = students;
    this.constraints = constraints;
    this.seatMap = seatMap;
    this.plans = plans;
    this.lockedIndices = lockedIndices;
    this.rows = rows;
    this.cols = cols;
    this.validIndices = seatMap.map((isSeat, idx) => isSeat ? idx : -1).filter(idx => idx !== -1);
  }

  generateSeating() {
    // 1. Build history of past pairs
    const pastPairs = this.buildPastPairs();

    // 2. Prepare grid with locked students
    let grid = this.initializeGrid();
    let takenIndices = new Set();
    let pool = [...this.students];

    // 2a. Place locked students
    this.lockedIndices.forEach(idx => {
      if (this.seatMap[idx] && grid[idx]) {
        const studentId = grid[idx].id;
        const studentIndex = pool.findIndex(s => s.id === studentId);

        if (studentIndex !== -1) {
          takenIndices.add(idx);
          pool.splice(studentIndex, 1);
        }
      }
    });

    // Shuffle remaining pool
    pool = pool.sort(() => Math.random() - 0.5);

    // 3. Place students by priority
    grid = this.placeStudentsByPriority(grid, pool, takenIndices);

    // 4. Optimize
    grid = this.optimizeSeating(grid, pastPairs);

    return {
      grid,
      hardConflicts: this.countHardConflicts(grid)
    };
  }

  buildPastPairs() {
    const pastPairs = new Map();
    this.plans.forEach(plan => {
      const pCols = plan.cols;
      const layout = plan.layout;
      for (let i = 0; i < layout.length; i++) {
        if (!layout[i]) continue;
        if ((i % pCols) !== (pCols - 1)) {
          const neighbor = layout[i + 1];
          if (neighbor) {
            this.registerPair(pastPairs, layout[i].id, neighbor.id);
          }
        }
      }
    });
    return pastPairs;
  }

  initializeGrid() {
    return Array(this.rows * this.cols).fill(null);
  }

  placeStudentsByPriority(grid, pool, takenIndices) {
    const placeStudentAtFirstAvailable = (student, criteriaFn = () => true) => {
      const spot = this.validIndices.find(idx => !takenIndices.has(idx) && criteriaFn(idx));
      if (spot !== undefined) {
        grid[spot] = student;
        takenIndices.add(spot);
        return true;
      }
      return false;
    };

    // Priority 1: Front
    const frontGroup = pool.filter(s => s.needsFront);
    pool = pool.filter(s => !s.needsFront);
    frontGroup.forEach(student => {
      if (!placeStudentAtFirstAvailable(student, idx => Math.floor(idx / this.cols) === 0)) {
        placeStudentAtFirstAvailable(student);
      }
    });

    // Priority 2: Wall
    const wallGroup = pool.filter(s => s.needsWall);
    pool = pool.filter(s => !s.needsWall);
    wallGroup.forEach(student => {
      const isWall = (idx) => {
        const c = idx % this.cols;
        return c === 0 || c === this.cols - 1;
      };
      if (!placeStudentAtFirstAvailable(student, isWall)) {
        placeStudentAtFirstAvailable(student);
      }
    });

    // Priority 3: Rest
    pool.forEach(student => {
      placeStudentAtFirstAvailable(student);
    });

    return grid;
  }

  optimizeSeating(grid, pastPairs) {
    let bestGrid = [...grid];
    let bestScore = this.calculateScore(bestGrid, pastPairs);

    for (let i = 0; i < ALGORITHM_CONSTANTS.OPTIMIZATION_ITERATIONS; i++) {
      const r1 = Math.floor(Math.random() * this.validIndices.length);
      const r2 = Math.floor(Math.random() * this.validIndices.length);
      const idx1 = this.validIndices[r1];
      const idx2 = this.validIndices[r2];

      if (idx1 === idx2) continue;
      if (this.lockedIndices.has(idx1) || this.lockedIndices.has(idx2)) continue;

      const s1 = grid[idx1];
      const s2 = grid[idx2];

      const s1Valid = this.isValidPos(s1, idx2);
      const s2Valid = this.isValidPos(s2, idx1);

      if (s1Valid && s2Valid) {
        const tempGrid = [...grid];
        tempGrid[idx1] = s2;
        tempGrid[idx2] = s1;
        const score = this.calculateScore(tempGrid, pastPairs);

        if (score < bestScore || (score === bestScore && Math.random() < ALGORITHM_CONSTANTS.ACCEPTANCE_PROBABILITY)) {
          grid = tempGrid;
          bestScore = score;
          bestGrid = [...grid];
        }
      }
    }

    return bestGrid;
  }

  registerPair(map, id1, id2) {
    const key = [id1, id2].sort().join('-');
    map.set(key, (map.get(key) || 0) + 1);
  }

  isValidPos(student, index) {
    if (!student) return true;
    const r = Math.floor(index / this.cols);
    const c = index % this.cols;
    if (student.needsFront && r !== 0) return false;
    if (student.needsWall && c !== 0 && c !== this.cols - 1) return false;
    return true;
  }

  areNeighbors(idx1, idx2) {
    const r1 = Math.floor(idx1 / this.cols);
    const c1 = idx1 % this.cols;
    const r2 = Math.floor(idx2 / this.cols);
    const c2 = idx2 % this.cols;
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  }

  calculateScore(gridToCheck, pastPairs) {
    let score = 0;

    // Hard constraints
    this.constraints.forEach(c => {
      const idx1 = gridToCheck.findIndex(s => s?.id === c.student1);
      const idx2 = gridToCheck.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1) {
        const neighbors = this.areNeighbors(idx1, idx2);
        if (c.type === 'pair' && !neighbors) score += ALGORITHM_CONSTANTS.HARD_CONSTRAINT_PENALTY;
        if ((c.type === 'avoid' || !c.type) && neighbors) score += ALGORITHM_CONSTANTS.HARD_CONSTRAINT_PENALTY;
      }
    });

    // Soft preferences
    for (let i = 0; i < gridToCheck.length; i++) {
      if (!gridToCheck[i]) continue;
      const r = Math.floor(i / this.cols);
      const c = i % this.cols;

      // Prefer front rows
      score += r * ALGORITHM_CONSTANTS.ROW_PENALTY_MULTIPLIER;

      // Check isolation
      let neighborCount = 0;
      if (c < this.cols - 1 && this.seatMap[i + 1] && gridToCheck[i + 1]) neighborCount++;
      if (c > 0 && this.seatMap[i - 1] && gridToCheck[i - 1]) neighborCount++;
      if (r < this.rows - 1 && this.seatMap[i + this.cols] && gridToCheck[i + this.cols]) neighborCount++;
      if (r > 0 && this.seatMap[i - this.cols] && gridToCheck[i - this.cols]) neighborCount++;

      if (neighborCount === 0) score += ALGORITHM_CONSTANTS.ISOLATION_PENALTY;

      // History penalty
      if (c < this.cols - 1) {
        const neighborIdx = i + 1;
        if (this.seatMap[neighborIdx] && gridToCheck[neighborIdx]) {
          const key = [gridToCheck[i].id, gridToCheck[neighborIdx].id].sort().join('-');
          if (pastPairs.has(key)) score += ALGORITHM_CONSTANTS.HISTORY_PENALTY;
        }
      }
    }
    return score;
  }

  countHardConflicts(grid) {
    let count = 0;
    this.constraints.forEach(c => {
      const idx1 = grid.findIndex(s => s?.id === c.student1);
      const idx2 = grid.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1) {
        const neighbors = this.areNeighbors(idx1, idx2);
        if (c.type === 'pair' && !neighbors) count++;
        if ((c.type === 'avoid' || !c.type) && neighbors) count++;
      }
    });
    return count;
  }
}
