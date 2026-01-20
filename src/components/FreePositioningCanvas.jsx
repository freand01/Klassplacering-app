import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, X, Move, RotateCcw } from 'lucide-react';

// Desk type configurations
const DESK_TYPES = {
  single: { width: 80, height: 60, capacity: 1, label: 'Singel', color: 'from-blue-500 to-blue-600' },
  pair: { width: 160, height: 60, capacity: 2, label: 'Dubbel', color: 'from-purple-500 to-purple-600' },
  group4: { width: 160, height: 120, capacity: 4, label: 'Grupp 4', color: 'from-pink-500 to-pink-600' },
  group5: { width: 150, height: 150, capacity: 5, label: 'Grupp 5', color: 'from-orange-500 to-orange-600' },
  group6: { width: 200, height: 140, capacity: 6, label: 'Grupp 6', color: 'from-amber-500 to-amber-600' }
};

const DeskItem = ({
  desk,
  onDragStart,
  onDelete,
  onToggleLock,
  onRotate,
  isLocked,
  isSelected,
  selectedStudentIndex,
  onClick,
  onStudentClick,
  students = [],
  isDesignMode
}) => {
  const config = DESK_TYPES[desk.type];
  const rotation = desk.rotation || 0;

  const renderContent = () => {
    if (isDesignMode) {
      return (
        <div className="text-white font-semibold text-xs pointer-events-none">
          {config.label}
        </div>
      );
    }

    if (students.length === 0) {
      return (
        <div className="text-white/60 text-xs font-medium pointer-events-none">
          Ledigt
        </div>
      );
    }

    // For single capacity desks, show student name centered
    if (config.capacity === 1) {
      const student = students[0];
      const isStudentSelected = isSelected && selectedStudentIndex === 0;
      return (
        <div
          className={`text-white font-bold text-sm px-2 text-center break-words cursor-pointer transition-all ${
            isStudentSelected ? 'bg-green-500/40 scale-105' : ''
          }`}
          onClick={(e) => {
            if (!isDesignMode && student) {
              e.stopPropagation();
              onStudentClick?.(desk, 0);
            }
          }}
        >
          {student?.name}
          {student?.needsFront && (
            <div className="w-2 h-2 rounded-full bg-yellow-400 absolute top-2 right-2" title="Nära tavlan" />
          )}
          {student?.needsWall && (
            <div className="w-2 h-2 rounded-full bg-green-400 absolute top-2 left-2" title="Vid vägg" />
          )}
        </div>
      );
    }

    // For multiple capacity desks, show names in grid
    return (
      <div className="grid gap-1 p-2 w-full h-full" style={{
        gridTemplateColumns: config.capacity === 2 ? 'repeat(2, 1fr)' :
                           config.capacity === 4 ? 'repeat(2, 1fr)' :
                           config.capacity === 5 ? 'repeat(3, 1fr)' :
                           'repeat(3, 1fr)'
      }}>
        {Array.from({ length: config.capacity }).map((_, idx) => {
          const student = students[idx];
          const isStudentSelected = isSelected && selectedStudentIndex === idx;
          return (
            <div
              key={idx}
              className={`text-white text-[10px] font-semibold text-center bg-white/20 rounded px-1 flex items-center justify-center transition-all ${
                student && !isDesignMode ? 'cursor-pointer hover:bg-white/30' : ''
              } ${
                isStudentSelected ? 'bg-green-500/60 ring-2 ring-green-300 scale-110' : ''
              }`}
              onClick={(e) => {
                if (!isDesignMode && student) {
                  e.stopPropagation();
                  onStudentClick?.(desk, idx);
                }
              }}
            >
              {student ? (
                <span className="truncate">
                  {student.name}
                  {student.needsFront && <span className="text-yellow-400">●</span>}
                  {student.needsWall && <span className="text-green-400">●</span>}
                </span>
              ) : (
                <span className="text-white/40">-</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`desk-item absolute rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center bg-gradient-to-br ${config.color} ${
        isDesignMode ? 'cursor-move' : 'cursor-default'
      } ${
        isSelected ? 'ring-2 ring-green-300 z-50' : 'hover:shadow-xl'
      } ${isLocked ? 'ring-2 ring-purple-400' : ''}`}
      style={{
        left: desk.x + 'px',
        top: desk.y + 'px',
        width: config.width + 'px',
        height: config.height + 'px',
        transform: `rotate(${rotation}deg)`,
      }}
      onMouseDown={(e) => {
        if (isDesignMode) {
          onDragStart(desk, e);
        }
      }}
      onClick={(e) => {
        if (isDesignMode) {
          e.stopPropagation();
          onClick(desk);
        }
      }}
    >
      {renderContent()}

      {/* Delete button (design mode only) */}
      {isDesignMode && (
        <>
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10 print:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(desk.id);
            }}
          >
            <X size={14} />
          </button>
          <button
            className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10 print:hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              onRotate(desk, e);
            }}
            title="Håll och dra för att rotera"
          >
            <RotateCcw size={14} />
          </button>
        </>
      )}

      {/* Lock button (student mode only) */}
      {!isDesignMode && students.length > 0 && (
        <button
          className={`absolute bottom-1 right-1 p-1 rounded-lg transition-all hover:scale-110 print:hidden ${
            isLocked
              ? 'bg-purple-100 text-purple-600'
              : 'bg-white/30 text-white hover:bg-white/50'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(desk.id);
          }}
        >
          {isLocked ? <Lock size={12} fill="currentColor" /> : <Unlock size={12} />}
        </button>
      )}
    </div>
  );
};

const FreePositioningCanvas = ({
  isDesignMode,
  currentBrush,
  desks = [],
  onDesksChange,
  students = [],
  lockedDesks = new Set(),
  onToggleLock,
  onStudentAssignment,
  selectedDesk,
  onDeskSelect
}) => {
  const canvasRef = useRef(null);
  const [draggedDesk, setDraggedDesk] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nextDeskId, setNextDeskId] = useState(0);
  const [rotatingDesk, setRotatingDesk] = useState(null);
  const [rotationStart, setRotationStart] = useState(null);

  useEffect(() => {
    if (desks.length > 0) {
      const maxId = Math.max(...desks.map(d => d.id || 0));
      setNextDeskId(maxId + 1);
    }
  }, []);

  const handleCanvasClick = (e) => {
    if (!isDesignMode || !currentBrush) return;
    if (currentBrush === 'eraser') return;

    // Don't place if clicking on a desk (let desk handle its own click)
    if (e.target.closest('.desk-item')) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = Math.max(e.clientY - rect.top, 80); // Below whiteboard

    const config = DESK_TYPES[currentBrush];
    if (!config) return;

    const newDesk = {
      id: nextDeskId,
      type: currentBrush,
      x: x - config.width / 2,
      y: y - config.height / 2,
      capacity: config.capacity,
      students: []
    };

    onDesksChange([...desks, newDesk]);
    setNextDeskId(nextDeskId + 1);
  };

  const handleDeskDragStart = (desk, e) => {
    e.stopPropagation();
    setDraggedDesk(desk);
    const config = DESK_TYPES[desk.type];
    setDragOffset({
      x: e.clientX - desk.x,
      y: e.clientY - desk.y
    });
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Handle dragging
    if (draggedDesk) {
      const config = DESK_TYPES[draggedDesk.type];

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to canvas
      newX = Math.max(0, Math.min(newX, rect.width - config.width));
      newY = Math.max(80, Math.min(newY, rect.height - config.height));

      const updatedDesks = desks.map(d =>
        d.id === draggedDesk.id ? { ...d, x: newX, y: newY } : d
      );

      onDesksChange(updatedDesks);
      setDraggedDesk({ ...draggedDesk, x: newX, y: newY });
    }

    // Handle rotation
    if (rotatingDesk && rotationStart) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentAngle = Math.atan2(
        mouseY - rotationStart.centerY,
        mouseX - rotationStart.centerX
      ) * (180 / Math.PI);

      const angleDiff = currentAngle - rotationStart.startAngle;
      let newRotation = rotationStart.initialRotation + angleDiff;

      // Normalize to 0-360
      newRotation = ((newRotation % 360) + 360) % 360;

      const updatedDesks = desks.map(d =>
        d.id === rotatingDesk.id ? { ...d, rotation: Math.round(newRotation) } : d
      );

      onDesksChange(updatedDesks);
    }
  };

  const handleMouseUp = () => {
    setDraggedDesk(null);
    setRotatingDesk(null);
    setRotationStart(null);
  };

  useEffect(() => {
    if (draggedDesk || rotatingDesk) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedDesk, dragOffset, rotatingDesk, rotationStart, desks]);

  const handleDeleteDesk = (deskId) => {
    onDesksChange(desks.filter(d => d.id !== deskId));
  };

  const handleRotateStart = (desk, e) => {
    e.stopPropagation();
    const config = DESK_TYPES[desk.type];
    const deskCenterX = desk.x + config.width / 2;
    const deskCenterY = desk.y + config.height / 2;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const startAngle = Math.atan2(mouseY - deskCenterY, mouseX - deskCenterX) * (180 / Math.PI);

    setRotatingDesk(desk);
    setRotationStart({
      startAngle,
      initialRotation: desk.rotation || 0,
      centerX: deskCenterX,
      centerY: deskCenterY
    });
  };

  const handleDeskClick = (desk) => {
    if (isDesignMode) return;
    onDeskSelect?.(desk);
  };

  // Calculate statistics and bounding box for print
  const totalSeats = desks.reduce((sum, desk) => sum + desk.capacity, 0);
  const assignedStudents = desks.reduce((sum, desk) => sum + (desk.students?.length || 0), 0);

  // Calculate the actual bounding box of all desks for print optimization
  const calculateBoundingBox = () => {
    if (desks.length === 0) return { width: 1000, height: 700 };

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

    desks.forEach(desk => {
      const config = DESK_TYPES[desk.type];
      // Account for rotation - use a generous bounding box
      const diagonal = Math.sqrt(config.width ** 2 + config.height ** 2);
      const centerX = desk.x + config.width / 2;
      const centerY = desk.y + config.height / 2;

      minX = Math.min(minX, centerX - diagonal / 2);
      minY = Math.min(minY, centerY - diagonal / 2);
      maxX = Math.max(maxX, centerX + diagonal / 2);
      maxY = Math.max(maxY, centerY + diagonal / 2);
    });

    return {
      width: Math.max(1000, maxX + 50),
      height: Math.max(700, maxY + 50)
    };
  };

  const boundingBox = calculateBoundingBox();

  return (
    <div className="space-y-4 free-positioning-canvas-wrapper">
      {/* Statistics */}
      <div className="flex gap-6 justify-center bg-white p-4 rounded-xl border border-gray-100 print:hidden">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{desks.length}</div>
          <div className="text-xs text-gray-500">Bänkar</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalSeats}</div>
          <div className="text-xs text-gray-500">Platser</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{assignedStudents}</div>
          <div className="text-xs text-gray-500">Placerade</div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="free-positioning-canvas relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden print:overflow-visible print:shadow-none print:border print:rounded-none"
        style={{
          height: '700px',
          minHeight: '500px',
          width: '100%'
        }}
        onClick={handleCanvasClick}
      >
        {/* Whiteboard */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-lg tracking-widest shadow-lg z-10 border-b-4 border-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            WHITEBOARD
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>

        {/* Grid lines (subtle, for alignment help) */}
        <svg className="absolute inset-0 pointer-events-none opacity-10 print:hidden" style={{ zIndex: 1 }}>
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Desks */}
        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          {desks.map(desk => (
            <DeskItem
              key={desk.id}
              desk={desk}
              onDragStart={handleDeskDragStart}
              onDelete={handleDeleteDesk}
              onRotate={handleRotateStart}
              onToggleLock={onToggleLock}
              isLocked={lockedDesks.has(desk.id)}
              isSelected={selectedDesk?.deskId === desk.id}
              selectedStudentIndex={selectedDesk?.deskId === desk.id ? selectedDesk.studentIndex : -1}
              onClick={handleDeskClick}
              onStudentClick={onDeskSelect}
              students={desk.students || []}
              isDesignMode={isDesignMode}
            />
          ))}
        </div>

        {/* Empty state */}
        {desks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none print:hidden" style={{ zIndex: 2 }}>
            <div className="text-center text-gray-400 bg-white/80 p-8 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">🪑</div>
              <p className="font-semibold mb-2">Tomt klassrum</p>
              <p className="text-sm">
                {isDesignMode
                  ? 'Välj ett möbelverktyg och klicka för att placera bänkar'
                  : 'Växla till design-läge för att skapa klassrummet'
                }
              </p>
            </div>
          </div>
        )}

        {/* Cursor indicator in design mode */}
        {isDesignMode && currentBrush && currentBrush !== 'eraser' && (
          <div className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold pointer-events-none z-20 print:hidden">
            Placerar: {DESK_TYPES[currentBrush]?.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreePositioningCanvas;
