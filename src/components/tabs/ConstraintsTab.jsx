import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Ban, Link, UserMinus } from 'lucide-react';
import Button from '../Button';
import { useApp, ACTIONS } from '../../contexts/AppContext';
import { CONSTRAINT_TYPES } from '../../utils/constants';

const ConstraintsTab = ({ showNotification }) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const [constraintStudent1, setConstraintStudent1] = useState('');
  const [constraintStudent2, setConstraintStudent2] = useState('');
  const [constraintType, setConstraintType] = useState(CONSTRAINT_TYPES.AVOID);

  const getStudents = () =>
    data.students.filter(s => s.classId === currentClassId).sort((a, b) => a.name.localeCompare(b.name));

  const getConstraints = () => {
    const classStudentIds = new Set(getStudents().map(s => s.id));
    return data.constraints.filter(c => classStudentIds.has(c.student1) && classStudentIds.has(c.student2));
  };

  const addConstraint = () => {
    if (!constraintStudent1 || !constraintStudent2 || constraintStudent1 === constraintStudent2) {
      showNotification('Välj två olika elever', 'warning');
      return;
    }
    const newConstraint = {
      id: crypto.randomUUID(),
      classId: currentClassId,
      student1: constraintStudent1,
      student2: constraintStudent2,
      type: constraintType
    };
    dispatch({ type: ACTIONS.ADD_CONSTRAINT, payload: newConstraint });
    setConstraintStudent1('');
    setConstraintStudent2('');
    showNotification('Regel sparad', 'success');
  };

  const removeConstraint = (id) => {
    dispatch({ type: ACTIONS.REMOVE_CONSTRAINT, payload: id });
    showNotification('Regel borttagen', 'info');
  };

  if (!currentClassId) {
    return <div className="text-center py-10 text-gray-500">Välj en klass först.</div>;
  }

  return (
    <div className="space-y-6 print:hidden">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4 flex gap-2">
          <ShieldAlert size={20} className="text-orange-600" /> Hantera regler
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setConstraintType(CONSTRAINT_TYPES.AVOID)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                constraintType === CONSTRAINT_TYPES.AVOID
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={constraintType === CONSTRAINT_TYPES.AVOID}
            >
              <Ban size={16} /> Får ej sitta bredvid
            </button>
            <button
              onClick={() => setConstraintType(CONSTRAINT_TYPES.PAIR)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                constraintType === CONSTRAINT_TYPES.PAIR
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={constraintType === CONSTRAINT_TYPES.PAIR}
            >
              <Link size={16} /> Ska sitta bredvid
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select
              className="flex-1 p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={constraintStudent1}
              onChange={e => setConstraintStudent1(e.target.value)}
              aria-label="Välj första elev"
            >
              <option value="">Elev 1</option>
              {getStudents().map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ArrowRight className="text-gray-400 hidden md:block" aria-hidden="true" />
            <select
              className="flex-1 p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={constraintStudent2}
              onChange={e => setConstraintStudent2(e.target.value)}
              aria-label="Välj andra elev"
            >
              <option value="">Elev 2</option>
              {getStudents()
                .filter(s => s.id !== constraintStudent1)
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <Button onClick={addConstraint} disabled={!constraintStudent1 || !constraintStudent2}>
              Spara regel
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {getConstraints().map(c => {
          const s1 = getStudents().find(s => s.id === c.student1);
          const s2 = getStudents().find(s => s.id === c.student2);
          if (!s1 || !s2) return null;

          const isPair = c.type === CONSTRAINT_TYPES.PAIR;

          return (
            <div
              key={c.id}
              className={`p-3 rounded-lg border flex justify-between items-center ${
                isPair
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-orange-50 border-orange-100 text-orange-900'
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                {isPair ? <Link size={16} /> : <Ban size={16} />}
                <b>{s1.name}</b> {isPair ? 'ska sitta med' : 'får ej sitta med'} <b>{s2.name}</b>
              </span>
              <button
                onClick={() => removeConstraint(c.id)}
                className={`${isPair ? 'text-green-400 hover:text-green-700' : 'text-orange-400 hover:text-orange-700'}`}
                aria-label={`Ta bort regel för ${s1.name} och ${s2.name}`}
              >
                <UserMinus size={18} />
              </button>
            </div>
          );
        })}
        {getConstraints().length === 0 && (
          <div className="text-center text-gray-400 py-4">Inga regler än.</div>
        )}
      </div>
    </div>
  );
};

export default ConstraintsTab;
