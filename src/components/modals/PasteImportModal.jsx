import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import Button from '../Button';

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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden"
      role="dialog"
      aria-labelledby="paste-import-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 id="paste-import-title" className="text-lg font-bold mb-2 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600" aria-hidden="true" /> Klistra in namn
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
          aria-label="Namnlista"
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} ariaLabel="Avbryt import">
            Avbryt
          </Button>
          <Button onClick={handleImport} disabled={!text.trim()} ariaLabel={`Importera ${count} namn`}>
            Importera {count > 0 ? `(${count})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasteImportModal;
