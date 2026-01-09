import React, { memo } from 'react';
import { Armchair, Lock, Unlock, Move } from 'lucide-react';

const SeatingCell = memo(({
  student,
  index,
  isSeat,
  isSelected,
  isLocked,
  isDesignMode,
  onCellClick,
  onToggleLock,
  onDesignDrop,
  onStudentDrop
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  let cellClass = "h-20 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center text-center relative transition-all duration-300 ";

  if (isDesignMode) {
    cellClass += "cursor-pointer hover:ring-4 hover:ring-indigo-300 hover:scale-105 active-press ";
    if (isSeat) {
      cellClass += "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-lg hover:shadow-xl ";
    } else {
      cellClass += "bg-white/50 border-2 border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30 ";
    }
    if (isDragOver) {
      cellClass += "ring-4 ring-green-400 scale-110 bg-green-50 ";
    }
  } else {
    if (!isSeat) {
      cellClass += "border-transparent bg-transparent opacity-0 pointer-events-none ";
    } else {
      cellClass += "cursor-pointer active-press ";
      if (isSelected) cellClass += "border-indigo-500 ring-4 ring-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 z-10 scale-110 shadow-xl shadow-indigo-500/30 ";
      else if (isLocked) cellClass += "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-lg ring-2 ring-purple-200 print:bg-white print:border-gray-200 print:shadow-none print:ring-0 ";
      else if (student) cellClass += "bg-white border-gray-200 shadow-md hover:border-indigo-300 hover:shadow-xl hover:scale-105 ";
      else cellClass += "bg-gray-50 border-gray-300 border-dashed hover:bg-gray-100 hover:scale-105 ";
      if (student) cellClass += "cursor-grab active:cursor-grabbing ";
      if (isDragOver && !student) {
        cellClass += "ring-4 ring-green-400 scale-105 bg-green-50 ";
      }
    }
  }

  const handleDragStart = (e) => {
    if (!isDesignMode && student) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isDesignMode || (!isDesignMode && isSeat && !student)) {
      e.dataTransfer.dropEffect = isDesignMode ? 'copy' : 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('text/plain');

    if (isDesignMode) {
      // Dropping a brush type in design mode
      if (onDesignDrop) {
        onDesignDrop(index, data);
      }
    } else {
      // Dropping a student in normal mode
      const fromIndex = parseInt(data, 10);
      if (!isNaN(fromIndex) && fromIndex !== index && isSeat && !student && onStudentDrop) {
        onStudentDrop(fromIndex, index);
      }
    }
  };

  return (
    <div
      onClick={() => onCellClick(index)}
      draggable={!isDesignMode && student}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cellClass}
      role={isDesignMode ? "button" : isSeat ? "gridcell" : undefined}
      aria-label={
        isDesignMode
          ? `Design cell ${index}`
          : student
          ? `${student.name}${isLocked ? ' (låst)' : ''}`
          : isSeat
          ? 'Ledig plats'
          : undefined
      }
    >
      {isDesignMode ? (
        isSeat ? (
          <div className="text-indigo-600 flex flex-col items-center animate-scale-in">
            <Armchair size={28} aria-hidden="true" />
            <span className="text-xs font-bold mt-1">BÄNK</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs font-semibold">TOM</span>
        )
      ) : (
        isSeat && (
          student ? (
            <>
              <span className="font-bold text-sm sm:text-base leading-tight px-2 break-words w-full text-gray-800">
                {student.name}
              </span>
              <div className="absolute top-2 right-2 flex gap-1.5 print:hidden">
                {student.needsFront && (
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 shadow-sm" title="Nära tavlan" />
                )}
                {student.needsWall && (
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-sm" title="Vid vägg" />
                )}
              </div>

              <button
                onClick={(e) => onToggleLock(index, e)}
                className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all print:hidden hover:scale-110 active-press ${
                  isLocked
                    ? 'bg-purple-100 text-purple-600 shadow-sm'
                    : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                aria-label={isLocked ? `Lås upp ${student.name}` : `Lås fast ${student.name}`}
              >
                {isLocked ? <Lock size={14} fill="currentColor" /> : <Unlock size={14} />}
              </button>

              {isSelected && (
                <div className="absolute -top-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-scale-in">
                  <Move size={10} aria-hidden="true" /> Flytta
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-xs font-medium print:hidden">Ledigt</span>
          )
        )
      )}
    </div>
  );
});

SeatingCell.displayName = 'SeatingCell';

const SeatingGrid = ({
  rows,
  cols,
  currentPlan,
  currentSeatMap,
  selectedSeatIndex,
  lockedIndices,
  isDesignMode,
  onCellClick,
  onToggleLock,
  onDesignDrop,
  onStudentDrop
}) => {
  return (
    <div className="overflow-x-auto pb-4 max-w-full print:overflow-visible">
      <div className="mx-auto bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800 rounded-2xl mb-10 w-2/3 max-w-2xl text-center text-sm text-white py-3 font-bold shadow-xl border-4 border-gray-900 animate-slide-in-up">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="tracking-wider">WHITEBOARD</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
      </div>
      <div
        className="grid gap-3 mx-auto max-w-full select-none"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(70px, 1fr))`,
          width: 'fit-content',
          minWidth: '600px'
        }}
        role="grid"
        aria-label="Klassrumslayout"
      >
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const s = currentPlan[idx];
          const isSeat = currentSeatMap[idx];
          const isSelected = selectedSeatIndex === idx;
          const isLocked = lockedIndices.has(idx);

          return (
            <SeatingCell
              key={idx}
              student={s}
              index={idx}
              isSeat={isSeat}
              isSelected={isSelected}
              isLocked={isLocked}
              isDesignMode={isDesignMode}
              onCellClick={onCellClick}
              onToggleLock={onToggleLock}
              onDesignDrop={onDesignDrop}
              onStudentDrop={onStudentDrop}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(SeatingGrid);
