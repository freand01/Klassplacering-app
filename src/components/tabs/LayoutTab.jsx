/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  PenTool, Settings, RefreshCw, Printer, Save, Square, Columns, Grid3X3,
  LayoutGrid as LayoutGridIcon, Maximize, Eraser, MousePointer2, RotateCcw,
  Layout, FilePlus, X, Grid2X2, Paintbrush
} from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import SeatingGrid from '../SeatingGrid';
import FreePositioningCanvas from '../FreePositioningCanvas';
import { useApp, ACTIONS } from '../../contexts/AppContext';
import { DEFAULT_ROWS, DEFAULT_COLS, DESIGN_BRUSH_TYPES } from '../../utils/constants';
import { SeatingOptimizer } from '../../utils/seatingAlgorithm';

const LayoutTab = ({ showNotification }) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [currentPlan, setCurrentPlan] = useState([]);
  const [currentSeatMap, setCurrentSeatMap] = useState([]);
  const [lockedIndices, setLockedIndices] = useState(new Set());
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [designBrush, setDesignBrush] = useState(DESIGN_BRUSH_TYPES.SINGLE);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState('');
  const [planName, setPlanName] = useState('');
  const [layoutName, setLayoutName] = useState('');

  // Free positioning states
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'free'
  const [desks, setDesks] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [lockedDesks, setLockedDesks] = useState(new Set());

  const getStudents = () =>
    data.students.filter(s => s.classId === currentClassId).sort((a, b) => a.name.localeCompare(b.name));
  const getPlans = () =>
    data.plans.filter(p => p.classId === currentClassId).sort((a, b) => b.createdAt - a.createdAt);
  const getConstraints = () => {
    const classStudentIds = new Set(getStudents().map(s => s.id));
    return data.constraints.filter(c => classStudentIds.has(c.student1) && classStudentIds.has(c.student2));
  };
  const getRoomLayouts = () => data.roomLayouts.filter(l => l.classId === currentClassId);

  // Reset selected seat when class changes
  useEffect(() => {
    setSelectedSeatIndex(null);
  }, [currentClassId]);

  // Sync layout state when class changes
  useEffect(() => {
    if (!currentClassId) return;

    const active = data.activePlans?.[currentClassId];
    const r = active?.rows || DEFAULT_ROWS;
    const c = active?.cols || DEFAULT_COLS;

    setRows(r);
    setCols(c);

    if (active) {
      setCurrentPlan(active.layout || Array(r * c).fill(null));
      setCurrentSeatMap(active.seatMap || Array(r * c).fill(false));
      setLockedIndices(new Set(active.locked || []));
      setGenerationMsg("");

      // Load free positioning data
      setLayoutMode(active.layoutMode || 'grid');
      setDesks(active.desks || []);
      setLockedDesks(new Set(active.lockedDesks || []));
    } else {
      setCurrentPlan(Array(r * c).fill(null));
      setCurrentSeatMap(Array(r * c).fill(false));
      setLockedIndices(new Set());
      setGenerationMsg("");
      setIsDesignMode(true);

      // Reset free positioning
      setLayoutMode('grid');
      setDesks([]);
      setLockedDesks(new Set());
    }
  }, [currentClassId, data.activePlans]);

  const updateActivePlanInState = useCallback((updates) => {
    dispatch({
      type: ACTIONS.UPDATE_ACTIVE_PLAN,
      payload: { classId: currentClassId, updates }
    });
  }, [dispatch, currentClassId]);

  const updateGridSize = (newRows, newCols) => {
    const newSize = newRows * newCols;
    const newSeatMap = Array(newSize).fill(false);
    const newLayout = Array(newSize).fill(null);
    const newLocked = new Set();

    for (let r = 0; r < Math.min(rows, newRows); r++) {
      for (let c = 0; c < Math.min(cols, newCols); c++) {
        const oldIdx = r * cols + c;
        const newIdx = r * newCols + c;
        if (oldIdx < currentSeatMap.length) {
          newSeatMap[newIdx] = currentSeatMap[oldIdx];
          newLayout[newIdx] = currentPlan[oldIdx];
          if (lockedIndices.has(oldIdx)) newLocked.add(newIdx);
        }
      }
    }

    setRows(newRows);
    setCols(newCols);
    setCurrentSeatMap(newSeatMap);
    setCurrentPlan(newLayout);
    setLockedIndices(newLocked);

    updateActivePlanInState({
      layout: newLayout,
      seatMap: newSeatMap,
      locked: Array.from(newLocked),
      rows: newRows,
      cols: newCols
    });
  };

  const applyDesignTool = (index) => {
    const safeRows = rows || DEFAULT_ROWS;
    const safeCols = cols || DEFAULT_COLS;

    const r = Math.floor(index / safeCols);
    const c = index % safeCols;

    let newMap = [...currentSeatMap];
    let newLayout = [...currentPlan];
    let newLocked = new Set(lockedIndices);

    const setSeat = (rr, cc, state) => {
      if (rr >= 0 && rr < safeRows && cc >= 0 && cc < safeCols) {
        const idx = rr * safeCols + cc;
        newMap[idx] = state;
        if (!state) {
          newLayout[idx] = null;
          newLocked.delete(idx);
        }
      }
    };

    if (designBrush === DESIGN_BRUSH_TYPES.ERASER) {
      setSeat(r, c, false);
    } else if (designBrush === DESIGN_BRUSH_TYPES.SINGLE) {
      setSeat(r, c, true);
    } else if (designBrush === DESIGN_BRUSH_TYPES.PAIR) {
      setSeat(r, c, true);
      setSeat(r, c + 1, true);
    } else if (designBrush === DESIGN_BRUSH_TYPES.GROUP_4) {
      setSeat(r, c, true);
      setSeat(r, c + 1, true);
      setSeat(r + 1, c, true);
      setSeat(r + 1, c + 1, true);
    } else if (designBrush === DESIGN_BRUSH_TYPES.GROUP_5) {
      setSeat(r, c, true); setSeat(r, c + 1, true);
      setSeat(r + 1, c, true); setSeat(r + 1, c + 1, true);
      setSeat(r, c + 2, true);
    } else if (designBrush === DESIGN_BRUSH_TYPES.GROUP_6) {
      setSeat(r, c, true); setSeat(r, c + 1, true); setSeat(r, c + 2, true);
      setSeat(r + 1, c, true); setSeat(r + 1, c + 1, true); setSeat(r + 1, c + 2, true);
    }

    setCurrentSeatMap(newMap);
    setCurrentPlan(newLayout);
    setLockedIndices(newLocked);

    updateActivePlanInState({
      layout: newLayout,
      seatMap: newMap,
      locked: Array.from(newLocked)
    });
  };

  const clearRoom = () => {
    const safeRows = rows || DEFAULT_ROWS;
    const safeCols = cols || DEFAULT_COLS;
    const newMap = Array(safeRows * safeCols).fill(false);
    const newLayout = Array(safeRows * safeCols).fill(null);
    const newLocked = new Set();

    setCurrentSeatMap(newMap);
    setCurrentPlan(newLayout);
    setLockedIndices(newLocked);

    updateActivePlanInState({
      layout: newLayout,
      seatMap: newMap,
      locked: []
    });

    showNotification('Rummet rensat', 'info');
  };

  const toggleLock = (index, e) => {
    e.stopPropagation();
    const newLocked = new Set(lockedIndices);
    if (newLocked.has(index)) {
      newLocked.delete(index);
    } else {
      newLocked.add(index);
    }
    setLockedIndices(newLocked);

    updateActivePlanInState({ locked: Array.from(newLocked) });
  };

  // Free positioning handlers
  const handleDesksChange = (newDesks) => {
    setDesks(newDesks);
    updateActivePlanInState({ desks: newDesks, layoutMode });
  };

  const handleDeskLockToggle = (deskId) => {
    const newLockedDesks = new Set(lockedDesks);
    if (newLockedDesks.has(deskId)) {
      newLockedDesks.delete(deskId);
    } else {
      newLockedDesks.add(deskId);
    }
    setLockedDesks(newLockedDesks);
    updateActivePlanInState({ lockedDesks: Array.from(newLockedDesks) });
  };

  const handleDeskSelect = (desk, studentIndex) => {
    if (isDesignMode) return;

    const student = desk.students?.[studentIndex];
    if (!student) return; // Can't select empty seat

    if (!selectedDesk) {
      // Select first student
      setSelectedDesk({ deskId: desk.id, studentIndex });
    } else if (selectedDesk.deskId === desk.id && selectedDesk.studentIndex === studentIndex) {
      // Deselect same student
      setSelectedDesk(null);
    } else {
      // Swap individual students
      const selectedDeskObj = desks.find(d => d.id === selectedDesk.deskId);
      if (!selectedDeskObj) return;

      const student1 = selectedDeskObj.students[selectedDesk.studentIndex];
      const student2 = desk.students[studentIndex];

      // Check if swapping within the same desk
      if (selectedDesk.deskId === desk.id) {
        // Same desk - swap two students within same group
        const updatedDesks = desks.map(d => {
          if (d.id === desk.id) {
            const newStudents = [...d.students];
            // Classic swap using temp variable
            const temp = newStudents[selectedDesk.studentIndex];
            newStudents[selectedDesk.studentIndex] = newStudents[studentIndex];
            newStudents[studentIndex] = temp;
            return { ...d, students: newStudents };
          }
          return d;
        });

        setDesks(updatedDesks);
        setSelectedDesk(null);
        updateActivePlanInState({ desks: updatedDesks });
        showNotification(`${student1.name} och ${student2.name} bytte plats`, 'success');
      } else {
        // Different desks - swap between desks
        const updatedDesks = desks.map(d => {
          if (d.id === selectedDesk.deskId) {
            const newStudents = [...d.students];
            newStudents[selectedDesk.studentIndex] = student2;
            return { ...d, students: newStudents };
          } else if (d.id === desk.id) {
            const newStudents = [...d.students];
            newStudents[studentIndex] = student1;
            return { ...d, students: newStudents };
          }
          return d;
        });

        setDesks(updatedDesks);
        setSelectedDesk(null);
        updateActivePlanInState({ desks: updatedDesks });
        showNotification(`${student1.name} och ${student2.name} bytte plats`, 'success');
      }
    }
  };

  const generateSeatingFreeMode = () => {
    const students = getStudents();

    if (desks.length === 0) {
      showNotification('Du måste möblera klassrummet först!', 'warning');
      return;
    }

    const totalSeats = desks.reduce((sum, desk) => sum + desk.capacity, 0);

    if (students.length > totalSeats) {
      showNotification(`Varning: Fler elever (${students.length}) än platser (${totalSeats}).`, 'warning');
    }

    if (students.length === 0) {
      setGenerationMsg("Inga elever i vald klass.");
      showNotification('Inga elever i vald klass.', 'info');
      return;
    }

    setIsGenerating(true);
    setGenerationMsg("Placerar elever...");

    setTimeout(() => {
      // Simple shuffle algorithm for free positioning
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
      let studentIndex = 0;

      const updatedDesks = desks.map(desk => {
        // Keep locked desks as-is
        if (lockedDesks.has(desk.id)) {
          studentIndex += desk.students?.length || 0;
          return desk;
        }

        // Assign students to desk
        const deskStudents = [];
        for (let i = 0; i < desk.capacity && studentIndex < shuffledStudents.length; i++) {
          deskStudents.push(shuffledStudents[studentIndex++]);
        }

        return { ...desk, students: deskStudents };
      });

      setDesks(updatedDesks);
      updateActivePlanInState({ desks: updatedDesks });

      let msg = "Klar!";
      if (lockedDesks.size > 0) msg += ` (Låste: ${lockedDesks.size} bänkar)`;
      setGenerationMsg(msg);
      setIsGenerating(false);
      showNotification(msg, 'success');
    }, 100);
  };

  const switchLayoutMode = (mode) => {
    setLayoutMode(mode);
    updateActivePlanInState({ layoutMode: mode });
  };

  const handleCellClick = (index) => {
    if (isDesignMode) {
      applyDesignTool(index);
    } else {
      if (!currentSeatMap[index]) return;

      if (selectedSeatIndex === null) {
        setSelectedSeatIndex(index);
      } else if (selectedSeatIndex === index) {
        setSelectedSeatIndex(null);
      } else {
        // Swap
        const newLayout = [...currentPlan];
        const temp = newLayout[selectedSeatIndex];
        newLayout[selectedSeatIndex] = newLayout[index];
        newLayout[index] = temp;

        setCurrentPlan(newLayout);
        setSelectedSeatIndex(null);
        updateActivePlanInState({ layout: newLayout });
      }
    }
  };

  const generateSeating = () => {
    const students = getStudents();
    const plans = getPlans();
    const constraints = getConstraints();

    const validIndices = currentSeatMap.map((isSeat, idx) => isSeat ? idx : -1).filter(idx => idx !== -1);

    if (validIndices.length === 0) {
      showNotification('Du måste möblera klassrummet först!', 'warning');
      return;
    }

    if (students.length > validIndices.length) {
      showNotification(`Varning: Fler elever (${students.length}) än bänkar (${validIndices.length}).`, 'warning');
    }

    if (students.length === 0) {
      setGenerationMsg("Inga elever i vald klass.");
      showNotification('Inga elever i vald klass.', 'info');
      return;
    }

    setIsGenerating(true);
    setGenerationMsg("Analyserar...");

    setTimeout(() => {
      const optimizer = new SeatingOptimizer({
        students,
        constraints,
        seatMap: currentSeatMap,
        plans,
        lockedIndices,
        rows,
        cols
      });

      // Initialize grid with locked students
      let grid = Array(rows * cols).fill(null);
      lockedIndices.forEach(idx => {
        if (currentSeatMap[idx] && currentPlan[idx]) {
          grid[idx] = currentPlan[idx];
        }
      });

      const result = optimizer.generateSeating();
      const bestGrid = result.grid;
      const hardConflicts = result.hardConflicts;

      setCurrentPlan(bestGrid);
      updateActivePlanInState({ layout: bestGrid });

      let msg = "Klar!";
      if (lockedIndices.size > 0) msg += ` (Låste: ${lockedIndices.size})`;
      if (hardConflicts > 0) msg += ` ${hardConflicts} regelbrott.`;
      setGenerationMsg(msg);
      setIsGenerating(false);
      showNotification(msg, hardConflicts > 0 ? 'warning' : 'success');
    }, 100);
  };

  const saveCurrentPlan = () => {
    if (currentPlan.length === 0 || !currentClassId) return;
    const name = planName || `Placering ${new Date().toLocaleDateString('sv-SE')}`;
    const newPlan = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name,
      rows,
      cols,
      layout: currentPlan,
      seatMap: currentSeatMap,
      locked: Array.from(lockedIndices),
      createdAt: Date.now()
    };
    dispatch({ type: ACTIONS.SAVE_PLAN, payload: newPlan });
    setPlanName('');
    showNotification('Placering sparad!', 'success');
  };

  const saveRoomLayout = () => {
    if (!layoutName.trim()) {
      showNotification('Ange ett namn på möbleringen.', 'warning');
      return;
    }
    const newLayout = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name: layoutName.trim(),
      rows: rows,
      cols: cols,
      seatMap: currentSeatMap,
      locked: Array.from(lockedIndices),
      createdAt: Date.now()
    };

    dispatch({ type: ACTIONS.SAVE_ROOM_LAYOUT, payload: newLayout });
    setLayoutName('');
    showNotification('Möblering sparad!', 'success');
  };

  const loadRoomLayout = (layoutId) => {
    const template = data.roomLayouts.find(l => l.id === layoutId);
    if (!template) return;

    const newRows = template.rows;
    const newCols = template.cols;
    const newSeatMap = template.seatMap;
    const newLocked = new Set(template.locked || []);
    const newPlan = Array(newRows * newCols).fill(null);

    setRows(newRows);
    setCols(newCols);
    setCurrentSeatMap(newSeatMap);
    setCurrentPlan(newPlan);
    setLockedIndices(newLocked);

    updateActivePlanInState({
      layout: newPlan,
      seatMap: newSeatMap,
      locked: Array.from(newLocked),
      rows: newRows,
      cols: newCols
    });

    showNotification(`Mall "${template.name}" laddad`, 'success');
  };

  const deleteRoomLayout = (layoutId) => {
    dispatch({ type: ACTIONS.DELETE_ROOM_LAYOUT, payload: layoutId });
    showNotification('Möbleringsmall borttagen', 'info');
  };

  if (!currentClassId) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed border-gray-300 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
          <MapPin size={40} className="text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Välj en klass först</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          För att skapa eller visa klassrumsplacering behöver du först välja eller skapa en klass.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 print:hidden">
        {/* Layout Mode Toggle */}
        <div className="flex gap-2 p-2 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => switchLayoutMode('grid')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm ${
              layoutMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid2X2 size={16} />
            Grid-läge
          </button>
          <button
            onClick={() => switchLayoutMode('free')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm ${
              layoutMode === 'free'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Paintbrush size={16} />
            Fri positionering
          </button>
        </div>

        {/* Top Row */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-4 items-center">
            <Button
              variant={isDesignMode ? "primary" : "outline"}
              onClick={() => setIsDesignMode(!isDesignMode)}
              className={isDesignMode ? "bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-200" : ""}
            >
              <PenTool size={16} />
              {isDesignMode ? "Klar med möblering" : "Ändra möblering"}
            </Button>

            {isDesignMode && (
              <button
                onClick={() => setShowGridSettings(!showGridSettings)}
                className="p-2 text-gray-400 hover:text-indigo-600"
                aria-label="Ändra rumsstorlek"
              >
                <Settings size={16} />
              </button>
            )}

            {showGridSettings && isDesignMode && (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-indigo-100">
                <span className="text-xs text-gray-500 font-bold mr-1">Yta:</span>
                <input
                  type="number"
                  value={rows}
                  onChange={e => updateGridSize(parseInt(e.target.value) || 1, cols)}
                  className="w-12 p-1 border rounded text-center text-sm"
                  aria-label="Antal rader"
                />
                <span className="text-gray-400">x</span>
                <input
                  type="number"
                  value={cols}
                  onChange={e => updateGridSize(rows, parseInt(e.target.value) || 1)}
                  className="w-12 p-1 border rounded text-center text-sm"
                  aria-label="Antal kolumner"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isDesignMode && (
              <>
                <Button
                  onClick={() => layoutMode === 'grid' ? generateSeating() : generateSeatingFreeMode()}
                  disabled={isGenerating}
                >
                  {isGenerating ? '...' : 'Generera'} <RefreshCw size={18} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                  disabled={layoutMode === 'grid' ? currentPlan.length === 0 : desks.length === 0}
                >
                  <Printer size={18} /> Skriv ut
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Design Tools - Grid Mode */}
        {isDesignMode && layoutMode === 'grid' && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider mr-2">Verktyg:</span>

              {[
                { type: DESIGN_BRUSH_TYPES.SINGLE, icon: Square, label: 'Enkel' },
                { type: DESIGN_BRUSH_TYPES.PAIR, icon: Columns, label: 'Par (2)' },
                { type: DESIGN_BRUSH_TYPES.GROUP_4, icon: Grid3X3, label: 'Grupp (4)' },
                { type: DESIGN_BRUSH_TYPES.GROUP_5, icon: LayoutGridIcon, label: 'Grupp (5)' },
                { type: DESIGN_BRUSH_TYPES.GROUP_6, icon: Maximize, label: 'Grupp (6)' }
              ].map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.type}
                    onClick={() => setDesignBrush(tool.type)}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('text/plain', tool.type);
                      setDesignBrush(tool.type);
                    }}
                    className={`p-2 rounded border flex items-center gap-2 text-sm cursor-grab active:cursor-grabbing ${
                      designBrush === tool.type
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                    aria-pressed={designBrush === tool.type}
                    title="Klicka för att välja eller dra till klassrummet"
                  >
                    <IconComponent size={14} aria-hidden="true" /> {tool.label}
                  </button>
                );
              })}

              <div className="h-6 w-[1px] bg-indigo-200 mx-1"></div>

              <button
                onClick={() => setDesignBrush(DESIGN_BRUSH_TYPES.ERASER)}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('text/plain', DESIGN_BRUSH_TYPES.ERASER);
                  setDesignBrush(DESIGN_BRUSH_TYPES.ERASER);
                }}
                className={`p-2 rounded border flex items-center gap-2 text-sm cursor-grab active:cursor-grabbing ${
                  designBrush === DESIGN_BRUSH_TYPES.ERASER
                    ? 'bg-red-100 text-red-900 border-red-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50'
                }`}
                aria-pressed={designBrush === DESIGN_BRUSH_TYPES.ERASER}
                title="Klicka för att välja eller dra till klassrummet"
              >
                <Eraser size={14} aria-hidden="true" /> Sudda
              </button>
            </div>

            <div className="flex justify-between items-center mt-1 border-t border-indigo-200 pt-2">
              <div className="text-xs text-indigo-600 italic flex items-center gap-1">
                <MousePointer2 size={12} aria-hidden="true" /> Klicka eller dra möbler till rummet för att placera.
              </div>
              <button
                onClick={clearRoom}
                className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} aria-hidden="true" /> Rensa rummet
              </button>
            </div>

            {/* Room Templates */}
            <div className="mt-2 border-t border-indigo-200 pt-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Layout size={14} aria-hidden="true" /> Möbleringsmallar
              </h4>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <select
                    className="w-full p-2 text-sm border border-indigo-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => { if (e.target.value) loadRoomLayout(e.target.value); }}
                    value=""
                    aria-label="Ladda sparad möbleringsmall"
                  >
                    <option value="" disabled>Ladda sparad mall...</option>
                    {getRoomLayouts().map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                    {getRoomLayouts().length === 0 && <option disabled>(Inga mallar sparade än)</option>}
                  </select>
                </div>
                <div className="flex gap-2 flex-grow">
                  <input
                    type="text"
                    placeholder="Namn (t.ex. Provsittning)..."
                    className="p-2 text-sm border border-indigo-200 rounded-lg flex-grow min-w-[150px]"
                    value={layoutName}
                    onChange={e => setLayoutName(e.target.value)}
                    aria-label="Namn på möbleringsmall"
                  />
                  <button
                    onClick={saveRoomLayout}
                    disabled={!layoutName.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <FilePlus size={16} aria-hidden="true" /> Spara möblering
                  </button>
                </div>
              </div>
              {getRoomLayouts().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getRoomLayouts().map(l => (
                    <div key={l.id} className="text-xs bg-white border border-indigo-100 rounded px-2 py-1 flex items-center gap-2 text-indigo-800">
                      {l.name}
                      <button
                        onClick={() => deleteRoomLayout(l.id)}
                        className="text-indigo-300 hover:text-red-500"
                        aria-label={`Ta bort ${l.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Design Tools - Free Positioning Mode */}
        {isDesignMode && layoutMode === 'free' && (
          <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider mr-2">Möbeltyper:</span>

              {[
                { type: DESIGN_BRUSH_TYPES.SINGLE, label: '🪑 Singel (1)' },
                { type: DESIGN_BRUSH_TYPES.PAIR, label: '🪑🪑 Dubbel (2)' },
                { type: DESIGN_BRUSH_TYPES.GROUP_4, label: '▦ Grupp 4' },
                { type: DESIGN_BRUSH_TYPES.GROUP_5, label: '⬡ Grupp 5' },
                { type: DESIGN_BRUSH_TYPES.GROUP_6, label: '▦ Grupp 6' }
              ].map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setDesignBrush(tool.type)}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    designBrush === tool.type
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {tool.label}
                </button>
              ))}

              <div className="h-6 w-[1px] bg-purple-200 mx-1"></div>

              <button
                onClick={() => setDesignBrush(DESIGN_BRUSH_TYPES.ERASER)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  designBrush === DESIGN_BRUSH_TYPES.ERASER
                    ? 'bg-red-100 text-red-900 border-red-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50'
                }`}
              >
                <Eraser size={14} className="inline mr-1" /> Sudda
              </button>
            </div>

            <div className="text-xs text-purple-600 italic flex items-center gap-1">
              <MousePointer2 size={12} /> Välj möbel och klicka var som helst i klassrummet för att placera. Dra för att flytta.
            </div>

            <div className="flex justify-between items-center mt-1 border-t border-purple-200 pt-2">
              <button
                onClick={() => {
                  setDesks([]);
                  updateActivePlanInState({ desks: [] });
                  showNotification('Klassrummet rensat', 'info');
                }}
                className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} /> Rensa klassrum
              </button>
            </div>
          </div>
        )}
      </div>

      {generationMsg && !isDesignMode && (
        <div className={`text-sm text-center px-4 py-2 rounded-lg print:hidden ${
          generationMsg.includes("Klar") ? 'bg-green-100 text-green-800' : 'bg-blue-50'
        }`}>
          {generationMsg}
        </div>
      )}

      {layoutMode === 'grid' && currentPlan.length > 0 && selectedSeatIndex === null && !isDesignMode && (
        <div className="print:hidden">
          <p className="text-center text-xs text-gray-400 italic mb-1">
            💡 Tips: Klicka på en elev och sedan på en annan plats för att byta plats.
          </p>
          <p className="text-center text-xs text-gray-400 italic mb-2">
            🔒 Tips: Använd hänglåset på en elev för att låsa fast dem vid nästa generering.
          </p>
        </div>
      )}

      {layoutMode === 'free' && !isDesignMode && (
        <div className="print:hidden">
          <p className="text-center text-xs text-gray-400 italic mb-1">
            💡 Tips: Klicka på en bänk och sedan på en annan bänk för att byta elever.
          </p>
          <p className="text-center text-xs text-gray-400 italic mb-2">
            🔒 Tips: Använd hänglåset på en bänk för att låsa den vid nästa generering.
          </p>
        </div>
      )}

      {/* LAYOUT RENDERING */}
      {layoutMode === 'grid' ? (
        <SeatingGrid
        rows={rows}
        cols={cols}
        currentPlan={currentPlan}
        currentSeatMap={currentSeatMap}
        selectedSeatIndex={selectedSeatIndex}
        lockedIndices={lockedIndices}
        isDesignMode={isDesignMode}
        onCellClick={handleCellClick}
        onToggleLock={toggleLock}
        onDesignDrop={(index, brushType) => {
          setDesignBrush(brushType);
          applyDesignTool(index);
        }}
        onStudentDrop={(fromIndex, toIndex) => {
          // Swap students
          const newLayout = [...currentPlan];
          [newLayout[fromIndex], newLayout[toIndex]] = [newLayout[toIndex], newLayout[fromIndex]];

          // Update locked status if needed
          const newLocked = new Set(lockedIndices);
          const fromLocked = lockedIndices.has(fromIndex);
          const toLocked = lockedIndices.has(toIndex);

          if (fromLocked && !toLocked) {
            newLocked.delete(fromIndex);
            newLocked.add(toIndex);
          } else if (!fromLocked && toLocked) {
            newLocked.delete(toIndex);
            newLocked.add(fromIndex);
          }

          setCurrentPlan(newLayout);
          setLockedIndices(newLocked);
          updateActivePlanInState({
            layout: newLayout,
            seatMap: currentSeatMap,
            locked: Array.from(newLocked),
            rows,
            cols
          });
          showNotification('Elever bytte plats', 'success');
        }}
      />
      ) : (
        <FreePositioningCanvas
          isDesignMode={isDesignMode}
          currentBrush={designBrush}
          desks={desks}
          onDesksChange={handleDesksChange}
          students={getStudents()}
          lockedDesks={lockedDesks}
          onToggleLock={handleDeskLockToggle}
          selectedDesk={selectedDesk}
          onDeskSelect={handleDeskSelect}
        />
      )}

      {!isDesignMode && (
        <div className="mt-8 flex gap-4 justify-center items-end bg-white p-4 rounded-xl border print:hidden">
          <div className="flex-grow max-w-xs">
            <label htmlFor="plan-name" className="text-xs text-gray-500 ml-1">
              Spara som:
            </label>
            <Input
              id="plan-name"
              placeholder="Vecka 42..."
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              ariaLabel="Namn på placeringsplan"
            />
          </div>
          <Button
            variant="secondary"
            onClick={saveCurrentPlan}
            disabled={!currentPlan.some(s => s !== null)}
          >
            <Save size={18} /> Spara
          </Button>
        </div>
      )}
    </div>
  );
};

export default LayoutTab;
