import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // ゲームの定数
  const BIRD_SIZE = 30;
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -7;
  const PIPE_WIDTH = 50;
  const PIPE_GAP = 150;

  // ゲーム状態
  const birdY = useRef(200);
  const velocity = useRef(0);
  const pipes = useRef([]);
  const frame = useRef(0);

  const startGame = () => {
    birdY.current = 200;
    velocity.current = 0;
    pipes.current = [];
    setScore(0);
    setGameActive(true);
  };

  const jump = () => {
    if (gameActive) {
      velocity.current = JUMP_STRENGTH;
    } else {
      startGame();
    }
  };

  useEffect(() => {
    if (!gameActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const update = () => {
      // インコの物理演算
      velocity.current += GRAVITY;
      birdY.current += velocity.current;

      // 土管の生成
      if (frame.current % 100 === 0) {
        const pipeHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.current.push({ x: canvas.width, top: pipeHeight });
      }

      // 土管の移動と判定
      pipes.current.forEach((pipe, index) => {
        pipe.x -= 4;

        // 当たり判定
        if (
          50 < pipe.x + PIPE_WIDTH &&
          50 + BIRD_SIZE > pipe.x &&
          (birdY.current < pipe.top || birdY.current + BIRD_SIZE > pipe.top + PIPE_GAP)
        ) {
          setGameActive(false);
        }

        // スコア加算
        if (pipe.x === 50) setScore((s) => s + 1);
      });

      // 画面外判定
      if (birdY.current > canvas.height || birdY.current < 0) setGameActive(false);

      // 古い土管を削除
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();

      frame.current++;
    };

    const draw = () => {
      ctx.fillStyle = '#87CEEB'; // 空の色
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // インコ（緑色）
      ctx.fillStyle = '#4af14a';
      ctx.fillRect(50, birdY.current, BIRD_SIZE, BIRD_SIZE);

      // 土管
      ctx.fillStyle = '#228B22';
      pipes.current.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top); // 上の土管
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height); // 下の土管
      });
    };

    const loop = () => {
      update();
      draw();
      if (gameActive) requestAnimationFrame(loop);
    };

    const animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameActive]);

  return (
    <div onClick={jump} style={{ textAlign: 'center', color: 'white' }}>
      <h1>インコの大冒険</h1>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="400" height="500" style={{ border: '4px solid #fff' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '24px' }}>SCORE: {score}</div>
        {!gameActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', padding: '20px' }}>
            <h2>GAME OVER</h2>
            <p>クリックしてスタート</p>
          </div>
        )}
      </div>
      <p>スペースキーまたはクリックでジャンプ！</p>
    </div>
  );
};

export default App;
