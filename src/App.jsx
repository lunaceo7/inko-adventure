import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- 設定：ずっと等速・ずっと浮遊 ---
  const PIPE_SPEED = 1.2;      // スピードはずっとこれ。クリックしても早くなりません。
  const FLOAT_STRENGTH = 0.05; // 中央にふわふわ戻る力
  const JUMP_STRENGTH = -3;    // クリックしても優しく浮くだけ
  const PIPE_GAP = 280;        // 隙間はたっぷり
  const SPAWN_RATE = 180;      // 土管もたまにしか来ません
  const ITEM_SPAWN_RATE = 60;  // ごはんは頻繁に出てきます

  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;
  
  const birdY = useRef(250);
  const velocity = useRef(0);
  const pipes = useRef([]);
  const items = useRef([]); // ごはん（ひまわりの種）の配列
  const frame = useRef(0);

  const startGame = () => {
    birdY.current = 250;
    velocity.current = 0;
    pipes.current = [];
    items.current = [];
    frame.current = 0;
    setScore(0);
    setGameActive(true);
  };

  const jump = (e) => {
    if (e) e.preventDefault();
    if (gameActive) {
      velocity.current = JUMP_STRENGTH; // 浮くだけで加速はしません
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
      // --- 安定浮遊ロジック ---
      const diff = 250 - birdY.current;
      velocity.current += diff * FLOAT_STRENGTH; 
      velocity.current *= 0.92;
      birdY.current += velocity.current;

      // 土管の生成
      if (frame.current % SPAWN_RATE === 0) {
        const pipeHeight = Math.random() * 80 + 40; 
        pipes.current.push({ x: canvas.width, top: pipeHeight });
      }

      // ごはん（ひまわりの種）の生成
      if (frame.current % ITEM_SPAWN_RATE === 0) {
        items.current.push({ 
          x: canvas.width, 
          y: Math.random() * 300 + 50, 
          collected: false 
        });
      }

      // 土管の移動（常に一定速度）
      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;
        // 判定（かなり甘め）
        if (50 + 5 < pipe.x + 40 && 50 + BIRD_WIDTH - 5 > pipe.x &&
            (birdY.current + 5 < pipe.top || birdY.current + BIRD_HEIGHT - 5 > pipe.top + PIPE_GAP)) {
          setGameActive(false);
        }
      });

      // ごはんの移動と獲得
      items.current.forEach((item) => {
        item.x -= PIPE_SPEED;
        if (!item.collected && 
            Math.abs(50 - item.x) < 20 && 
            Math.abs(birdY.current - item.y) < 20) {
          item.collected = true;
          setScore((s) => {
            const newScore = s + 10; // ごはんを食べると10点！
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
        }
      });

      // お掃除
      if (pipes.current[0]?.x < -50) pipes.current.shift();
      if (items.current[0]?.x < -50) items.current.shift();
      frame.current++;
    };

    const draw = () => {
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 土管
      ctx.fillStyle = '#B0E57C';
      pipes.current.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, 40, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, 40, canvas.height);
      });

      // ごはん（ひまわりの種：オレンジの楕円）
      items.current.forEach((item) => {
        if (!item.collected) {
          ctx.fillStyle = '#FFA500'; 
          ctx.beginPath();
          ctx.ellipse(item.x, item.y, 8, 5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // インコ
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
      textAlign: 'center', backgroundColor: '#F0F8FF', minHeight: '100vh', color: '#333', 
      fontFamily: 'sans-serif', userSelect: 'none', touchAction: 'none'
    }}>
      <h2 style={{ paddingTop: '20px' }}>インコの「ごはん」あつめ</h2>
      <p>ハイスコア: {highScore} / スコア: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '10px solid #FFF', borderRadius: '30px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        {!gameActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', width: '240px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>またあそぼう！</h3>
            <button style={{ padding: '12px 40px', fontSize: '20px', borderRadius: '30px', border: 'none', background: '#4af14a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <p style={{ marginTop: '20px' }}>オレンジ色の「ごはん」をたべると10点だよ！<br/>クリックしても早くならないから安心してね。</p>
    </div>
  );
};

export default App;
