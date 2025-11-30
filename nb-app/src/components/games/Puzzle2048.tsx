import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { playMergeSound } from '../../utils/soundUtils';

export const Puzzle2048: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  
  const touchStartRef = useRef({ x: 0, y: 0 });

  const initGame = useCallback(() => {
    const newBoard = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    addNewTile(newBoard);
    addNewTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  }, []);

  const addNewTile = (grid: number[][]) => {
    const emptyCells = [];
    for(let i=0; i<4; i++){
      for(let j=0; j<4; j++){
        if(grid[i][j] === 0) emptyCells.push({r:i, c:j});
      }
    }
    if(emptyCells.length > 0){
      const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if(gameOver) return;

    let rotated = [...board];
    let moved = false;
    let scoreAdd = 0;

    // Rotate board to handle all moves as LEFT moves
    const rotate = (mat: number[][]) => {
        const N = 4;
        const res = Array(N).fill(0).map(() => Array(N).fill(0));
        for(let i=0; i<N; i++) for(let j=0; j<N; j++) res[j][N-1-i] = mat[i][j];
        return res;
    };

    // Rotate 0, 1, 2, 3 times depending on direction
    let rotations = 0;
    if (direction === 'UP') rotations = 1; // LEFT -> UP requires rotate -90? Wait. 
    // Let's simplify: Standardize to LEFT logic
    // UP: Rotate -90 (3 times) -> LEFT -> Rotate +90 (1 time)
    // DOWN: Rotate +90 (1 time) -> LEFT -> Rotate -90 (3 times)
    // RIGHT: Rotate 180 (2 times) -> LEFT -> Rotate 180 (2 times)
    // LEFT: 0 times
    
    // Actually simpler manual implementation
    if (direction === 'UP') { rotated = rotate(rotate(rotate(rotated))); rotations = 3; }
    else if (direction === 'RIGHT') { rotated = rotate(rotate(rotated)); rotations = 2; }
    else if (direction === 'DOWN') { rotated = rotate(rotated); rotations = 1; }

    // Shift & Merge Left
    for (let i = 0; i < 4; i++) {
        let row = rotated[i].filter(val => val !== 0);
        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
                row[j] *= 2;
                scoreAdd += row[j];
                row[j + 1] = 0;
            }
        }
        row = row.filter(val => val !== 0);
        while (row.length < 4) row.push(0);
        
        if (row.join(',') !== rotated[i].join(',')) moved = true;
        rotated[i] = row;
    }

    // Rotate back
    for(let i=0; i<(4-rotations)%4; i++) rotated = rotate(rotated);

    if (moved) {
        addNewTile(rotated);
        setBoard(rotated);
        setScore(s => {
            const newS = s + scoreAdd;
            setBestScore(b => Math.max(b, newS));
            return newS;
        });
        if (checkGameOver(rotated)) setGameOver(true);
        playMergeSound();
    }
  }, [board, gameOver]);

  const checkGameOver = (grid: number[][]) => {
      // Check empty
      for(let i=0; i<4; i++) for(let j=0; j<4; j++) if(grid[i][j] === 0) return false;
      // Check merges
      for(let i=0; i<4; i++){
          for(let j=0; j<4; j++){
              if(j<3 && grid[i][j] === grid[i][j+1]) return false;
              if(i<3 && grid[i][j] === grid[i+1][j]) return false;
          }
      }
      return true;
  };

  useEffect(() => {
      initGame();
  }, [initGame]);

  // Keyboard
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          // Restart on Game Over
          if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              initGame();
              return;
          }

          if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)){
              e.preventDefault();
              if(e.key === 'ArrowUp') move('UP');
              if(e.key === 'ArrowDown') move('DOWN');
              if(e.key === 'ArrowLeft') move('LEFT');
              if(e.key === 'ArrowRight') move('RIGHT');
          }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [move, gameOver, initGame]);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
          if(dx > 0) move('RIGHT'); else move('LEFT');
      } else if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30) {
          if(dy > 0) move('DOWN'); else move('UP');
      }
  };

  const getCellColor = (val: number) => {
      const colors: Record<number, string> = {
          0: 'bg-gray-200/50',
          2: 'bg-white text-gray-800',
          4: 'bg-orange-100 text-gray-800',
          8: 'bg-orange-200 text-white',
          16: 'bg-orange-300 text-white',
          32: 'bg-orange-400 text-white',
          64: 'bg-orange-500 text-white',
          128: 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50',
          256: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50',
          512: 'bg-yellow-600 text-white',
          1024: 'bg-yellow-700 text-white',
          2048: 'bg-yellow-800 text-white',
      };
      return colors[val] || 'bg-gray-900 text-white';
  };

  return (
    <div className="relative flex flex-col items-center w-full select-none">
      <div className="flex w-full justify-between px-4 mb-4">
          <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">分数</span>
              <span className="text-xl font-bold text-gray-700">{score}</span>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">最高分</span>
              <span className="text-xl font-bold text-gray-700">{bestScore}</span>
          </div>
      </div>

      <div 
        className="relative bg-gray-300/30 p-2 rounded-xl touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
          <div className="grid grid-cols-4 gap-2">
              {board.map((row, i) => row.map((val, j) => (
                  <div 
                    key={`${i}-${j}`}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-bold text-2xl transition-all duration-200 ${getCellColor(val)}`}
                  >
                      {val > 0 && val}
                  </div>
              )))}
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">游戏结束</h3>
                <button 
                    onClick={initGame}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
                >
                    <RefreshCw className="h-4 w-4" /> 重试
                </button>
            </div>
          )}
      </div>
      
      <div className="mt-4 text-[10px] text-gray-400 font-mono">
        滑动或使用方向键合并数字
      </div>
    </div>
  );
};
