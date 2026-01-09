import React from 'react';
import { Trash2, History, Clock } from 'lucide-react';
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
    return (
      <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed border-gray-300 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
          <History size={40} className="text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Välj en klass först</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          För att visa historik över sparade placeringar behöver du först välja en klass.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 print:hidden">
      <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
        <History size={22} className="text-indigo-600" />
        Sparade placeringar
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getPlans().map((p, index) => (
          <div
            key={p.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-md hover:shadow-lg hover:border-indigo-200 transition-all duration-200 animate-scale-in"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-lg">{p.name}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock size={12} />
                  {new Date(p.createdAt).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <button
                onClick={() => deletePlan(p.id)}
                className="text-gray-300 hover:text-red-500 hover:scale-110 p-2 transition-all duration-200 rounded-lg hover:bg-red-50"
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
          <div className="col-span-full text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
              <History size={32} className="text-amber-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Ingen historik än</h4>
            <p className="text-sm text-gray-500">
              Sparade placeringar kommer att visas här när du skapar dem i fliken Placering.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
