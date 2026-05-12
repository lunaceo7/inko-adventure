import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- 「超かんたん・初心者モード」の調整 ---
  const BIRD_WIDTH = 24;    // さらに小さく（当たりにくく）
  const BIRD_HEIGHT = 18;   
  const GRAVITY = 0.15;     // かなりふわふわ（ゆっくり落ちる）
  const JUMP_STRENGTH = -4; // ジャンプも優しく
  const PIPE_WIDTH = 40;    
  const PIPE_GAP = 240;     // 隙間を特大に（インコ10匹分くらい通れる）
  const PIPE_SPEED = 2;     // スクロールをゆっくりに
  const SPAWN_RATE = 120;   // 土管の間隔をさらに広く
  const HIT_BOX_MARGIN = 10; // 判定をめちゃくちゃ甘く（ほぼ重ならないと死なない）

  const birdY = useRef(250);
  const velocity = useRef(0);
  const pipes = useRef([]);
  const frame = useRef(0);

  const startGame = () => {
    birdY.current = 250;
    velocity.current = 0;
    pipes.current = [];
    frame.current = 0;
    setScore(0);
    setGameActive(true);
  };

  const jump = (e) => {
    if (e) e.preventDefault();
    if (gameActive) {
      velocity.current = JUMP_STRENGTH;
    } else {
      startGame();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const update = () => {
      velocity.current += GRAVITY;
      birdY.current += velocity.current;

      if (frame.current % SPAWN_RATE === 0) {
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - PIPE_GAP - 50;
        const pipeHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
        pipes.current.push({ x: canvas.width, top: pipeHeight, passed: false });
      }

      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // 判定を大幅に緩和
        const birdLeft = 50 + HIT_BOX_MARGIN;
        const birdRight = 50 + BIRD_WIDTH - HIT_BOX_MARGIN;
        const birdTop = birdY.current + HIT_BOX_MARGIN;
        const birdBottom = birdY.current + BIRD_HEIGHT - HIT_BOX_MARGIN;

        if (
          birdRight > pipe.x &&
          birdLeft < pipe.x + PIPE_WIDTH &&
          (birdTop < pipe.top || birdBottom > pipe.top + PIPE_GAP)
        ) {
          setGameActive(false);
        }

        if (!pipe.passed && pipe.x < 50) {
          pipe.passed = true;
          setScore((s) => {
            const newScore = s + 1;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
        }
      });

      // 画面の下に行きすぎても、少し余裕を持たせる
      if (birdY.current > canvas.height + 20 || birdY.current < -100) setGameActive(false);
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();

      frame.current++;
    };

    const draw = () => {
      ctx.fillStyle = '#AEEEEE'; // より明るい空
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 土管
      ctx.fillStyle = '#90EE90'; 
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 2;
      pipes.current.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height);
        ctx.strokeRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height);
      });

      // インコ（さらに小さく可愛いサイズ）
      const bx = 50;
      const by = birdY.current;
      ctx.fillStyle = '#4af14a'; // 体
      ctx.fillRect(bx, by, BIRD_WIDTH, BIRD_HEIGHT);
      ctx.fillStyle = '#fff700'; // 頭
      ctx.fillRect(bx + 10, by, 14, 10);
      ctx.fillStyle = '#000';    // 目
      ctx.fillRect(bx + 18, by + 2, 2, 2);
    };

    const loop = () => {
      update();
      draw();
      if (gameActive) requestAnimationFrame(loop);
    };

    const animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameActive, highScore]);

  return (
    <div onMouseDown={jump} style={{ 
      textAlign: 'center', backgroundColor: '#333', minHeight: '100vh', color: 'white', 
      fontFamily: 'sans-serif', userSelect: 'none', touchAction: 'none'
    }}>
      <h2 style={{ paddingTop: '20px' }}>インコの大冒険（らくらくモード）</h2>
      <p>ハイスコア: {highScore} / 今のスコア: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '5px solid #FFD700', borderRadius: '10px', background: '#fff' }} />
        {!gameActive && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            background: 'rgba(255,255,255,0.9)', color: '#333', padding: '20px', borderRadius: '10px',
            boxShadow: '0 0 15px rgba(0,0,0,0.5)'
          }}>
            <h3>またあそぼう！</h3>
            <button style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <p style={{ color: '#ccc' }}>クリックかスペースキーで、インコがふわふわ飛ぶよ！</p>
    </div>
  );
};

export default App;
