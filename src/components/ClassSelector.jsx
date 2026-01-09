import React, { useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { useApp, ACTIONS } from '../contexts/AppContext';

const ClassSelector = ({ showNotification }) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const [newClassName, setNewClassName] = useState('');

  const addClass = () => {
    if (!newClassName.trim()) {
      showNotification('Ange ett klassnamn', 'warning');
      return;
    }
    const newClass = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      createdAt: Date.now()
    };
    dispatch({ type: ACTIONS.ADD_CLASS, payload: newClass });
    dispatch({ type: ACTIONS.SET_CURRENT_CLASS_ID, payload: newClass.id });
    setNewClassName('');
    showNotification('Klass skapad!', 'success');
  };

  const selectClass = (classId) => {
    dispatch({ type: ACTIONS.SET_CURRENT_CLASS_ID, payload: classId });
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 print:hidden">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap size={16} aria-hidden="true" /> Klass:
          </span>
          {data.classes.map(c => (
            <button
              key={c.id}
              onClick={() => selectClass(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                currentClassId === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-pressed={currentClassId === c.id}
              aria-label={`Välj klass ${c.name}`}
            >
              {c.name}
            </button>
          ))}
          {data.classes.length === 0 && (
            <span className="text-gray-400 text-sm italic">Inga klasser</span>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Ny klass..."
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            className="w-full md:w-40 text-sm"
            ariaLabel="Nytt klassnamn"
          />
          <Button onClick={addClass} variant="secondary" className="text-sm whitespace-nowrap">
            <Plus size={16} /> Skapa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassSelector;
