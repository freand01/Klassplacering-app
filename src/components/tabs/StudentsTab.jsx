import React, { useState } from 'react';
import { Users, ListPlus, ClipboardList, Edit2, UserMinus, X, Plus, Trash2, GraduationCap } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import { useApp, ACTIONS } from '../../contexts/AppContext';

const StudentsTab = ({
  onEditStudent,
  onShowPasteModal,
  onDeleteClass,
  showNotification
}) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const [newStudentName, setNewStudentName] = useState('');
  const [studentAttr, setStudentAttr] = useState({ front: false, wall: false });
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState([
    { id: '1', name: '', front: false, wall: false },
    { id: '2', name: '', front: false, wall: false },
    { id: '3', name: '', front: false, wall: false }
  ]);

  const getStudents = () =>
    data.students.filter(s => s.classId === currentClassId).sort((a, b) => a.name.localeCompare(b.name));

  const addStudent = () => {
    if (!newStudentName.trim() || !currentClassId) {
      showNotification('Ange ett elevnamn', 'warning');
      return;
    }
    const newStudent = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      name: newStudentName.trim(),
      needsFront: studentAttr.front,
      needsWall: studentAttr.wall,
      createdAt: Date.now()
    };
    dispatch({ type: ACTIONS.ADD_STUDENT, payload: newStudent });
    setNewStudentName('');
    setStudentAttr({ front: false, wall: false });
    showNotification('Elev tillagd', 'success');
  };

  const removeStudent = (id) => {
    dispatch({ type: ACTIONS.REMOVE_STUDENT, payload: id });
    showNotification('Elev borttagen', 'info');
  };

  const handleBulkChange = (id, field, value) => {
    setBulkList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addBulkRow = () => {
    setBulkList(prev => [...prev, { id: crypto.randomUUID(), name: '', front: false, wall: false }]);
  };

  const removeBulkRow = (id) => {
    if (bulkList.length <= 1) {
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
      dispatch({ type: ACTIONS.ADD_STUDENTS_BULK, payload: validStudents });
      setBulkList([{ id: crypto.randomUUID(), name: '', front: false, wall: false }]);
      setIsBulkMode(false);
      showNotification(`${validStudents.length} elever tillagda`, 'success');
    }
  };

  if (!currentClassId) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed border-gray-300 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
          <GraduationCap size={40} className="text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Välj eller skapa en klass</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Börja med att välja en befintlig klass eller skapa en ny klass högst upp på sidan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      {!isBulkMode ? (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-slide-in-up">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold flex gap-2 items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <Users size={22} className="text-indigo-600" /> Lägg till elev
            </h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setIsBulkMode(true)}
                className="text-sm text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 transition-colors active-press"
              >
                <ListPlus size={16} /> Lägg till flera...
              </button>
              <div className="h-4 w-[1px] bg-gray-300"></div>
              <button
                onClick={onShowPasteModal}
                className="text-sm text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 transition-colors active-press"
              >
                <ClipboardList size={16} /> Klistra in lista
              </button>
              <div className="h-4 w-[1px] bg-gray-300"></div>
              <button
                onClick={() => onDeleteClass(currentClassId)}
                className="text-xs text-red-400 font-medium hover:text-red-600 transition-colors"
              >
                Ta bort klass
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <Input
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="Namn..."
                ariaLabel="Nytt elevnamn"
              />
            </div>
            <div className="flex gap-4 mb-2 text-sm text-gray-700">
              <label className="flex gap-2 cursor-pointer items-center select-none">
                <input
                  type="checkbox"
                  checked={studentAttr.front}
                  onChange={e => setStudentAttr({ ...studentAttr, front: e.target.checked })}
                  aria-label="Måste sitta nära tavlan"
                />
                Nära tavlan
              </label>
              <label className="flex gap-2 cursor-pointer items-center select-none">
                <input
                  type="checkbox"
                  checked={studentAttr.wall}
                  onChange={e => setStudentAttr({ ...studentAttr, wall: e.target.checked })}
                  aria-label="Måste sitta vid vägg"
                />
                Vid vägg
              </label>
            </div>
            <Button onClick={addStudent}>Lägg till</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 relative">
          <button
            onClick={() => setIsBulkMode(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Stäng bulkläge"
          >
            <X size={20} />
          </button>
          <h3 className="font-semibold flex gap-2 mb-4 text-lg">
            <ListPlus size={24} className="text-blue-600" /> Lägg till flera elever
          </h3>
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
                <label className="w-20 flex justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.front}
                    onChange={e => handleBulkChange(item.id, 'front', e.target.checked)}
                    className="w-5 h-5"
                    aria-label={`Elev ${idx + 1} nära tavlan`}
                  />
                </label>
                <label className="w-20 flex justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.wall}
                    onChange={e => handleBulkChange(item.id, 'wall', e.target.checked)}
                    className="w-5 h-5"
                    aria-label={`Elev ${idx + 1} vid vägg`}
                  />
                </label>
                <button
                  onClick={() => removeBulkRow(item.id)}
                  className="w-8 text-gray-300 hover:text-red-500 flex justify-center"
                  aria-label={`Ta bort elev ${idx + 1}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-4">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={addBulkRow}>
                <Plus size={16} /> Lägg till rad
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsBulkMode(false)}>
                Avbryt
              </Button>
              <Button onClick={saveBulkList}>Spara alla elever</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {getStudents().map((s, index) => (
          <div
            key={s.id}
            onClick={() => onEditStudent(s)}
            style={{ animationDelay: `${index * 30}ms` }}
            className="bg-white p-4 rounded-xl border-2 border-gray-100 flex justify-between items-center cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group animate-scale-in active-press"
          >
            <div>
              <div className="font-semibold text-gray-800 group-hover:text-indigo-700 flex items-center gap-2 transition-colors">
                {s.name}
                <Edit2 size={13} className="opacity-0 group-hover:opacity-100 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="flex gap-2 mt-2">
                {s.needsFront && (
                  <span className="text-[10px] font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    Tavla
                  </span>
                )}
                {s.needsWall && (
                  <span className="text-[10px] font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Vägg
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeStudent(s.id); }}
              className="text-gray-300 hover:text-red-500 hover:scale-110 p-2 transition-all duration-200 rounded-lg hover:bg-red-50"
              aria-label={`Ta bort ${s.name}`}
            >
              <UserMinus size={18} />
            </button>
          </div>
        ))}
        {getStudents().length === 0 && (
          <div className="col-span-full text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Users size={32} className="text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Inga elever än</h4>
            <p className="text-sm text-gray-500 mb-4">Lägg till din första elev med formuläret ovan</p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ClipboardList size={14} />
                Klistra in lista
              </span>
              <span>eller</span>
              <span className="flex items-center gap-1">
                <ListPlus size={14} />
                Lägg till flera
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsTab;
