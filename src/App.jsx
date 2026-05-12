import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- 「何もしなくても進める」ゆったり設定 ---
  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;
  const FLOAT_STRENGTH = 0.03; // ふわふわ浮く力（自動）
  const GRAVITY = 0.1;         // 重力（極めて弱い）
  const JUMP_STRENGTH = -3.5;  // ジャンプ（さらに優しく）
  const PIPE_WIDTH = 40;
  const PIPE_GAP = 260;        // 隙間をさらに広く（画面の半分以上）
  const PIPE_SPEED = 1.5;      // スピードを「お散歩」レベルに落とす
  const SPAWN_RATE = 150;      // 土管の間隔をたっぷり空ける
  const HIT_BOX_MARGIN = 12;   // 判定を最大級に甘く

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
      // --- 自動浮遊ロジック ---
      // 何もしなくても画面の真ん中（250px）あたりに戻ろうとする力を加える
      const diff = 250 - birdY.current;
      velocity.current += diff * FLOAT_STRENGTH; 
      
      velocity.current += GRAVITY;
      velocity.current *= 0.95; // 速度にブレーキをかけて動きを滑らかに
      birdY.current += velocity.current;

      if (frame.current % SPAWN_RATE === 0) {
        // 土管の位置も、中央を通れば当たらないように調整
        const pipeHeight = Math.random() * 100 + 20; 
        pipes.current.push({ x: canvas.width, top: pipeHeight, passed: false });
      }

      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // 当たり判定
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

      // 画面外でも死なないように余裕を持たせる
      if (birdY.current > canvas.height + 50 || birdY.current < -100) setGameActive(false);
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();
      frame.current++;
    };

    const draw = () => {
      ctx.fillStyle = '#E0FFFF'; // さらに優しい空の色
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 背景の雲（お散歩感を出す）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(100, 80, 20, 0, Math.PI * 2);
      ctx.arc(120, 80, 25, 0, Math.PI * 2);
      ctx.arc(140, 80, 20, 0, Math.PI * 2);
      ctx.fill();

      // 土管
      ctx.fillStyle = '#98FB98';
      ctx.strokeStyle = '#3CB371';
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
      textAlign: 'center', backgroundColor: '#444', minHeight: '100vh', color: 'white', 
      fontFamily: 'sans-serif', userSelect: 'none', touchAction: 'none'
    }}>
      <h2 style={{ paddingTop: '20px', margin: 0 }}>インコののんびり散歩</h2>
      <p style={{ margin: '5px' }}>ハイスコア: {highScore} / スコア: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '8px solid #87CEEB', borderRadius: '20px', background: '#fff' }} />
        {!gameActive && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            background: 'rgba(255,255,255,0.95)', color: '#333', padding: '20px', borderRadius: '15px',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)', width: '220px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>またあそぼう！</h3>
            <button style={{ padding: '10px 30px', fontSize: '18px', borderRadius: '25px', border: 'none', background: '#4af14a', color: 'white', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <p style={{ padding: '10px', fontSize: '14px' }}>何もしなくてもふわふわ進むよ。<br/>タップすると少しだけ高く飛ぶよ！</p>
    </div>
  );
};

export default App;
