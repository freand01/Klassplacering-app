/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  PenTool, RefreshCw, Printer, Save,
  Eraser, MousePointer2, RotateCcw,
  Layout, FilePlus, X
} from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import FreePositioningCanvas from '../FreePositioningCanvas';
import { useApp, ACTIONS } from '../../contexts/AppContext';
import { DESIGN_BRUSH_TYPES } from '../../utils/constants';
import { SeatingOptimizer } from '../../utils/seatingAlgorithm';

const LayoutTab = ({ showNotification }) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const [isDesignMode, setIsDesignMode] = useState(false);
  const [designBrush, setDesignBrush] = useState(DESIGN_BRUSH_TYPES.SINGLE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState('');
  const [planName, setPlanName] = useState('');
  const [layoutName, setLayoutName] = useState('');

  // Free positioning states
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

  // Återställ vald bänk när man byter klass
  useEffect(() => {
    setSelectedDesk(null);
  }, [currentClassId]);

  // Hämta sparad layout när man byter klass
  useEffect(() => {
    if (!currentClassId) return;

    const active = data.activePlans?.[currentClassId];

    if (active && active.desks) {
      setDesks(active.desks || []);
      setLockedDesks(new Set(active.lockedDesks || []));
      setGenerationMsg("");
    } else {
      setDesks([]);
      setLockedDesks(new Set());
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

  // --- Handlers för bänkarna ---
  const handleDesksChange = (newDesks) => {
    setDesks(newDesks);
    updateActivePlanInState({ desks: newDesks });
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
    if (!student) return;

    if (!selectedDesk) {
      // Välj första eleven
      setSelectedDesk({ deskId: desk.id, studentIndex });
    } else if (selectedDesk.deskId === desk.id && selectedDesk.studentIndex === studentIndex) {
      // Avmarkera
      setSelectedDesk(null);
    } else {
      // Byt plats på elever
      const selectedDeskObj = desks.find(d => d.id === selectedDesk.deskId);
      if (!selectedDeskObj) return;

      const student1 = selectedDeskObj.students[selectedDesk.studentIndex];
      const student2 = desk.students[studentIndex];

      let updatedDesks;
      if (selectedDesk.deskId === desk.id) {
        // Samma bänk
        updatedDesks = desks.map(d => {
          if (d.id === desk.id) {
            const newStudents = [...d.students];
            const temp = newStudents[selectedDesk.studentIndex];
            newStudents[selectedDesk.studentIndex] = newStudents[studentIndex];
            newStudents[studentIndex] = temp;
            return { ...d, students: newStudents };
          }
          return d;
        });
      } else {
        // Olika bänkar
        updatedDesks = desks.map(d => {
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
      }

      setDesks(updatedDesks);
      setSelectedDesk(null);
      updateActivePlanInState({ desks: updatedDesks });
      showNotification(`${student1.name} och ${student2.name} bytte plats`, 'success');
    }
  };

  // --- Generera Placering ---
  const generateSeating = () => {
    const students = getStudents();
    const constraints = getConstraints();
    const plans = getPlans();

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
    setGenerationMsg("Analyserar och placerar...");

    setTimeout(() => {
      // Här anropar vi den nya hjärnan (som vi bygger i nästa steg)
      const optimizer = new SeatingOptimizer({
        students,
        constraints,
        desks,
        lockedDesks,
        plans
      });

      const result = optimizer.generateSeating();
      
      setDesks(result.desks);
      updateActivePlanInState({ desks: result.desks });

      let msg = "Klar!";
      if (lockedDesks.size > 0) msg += ` (Låste: ${lockedDesks.size} bänkar)`;
      if (result.hardConflicts > 0) msg += ` ${result.hardConflicts} regelbrott.`;
      setGenerationMsg(msg);
      setIsGenerating(false);
      showNotification(msg, result.hardConflicts > 0 ? 'warning' : 'success');
    }, 100);
  };

  // --- Spara och Ladda ---
  const saveCurrentPlan = () => {
    if (desks.length === 0 || !currentClassId) return;
    const name = planName || `Placering ${new Date().toLocaleDateString('sv-SE')}`;
    const newPlan = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name,
      desks,
      lockedDesks: Array.from(lockedDesks),
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
    // Rensa eleverna från bänkarna innan vi sparar som en ren "mall"
    const emptyDesks = desks.map(d => ({ ...d, students: [] }));
    const newLayout = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name: layoutName.trim(),
      desks: emptyDesks,
      createdAt: Date.now()
    };

    dispatch({ type: ACTIONS.SAVE_ROOM_LAYOUT, payload: newLayout });
    setLayoutName('');
    showNotification('Möblering sparad!', 'success');
  };

  const loadRoomLayout = (layoutId) => {
    const template = data.roomLayouts.find(l => l.id === layoutId);
    if (!template) return;

    const newDesks = template.desks || [];
    setDesks(newDesks);
    setLockedDesks(new Set());

    updateActivePlanInState({ desks: newDesks, lockedDesks: [] });
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
          <Layout size={40} className="text-indigo-600" />
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
      {/* VERKTYGSFÄLT */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 print:hidden">
        
        {/* Toppraden */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Button
            variant={isDesignMode ? "primary" : "outline"}
            onClick={() => setIsDesignMode(!isDesignMode)}
            className={isDesignMode ? "bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-200" : ""}
          >
            <PenTool size={16} />
            {isDesignMode ? "Klar med möblering" : "Ändra möblering"}
          </Button>

          <div className="flex gap-2">
            {!isDesignMode && (
              <>
                <Button onClick={generateSeating} disabled={isGenerating}>
                  {isGenerating ? '...' : 'Generera'} <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                </Button>
                <Button variant="secondary" onClick={() => window.print()} disabled={desks.length === 0}>
                  <Printer size={18} /> Skriv ut
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Design-verktyg */}
        {isDesignMode && (
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

            <div className="text-xs text-purple-600 italic flex items-center gap-1 mt-1 border-t border-purple-200 pt-2">
              <MousePointer2 size={12} /> Välj möbel och klicka i klassrummet för att placera. Klicka och dra för att flytta.
            </div>

            {/* Möbleringsmallar och rensa */}
            <div className="flex flex-wrap gap-4 justify-between items-end mt-2 border-t border-purple-200 pt-3">
              <div className="flex flex-wrap gap-2 items-end flex-grow">
                <div className="flex-1 min-w-[200px] max-w-xs">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layout size={14} /> Sparade mallar
                  </h4>
                  <select
                    className="w-full p-2 text-sm border border-purple-200 rounded-lg text-gray-700 bg-white"
                    onChange={(e) => { if (e.target.value) loadRoomLayout(e.target.value); }}
                    value=""
                  >
                    <option value="" disabled>Ladda mall...</option>
                    {getRoomLayouts().map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Namn på mall..."
                    className="p-2 text-sm border border-purple-200 rounded-lg w-32 bg-white"
                    value={layoutName}
                    onChange={e => setLayoutName(e.target.value)}
                  />
                  <button
                    onClick={saveRoomLayout}
                    disabled={!layoutName.trim() || desks.length === 0}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-300 flex items-center gap-1"
                  >
                    <FilePlus size={14} /> Spara
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setDesks([]);
                  updateActivePlanInState({ desks: [] });
                  showNotification('Klassrummet rensat', 'info');
                }}
                className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} /> Rensa klassrum
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Meddelanden och Tips */}
      {generationMsg && !isDesignMode && (
        <div className={`text-sm text-center px-4 py-2 rounded-lg print:hidden ${
          generationMsg.includes("Klar") ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
        }`}>
          {generationMsg}
        </div>
      )}

      {!isDesignMode && desks.length > 0 && (
        <div className="print:hidden flex justify-center gap-6">
          <p className="text-xs text-gray-500 italic">
            💡 Klicka på en elev och sedan på en annan för att byta plats.
          </p>
          <p className="text-xs text-gray-500 italic">
            🔒 Klicka på hänglåset på en bänk för att låsa fast eleverna där.
          </p>
        </div>
      )}

      {/* KLASSRUMMET (Canvas) */}
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

      {/* Spara placering */}
      {!isDesignMode && desks.length > 0 && (
        <div className="mt-8 flex gap-4 justify-center items-end bg-white p-4 rounded-xl border print:hidden">
          <div className="flex-grow max-w-xs">
            <label htmlFor="plan-name" className="text-xs text-gray-500 ml-1">
              Spara placering som:
            </label>
            <Input
              id="plan-name"
              placeholder="T.ex. Vecka 42..."
              value={planName}
              onChange={e => setPlanName(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={saveCurrentPlan}
          >
            <Save size={18} /> Spara
          </Button>
        </div>
      )}
    </div>
  );
};

export default LayoutTab;
