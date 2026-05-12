import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- ゲームバランス調整（ここをいじると難易度が変わります） ---
  const BIRD_WIDTH = 34;    // インコの横幅
  const BIRD_HEIGHT = 24;   // インコの縦幅
  const GRAVITY = 0.25;     // 重力（小さいほどふわふわ浮く）
  const JUMP_STRENGTH = -5; // ジャンプ力（小さいほど小刻みに跳ねる）
  const PIPE_WIDTH = 60;    // 土管の太さ
  const PIPE_GAP = 180;     // 土管の隙間（大きいほど通りやすい）
  const PIPE_SPEED = 3;     // スクロール速度（小さいほどゆっくり）
  const SPAWN_RATE = 90;    // 土管が出る間隔（大きいほど土管がまばらになる）
  const HIT_BOX_MARGIN = 6; // 当たり判定の余裕（大きいほど「今当たったじゃん！」がなくなる）

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
      if (e.code === 'Space') jump();
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

      // 土管の生成
      if (frame.current % SPAWN_RATE === 0) {
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - PIPE_GAP - 50;
        const pipeHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
        pipes.current.push({ x: canvas.width, top: pipeHeight, passed: false });
      }

      // 土管の移動と判定
      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // 当たり判定（HIT_BOX_MARGIN 分だけ判定を甘く設定）
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

        // スコア加算
        if (!pipe.passed && pipe.x < 50) {
          pipe.passed = true;
          setScore((s) => {
            const newScore = s + 1;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
        }
      });

      if (birdY.current > canvas.height || birdY.current < -50) setGameActive(false);
      if (pipes.current[0]?.x < -PIPE_WIDTH) pipes.current.shift();

      frame.current++;
    };

    const draw = () => {
      // 背景（空色）
      ctx.fillStyle = '#70c5ce';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 土管の描画（ファミコン風の緑）
      ctx.fillStyle = '#73bf2e';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      pipes.current.forEach((pipe) => {
        // 上の土管
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        // 下の土管
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height);
        ctx.strokeRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height);
      });

      // インコの描画（セキセイインコ風：体は緑、頭は黄色）
      const bx = 50;
      const by = birdY.current;
      
      ctx.fillStyle = '#4af14a'; // 体（緑）
      ctx.fillRect(bx, by, BIRD_WIDTH, BIRD_HEIGHT);
      ctx.fillStyle = '#fff700'; // 頭（黄）
      ctx.fillRect(bx + 15, by, 19, 15);
      ctx.fillStyle = '#000';    // 目
      ctx.fillRect(bx + 28, by + 4, 3, 3);
      ctx.fillStyle = '#ff9900'; // くちばし
      ctx.fillRect(bx + 32, by + 8, 4, 4);
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
      textAlign: 'center', 
      backgroundColor: '#222', 
      minHeight: '100vh', 
      color: 'white', 
      fontFamily: '"Press Start 2P", cursive', // ファミコン風フォントがあれば
      userSelect: 'none',
      touchAction: 'none'
    }}>
      <h1 style={{ paddingTop: '20px', margin: '0' }}>インコの大冒険</h1>
      <p style={{ fontSize: '14px' }}>ハイスコア: {highScore}</p>
      
      <div style={{ position: 'relative', display: 'inline-block', marginTop: '20px' }}>
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="500" 
          style={{ border: '4px solid #fff', borderRadius: '8px', cursor: 'pointer' }} 
        />
        
        <div style={{ position: 'absolute', top: 20, left: 20, fontSize: '24px', fontWeight: 'bold', textShadow: '2px 2px #000' }}>
          SCORE: {score}
        </div>

        {!gameActive && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            background: 'rgba(0,0,0,0.8)', padding: '30px', borderRadius: '15px', border: '2px solid #fff',
            width: '250px'
          }}>
            <h2 style={{ color: '#ff4444' }}>GAME OVER</h2>
            <p>クリックしてスタート！</p>
            <p style={{ fontSize: '12px' }}>（スペースキーでも飛べるよ）</p>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', color: '#aaa' }}>
        <p>土管をよけて進もう！</p>
      </div>
    </div>
  );
};

export default App;
