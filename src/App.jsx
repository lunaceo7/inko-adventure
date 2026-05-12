import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- お助けモードの設定 ---
  const SAFE_PIPES_COUNT = 3; // 最初の3本までは絶対死なない
  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;
  const GRAVITY = 0.15;
  const JUMP_STRENGTH = -4;
  const PIPE_WIDTH = 40;
  const PIPE_GAP = 240;
  const PIPE_SPEED = 2;
  const SPAWN_RATE = 120;
  const HIT_BOX_MARGIN = 10;

  const birdY = useRef(250);
  const velocity = useRef(0);
  const pipes = useRef([]);
  const frame = useRef(0);
  const pipesPassedCount = useRef(0); // 通過した土管の数

  const startGame = () => {
    birdY.current = 250;
    velocity.current = 0;
    pipes.current = [];
    frame.current = 0;
    pipesPassedCount.current = 0;
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
      // --- お助け機能：最初の方は落ちないようにする ---
      if (pipesPassedCount.current < SAFE_PIPES_COUNT) {
        // 最初はふわふわ真ん中に留まるように速度を調整
        velocity.current *= 0.9; 
        birdY.current += (250 - birdY.current) * 0.05; 
      } else {
        // 規定数を超えたら通常の重力を適用
        velocity.current += GRAVITY;
        birdY.current += velocity.current;
      }

      if (frame.current % SPAWN_RATE === 0) {
        const minPipeHeight = 100;
        const maxPipeHeight = canvas.height - PIPE_GAP - 100;
        const pipeHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
        pipes.current.push({ x: canvas.width, top: pipeHeight, passed: false });
      }

      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // 無敵モード中は判定をスルー
        if (pipesPassedCount.current >= SAFE_PIPES_COUNT) {
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
        }

        if (!pipe.passed && pipe.x < 50) {
          pipe.passed = true;
          pipesPassedCount.current += 1;
          setScore((s) => {
            const newScore = s + 1;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
        }
      });

      // 画面外判定（無敵モード中は落ちない）
      if (pipesPassedCount.current >= SAFE_PIPES_COUNT) {
        if (birdY.current > canvas.height || birdY.current < -50) setGameActive(false);
      }
      
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();
      frame.current++;
    };

    const draw = () => {
      ctx.fillStyle = '#AEEEEE';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 無敵モード中のメッセージ
      if (pipesPassedCount.current < SAFE_PIPES_COUNT) {
        ctx.fillStyle = '#ff6600';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('れんしゅうモード：おちないよ！', canvas.width/2, 50);
      }

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

      // インコ
      const bx = 50;
      const by = birdY.current;
      ctx.fillStyle = '#4af14a';
      ctx.fillRect(bx, by, BIRD_WIDTH, BIRD_HEIGHT);
      ctx.fillStyle = '#fff700';
      ctx.fillRect(bx + 10, by, 14, 10);
      ctx.fillStyle = '#000';
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
      <h2 style={{ paddingTop: '20px' }}>インコの大冒険（むてきタイム付）</h2>
      <p>ハイスコア: {highScore} / スコア: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '5px solid #FFD700', borderRadius: '10px', background: '#fff' }} />
        {!gameActive && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            background: 'rgba(255,255,255,0.9)', color: '#333', padding: '20px', borderRadius: '10px',
            boxShadow: '0 0 15px rgba(0,0,0,0.5)', width: '200px'
          }}>
            <h3>またあそぼう！</h3>
            <p>クリックしてスタート</p>
          </div>
        )}
      </div>
      <p style={{ padding: '10px' }}>最初は自動で飛ぶよ！<br/>なれてきたらタップしてね。</p>
    </div>
  );
};

export default App;
