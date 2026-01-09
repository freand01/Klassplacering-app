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
  onToggleLock
}) => {
  let cellClass = "h-16 sm:h-20 rounded-lg border flex flex-col items-center justify-center text-center relative transition-all ";

  if (isDesignMode) {
    cellClass += "cursor-pointer hover:ring-2 hover:ring-indigo-400 ";
    if (isSeat) {
      cellClass += "bg-indigo-50 border-indigo-300 shadow-sm ";
    } else {
      cellClass += "bg-white border-2 border-dashed border-gray-200 hover:border-indigo-200 ";
    }
  } else {
    if (!isSeat) {
      cellClass += "border-transparent bg-transparent opacity-0 pointer-events-none ";
    } else {
      cellClass += "cursor-pointer ";
      if (isSelected) cellClass += "border-blue-500 ring-2 ring-blue-200 bg-blue-50 z-10 scale-105 shadow-md ";
      else if (isLocked) cellClass += "bg-purple-50 border-purple-300 shadow-sm ring-1 ring-purple-200 print:bg-white print:border-gray-200 print:shadow-none print:ring-0 ";
      else if (student) cellClass += "bg-white border-blue-100 shadow-sm hover:border-blue-300 ";
      else cellClass += "bg-gray-50 border-gray-200 border-dashed hover:bg-gray-100 ";
    }
  }

  return (
    <div
      onClick={() => onCellClick(index)}
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
          <div className="text-indigo-600 flex flex-col items-center">
            <Armchair size={24} aria-hidden="true" />
            <span className="text-[10px] font-bold mt-1">BÄNK</span>
          </div>
        ) : (
          <span className="text-gray-300 text-[10px] font-bold">TOM</span>
        )
      ) : (
        isSeat && (
          student ? (
            <>
              <span className="font-bold text-xs sm:text-sm leading-tight px-1 break-words w-full">
                {student.name}
              </span>
              <div className="absolute top-1 right-1 flex gap-1 print:hidden">
                {student.needsFront && (
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" title="Nära tavlan" />
                )}
                {student.needsWall && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Vid vägg" />
                )}
              </div>

              <button
                onClick={(e) => onToggleLock(index, e)}
                className={`absolute bottom-1 right-1 p-1 rounded-full hover:bg-gray-100 transition-colors print:hidden ${
                  isLocked ? 'text-purple-600' : 'text-gray-300 hover:text-gray-500'
                }`}
                aria-label={isLocked ? `Lås upp ${student.name}` : `Lås fast ${student.name}`}
              >
                {isLocked ? <Lock size={12} fill="currentColor" /> : <Unlock size={12} />}
              </button>

              {isSelected && (
                <div className="absolute -top-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Move size={8} aria-hidden="true" /> Flytta
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-300 text-[10px] print:hidden">Ledigt</span>
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
  onToggleLock
}) => {
  return (
    <div className="overflow-x-auto pb-4 max-w-full print:overflow-visible">
      <div className="mx-auto border-t-8 border-gray-800 rounded-t-lg mb-8 w-2/3 max-w-lg text-center text-xs text-gray-500 pt-1 font-bold">
        WHITEBOARD
      </div>
      <div
        className="grid gap-2 mx-auto max-w-full select-none"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`,
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
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(SeatingGrid);
