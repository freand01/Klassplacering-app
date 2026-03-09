import { ALGORITHM_CONSTANTS } from './constants';

export class SeatingOptimizer {
  constructor({ students, constraints, desks, lockedDesks, plans }) {
    this.students = students;
    this.constraints = constraints;
    // Djupkopiera bänkarna så att vi inte ändrar tillståndet (state) direkt under uträkningen
    this.desks = JSON.parse(JSON.stringify(desks)); 
    this.lockedDesks = new Set(lockedDesks || []);
    this.plans = plans || [];

    this.analyzeClassroom();
  }

  // Räknar ut vilka bänkar som är fram, vid vägg, etc. baserat på deras placering i rummet
  analyzeClassroom() {
    let minX = Infinity, maxX = -Infinity, minY = Infinity;
    
    this.desks.forEach(desk => {
      if (desk.x < minX) minX = desk.x;
      if (desk.x + desk.width > maxX) maxX = desk.x + desk.width;
      if (desk.y < minY) minY = desk.y;
    });

    this.frontDeskIds = new Set();
    this.wallDeskIds = new Set();
    this.soloDeskIds = new Set();

    this.desks.forEach(desk => {
      // Längst fram: Inom 180 pixlar från den bänk som är närmast tavlan
      if (desk.y <= minY + 180) this.frontDeskIds.add(desk.id);
      
      // Vid vägg: Inom 180 pixlar från rummets vänstra eller högra bänk-ytterkant
      if (desk.x <= minX + 180 || (desk.x + desk.width) >= maxX - 180) {
        this.wallDeskIds.add(desk.id);
      }

      // Ensam: Kapaciteten på möbeln är 1 (Singelbänk)
      if (desk.capacity === 1) {
        this.soloDeskIds.add(desk.id);
      }
    });

    // Skapa en "platt" lista med alla platser (stolar) i klassrummet
    this.flatSeats = [];
    this.desks.forEach(desk => {
      for (let i = 0; i < desk.capacity; i++) {
        this.flatSeats.push({
          deskId: desk.id,
          seatIndex: i,
          isLocked: this.lockedDesks.has(desk.id),
          student: this.lockedDesks.has(desk.id) && desk.students ? (desk.students[i] || null) : null
        });
      }
    });
  }

  generateSeating() {
    const pastPairs = this.buildPastPairs();
    
    let grid = this.flatSeats.map(s => ({ ...s }));
    let pool = [...this.students];

    // 1. Plocka bort elever som redan sitter på låsta bänkar från poolen
    const lockedStudentIds = new Set(
      grid.filter(s => s.isLocked && s.student).map(s => s.student.id)
    );
    pool = pool.filter(s => !lockedStudentIds.has(s.id));

    // Blanda resterande elever
    pool = pool.sort(() => Math.random() - 0.5);

    // 2. Placera ut elever baserat på prioritering (Ensam -> Tavla -> Vägg)
    grid = this.placeStudentsByPriority(grid, pool);

    // 3. Optimera placeringen (byt platser för att minimera straffpoäng)
    grid = this.optimizeSeating(grid, pastPairs);

    // 4. Bygg ihop listan av bänkar igen med de nya eleverna
    const optimizedDesks = this.desks.map(desk => {
      const deskSeats = grid
        .filter(s => s.deskId === desk.id)
        .sort((a, b) => a.seatIndex - b.seatIndex);
      
      return {
        ...desk,
        students: deskSeats.map(s => s.student || null)
      };
    });

    return {
      desks: optimizedDesks,
      hardConflicts: this.countHardConflicts(grid)
    };
  }

  buildPastPairs() {
    const pastPairs = new Map();
    this.plans.forEach(plan => {
      if (plan.desks) {
        // Ny struktur (fria bänkar)
        plan.desks.forEach(desk => {
          if (desk.students && desk.students.length > 1) {
            for (let i = 0; i < desk.students.length; i++) {
              for (let j = i + 1; j < desk.students.length; j++) {
                if (desk.students[i] && desk.students[j]) {
                  this.registerPair(pastPairs, desk.students[i].id, desk.students[j].id);
                }
              }
            }
          }
        });
      } else if (plan.layout && plan.cols) {
        // Fallback för gamla historiska grid-planer (bakåtkompatibilitet)
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
      }
    });
    return pastPairs;
  }

  registerPair(map, id1, id2) {
    const key = [id1, id2].sort().join('-');
    map.set(key, (map.get(key) || 0) + 1);
  }

  placeStudentsByPriority(grid, pool) {
    const placeStudentAtRandomAvailable = (student, criteriaFn = () => true) => {
      const availableSpots = grid.filter(seat => !seat.isLocked && !seat.student && criteriaFn(seat));
      if (availableSpots.length > 0) {
        const spot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
        spot.student = student;
        return true;
      }
      return false;
    };

    // Pri 1: Måste sitta själv
    const soloGroup = pool.filter(s => s.needsSolo);
    pool = pool.filter(s => !s.needsSolo);
    soloGroup.forEach(student => {
      if (!placeStudentAtRandomAvailable(student, seat => this.soloDeskIds.has(seat.deskId))) {
        placeStudentAtRandomAvailable(student); // Fallback: var som helst om inga singelbänkar finns
      }
    });

    // Pri 2: Nära tavlan
    const frontGroup = pool.filter(s => s.needsFront);
    pool = pool.filter(s => !s.needsFront);
    frontGroup.forEach(student => {
      if (!placeStudentAtRandomAvailable(student, seat => this.frontDeskIds.has(seat.deskId))) {
        placeStudentAtRandomAvailable(student);
      }
    });

    // Pri 3: Vid vägg
    const wallGroup = pool.filter(s => s.needsWall);
    pool = pool.filter(s => !s.needsWall);
    wallGroup.forEach(student => {
      if (!placeStudentAtRandomAvailable(student, seat => this.wallDeskIds.has(seat.deskId))) {
        placeStudentAtRandomAvailable(student);
      }
    });

    // Resten
    pool.forEach(student => {
      placeStudentAtRandomAvailable(student);
    });

    return grid;
  }

  optimizeSeating(grid, pastPairs) {
    let bestGrid = grid.map(s => ({ ...s }));
    let bestScore = this.calculateScore(bestGrid, pastPairs);
    
    // Vi kan bara byta plats på stolar som inte är låsta
    const unlockedIndices = grid.map((s, i) => !s.isLocked ? i : -1).filter(i => i !== -1);

    if (unlockedIndices.length < 2) return bestGrid; // Finns inget att byta

    for (let i = 0; i < ALGORITHM_CONSTANTS.OPTIMIZATION_ITERATIONS; i++) {
      const idx1 = unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
      const idx2 = unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];

      if (idx1 === idx2) continue;

      const s1 = grid[idx1];
      const s2 = grid[idx2];

      // Byt plats på eleverna i den tillfälliga griden
      const tempGrid = grid.map(s => ({ ...s }));
      tempGrid[idx1].student = s2.student;
      tempGrid[idx2].student = s1.student;

      const score = this.calculateScore(tempGrid, pastPairs);

      // Spara om vi hittat en bättre (lägre) poäng, eller av en liten slump (Simulated Annealing)
      if (score < bestScore || (score === bestScore && Math.random() < ALGORITHM_CONSTANTS.ACCEPTANCE_PROBABILITY)) {
        grid = tempGrid;
        bestScore = score;
        bestGrid = grid.map(s => ({ ...s }));
      }
    }

    return bestGrid;
  }

  calculateScore(grid, pastPairs) {
    let score = 0;

    // Mappa bänkId till en lista med elever som sitter där
    const deskStudents = new Map();
    grid.forEach(seat => {
      if (seat.student) {
        if (!deskStudents.has(seat.deskId)) deskStudents.set(seat.deskId, []);
        deskStudents.get(seat.deskId).push(seat.student);
      }
    });

    // Hjälpfunktion för att kolla om två elever sitter vid samma bänk (grannar)
    const areNeighbors = (id1, id2) => {
      for (const students of deskStudents.values()) {
        const studentIds = students.map(s => s.id);
        if (studentIds.includes(id1) && studentIds.includes(id2)) return true;
      }
      return false;
    };

    // 1. Hårda kompis-regler
    this.constraints.forEach(c => {
      const s1Exists = grid.some(s => s.student?.id === c.student1);
      const s2Exists = grid.some(s => s.student?.id === c.student2);
      
      if (s1Exists && s2Exists) {
        const neighbors = areNeighbors(c.student1, c.student2);
        if (c.type === 'pair' && !neighbors) score += ALGORITHM_CONSTANTS.HARD_CONSTRAINT_PENALTY;
        if ((c.type === 'avoid' || !c.type) && neighbors) score += ALGORITHM_CONSTANTS.HARD_CONSTRAINT_PENALTY;
      }
    });

    // 2. Mjuka preferenser
    grid.forEach(seat => {
      if (!seat.student) return;
      const student = seat.student;
      const deskId = seat.deskId;

      // Straff om eleven behöver sitta fram men inte gör det
      if (student.needsFront && !this.frontDeskIds.has(deskId)) {
        score += ALGORITHM_CONSTANTS.ROW_PENALTY_MULTIPLIER * 10;
      }

      // Straff om eleven behöver sitta vid vägg men inte gör det
      if (student.needsWall && !this.wallDeskIds.has(deskId)) {
        score += 500; 
      }

      // Straff om eleven måste sitta själv men bänken har flera platser/personer
      if (student.needsSolo) {
        const neighborsCount = (deskStudents.get(deskId)?.length || 1) - 1;
        if (neighborsCount > 0) {
          score += ALGORITHM_CONSTANTS.SOLO_PENALTY * neighborsCount;
        }
      }

      // Historik-straff (har de suttit tillsammans förut?)
      const roommates = deskStudents.get(deskId) || [];
      if (roommates.length > 1) {
        roommates.forEach(roommate => {
          if (roommate.id !== student.id) {
            const key = [student.id, roommate.id].sort().join('-');
            if (pastPairs.has(key)) {
               score += ALGORITHM_CONSTANTS.HISTORY_PENALTY;
            }
          }
        });
      }
    });

    return score;
  }

  countHardConflicts(grid) {
    let count = 0;
    
    const deskStudents = new Map();
    grid.forEach(seat => {
      if (seat.student) {
        if (!deskStudents.has(seat.deskId)) deskStudents.set(seat.deskId, []);
        deskStudents.get(seat.deskId).push(seat.student);
      }
    });

    const areNeighbors = (id1, id2) => {
      for (const students of deskStudents.values()) {
        const studentIds = students.map(s => s.id);
        if (studentIds.includes(id1) && studentIds.includes(id2)) return true;
      }
      return false;
    };

    this.constraints.forEach(c => {
      const s1Exists = grid.some(s => s.student?.id === c.student1);
      const s2Exists = grid.some(s => s.student?.id === c.student2);
      if (s1Exists && s2Exists) {
        const neighbors = areNeighbors(c.student1, c.student2);
        if (c.type === 'pair' && !neighbors) count++;
        if ((c.type === 'avoid' || !c.type) && neighbors) count++;
      }
    });
    
    return count;
  }
}
