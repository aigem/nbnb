import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { playJumpSound, playScoreSound, playGameOverSound } from '../../utils/soundUtils';

// --- Constants ---
const CANVAS_HEIGHT = 300;
const GROUND_Y = 250;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 47;
const DINO_DUCK_HEIGHT = 26;
const INITIAL_SPEED = 7.5;
const MAX_SPEED = 25;
const SPEED_INCREMENT = 0.0025;
const MIN_OBSTACLE_GAP = 200;

// --- Types ---
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Dino extends GameObject {
  dy: number;
  jumpPower: number;
  isJumping: boolean;
  isDucking: boolean;
  grounded: boolean;
  status: 'running' | 'ducking' | 'jumping' | 'crashed';
}

enum ObstacleType {
  CACTUS_SMALL = 'CACTUS_SMALL',
  CACTUS_LARGE = 'CACTUS_LARGE',
  BIRD = 'BIRD'
}

interface Obstacle extends GameObject {
  type: ObstacleType;
  speedOffset: number;
  frame: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  size: number;
}

type GameStatus = 'START' | 'PLAYING' | 'GAME_OVER';

// --- Drawing Helpers ---

const drawDino = (ctx: CanvasRenderingContext2D, dino: Dino, frame: number) => {
  ctx.fillStyle = '#535353';
  const x = dino.x;
  const y = dino.y;
  const w = dino.width;
  const h = dino.height;

  if (dino.status === 'crashed') {
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w - 15, y + 5, 5, 5); // Dead Eye
    ctx.fillStyle = '#535353';
    ctx.fillRect(x + w - 14, y + 6, 3, 3); 
  } else {
    ctx.fillRect(x, y, w, h); // Body
    ctx.fillRect(x - 5, y + h - 15, 5, 10); // Tail
    ctx.fillRect(x + w, y, 10, 20); // Snout
    
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(x + w - 10, y + 2, 4, 4); // Eye
    ctx.fillStyle = '#535353';

    if (dino.status !== 'jumping') {
        const isLeg1 = Math.floor(frame / 5) % 2 === 0;
        ctx.fillStyle = '#f7f7f7'; // Erase leg parts to animate
        if (isLeg1) {
            ctx.fillRect(x + 5, y + h - 5, 10, 5);
        } else {
            ctx.fillRect(x + w - 15, y + h - 5, 10, 5);
        }
        ctx.fillStyle = '#535353';
    }
  }
};

const drawCactus = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
  ctx.fillStyle = '#535353';
  const { x, y, width, height } = obs;
  
  ctx.fillRect(x + width / 3, y, width / 3, height); // Stem
  
  if (obs.type === ObstacleType.CACTUS_LARGE) {
     ctx.fillRect(x, y + 10, width / 3, 5);
     ctx.fillRect(x, y + 10, 5, 20);
  }
  
  ctx.fillRect(x + width * 0.66, y + 15, width / 3, 5);
  ctx.fillRect(x + width - 5, y + 5, 5, 15);
};

const drawBird = (ctx: CanvasRenderingContext2D, obs: Obstacle, frame: number) => {
    ctx.fillStyle = '#535353';
    const { x, y, width, height } = obs;
    const wingUp = Math.floor(frame / 10) % 2 === 0;

    ctx.fillRect(x, y + height / 2, width, height / 3); // Body
    ctx.fillRect(x, y + height / 2 - 5, 10, 10); // Head

    if (wingUp) {
        ctx.fillRect(x + 10, y, 10, height / 2);
    } else {
        ctx.fillRect(x + 10, y + height / 2, 10, height / 2);
    }
};

const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud) => {
    ctx.fillStyle = '#d1d5db'; 
    const { x, y, size } = cloud;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y - size * 0.5, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();
};

const drawGround = (ctx: CanvasRenderingContext2D, width: number, offset: number) => {
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(width, GROUND_Y);
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ground noise
    ctx.fillStyle = '#535353';
    const dotSeed = Math.floor(offset / 100); 
    for(let i=0; i<10; i++) {
        const dx = ((dotSeed * 137 + i * 50) % width);
        if (dx > 0 && dx < width) {
             ctx.fillRect(dx, GROUND_Y + 5 + (i % 3) * 2, 2, 2);
        }
    }
};

export const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const frameRef = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const nextSpawnGapRef = useRef<number>(400);
  const canvasWidthRef = useRef<number>(800); // Track current width
  
  const [gameState, setGameState] = useState<GameStatus>('START');
  const [highScore, setHighScore] = useState(0);

  const dinoRef = useRef<Dino>({
    x: 50, y: GROUND_Y - DINO_HEIGHT, width: DINO_WIDTH, height: DINO_HEIGHT,
    dy: 0, jumpPower: JUMP_FORCE, isJumping: false, isDucking: false, grounded: true, status: 'running'
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const speedRef = useRef<number>(INITIAL_SPEED);
  const distanceRef = useRef<number>(0);

  // --- Logic ---

  const spawnObstacle = () => {
    const typeProb = Math.random();
    let type = ObstacleType.CACTUS_SMALL;
    let width = 20 + Math.random() * 20;
    let height = 35 + Math.random() * 15;
    let y = GROUND_Y - height;

    const currentScore = scoreRef.current;
    const birdChance = currentScore > 400 ? 0.25 : (currentScore > 150 ? 0.15 : 0);
    const largeCactusChance = currentScore > 100 ? 0.5 : 0.1;

    if (birdChance > 0 && typeProb < birdChance) {
        type = ObstacleType.BIRD;
        width = 40;
        height = 30;
        const heightRoll = Math.random();
        if (heightRoll < 0.35) y = GROUND_Y - 20;
        else if (heightRoll < 0.70) y = GROUND_Y - 50;
        else y = GROUND_Y - 75;
    } else if (Math.random() < largeCactusChance) {
        type = ObstacleType.CACTUS_LARGE;
        width = 30 + Math.random() * 20;
        height = 50 + Math.random() * 20;
        y = GROUND_Y - height;
    }

    obstaclesRef.current.push({
      x: canvasWidthRef.current, // Spawn at dynamic edge
      y,
      width,
      height,
      type,
      speedOffset: type === ObstacleType.BIRD ? (Math.random() * 1.5 + 0.5) : 0,
      frame: 0
    });
  };

  const spawnCloud = () => {
      cloudsRef.current.push({
          x: canvasWidthRef.current,
          y: Math.random() * (GROUND_Y - 100),
          speed: Math.random() * 0.5 + 0.1,
          size: Math.random() * 15 + 10
      });
  };

  const resetGame = () => {
    dinoRef.current = {
      x: 50, y: GROUND_Y - DINO_HEIGHT, width: DINO_WIDTH, height: DINO_HEIGHT,
      dy: 0, jumpPower: JUMP_FORCE, isJumping: false, isDucking: false, grounded: true, status: 'running'
    };
    obstaclesRef.current = [];
    cloudsRef.current = [];
    scoreRef.current = 0;
    distanceRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    frameRef.current = 0;
    nextSpawnGapRef.current = 400;
    setGameState('PLAYING');
    
    // Pre-seed
    spawnCloud();
    spawnCloud();
  };

  const update = () => {
    const dino = dinoRef.current;
    const currentSpeed = speedRef.current;
    const canvasWidth = canvasWidthRef.current;
    
    // Physics
    if (dino.isJumping) {
      dino.dy += GRAVITY;
      dino.y += dino.dy;
      
      if (dino.y > GROUND_Y - dino.height) {
        dino.y = GROUND_Y - dino.height;
        dino.dy = 0;
        dino.isJumping = false;
        dino.grounded = true;
        dino.status = dino.isDucking ? 'ducking' : 'running';
      } else {
          dino.grounded = false;
          dino.status = 'jumping';
      }
    } else if (dino.status === 'ducking') {
         dino.y = GROUND_Y - DINO_DUCK_HEIGHT;
    } else {
         dino.y = GROUND_Y - DINO_HEIGHT;
    }

    // Spawning
    const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
    const lastObsX = lastObs ? lastObs.x + lastObs.width : -999;
    const gapFromEdge = canvasWidth - lastObsX;

    if (gapFromEdge > nextSpawnGapRef.current) {
        spawnObstacle();
        const minGap = MIN_OBSTACLE_GAP + (currentSpeed * 15);
        const randomGap = Math.random() * (300 + (currentSpeed * 5)); 
        nextSpawnGapRef.current = minGap + randomGap;
    }

    // Move Obstacles
    obstaclesRef.current.forEach(obs => {
        obs.x -= currentSpeed + (obs.type === ObstacleType.BIRD ? obs.speedOffset : 0);
    });
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > -100);

    // Move Clouds
    if (Math.random() < 0.01) spawnCloud();
    cloudsRef.current.forEach(c => c.x -= c.speed);
    cloudsRef.current = cloudsRef.current.filter(c => c.x + c.size * 3 > -50);

    // Collision
    const hitBoxBuffer = 10; 
    for (const obs of obstaclesRef.current) {
        if (
            dino.x < obs.x + obs.width - hitBoxBuffer &&
            dino.x + dino.width > obs.x + hitBoxBuffer &&
            dino.y < obs.y + obs.height - hitBoxBuffer &&
            dino.y + dino.height > obs.y + hitBoxBuffer
        ) {
            handleGameOver();
            return;
        }
    }

    // Score
    distanceRef.current += currentSpeed;
    const newScore = Math.floor(distanceRef.current / 10);
    
    if (newScore > scoreRef.current) {
       scoreRef.current = newScore;
       if (newScore > 0 && newScore % 100 === 0) {
           playScoreSound();
       }
    }

    if (speedRef.current < MAX_SPEED) {
        speedRef.current += SPEED_INCREMENT;
    }

    frameRef.current++;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const width = canvasWidthRef.current;
    ctx.clearRect(0, 0, width, CANVAS_HEIGHT);
    
    cloudsRef.current.forEach(c => drawCloud(ctx, c));
    drawGround(ctx, width, distanceRef.current);

    obstaclesRef.current.forEach(obs => {
        if (obs.type === ObstacleType.BIRD) {
            drawBird(ctx, obs, frameRef.current);
        } else {
            drawCactus(ctx, obs);
        }
    });

    drawDino(ctx, dinoRef.current, frameRef.current);

    // Draw Score on Canvas
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    const scoreText = `HI ${highScore.toString().padStart(5, '0')}  ${scoreRef.current.toString().padStart(5, '0')}`;
    ctx.fillText(scoreText, width - 20, 30);
  };

  const loop = () => {
    if (gameState !== 'PLAYING') return;
    update();
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
    }
    animationFrameId.current = requestAnimationFrame(loop);
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    dinoRef.current.status = 'crashed';
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
    }
    playGameOverSound();
    cancelAnimationFrame(animationFrameId.current);
    
    if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('dino-highscore', scoreRef.current.toString());
    }
  };

  const handleJump = useCallback(() => {
     if (gameState !== 'PLAYING') {
         if (gameState === 'GAME_OVER' || gameState === 'START') {
             resetGame();
         }
         return;
     }

     const dino = dinoRef.current;
     if (dino.grounded && !dino.isDucking) { 
         dino.isJumping = true;
         dino.grounded = false;
         dino.dy = dino.jumpPower;
         dino.status = 'jumping';
         playJumpSound();
     }
  }, [gameState]);

  const handleDuck = useCallback((down: boolean) => {
      if (gameState !== 'PLAYING') return;
      const dino = dinoRef.current;
      
      if (down) {
          if (!dino.isJumping) {
              dino.isDucking = true;
              dino.height = DINO_DUCK_HEIGHT;
              dino.width = 55;
              dino.status = 'ducking';
          } else {
              dino.dy += 5; // Fast drop
          }
      } else {
          dino.isDucking = false;
          dino.height = DINO_HEIGHT;
          dino.width = DINO_WIDTH;
          if (dino.grounded) dino.status = 'running';
      }
  }, [gameState]);

  useEffect(() => {
    const stored = localStorage.getItem('dino-highscore');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      animationFrameId.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState]);

  // Resize & Init Draw
  useEffect(() => {
      const canvas = canvasRef.current;
      if(!canvas) return;
      
      const resize = () => {
          if (canvas.parentElement) {
              canvas.width = canvas.parentElement.clientWidth;
              canvas.height = CANVAS_HEIGHT;
              canvasWidthRef.current = canvas.width;
              
              // Redraw current state if stopped
              if (gameState !== 'PLAYING') {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      if (gameState === 'START') {
                          ctx.clearRect(0,0, canvas.width, CANVAS_HEIGHT);
                          drawGround(ctx, canvas.width, 0);
                          drawDino(ctx, dinoRef.current, 0);
                          ctx.fillStyle = '#535353';
                          ctx.font = '20px monospace';
                          ctx.textAlign = 'center';
                          ctx.fillText("按空格键跳跃", canvas.width / 2, CANVAS_HEIGHT / 2 - 20);
                      } else {
                          draw(ctx);
                      }
                  }
              }
          }
      };
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
  }, [gameState]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            handleJump();
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            handleDuck(true);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'ArrowDown') {
            handleDuck(false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDuck]);

  return (
    <div className="relative flex flex-col items-center w-full select-none">
      <canvas
        ref={canvasRef}
        className="rounded-lg w-full bg-gray-50 block"
        onClick={handleJump}
      />

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg z-20">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">游戏结束</h3>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      )}
      
      <div className="mt-2 text-[10px] text-gray-400 font-mono">
        空格/上方向键跳跃，下方向键下蹲
      </div>
    </div>
  );
};
