import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { playEatSound, playGameOverSound } from '../../utils/soundUtils';

const GRID_SIZE = 20;
const TILE_SIZE = 20;
const SPEED = 100;

interface Point {
  x: number;
  y: number;
}

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Game State Refs (to avoid closure staleness in loop)
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Point>({ x: 1, y: 0 }); // Moving right
  const nextDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const gameLoopRef = useRef<number | null>(null);

  const generateFood = useCallback((): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (canvasRef.current?.width || 400) / TILE_SIZE),
        y: Math.floor(Math.random() * (canvasRef.current?.height || 300) / TILE_SIZE)
      };
      // Check if food spawns on snake
      const onSnake = snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 5, y: 5 }];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    if (canvasRef.current) {
        foodRef.current = generateFood();
    }
  }, [generateFood]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear background
    ctx.fillStyle = '#111827'; // Tailwind gray-900
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Grid lines (optional, for cyber look)
    ctx.strokeStyle = '#1f2937'; // gray-800
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= ctx.canvas.width; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ctx.canvas.height; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    // Draw Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3b82f6'; // blue-500 glow
    ctx.fillStyle = '#3b82f6';
    snakeRef.current.forEach((segment, index) => {
      // Head is slightly different color
      if (index === 0) ctx.fillStyle = '#60a5fa'; // blue-400
      else ctx.fillStyle = '#2563eb'; // blue-600

      ctx.fillRect(
        segment.x * TILE_SIZE + 1,
        segment.y * TILE_SIZE + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2
      );
    });

    // Draw Food
    ctx.shadowColor = '#ef4444'; // red-500 glow
    ctx.fillStyle = '#ef4444';
    const food = foodRef.current;
    ctx.beginPath();
    ctx.arc(
      food.x * TILE_SIZE + TILE_SIZE / 2,
      food.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

  }, []);

  const update = useCallback(() => {
    if (gameOver) return;

    const head = { ...snakeRef.current[0] };
    directionRef.current = nextDirectionRef.current;
    
    head.x += directionRef.current.x;
    head.y += directionRef.current.y;

    // Wall Wrapping
    const widthTiles = (canvasRef.current?.width || 0) / TILE_SIZE;
    const heightTiles = (canvasRef.current?.height || 0) / TILE_SIZE;

    if (head.x < 0) head.x = widthTiles - 1;
    if (head.x >= widthTiles) head.x = 0;
    if (head.y < 0) head.y = heightTiles - 1;
    if (head.y >= heightTiles) head.y = 0;

    // Check Self Collision
    if (snakeRef.current.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      playGameOverSound();
      return;
    }

    // Move Snake
    snakeRef.current.unshift(head);

    // Check Food
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore(s => {
        const newScore = s + 10;
        setHighScore(h => Math.max(h, newScore));
        return newScore;
      });
      foodRef.current = generateFood();
      playEatSound();
    } else {
      snakeRef.current.pop();
    }

  }, [gameOver, generateFood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial setup
    foodRef.current = generateFood();

    const loop = setInterval(() => {
      update();
      draw(ctx);
    }, SPEED);

    return () => clearInterval(loop);
  }, [update, draw, generateFood]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Game Over Restart
      if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          resetGame();
          return;
      }

      // Prevent scrolling when using arrows
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (gameOver) return;

      const currentDir = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
          if (currentDir.y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (currentDir.y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (currentDir.x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (currentDir.x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, resetGame]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-2 left-4 text-xs font-mono text-blue-400">分数: {score}</div>
      <div className="absolute top-2 right-4 text-xs font-mono text-yellow-500">最高: {highScore}</div>
      
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="rounded-lg border border-gray-700 bg-gray-900 shadow-2xl shadow-blue-500/10"
      />

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">游戏结束</h3>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
        使用方向键移动
      </div>
    </div>
  );
};
