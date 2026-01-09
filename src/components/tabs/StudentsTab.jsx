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
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Välj en klass</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      {!isBulkMode ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex gap-2">
              <Users size={20} className="text-blue-600" /> Lägg till elev
            </h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setIsBulkMode(true)}
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                <ListPlus size={16} /> Lägg till flera...
              </button>
              <div className="h-4 w-[1px] bg-gray-300"></div>
              <button
                onClick={onShowPasteModal}
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                <ClipboardList size={16} /> Klistra in lista
              </button>
              <div className="h-4 w-[1px] bg-gray-300"></div>
              <button
                onClick={() => onDeleteClass(currentClassId)}
                className="text-xs text-red-400 underline hover:text-red-600"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {getStudents().map(s => (
          <div
            key={s.id}
            onClick={() => onEditStudent(s)}
            className="bg-white p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div>
              <div className="font-medium group-hover:text-blue-700 flex items-center gap-2">
                {s.name}
                <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" aria-hidden="true" />
              </div>
              <div className="flex gap-1 mt-1">
                {s.needsFront && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Tavla</span>}
                {s.needsWall && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">Vägg</span>}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeStudent(s.id); }}
              className="text-gray-400 hover:text-red-500 p-2"
              aria-label={`Ta bort ${s.name}`}
            >
              <UserMinus size={18} />
            </button>
          </div>
        ))}
        {getStudents().length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-4">Inga elever än.</div>
        )}
      </div>
    </div>
  );
};

export default StudentsTab;
