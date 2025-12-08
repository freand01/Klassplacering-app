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
  ClipboardList
} from 'lucide-react';

// --- LocalStorage Helper (Kvar som "Autosave"/Session) ---
const STORAGE_KEY = 'classroom_seating_data_v1';

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
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

  const handleImport = () => {
    // Split by new line, remove empty lines
    const names = text.split(/\r?\n/).map(n => n.trim()).filter(n => n !== '');
    if (names.length > 0) {
      onImport(names);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600"/> Klistra in namn
        </h3>
        <p className="text-sm text-gray-500 mb-4">Klistra in din namnlista här. Ett namn per rad.</p>
        
        <textarea 
          className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4 font-mono text-sm"
          placeholder={"Anna Andersson\nBertil Svensson\nCecilia..."}
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleImport} disabled={!text.trim()}>Importera {text.split(/\r?\n/).filter(n => n.trim()).length > 0 ? `(${text.split(/\r?\n/).filter(n => n.trim()).length})` : ''}</Button>
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
    plans: []
  });

  const [currentClassId, setCurrentClassId] = useState('');
  
  // States for Modals
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);

  // Form Inputs - Single Add
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [studentAttr, setStudentAttr] = useState({ front: false, wall: false });
  
  // Form Inputs - Bulk Add
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState([
    { id: '1', name: '', front: false, wall: false },
    { id: '2', name: '', front: false, wall: false },
    { id: '3', name: '', front: false, wall: false }
  ]);

  const [constraintStudent1, setConstraintStudent1] = useState('');
  const [constraintStudent2, setConstraintStudent2] = useState('');

  // Layout State
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(6);
  const [currentPlan, setCurrentPlan] = useState([]);
  const [planName, setPlanName] = useState('');

  // Loading/Gen State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState('');

  // --- Initial Load ---
  useEffect(() => {
    const localData = loadFromLocal();
    if (localData) {
      setData(localData);
      if (localData.classes.length > 0) {
        setCurrentClassId(localData.classes[0].id);
      }
    }
  }, []);

  // --- Save Effect ---
  useEffect(() => {
    if (data) {
      saveToLocal(data);
    }
  }, [data]);

  // --- Helpers for Filtering ---
  const getStudents = () => data.students.filter(s => s.classId === currentClassId).sort((a,b) => a.name.localeCompare(b.name));
  const getConstraints = () => {
    const classStudentIds = new Set(getStudents().map(s => s.id));
    return data.constraints.filter(c => classStudentIds.has(c.student1) && classStudentIds.has(c.student2));
  };
  const getPlans = () => data.plans.filter(p => p.classId === currentClassId).sort((a,b) => b.createdAt - a.createdAt);

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
    setData(prev => ({
      classes: prev.classes.filter(c => c.id !== id),
      students: prev.students.filter(s => s.classId !== id),
      constraints: prev.constraints.filter(c => c.classId !== id),
      plans: prev.plans.filter(p => p.classId !== id)
    }));
    if (currentClassId === id) setCurrentClassId('');
  };

  // --- Student Actions ---

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

  // --- Bulk & Paste Actions ---
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
      type: 'avoid'
    };
    setData(prev => ({ ...prev, constraints: [...prev.constraints, newConstraint] }));
    setConstraintStudent1('');
    setConstraintStudent2('');
  };

  const removeConstraint = (id) => {
    setData(prev => ({ ...prev, constraints: prev.constraints.filter(c => c.id !== id) }));
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
    setActiveTab('layout');
  };

  // --- FILE STORAGE (Import/Export) ---
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `klassplacering_projekt_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.classes && imported.students) {
           if(confirm("Vill du öppna detta projekt? All osparad data i nuvarande session kommer ersättas.")) {
             setData(imported);
             if(imported.classes.length > 0) setCurrentClassId(imported.classes[0].id);
             console.log("Projekt öppnat!");
           }
        } else {
          alert("Felaktigt filformat. Det måste vara en fil skapad av detta program.");
        }
      } catch (error) {
        alert("Kunde inte läsa filen.");
      }
      // Reset input value to allow re-importing same file if needed
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // --- ALGORITHM ---

  const generateSeating = () => {
    const students = getStudents();
    const plans = getPlans();
    const constraints = getConstraints();

    if (students.length === 0) {
      setGenerationMsg("Inga elever i vald klass.");
      return;
    }
    setIsGenerating(true);
    setGenerationMsg("Analyserar...");

    setTimeout(() => {
      // 1. Analyze History
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

      // 2. Setup
      const requiredSeats = rows * cols;
      let grid = Array(requiredSeats).fill(null);
      let pool = [...students].sort(() => Math.random() - 0.5);

      // 3. Priorities
      const frontRowIndices = Array.from({length: cols}, (_, i) => i);
      const wallIndices = [];
      for(let r=0; r<rows; r++) {
        wallIndices.push(r * cols); 
        if (cols > 1) {
            wallIndices.push(r * cols + cols - 1); 
        }
      }
      
      const placeGroup = (filterFn, allowedIndices) => {
        const group = pool.filter(filterFn);
        pool = pool.filter(s => !filterFn(s));
        group.forEach(student => {
          const availableSpots = allowedIndices.filter(idx => grid[idx] === null);
          if (availableSpots.length > 0) {
            const spot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
            grid[spot] = student;
          } else {
            pool.push(student);
          }
        });
      };

      placeGroup(s => s.needsFront, frontRowIndices);
      placeGroup(s => s.needsWall, wallIndices);

      // 4. Fill
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === null && pool.length > 0) {
          const studentToPlace = pool[pool.length - 1]; 
          if(isValidPos(studentToPlace, i)) {
            grid[i] = pool.pop();
          }
        }
      }
      
      // 5. Optimize
      let bestGrid = [...grid];
      let bestScore = calculateScore(bestGrid, pastPairs, constraints);

      for (let i = 0; i < 1500; i++) { 
        const idx1 = Math.floor(Math.random() * grid.length);
        const idx2 = Math.floor(Math.random() * grid.length);
        const s1 = grid[idx1];
        const s2 = grid[idx2];
        
        const s1ValidAt2 = isValidPos(s1, idx2);
        const s2ValidAt1 = isValidPos(s2, idx1);

        if (s1ValidAt2 && s2ValidAt1) {
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
      
      const hardConflicts = countHardConflicts(bestGrid, constraints);
      const softConflicts = countSoftConflicts(bestGrid, pastPairs);
      
      let msg = "Klar!";
      if (hardConflicts > 0) msg += ` ${hardConflicts} regelbrott kvar.`;
      if (softConflicts > 0) msg += ` ${softConflicts} upprepade par.`;
      if (hardConflicts === 0 && softConflicts === 0) msg += " Inga konflikter!";
      
      setGenerationMsg(msg);
      setIsGenerating(false);
    }, 100);
  };

  // --- Algo Helpers ---
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

  const calculateScore = (gridToCheck, pastPairs, constraints) => {
    let score = 0;
    constraints.forEach(c => {
      const idx1 = gridToCheck.findIndex(s => s?.id === c.student1);
      const idx2 = gridToCheck.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1 && areNeighbors(idx1, idx2)) score += 1000; 
    });
    for (let i = 0; i < gridToCheck.length; i++) {
      if (!gridToCheck[i]) continue;
      if ((i % cols) !== (cols - 1)) {
        const neighbor = gridToCheck[i+1];
        if (neighbor) {
          const key = [gridToCheck[i].id, neighbor.id].sort().join('-');
          if (pastPairs.has(key)) score += 1;
        }
      }
    }
    return score;
  };

  const areNeighbors = (idx1, idx2) => {
    const r1 = Math.floor(idx1 / cols);
    const c1 = idx1 % cols;
    const r2 = Math.floor(idx2 / cols);
    const c2 = idx2 % cols;
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  };

  const countHardConflicts = (grid, constraints) => {
    let count = 0;
    constraints.forEach(c => {
      const idx1 = grid.findIndex(s => s?.id === c.student1);
      const idx2 = grid.findIndex(s => s?.id === c.student2);
      if (idx1 !== -1 && idx2 !== -1 && areNeighbors(idx1, idx2)) count++;
    });
    return count;
  };

  const countSoftConflicts = (grid, pastPairs) => {
    let count = 0;
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      if ((i % cols) !== (cols - 1)) {
        const neighbor = grid[i+1];
        if (neighbor) {
          const key = [grid[i].id, neighbor.id].sort().join('-');
          if (pastPairs.has(key)) count++;
        }
      }
    }
    return count;
  };

  // --- Renderers ---

  const renderClassSelector = () => (
    <div className="bg-white border-b border-gray-200 p-4">
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
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      
      {/* EDIT MODAL */}
      {editingStudent && (
        <EditStudentModal 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
          onSave={updateStudent} 
        />
      )}

      {/* PASTE MODAL */}
      {showPasteModal && (
        <PasteImportModal 
          onClose={() => setShowPasteModal(false)}
          onImport={handlePasteImport}
        />
      )}

      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">KlassPlacering</h1>
          </div>
          
          <div className="flex gap-2">
            {/* FILE ACTIONS - REBRANDED */}
            <Button variant="outline" className="text-xs px-2" onClick={exportData} title="Spara ner all data till en fil på datorn">
              <FileJson size={14} /> Spara Projekt
            </Button>
            <label className="cursor-pointer">
               <input type="file" onChange={importData} accept=".json" className="hidden" />
               <div className="px-3 py-2 border border-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 text-xs h-full">
                 <FolderOpen size={14} /> Öppna Projekt
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

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {!currentClassId ? (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Välj en klass</h3>
              </div>
            ) : (
              <>
                {/* --- ADD STUDENT AREA --- */}
                {!isBulkMode ? (
                  // SINGLE ADD MODE
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-semibold flex gap-2"><Users size={20} className="text-blue-600"/> Lägg till elev</h3>
                       <div className="flex gap-4 items-center">
                          <button onClick={() => setIsBulkMode(true)} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
                            <ListPlus size={16} /> Lägg till flera...
                          </button>
                          <div className="h-4 w-[1px] bg-gray-300"></div>
                          
                          {/* NY KNAPP: KLISTRA IN FRÅN URKLIPP */}
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
                  // BULK ADD MODE
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 relative">
                     <button onClick={() => setIsBulkMode(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                     <h3 className="font-semibold flex gap-2 mb-4 text-lg"><ListPlus size={24} className="text-blue-600"/> Lägg till flera elever</h3>
                     
                     <div className="space-y-3 mb-6">
                       {/* Header row */}
                       <div className="flex gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                         <div className="flex-grow">Namn</div>
                         <div className="w-20 text-center">Tavla</div>
                         <div className="w-20 text-center">Vägg</div>
                         <div className="w-8"></div>
                       </div>
                       
                       {/* Input rows */}
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

                {/* --- STUDENT LIST --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {getStudents().map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setEditingStudent(s)} // OPEN EDIT MODAL
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
          <div className="space-y-6">
             {!currentClassId ? <div className="text-center py-10 text-gray-500">Välj en klass först.</div> : (
               <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold mb-4 flex gap-2"><ShieldAlert size={20} className="text-orange-600"/> Skapa regel (Ska ej sitta bredvid)</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <select className="flex-1 p-2 border rounded-lg" value={constraintStudent1} onChange={e => setConstraintStudent1(e.target.value)}>
                      <option value="">Elev 1</option>
                      {getStudents().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ArrowRight className="text-gray-400 hidden md:block" />
                    <select className="flex-1 p-2 border rounded-lg" value={constraintStudent2} onChange={e => setConstraintStudent2(e.target.value)}>
                      <option value="">Elev 2</option>
                      {getStudents().filter(s => s.id !== constraintStudent1).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <Button onClick={addConstraint} disabled={!constraintStudent1 || !constraintStudent2}>Spara</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {getConstraints().map(c => {
                    const s1 = getStudents().find(s => s.id === c.student1);
                    const s2 = getStudents().find(s => s.id === c.student2);
                    if(!s1 || !s2) return null;
                    return (
                      <div key={c.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center text-orange-900">
                        <span className="text-sm"><b>{s1.name}</b> får ej sitta med <b>{s2.name}</b></span>
                        <button onClick={() => removeConstraint(c.id)} className="text-orange-400 hover:text-orange-700"><UserMinus size={18}/></button>
                      </div>
                    )
                  })}
                  {getConstraints().length === 0 && <div className="text-center text-gray-400 py-4">Inga regler än.</div>}
                </div>
               </>
             )}
          </div>
        )}

        {/* --- LAYOUT TAB --- */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {!currentClassId ? <div className="text-center py-10 text-gray-500">Välj en klass först.</div> : (
              <>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4">
                    <div><label className="text-xs font-bold text-gray-500">Rader</label><input type="number" value={rows} onChange={e => setRows(parseInt(e.target.value)||1)} className="w-16 p-2 border rounded text-center"/></div>
                    <div><label className="text-xs font-bold text-gray-500">Kolumner</label><input type="number" value={cols} onChange={e => setCols(parseInt(e.target.value)||1)} className="w-16 p-2 border rounded text-center"/></div>
                  </div>
                  <Button onClick={generateSeating} disabled={isGenerating}>{isGenerating ? '...' : 'Generera'} <RefreshCw size={18}/></Button>
                </div>
                {generationMsg && <div className={`text-sm text-center px-4 py-2 rounded-lg ${generationMsg.includes("Klar") ? 'bg-green-100 text-green-800' : 'bg-blue-50'}`}>{generationMsg}</div>}
                
                {currentPlan.length > 0 && (
                  <div className="overflow-x-auto pb-4 max-w-full">
                    <div className="mx-auto border-t-8 border-gray-800 rounded-t-lg mb-8 w-2/3 max-w-lg text-center text-xs text-gray-500 pt-1 font-bold">WHITEBOARD</div>
                    <div 
                      className="grid gap-3 mx-auto max-w-full"
                      style={{ 
                        gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr))`, 
                        width: 'fit-content',
                        minWidth: '100%'
                      }}
                    >
                      {currentPlan.map((s, idx) => (
                        <div key={idx} className={`h-24 p-2 rounded-lg border-2 flex flex-col items-center justify-center text-center relative ${s ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100 border-dashed'}`}>
                          {s ? (
                            <>
                              <span className="font-bold text-sm">{s.name}</span>
                              <div className="absolute top-1 right-1 flex gap-1">
                                {s.needsFront && <div className="w-2 h-2 rounded-full bg-yellow-400" title="Nära tavlan"/>}
                                {s.needsWall && <div className="w-2 h-2 rounded-full bg-green-400" title="Vid vägg"/>}
                              </div>
                            </>
                          ) : <span className="text-gray-300 text-xs">Tom</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex gap-4 justify-center items-end bg-white p-4 rounded-xl border">
                      <div className="flex-grow max-w-xs"><label className="text-xs text-gray-500 ml-1">Spara som:</label><Input placeholder="Vecka 42..." value={planName} onChange={e => setPlanName(e.target.value)}/></div>
                      <Button variant="secondary" onClick={saveCurrentPlan} disabled={!currentPlan.length}><Save size={18}/> Spara</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-4">
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