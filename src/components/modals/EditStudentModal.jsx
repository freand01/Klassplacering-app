import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';

const EditStudentModal = ({ student, onClose, onSave }) => {
  const [name, setName] = useState(student.name);
  const [front, setFront] = useState(student.needsFront);
  const [wall, setWall] = useState(student.needsWall);

  const handleSave = () => {
    onSave(student.id, { name, needsFront: front, needsWall: wall });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden"
      role="dialog"
      aria-labelledby="edit-student-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 id="edit-student-title" className="text-lg font-bold mb-4 flex items-center gap-2">
          <Edit2 size={20} className="text-blue-600" aria-hidden="true" /> Redigera Elev
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="student-name" className="text-sm font-medium text-gray-700 mb-1 block">
              Namn
            </label>
            <Input
              id="student-name"
              value={name}
              onChange={e => setName(e.target.value)}
              ariaLabel="Elevnamn"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={front}
                onChange={e => setFront(e.target.checked)}
                className="w-5 h-5 text-blue-600"
                aria-label="Måste sitta nära tavlan"
              />
              <span className="font-medium text-gray-700">Måste sitta nära tavlan</span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={wall}
                onChange={e => setWall(e.target.checked)}
                className="w-5 h-5 text-blue-600"
                aria-label="Måste sitta vid vägg"
              />
              <span className="font-medium text-gray-700">Måste sitta vid vägg</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={onClose} ariaLabel="Avbryt redigering">
            Avbryt
          </Button>
          <Button onClick={handleSave} ariaLabel="Spara ändringar">
            Spara ändringar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
