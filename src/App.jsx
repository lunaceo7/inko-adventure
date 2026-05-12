import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- スピードを「ずっと遅く」固定する設定 ---
  const PIPE_SPEED = 1.2;      // ずっとこの低速で固定。急に早くなりません。
  const FLOAT_STRENGTH = 0.05; // 真ん中に戻ろうとする力（自動浮遊）
  const GRAVITY = 0.05;        // 重力をさらに弱く
  const JUMP_STRENGTH = -3;    // タップした時の動きもさらに優しく

  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;
  const PIPE_WIDTH = 40;
  const PIPE_GAP = 280;        // 隙間をさらに広げて、ほぼ当たらないように。
  const SPAWN_RATE = 180;      // 土管が来る間隔を長くして、ゆったりさせます。
  const HIT_BOX_MARGIN = 15;   // 判定を最大級に甘く（かすっても大丈夫）

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
      // --- ずっと浮き続けるためのロジック ---
      // 常に画面中央（250px）を目指してふわふわ動く
      const centerTarget = 250;
      const diff = centerTarget - birdY.current;
      velocity.current += diff * FLOAT_STRENGTH; 
      
      velocity.current += GRAVITY;
      velocity.current *= 0.92; // 動きをマイルドにするブレーキ
      birdY.current += velocity.current;

      // 土管の生成（常に同じスピードで迫る）
      if (frame.current % SPAWN_RATE === 0) {
        const pipeHeight = Math.random() * 80 + 40; 
        pipes.current.push({ x: canvas.width, top: pipeHeight, passed: false });
      }

      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED; // ここが一定なので急に早くなりません

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
          // 判定を甘くしているので、よほど外れない限りセーフ
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

      // 画面から消えないように上下の制限を緩く
      if (birdY.current > canvas.height + 100 || birdY.current < -150) setGameActive(false);
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();
      frame.current++;
    };

    const draw = () => {
      // 背景
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 土管（パステルグリーンで優しく）
      ctx.fillStyle = '#B0E57C';
      ctx.strokeStyle = '#77A64B';
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
      textAlign: 'center', backgroundColor: '#F0F8FF', minHeight: '100vh', color: '#333', 
      fontFamily: 'sans-serif', userSelect: 'none', touchAction: 'none'
    }}>
      <h2 style={{ paddingTop: '20px' }}>インコのらくらく空中散歩</h2>
      <p>ハイスコア: {highScore} / 今のスコア: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '10px solid #FFF', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#fff' }} />
        {!gameActive && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            background: 'white', padding: '30px', borderRadius: '20px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '240px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>また遊ぼうね！</h3>
            <button style={{ padding: '12px 40px', fontSize: '20px', borderRadius: '30px', border: 'none', background: '#4af14a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <p style={{ marginTop: '20px' }}>何もしなくても、ずっと浮いて進むよ。安心してね。</p>
    </div>
  );
};

export default App;
