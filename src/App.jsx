import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutGrid, 
  Save, 
  History, 
  Settings, 
  UserMinus, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  MapPin,
  Trash2,
  GraduationCap,
  Plus,
  Download,
  Upload,
  AlertCircle,
  X,
  ListPlus,
  Edit2,
  FileJson,
  FolderOpen,
  ClipboardList,
  Printer,
  Move,
  PenTool,
  Grid3X3,
  Armchair,
  Eraser,
  Square,
  Columns,
  Maximize,
  MousePointer2,
  RotateCcw,
  Lock,
  Unlock,
  Link,
  Ban,
  FilePlus,
  Layout
} from 'lucide-react';

// --- LocalStorage Helper ---
const STORAGE_KEY = 'classroom_seating_data_v7'; // Uppdaterad version för layouter

const saveToLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Kunde inte spara lokalt", e);
  }
};

const loadFromLocal = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

// --- Components ---

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, title = '' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 print:hidden justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, className = '', autoFocus = false }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    autoFocus={autoFocus}
    className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${className}`}
  />
);

// --- MODALS ---

const EditStudentModal = ({ student, onClose, onSave }) => {
  const [name, setName] = useState(student.name);
  const [front, setFront] = useState(student.needsFront);
  const [wall, setWall] = useState(student.needsWall);

  const handleSave = () => {
    onSave(student.id, { name, needsFront: front, needsWall: wall });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Edit2 size={20} className="text-blue-600"/> Redigera Elev
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Namn</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={front} onChange={e => setFront(e.target.checked)} className="w-5 h-5 text-blue-600"/>
              <span className="font-medium text-gray-700">Måste sitta nära tavlan</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={wall} onChange={e => setWall(e.target.checked)} className="w-5 h-5 text-blue-600"/>
              <span className="font-medium text-gray-700">Måste sitta vid vägg</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave}>Spara ändringar</Button>
        </div>
      </div>
    </div>
  );
};

const PasteImportModal = ({ onClose, onImport }) => {
  const [text, setText] = useState('');

  const getParsedNames = (inputText) => {
    return inputText.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== '');
  };

  const handleImport = () => {
    const names = getParsedNames(text);
    if (names.length > 0) {
      onImport(names);
      onClose();
    }
  };

  const count = getParsedNames(text).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600"/> Klistra in namn
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Klistra in din namnlista här. Separera med ny rad eller kommatecken.
        </p>
        
        <textarea 
          className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4 font-mono text-sm"
          placeholder={"Anna, Bertil, Cecilia\nDavid\nErika, Fredrik"}
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            Importera {count > 0 ? `(${count})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('students'); 
  
  // -- Data State --
  const [data, setData] = useState({
    classes: [],
    students: [],
    constraints: [],
    plans: [],
    roomLayouts: [], // New: Store saved layouts
    activePlans: {} 
  });

  const [currentClassId, setCurrentClassId] = useState('');
  
  // States for Modals & Interactions
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);

  // Form Inputs
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [studentAttr, setStudentAttr] = useState({ front: false, wall: false });
  
  // Bulk Add
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState([
    { id: '1', name: '', front: false, wall: false },
    { id: '2', name: '', front: false, wall: false },
    { id: '3', name: '', front: false, wall: false }
  ]);

  const [constraintStudent1, setConstraintStudent1] = useState('');
  const [constraintStudent2, setConstraintStudent2] = useState('');
  const [constraintType, setConstraintType] = useState('avoid');

  // Layout State
  const DEFAULT_ROWS = 10;
  const DEFAULT_COLS = 12;

  const [rows, setRows] = useState(DEFAULT_ROWS); 
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [currentPlan, setCurrentPlan] = useState([]); 
  const [currentSeatMap, setCurrentSeatMap] = useState([]); 
  const [lockedIndices, setLockedIndices] = useState(new Set()); 
  const [planName, setPlanName] = useState('');
  
  // Design Mode
  const [isDesignMode, setIsDesignMode] = useState(false); 
  const [designBrush, setDesignBrush] = useState('single'); 
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [layoutName, setLayoutName] = useState(''); // Name for saving layout template

  // Loading/Gen State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState('');

  // --- Initial Load ---
  useEffect(() => {
    const localData = loadFromLocal();
    if (localData) {
      setData({ ...localData, activePlans: localData.activePlans || {}, roomLayouts: localData.roomLayouts || [] });
      if (localData.classes.length > 0) {
        setCurrentClassId(localData.classes[0].id);
      }
    }
  }, []);

  // --- Sync Layout State when Class Changes ---
  useEffect(() => {
    if (!currentClassId) return;
    setSelectedSeatIndex(null);

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

  // --- Save Effect ---
  useEffect(() => {
    if (data) {
      saveToLocal(data);
    }
  }, [data]);

  // --- Helpers ---
  const getStudents = () => data.students.filter(s => s.classId === currentClassId).sort((a,b) => a.name.localeCompare(b.name));
  const getConstraints = () => {
    const classStudentIds = new Set(getStudents().map(s => s.id));
    return data.constraints.filter(c => classStudentIds.has(c.student1) && classStudentIds.has(c.student2));
  };
  const getPlans = () => data.plans.filter(p => p.classId === currentClassId).sort((a,b) => b.createdAt - a.createdAt);
  const getRoomLayouts = () => data.roomLayouts.filter(l => l.classId === currentClassId);

  // --- Actions ---

  const addClass = () => {
    if (!newClassName.trim()) return;
    const newClass = { id: crypto.randomUUID(), name: newClassName.trim(), createdAt: Date.now() };
    setData(prev => ({ ...prev, classes: [...prev.classes, newClass].sort((a,b) => a.name.localeCompare(b.name)) }));
    setNewClassName('');
    setCurrentClassId(newClass.id);
  };

  const deleteClass = (id) => {
    if(!confirm("Är du säker? Detta raderar klassen permanent.")) return;
    const { [id]: deleted, ...remainingActivePlans } = data.activePlans || {};
    setData(prev => ({
      classes: prev.classes.filter(c => c.id !== id),
      students: prev.students.filter(s => s.classId !== id),
      constraints: prev.constraints.filter(c => c.classId !== id),
      plans: prev.plans.filter(p => p.classId !== id),
      roomLayouts: prev.roomLayouts.filter(l => l.classId !== id),
      activePlans: remainingActivePlans
    }));
    if (currentClassId === id) setCurrentClassId('');
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !currentClassId) return;
    const newStudent = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name: newStudentName.trim(),
      needsFront: studentAttr.front,
      needsWall: studentAttr.wall,
      createdAt: Date.now()
    };
    setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
    setNewStudentName('');
    setStudentAttr({ front: false, wall: false });
  };

  const updateStudent = (id, updates) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const removeStudent = (id) => {
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      constraints: prev.constraints.filter(c => c.student1 !== id && c.student2 !== id)
    }));
  };

  // --- Bulk Actions ---
  const handleBulkChange = (id, field, value) => {
    setBulkList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addBulkRow = () => {
    setBulkList(prev => [...prev, { id: crypto.randomUUID(), name: '', front: false, wall: false }]);
  };

  const removeBulkRow = (id) => {
    if(bulkList.length <= 1) {
        setBulkList([{ id: crypto.randomUUID(), name: '', front: false, wall: false }]); 
        return;
    }
    setBulkList(prev => prev.filter(item => item.id !== id));
  };

  const saveBulkList = () => {
    const validStudents = bulkList
        .filter(s => s.name.trim() !== '')
        .map(s => ({
            id: crypto.randomUUID(),
            classId: currentClassId,
            name: s.name.trim(),
            needsFront: s.front,
            needsWall: s.wall,
            createdAt: Date.now()
        }));

    if (validStudents.length > 0) {
        setData(prev => ({ ...prev, students: [...prev.students, ...validStudents] }));
        setBulkList([{ id: crypto.randomUUID(), name: '', front: false, wall: false }]); 
        setIsBulkMode(false); 
    }
  };

  const handlePasteImport = (namesList) => {
    const newStudents = namesList.map(name => ({
        id: crypto.randomUUID(),
        classId: currentClassId,
        name: name,
        needsFront: false,
        needsWall: false,
        createdAt: Date.now()
    }));
    setData(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
  };

  // --- Constraint Actions ---
  const addConstraint = () => {
    if (!constraintStudent1 || !constraintStudent2 || constraintStudent1 === constraintStudent2) return;
    const newConstraint = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      student1: constraintStudent1,
      student2: constraintStudent2,
      type: constraintType
    };
    setData(prev => ({ ...prev, constraints: [...prev.constraints, newConstraint] }));
    setConstraintStudent1('');
    setConstraintStudent2('');
  };

  const removeConstraint = (id) => {
    setData(prev => ({ ...prev, constraints: prev.constraints.filter(c => c.id !== id) }));
  };

  // --- Room Layout Actions ---
  const saveRoomLayout = () => {
    if (!layoutName.trim()) {
        alert("Ange ett namn på möbleringen.");
        return;
    }
    const newLayout = {
        id: crypto.randomUUID(),
        classId: currentClassId,
        name: layoutName.trim(),
        rows: rows,
        cols: cols,
        seatMap: currentSeatMap,
        locked: Array.from(lockedIndices), // Save locks with the layout template? Yes, good for "Exam" where you always lock specific seats
        createdAt: Date.now()
    };
    
    setData(prev => ({
        ...prev,
        roomLayouts: [...(prev.roomLayouts || []), newLayout]
    }));
    setLayoutName('');
  };

  const loadRoomLayout = (layoutId) => {
      const template = data.roomLayouts.find(l => l.id === layoutId);
      if (!template) return;

      // REMOVED confirm() dialogue here as it blocks execution in some environments
      // if (!confirm(`Vill du ladda "${template.name}"? Nuvarande möblering ersätts.`)) return;

      const newRows = template.rows;
      const newCols = template.cols;
      const newSeatMap = template.seatMap;
      const newLocked = new Set(template.locked || []);

      // CLEAR STUDENTS on layout change (User Request)
      // Instead of migrating, we clear the plan to avoid confusion.
      const newPlan = Array(newRows * newCols).fill(null);
      
      setRows(newRows);
      setCols(newCols);
      setCurrentSeatMap(newSeatMap);
      setCurrentPlan(newPlan);
      setLockedIndices(newLocked);

      // Save as active
      setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { 
                layout: newPlan, 
                seatMap: newSeatMap, 
                locked: Array.from(newLocked),
                rows: newRows, 
                cols: newCols 
            }
        }
      }));
  };

  const deleteRoomLayout = (layoutId) => {
      // Removed confirm here as well for consistency and stability
      setData(prev => ({
          ...prev,
          roomLayouts: prev.roomLayouts.filter(l => l.id !== layoutId)
      }));
  };

  // --- Plan Actions ---
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
      locked: Array.from(lockedIndices), // Save locks too
      createdAt: Date.now()
    };
    setData(prev => ({ ...prev, plans: [newPlan, ...prev.plans] }));
    setPlanName('');
    setActiveTab('history');
  };

  const deletePlan = (id) => {
    setData(prev => ({ ...prev, plans: prev.plans.filter(p => p.id !== id) }));
  };

  const loadPlan = (plan) => {
    setRows(plan.rows);
    setCols(plan.cols);
    setCurrentPlan(plan.layout);
    setCurrentSeatMap(plan.seatMap || Array(plan.rows * plan.cols).fill(true));
    setLockedIndices(new Set(plan.locked || []));
    
    setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [plan.classId]: { 
              layout: plan.layout, 
              seatMap: plan.seatMap || Array(plan.rows * plan.cols).fill(true), 
              locked: plan.locked || [],
              rows: plan.rows, 
              cols: plan.cols 
            }
        }
    }));
    setActiveTab('layout');
  };

  // --- GRID RESIZING ---
  const updateGridSize = (newRows, newCols) => {
    const newSize = newRows * newCols;
    const newSeatMap = Array(newSize).fill(false);
    const newLayout = Array(newSize).fill(null);
    const newLocked = new Set();

    for(let r=0; r<Math.min(rows, newRows); r++) {
      for(let c=0; c<Math.min(cols, newCols); c++) {
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
    
    setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { 
                layout: newLayout, 
                seatMap: newSeatMap, 
                locked: Array.from(newLocked),
                rows: newRows, 
                cols: newCols 
            }
        }
    }));
  };

  // --- DESIGN TOOLS ---
  const applyDesignTool = (index) => {
    const safeRows = rows || DEFAULT_ROWS;
    const safeCols = cols || DEFAULT_COLS;
    
    const r = Math.floor(index / safeCols);
    const c = index % safeCols;

    let newMap = [...currentSeatMap];
    let newLayout = [...currentPlan];
    let newLocked = new Set(lockedIndices); 
    
    if (newMap.length !== safeRows * safeCols) {
        const resizedMap = Array(safeRows * safeCols).fill(false);
        const resizedLayout = Array(safeRows * safeCols).fill(null);
        newMap.forEach((val, i) => { if(i < resizedMap.length) resizedMap[i] = val; });
        newLayout.forEach((val, i) => { if(i < resizedLayout.length) resizedLayout[i] = val; });
        newMap = resizedMap;
        newLayout = resizedLayout;
    }

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

    if (designBrush === 'eraser') {
        setSeat(r, c, false);
    } else if (designBrush === 'single') {
        setSeat(r, c, true);
    } else if (designBrush === 'pair') {
        setSeat(r, c, true);
        setSeat(r, c + 1, true);
    } else if (designBrush === 'group4') {
        setSeat(r, c, true);
        setSeat(r, c + 1, true);
        setSeat(r + 1, c, true);
        setSeat(r + 1, c + 1, true);
    } else if (designBrush === 'group5') {
        setSeat(r, c, true); setSeat(r, c + 1, true);
        setSeat(r + 1, c, true); setSeat(r + 1, c + 1, true);
        setSeat(r, c + 2, true); 
    } else if (designBrush === 'group6') {
        setSeat(r, c, true); setSeat(r, c + 1, true); setSeat(r, c + 2, true);
        setSeat(r + 1, c, true); setSeat(r + 1, c + 1, true); setSeat(r + 1, c + 2, true);
    }

    setCurrentSeatMap(newMap);
    setCurrentPlan(newLayout);
    setLockedIndices(newLocked);
    
    setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { 
                layout: newLayout, 
                seatMap: newMap, 
                locked: Array.from(newLocked),
                rows: safeRows, 
                cols: safeCols 
            }
        }
    }));
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
      
      setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { 
                layout: newLayout, 
                seatMap: newMap, 
                locked: [],
                rows: safeRows, 
                cols: safeCols 
            }
        }
    }));
  };

  // --- LOCK FUNCTIONALITY ---
  const toggleLock = (index, e) => {
      e.stopPropagation(); 
      const newLocked = new Set(lockedIndices);
      if (newLocked.has(index)) {
          newLocked.delete(index);
      } else {
          newLocked.add(index);
      }
      setLockedIndices(newLocked);
      
      setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { 
                ...prev.activePlans[currentClassId],
                locked: Array.from(newLocked)
            }
        }
      }));
  };

  // --- INTERACTION ---
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
            setData(prev => ({
                ...prev,
                activePlans: {
                    ...prev.activePlans,
                    [currentClassId]: { ...prev.activePlans[currentClassId], layout: newLayout }
                }
            }));
        }
    }
  };

  // --- ALGORITHM ---
  const generateSeating = () => {
    const students = getStudents();
    const plans = getPlans();
    const constraints = getConstraints();

    const validIndices = currentSeatMap.map((isSeat, idx) => isSeat ? idx : -1).filter(idx => idx !== -1);
    
    if (validIndices.length === 0) {
        alert("Du måste möblera klassrummet först! Klicka på 'Ändra möblering' och placera ut bänkar.");
        return;
    }

    if (students.length > validIndices.length) {
        alert(`Varning: Fler elever (${students.length}) än bänkar (${validIndices.length}).`);
    }

    if (students.length === 0) {
      setGenerationMsg("Inga elever i vald klass.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationMsg("Analyserar...");

    setTimeout(() => {
      // 1. History
      const pastPairs = new Map();
      plans.forEach(plan => {
        const pCols = plan.cols;
        const layout = plan.layout;
        for (let i = 0; i < layout.length; i++) {
          if (!layout[i]) continue;
          if ((i % pCols) !== (pCols - 1)) {
             const neighbor = layout[i + 1];
             if (neighbor) registerPair(pastPairs, layout[i].id, neighbor.id);
          }
        }
      });

      // 2. Prepare Grid (Handle Locks First)
      let grid = Array(rows * cols).fill(null);
      let takenIndices = new Set();
      let pool = [...students]; 

      // 2a. Place Locked Students
      lockedIndices.forEach(idx => {
          if (currentSeatMap[idx] && currentPlan[idx]) {
              const studentId = currentPlan[idx].id;
              const studentIndex = pool.findIndex(s => s.id === studentId);
              
              if (studentIndex !== -1) {
                  grid[idx] = pool[studentIndex];
                  takenIndices.add(idx);
                  pool.splice(studentIndex, 1); 
              }
          }
      });

      // Shuffle remaining pool
      pool = pool.sort(() => Math.random() - 0.5);

      // 3. Placement Logic (Front to Back)
      const placeStudentAtFirstAvailable = (student, criteriaFn = () => true) => {
        const spot = validIndices.find(idx => !takenIndices.has(idx) && criteriaFn(idx));
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
         if (!placeStudentAtFirstAvailable(student, idx => Math.floor(idx / cols) === 0)) {
             placeStudentAtFirstAvailable(student);
         }
      });

      // Priority 2: Wall
      const wallGroup = pool.filter(s => s.needsWall);
      pool = pool.filter(s => !s.needsWall);
      wallGroup.forEach(student => {
          const isWall = (idx) => {
             const c = idx % cols;
             return c === 0 || c === cols - 1;
          };
          if (!placeStudentAtFirstAvailable(student, isWall)) {
              placeStudentAtFirstAvailable(student);
          }
      });

      // Priority 3: Rest
      pool.forEach(student => {
          placeStudentAtFirstAvailable(student);
      });

      // 4. Optimize
      let bestGrid = [...grid];
      let bestScore = calculateScore(bestGrid, pastPairs, constraints);

      // Only swap if BOTH seats are NOT locked
      for (let i = 0; i < 3000; i++) { 
        const r1 = Math.floor(Math.random() * validIndices.length);
        const r2 = Math.floor(Math.random() * validIndices.length);
        const idx1 = validIndices[r1];
        const idx2 = validIndices[r2];
        
        if (idx1 === idx2) continue;
        if (lockedIndices.has(idx1) || lockedIndices.has(idx2)) continue;

        const s1 = grid[idx1];
        const s2 = grid[idx2];
        
        const s1Valid = isValidPos(s1, idx2);
        const s2Valid = isValidPos(s2, idx1);

        if (s1Valid && s2Valid) {
          const tempGrid = [...grid];
          tempGrid[idx1] = s2;
          tempGrid[idx2] = s1;
          const score = calculateScore(tempGrid, pastPairs, constraints);
          if (score < bestScore || (score === bestScore && Math.random() < 0.05)) {
            grid = tempGrid;
            bestScore = score;
            bestGrid = [...grid];
          }
        }
      }

      setCurrentPlan(bestGrid);
      setData(prev => ({
        ...prev,
        activePlans: {
            ...prev.activePlans,
            [currentClassId]: { ...prev.activePlans[currentClassId], layout: bestGrid }
        }
    }));
      
      const hardConflicts = countHardConflicts(bestGrid, constraints);
      let msg = "Klar!";
      if (lockedIndices.size > 0) msg += ` (Låste: ${lockedIndices.size})`;
      if (hardConflicts > 0) msg += ` ${hardConflicts} regelbrott.`;
      setGenerationMsg(msg);
      setIsGenerating(false);
    }, 100);
  };

  const registerPair = (map, id1, id2) => {
    const key = [id1, id2].sort().join('-');
    map.set(key, (map.get(key) || 0) + 1);
  };

  const isValidPos = (student, index) => {
    if (!student) return true;
    const r = Math.floor(index / cols);
    const c = index % cols;
    if (student.needsFront && r !== 0) return false;
    if (student.needsWall && c !== 0 && c !== cols - 1) return false;
    return true;
  };

  const areNeighbors = (idx1, idx2) => {
    const r1 = Math.floor(idx1 / cols);
    const c1 = idx1 % cols;
    const r2 = Math.floor(idx2 / cols);
    const c2 = idx2 % cols;
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  };

  const calculateScore = (gridToCheck, pastPairs, constraints) => {
    let score = 0;
    constraints.forEach(c => {
      const idx1 = gridToCheck.findIndex(s => s?.id === c.student1);
      const idx2 = gridToCheck.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1) {
          const neighbors = areNeighbors(idx1, idx2);
          if (c.type === 'pair' && !neighbors) score += 5000; // Must sit together
          if ((c.type === 'avoid' || !c.type) && neighbors) score += 5000; // Must avoid
      }
    });

    for (let i = 0; i < gridToCheck.length; i++) {
      if (!gridToCheck[i]) continue;
      const r = Math.floor(i / cols);
      const c = i % cols;

      score += r * 20; 

      let neighborCount = 0;
      if (c < cols - 1 && currentSeatMap[i+1] && gridToCheck[i+1]) neighborCount++;
      if (c > 0 && currentSeatMap[i-1] && gridToCheck[i-1]) neighborCount++;
      if (r < rows - 1 && currentSeatMap[i+cols] && gridToCheck[i+cols]) neighborCount++;
      if (r > 0 && currentSeatMap[i-cols] && gridToCheck[i-cols]) neighborCount++;

      if (neighborCount === 0) score += 500; 

      if (c < cols - 1) {
          const neighborIdx = i + 1;
          if (currentSeatMap[neighborIdx] && gridToCheck[neighborIdx]) {
             const key = [gridToCheck[i].id, gridToCheck[neighborIdx].id].sort().join('-');
             if (pastPairs.has(key)) score += 50;
          }
      }
    }
    return score;
  };

  const countHardConflicts = (grid, constraints) => {
    let count = 0;
    constraints.forEach(c => {
      const idx1 = grid.findIndex(s => s?.id === c.student1);
      const idx2 = grid.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1) {
          const neighbors = areNeighbors(idx1, idx2);
          if (c.type === 'pair' && !neighbors) count++;
          if ((c.type === 'avoid' || !c.type) && neighbors) count++;
      }
    });
    return count;
  };

  // --- RENDER ---
  const renderClassSelector = () => (
    <div className="bg-white border-b border-gray-200 p-4 print:hidden">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap size={16} /> Klass:
          </span>
          {data.classes.map(c => (
            <button
              key={c.id}
              onClick={() => setCurrentClassId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                currentClassId === c.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
          {data.classes.length === 0 && <span className="text-gray-400 text-sm italic">Inga klasser</span>}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            placeholder="Ny klass..." 
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            className="w-full md:w-40 text-sm"
          />
          <Button onClick={addClass} variant="secondary" className="text-sm whitespace-nowrap">
            <Plus size={16} /> Skapa
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10 print:bg-white print:pb-0">
      
      {/* MODALS */}
      {editingStudent && (
        <EditStudentModal 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
          onSave={updateStudent} 
        />
      )}
      {showPasteModal && (
        <PasteImportModal 
          onClose={() => setShowPasteModal(false)}
          onImport={handlePasteImport}
        />
      )}

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">KlassPlacering</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-xs px-2" onClick={() => {
                const dataStr = JSON.stringify(data, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `klassplacering_projekt_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(link);
                link.click();
            }} title="Spara">
              <FileJson size={14} /> Spara
            </Button>
            <label className="cursor-pointer">
               <input type="file" onChange={(e) => {
                   const file = e.target.files[0];
                   if (!file) return;
                   const reader = new FileReader();
                   reader.onload = (ev) => {
                     try {
                       const imported = JSON.parse(ev.target.result);
                       if (imported.classes) {
                          if(confirm("Ladda in projekt?")) {
                            setData({ ...imported, activePlans: imported.activePlans || {} });
                            if(imported.classes.length > 0) setCurrentClassId(imported.classes[0].id);
                          }
                       }
                     } catch(err){ alert("Fel vid inläsning"); }
                   };
                   reader.readAsText(file);
               }} accept=".json" className="hidden" />
               <div className="px-3 py-2 border border-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 text-xs h-full">
                 <FolderOpen size={14} /> Öppna
               </div>
            </label>
          </div>
        </div>
        
        {renderClassSelector()}

        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto mt-2">
          {[
            { id: 'students', label: 'Elever', icon: Users },
            { id: 'constraints', label: 'Regler', icon: Settings },
            { id: 'layout', label: 'Placering', icon: MapPin },
            { id: 'history', label: 'Historik', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* PRINT HEADER */}
      <div className="hidden print:block text-center py-4 mb-4 border-b">
        <h1 className="text-2xl font-bold">{data.classes.find(c => c.id === currentClassId)?.name}</h1>
        <p className="text-sm text-gray-500">Placering genererad {new Date().toLocaleDateString('sv-SE')}</p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 print:p-0 print:w-full print:max-w-none">
        
        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="space-y-6 print:hidden">
            {!currentClassId ? (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Välj en klass</h3>
              </div>
            ) : (
              <>
                {!isBulkMode ? (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-semibold flex gap-2"><Users size={20} className="text-blue-600"/> Lägg till elev</h3>
                       <div className="flex gap-4 items-center">
                          <button onClick={() => setIsBulkMode(true)} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
                            <ListPlus size={16} /> Lägg till flera...
                          </button>
                          <div className="h-4 w-[1px] bg-gray-300"></div>
                          <button onClick={() => setShowPasteModal(true)} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
                            <ClipboardList size={16} /> Klistra in lista
                          </button>
                          <div className="h-4 w-[1px] bg-gray-300"></div>
                          <button onClick={() => deleteClass(currentClassId)} className="text-xs text-red-400 underline hover:text-red-600">Ta bort klass</button>
                       </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-grow">
                        <Input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Namn..." />
                      </div>
                      <div className="flex gap-4 mb-2 text-sm text-gray-700">
                        <label className="flex gap-2 cursor-pointer items-center select-none"><input type="checkbox" checked={studentAttr.front} onChange={e => setStudentAttr({...studentAttr, front: e.target.checked})}/> Nära tavlan</label>
                        <label className="flex gap-2 cursor-pointer items-center select-none"><input type="checkbox" checked={studentAttr.wall} onChange={e => setStudentAttr({...studentAttr, wall: e.target.checked})}/> Vid vägg</label>
                      </div>
                      <Button onClick={addStudent}>Lägg till</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 relative">
                     <button onClick={() => setIsBulkMode(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                     <h3 className="font-semibold flex gap-2 mb-4 text-lg"><ListPlus size={24} className="text-blue-600"/> Lägg till flera elever</h3>
                     <div className="space-y-3 mb-6">
                       <div className="flex gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                         <div className="flex-grow">Namn</div>
                         <div className="w-20 text-center">Tavla</div>
                         <div className="w-20 text-center">Vägg</div>
                         <div className="w-8"></div>
                       </div>
                       {bulkList.map((item, idx) => (
                         <div key={item.id} className="flex gap-2 items-center">
                           <div className="flex-grow">
                             <Input 
                                value={item.name} 
                                onChange={e => handleBulkChange(item.id, 'name', e.target.value)} 
                                placeholder={`Elev ${idx + 1}`}
                                autoFocus={idx === 0}
                             />
                           </div>
                           <label className="w-20 flex justify-center cursor-pointer"><input type="checkbox" checked={item.front} onChange={e => handleBulkChange(item.id, 'front', e.target.checked)} className="w-5 h-5" /></label>
                           <label className="w-20 flex justify-center cursor-pointer"><input type="checkbox" checked={item.wall} onChange={e => handleBulkChange(item.id, 'wall', e.target.checked)} className="w-5 h-5" /></label>
                           <button onClick={() => removeBulkRow(item.id)} className="w-8 text-gray-300 hover:text-red-500 flex justify-center"><Trash2 size={18}/></button>
                         </div>
                       ))}
                     </div>
                     <div className="flex justify-between items-center border-t pt-4">
                        <div className="flex gap-2">
                           <Button variant="ghost" onClick={addBulkRow}><Plus size={16}/> Lägg till rad</Button>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="secondary" onClick={() => setIsBulkMode(false)}>Avbryt</Button>
                           <Button onClick={saveBulkList}>Spara alla elever</Button>
                        </div>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {getStudents().map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setEditingStudent(s)} 
                      className="bg-white p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div>
                        <div className="font-medium group-hover:text-blue-700 flex items-center gap-2">
                          {s.name}
                          <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                        <div className="flex gap-1 mt-1">
                          {s.needsFront && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Tavla</span>}
                          {s.needsWall && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">Vägg</span>}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeStudent(s.id); }} 
                        className="text-gray-400 hover:text-red-500 p-2"
                        title="Ta bort elev"
                      >
                        <UserMinus size={18}/>
                      </button>
                    </div>
                  ))}
                  {getStudents().length === 0 && <div className="col-span-full text-center text-gray-400 py-4">Inga elever än.</div>}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- CONSTRAINTS TAB --- */}
        {activeTab === 'constraints' && (
          <div className="space-y-6 print:hidden">
             {!currentClassId ? <div className="text-center py-10 text-gray-500">Välj en klass först.</div> : (
               <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold mb-4 flex gap-2"><ShieldAlert size={20} className="text-orange-600"/> Hantera regler</h3>
                  <div className="flex flex-col gap-4">
                    
                    {/* Rule Type Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                        <button 
                            onClick={() => setConstraintType('avoid')} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${constraintType === 'avoid' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Ban size={16} /> Får ej sitta bredvid
                        </button>
                        <button 
                            onClick={() => setConstraintType('pair')} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${constraintType === 'pair' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Link size={16} /> Ska sitta bredvid
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <select className="flex-1 p-2 border rounded-lg w-full" value={constraintStudent1} onChange={e => setConstraintStudent1(e.target.value)}>
                        <option value="">Elev 1</option>
                        {getStudents().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ArrowRight className="text-gray-400 hidden md:block" />
                        <select className="flex-1 p-2 border rounded-lg w-full" value={constraintStudent2} onChange={e => setConstraintStudent2(e.target.value)}>
                        <option value="">Elev 2</option>
                        {getStudents().filter(s => s.id !== constraintStudent1).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <Button onClick={addConstraint} disabled={!constraintStudent1 || !constraintStudent2}>Spara regel</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {getConstraints().map(c => {
                    const s1 = getStudents().find(s => s.id === c.student1);
                    const s2 = getStudents().find(s => s.id === c.student2);
                    if(!s1 || !s2) return null;
                    
                    const isPair = c.type === 'pair';

                    return (
                      <div key={c.id} className={`p-3 rounded-lg border flex justify-between items-center ${isPair ? 'bg-green-50 border-green-200 text-green-900' : 'bg-orange-50 border-orange-100 text-orange-900'}`}>
                        <span className="text-sm flex items-center gap-2">
                            {isPair ? <Link size={16}/> : <Ban size={16}/>}
                            <b>{s1.name}</b> {isPair ? 'ska sitta med' : 'får ej sitta med'} <b>{s2.name}</b>
                        </span>
                        <button onClick={() => removeConstraint(c.id)} className={`${isPair ? 'text-green-400 hover:text-green-700' : 'text-orange-400 hover:text-orange-700'}`}><UserMinus size={18}/></button>
                      </div>
                    )
                  })}
                  {getConstraints().length === 0 && <div className="text-center text-gray-400 py-4">Inga regler än.</div>}
                </div>
               </>
             )}
          </div>
        )}

        {/* --- LAYOUT TAB (MAIN VIEW) --- */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {!currentClassId ? <div className="text-center py-10 text-gray-500">Välj en klass först.</div> : (
              <>
                {/* CONTROLS (Döljs vid print) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 print:hidden">
                    {/* Top Row: Grid Size & Main Actions */}
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

                            {/* Hidden Grid Settings Toggle */}
                            {isDesignMode && (
                                <button onClick={() => setShowGridSettings(!showGridSettings)} className="p-2 text-gray-400 hover:text-indigo-600" title="Ändra rumsstorlek">
                                    <Settings size={16} />
                                </button>
                            )}

                            {showGridSettings && isDesignMode && (
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-indigo-100 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex gap-1 items-center">
                                        <span className="text-xs text-gray-500 font-bold mr-1">Yta:</span>
                                        <input 
                                            type="number" 
                                            value={rows} 
                                            onChange={e => updateGridSize(parseInt(e.target.value)||1, cols)} 
                                            className="w-12 p-1 border rounded text-center text-sm"
                                        />
                                        <span className="text-gray-400">x</span>
                                        <input 
                                            type="number" 
                                            value={cols} 
                                            onChange={e => updateGridSize(rows, parseInt(e.target.value)||1)} 
                                            className="w-12 p-1 border rounded text-center text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                             {!isDesignMode && (
                                <>
                                <Button onClick={generateSeating} disabled={isGenerating}>
                                    {isGenerating ? '...' : 'Generera'} <RefreshCw size={18}/>
                                </Button>
                                <Button variant="secondary" onClick={() => window.print()} disabled={currentPlan.length === 0}>
                                    <Printer size={18} /> Skriv ut
                                </Button>
                                </>
                             )}
                        </div>
                    </div>

                    {/* Second Row: Design Tools (Only visible in Design Mode) */}
                    {isDesignMode && (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                             
                             <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider mr-2">Verktyg:</span>
                                
                                <button onClick={() => setDesignBrush('single')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'single' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'}`}>
                                    <Square size={14} /> Enkel
                                </button>
                                <button onClick={() => setDesignBrush('pair')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'pair' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'}`}>
                                    <Columns size={14} /> Par (2)
                                </button>
                                <button onClick={() => setDesignBrush('group4')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'group4' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'}`}>
                                    <Grid3X3 size={14} /> Grupp (4)
                                </button>
                                <button onClick={() => setDesignBrush('group5')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'group5' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'}`}>
                                    <LayoutGrid size={14} /> Grupp (5)
                                </button>
                                <button onClick={() => setDesignBrush('group6')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'group6' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'}`}>
                                    <Maximize size={14} /> Grupp (6)
                                </button>
                                
                                <div className="h-6 w-[1px] bg-indigo-200 mx-1"></div>

                                <button onClick={() => setDesignBrush('eraser')} className={`p-2 rounded border flex items-center gap-2 text-sm ${designBrush === 'eraser' ? 'bg-red-100 text-red-900 border-red-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50'}`}>
                                    <Eraser size={14} /> Sudda
                                </button>
                             </div>

                             <div className="flex justify-between items-center mt-1 border-t border-indigo-200 pt-2">
                                <div className="text-xs text-indigo-600 italic flex items-center gap-1">
                                    <MousePointer2 size={12}/> Klicka i rummet för att placera vald möbel.
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={clearRoom} className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                        <RotateCcw size={12}/> Rensa rummet
                                    </button>
                                </div>
                             </div>

                             {/* --- NEW SECTION: ROOM TEMPLATES --- */}
                             <div className="mt-2 border-t border-indigo-200 pt-3">
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Layout size={14}/> Möbleringsmallar
                                </h4>
                                <div className="flex flex-wrap gap-2 items-end">
                                    <div className="flex-1 min-w-[200px]">
                                        <select 
                                            className="w-full p-2 text-sm border border-indigo-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                            onChange={(e) => { if(e.target.value) loadRoomLayout(e.target.value); }}
                                            value=""
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
                                        />
                                        <button 
                                            onClick={saveRoomLayout}
                                            disabled={!layoutName.trim()}
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <FilePlus size={16}/> Spara möblering
                                        </button>
                                    </div>
                                </div>
                                {getRoomLayouts().length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {getRoomLayouts().map(l => (
                                            <div key={l.id} className="text-xs bg-white border border-indigo-100 rounded px-2 py-1 flex items-center gap-2 text-indigo-800">
                                                {l.name}
                                                <button onClick={() => deleteRoomLayout(l.id)} className="text-indigo-300 hover:text-red-500"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>
                    )}
                </div>

                {generationMsg && !isDesignMode && <div className={`text-sm text-center px-4 py-2 rounded-lg print:hidden ${generationMsg.includes("Klar") ? 'bg-green-100 text-green-800' : 'bg-blue-50'}`}>{generationMsg}</div>}
                
                {currentPlan.length > 0 && selectedSeatIndex === null && !isDesignMode && (
                   <div className="print:hidden">
                       <p className="text-center text-xs text-gray-400 italic mb-1">💡 Tips: Klicka på en elev och sedan på en annan plats för att byta plats.</p>
                       <p className="text-center text-xs text-gray-400 italic mb-2">🔒 Tips: Använd hänglåset på en elev för att låsa fast dem vid nästa generering.</p>
                   </div>
                )}

                {/* VISUAL GRID */}
                <div className="overflow-x-auto pb-4 max-w-full print:overflow-visible">
                    <div className="mx-auto border-t-8 border-gray-800 rounded-t-lg mb-8 w-2/3 max-w-lg text-center text-xs text-gray-500 pt-1 font-bold">WHITEBOARD</div>
                    <div 
                      className="grid gap-2 mx-auto max-w-full select-none"
                      style={{ 
                        gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`, 
                        width: 'fit-content',
                        minWidth: '600px'
                      }}
                    >
                      {Array.from({length: rows*cols}).map((_, idx) => {
                        const s = currentPlan[idx];
                        const isSeat = currentSeatMap[idx];
                        const isSelected = selectedSeatIndex === idx;
                        const isLocked = lockedIndices.has(idx);

                        // Visual styling based on state
                        let cellClass = "h-16 sm:h-20 rounded-lg border flex flex-col items-center justify-center text-center relative transition-all ";
                        
                        if (isDesignMode) {
                            cellClass += "cursor-pointer hover:ring-2 hover:ring-indigo-400 ";
                            if (isSeat) {
                                // DESIGN MODE: SEAT
                                cellClass += "bg-indigo-50 border-indigo-300 shadow-sm ";
                            } else {
                                // DESIGN MODE: EMPTY VOID
                                cellClass += "bg-white border-2 border-dashed border-gray-200 hover:border-indigo-200 "; 
                            }
                        } else {
                            // VIEW MODE
                            if (!isSeat) {
                                cellClass += "border-transparent bg-transparent opacity-0 pointer-events-none "; // Hide voids
                            } else {
                                cellClass += "cursor-pointer ";
                                if (isSelected) cellClass += "border-blue-500 ring-2 ring-blue-200 bg-blue-50 z-10 scale-105 shadow-md ";
                                else if (isLocked) cellClass += "bg-purple-50 border-purple-300 shadow-sm ring-1 ring-purple-200 print:bg-white print:border-gray-200 print:shadow-none print:ring-0 ";
                                else if (s) cellClass += "bg-white border-blue-100 shadow-sm hover:border-blue-300 ";
                                else cellClass += "bg-gray-50 border-gray-200 border-dashed hover:bg-gray-100 "; // Empty Seat
                            }
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleCellClick(idx)}
                            className={cellClass}
                          >
                            {isDesignMode ? (
                                // DESIGN MODE CONTENT
                                isSeat ? (
                                    <div className="text-indigo-600 flex flex-col items-center">
                                        <Armchair size={24}/>
                                        <span className="text-[10px] font-bold mt-1">BÄNK</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-[10px] font-bold">TOM</span>
                                )
                            ) : (
                                // PLACEMENT MODE CONTENT
                                isSeat && (
                                    s ? (
                                        <>
                                            <span className="font-bold text-xs sm:text-sm leading-tight px-1 break-words w-full">{s.name}</span>
                                            <div className="absolute top-1 right-1 flex gap-1 print:hidden">
                                                {s.needsFront && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" title="Nära tavlan"/>}
                                                {s.needsWall && <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Vid vägg"/>}
                                            </div>
                                            
                                            {/* Lock Button */}
                                            <button 
                                                onClick={(e) => toggleLock(idx, e)}
                                                className={`absolute bottom-1 right-1 p-1 rounded-full hover:bg-gray-100 transition-colors print:hidden ${isLocked ? 'text-purple-600' : 'text-gray-300 hover:text-gray-500'}`}
                                                title={isLocked ? "Lås upp" : "Lås fast elev"}
                                            >
                                                {isLocked ? <Lock size={12} fill="currentColor" /> : <Unlock size={12} />}
                                            </button>

                                            {isSelected && <div className="absolute -top-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"><Move size={8}/> Flytta</div>}
                                        </>
                                    ) : <span className="text-gray-300 text-[10px] print:hidden">Ledigt</span>
                                )
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!isDesignMode && (
                        <div className="mt-8 flex gap-4 justify-center items-end bg-white p-4 rounded-xl border print:hidden">
                        <div className="flex-grow max-w-xs"><label className="text-xs text-gray-500 ml-1">Spara som:</label><Input placeholder="Vecka 42..." value={planName} onChange={e => setPlanName(e.target.value)}/></div>
                        <Button variant="secondary" onClick={saveCurrentPlan} disabled={!currentPlan.some(s => s !== null)}><Save size={18}/> Spara</Button>
                        </div>
                    )}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 print:hidden">
            {!currentClassId ? <div className="text-center py-10 text-gray-500">Välj en klass först.</div> : (
              <>
                <h3 className="font-semibold text-gray-700">Sparade placeringar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getPlans().map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold">{p.name}</h4>
                          <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => deletePlan(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                      </div>
                      <Button variant="outline" className="w-full justify-center text-sm" onClick={() => loadPlan(p)}>Öppna</Button>
                    </div>
                  ))}
                  {getPlans().length === 0 && <div className="text-center text-gray-400 py-12 col-span-full">Ingen historik än.</div>}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}