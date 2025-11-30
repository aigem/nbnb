import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Play, Pause, Eraser } from 'lucide-react';
import { playPopSound } from '../../utils/soundUtils';

const CELL_SIZE = 10;
const SPEED = 100;

export const LifeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [generation, setGeneration] = useState(0);
  
  const gridRef = useRef<boolean[][]>([]);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const frameRef = useRef<number>(0);
  const lastUpdateRef = useRef(0);
  const lastSoundRef = useRef(0);

  const initGrid = useCallback((width: number, height: number) => {
    const cols = Math.floor(width / CELL_SIZE);
    const rows = Math.floor(height / CELL_SIZE);
    colsRef.current = cols;
    rowsRef.current = rows;

    const newGrid = new Array(cols).fill(null).map(() => new Array(rows).fill(false));
    
    // Randomize start
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        newGrid[i][j] = Math.random() > 0.85; // 15% chance of life - Cleaner start
      }
    }
    
    gridRef.current = newGrid;
    setGeneration(0);
  }, []);

  const computeNextGen = () => {
    const grid = gridRef.current;
    const cols = colsRef.current;
    const rows = rowsRef.current;
    if (!grid || grid.length === 0) return;

    const nextGrid = grid.map(arr => [...arr]);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const state = grid[i][j];
        
        // Count neighbors
        let neighbors = 0;
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            if (x === 0 && y === 0) continue;
            const col = (i + x + cols) % cols;
            const row = (j + y + rows) % rows;
            if (grid[col][row]) neighbors++;
          }
        }

        // Rules
        if (state && (neighbors < 2 || neighbors > 3)) {
          nextGrid[i][j] = false;
        } else if (!state && neighbors === 3) {
          nextGrid[i][j] = true;
        }
      }
    }

    gridRef.current = nextGrid;
    setGeneration(g => g + 1);
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#030712'; // gray-950
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#8b5cf6'; // purple-500
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#8b5cf6';

    const grid = gridRef.current;
    if (!grid) return;

    for (let i = 0; i < colsRef.current; i++) {
      for (let j = 0; j < rowsRef.current; j++) {
        if (grid[i][j]) {
          ctx.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 300;
            initGrid(canvas.width, canvas.height);
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      if (isRunning && time - lastUpdateRef.current > SPEED) {
        computeNextGen();
        lastUpdateRef.current = time;
      }
      draw(ctx, canvas.width, canvas.height);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(frameRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [draw, initGrid, isRunning]);

  // Keyboard Controls
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
              e.preventDefault();
              setIsRunning(prev => !prev);
          }
          if (e.code === 'KeyR' || e.code === 'Enter') {
              e.preventDefault();
              initGrid(canvasRef.current?.width || 0, canvasRef.current?.height || 0);
          }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [initGrid]);

  const handleInteract = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < colsRef.current && y >= 0 && y < rowsRef.current) {
        gridRef.current[x][y] = !gridRef.current[x][y];
        
        // Play sound with throttle
        const now = Date.now();
        if (now - lastSoundRef.current > 50) {
            playPopSound();
            lastSoundRef.current = now;
        }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      <div className="absolute top-2 left-4 text-xs font-mono text-purple-400 z-10 pointer-events-none">
        代数: {generation}
      </div>
      
      <div className="absolute top-2 right-4 flex gap-2 z-10">
        <button 
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 bg-gray-800/50 rounded hover:bg-gray-700 text-white backdrop-blur-sm transition"
        >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button 
            onClick={() => initGrid(canvasRef.current?.width || 0, canvasRef.current?.height || 0)}
            className="p-1 bg-gray-800/50 rounded hover:bg-gray-700 text-white backdrop-blur-sm transition"
        >
            <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="rounded-lg border border-gray-800 bg-gray-950 shadow-2xl shadow-purple-900/20 w-full touch-none cursor-crosshair"
        onMouseDown={handleInteract}
        onTouchMove={handleInteract} // Allow drawing
        onTouchStart={handleInteract}
        onMouseMove={(e) => {
            if (e.buttons === 1) handleInteract(e);
        }}
      />
      
      <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
        在屏幕上绘制以创造生命
      </div>
    </div>
  );
};
