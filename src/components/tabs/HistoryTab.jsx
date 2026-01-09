import React from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../Button';
import { useApp, ACTIONS } from '../../contexts/AppContext';

const HistoryTab = ({ onLoadPlan, showNotification }) => {
  const { state, dispatch } = useApp();
  const { data, currentClassId } = state;

  const getPlans = () =>
    data.plans.filter(p => p.classId === currentClassId).sort((a, b) => b.createdAt - a.createdAt);

  const deletePlan = (id) => {
    dispatch({ type: ACTIONS.DELETE_PLAN, payload: id });
    showNotification('Placering borttagen', 'info');
  };

  if (!currentClassId) {
    return <div className="text-center py-10 text-gray-500">Välj en klass först.</div>;
  }

  return (
    <div className="space-y-4 print:hidden">
      <h3 className="font-semibold text-gray-700">Sparade placeringar</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getPlans().map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold">{p.name}</h4>
                <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('sv-SE')}</p>
              </div>
              <button
                onClick={() => deletePlan(p.id)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Ta bort ${p.name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center text-sm"
              onClick={() => onLoadPlan(p)}
              ariaLabel={`Öppna ${p.name}`}
            >
              Öppna
            </Button>
          </div>
        ))}
        {getPlans().length === 0 && (
          <div className="text-center text-gray-400 py-12 col-span-full">Ingen historik än.</div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
