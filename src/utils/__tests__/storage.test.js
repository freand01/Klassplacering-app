import { describe, it, expect, beforeEach } from 'vitest';
import { saveToLocal, loadFromLocal, updateActivePlan } from '../storage';

describe('Storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load data from localStorage', () => {
    const testData = {
      classes: [{ id: '1', name: 'Klass 1' }],
      students: []
    };

    saveToLocal(testData);
    const loaded = loadFromLocal();

    expect(loaded).toEqual(testData);
  });

  it('should return null when localStorage is empty', () => {
    const loaded = loadFromLocal();
    expect(loaded).toBeNull();
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorage.setItem('classroom_seating_data_v7', 'invalid json');
    const loaded = loadFromLocal();
    expect(loaded).toBeNull();
  });

  it('should update active plan correctly', () => {
    const data = {
      activePlans: {
        'class1': { layout: [], seatMap: [] }
      }
    };

    const classId = 'class1';
    const updates = { layout: [1, 2, 3] };

    const result = updateActivePlan(data, classId, updates);

    expect(result.activePlans[classId].layout).toEqual([1, 2, 3]);
    expect(result.activePlans[classId].seatMap).toEqual([]);
  });

  it('should create new active plan if it does not exist', () => {
    const data = {
      activePlans: {}
    };

    const classId = 'class2';
    const updates = { layout: [4, 5, 6] };

    const result = updateActivePlan(data, classId, updates);

    expect(result.activePlans[classId]).toEqual({ layout: [4, 5, 6] });
  });
});
