/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  PenTool, Settings, RefreshCw, Printer, Save, Square, Columns, Grid3X3,
  LayoutGrid as LayoutGridIcon, Maximize, Eraser, MousePointer2, RotateCcw,
  Layout, FilePlus, X
} from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import SeatingGrid from '../SeatingGrid';
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
    } else {
      setCurrentPlan(Array(r * c).fill(null));
      setCurrentSeatMap(Array(r * c).fill(false));
      setLockedIndices(new Set());
      setGenerationMsg("");
      setIsDesignMode(true);
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
                <Button onClick={generateSeating} disabled={isGenerating}>
                  {isGenerating ? '...' : 'Generera'} <RefreshCw size={18} />
                </Button>
                <Button variant="secondary" onClick={() => window.print()} disabled={currentPlan.length === 0}>
                  <Printer size={18} /> Skriv ut
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Design Tools */}
        {isDesignMode && (
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
                    className={`p-2 rounded border flex items-center gap-2 text-sm ${
                      designBrush === tool.type
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                    aria-pressed={designBrush === tool.type}
                  >
                    <IconComponent size={14} aria-hidden="true" /> {tool.label}
                  </button>
                );
              })}

              <div className="h-6 w-[1px] bg-indigo-200 mx-1"></div>

              <button
                onClick={() => setDesignBrush(DESIGN_BRUSH_TYPES.ERASER)}
                className={`p-2 rounded border flex items-center gap-2 text-sm ${
                  designBrush === DESIGN_BRUSH_TYPES.ERASER
                    ? 'bg-red-100 text-red-900 border-red-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50'
                }`}
                aria-pressed={designBrush === DESIGN_BRUSH_TYPES.ERASER}
              >
                <Eraser size={14} aria-hidden="true" /> Sudda
              </button>
            </div>

            <div className="flex justify-between items-center mt-1 border-t border-indigo-200 pt-2">
              <div className="text-xs text-indigo-600 italic flex items-center gap-1">
                <MousePointer2 size={12} aria-hidden="true" /> Klicka i rummet för att placera vald möbel.
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
      </div>

      {generationMsg && !isDesignMode && (
        <div className={`text-sm text-center px-4 py-2 rounded-lg print:hidden ${
          generationMsg.includes("Klar") ? 'bg-green-100 text-green-800' : 'bg-blue-50'
        }`}>
          {generationMsg}
        </div>
      )}

      {currentPlan.length > 0 && selectedSeatIndex === null && !isDesignMode && (
        <div className="print:hidden">
          <p className="text-center text-xs text-gray-400 italic mb-1">
            💡 Tips: Klicka på en elev och sedan på en annan plats för att byta plats.
          </p>
          <p className="text-center text-xs text-gray-400 italic mb-2">
            🔒 Tips: Använd hänglåset på en elev för att låsa fast dem vid nästa generering.
          </p>
        </div>
      )}

      {/* SEATING GRID */}
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
      />

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
