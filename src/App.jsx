import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const SPEED_PER_SECOND = 80;
  const MOVE_SPEED = 250;
  const PIPE_GAP = 280;
  const SPAWN_INTERVAL = 2500;
  const ITEM_INTERVAL = 1000;

  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;

  const birdY = useRef(250);
  const pipes = useRef([]);
  const items = useRef([]);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastItemSpawnRef = useRef(0);
  const keysPressed = useRef({});
  const requestRef = useRef(); // ループを管理するためのRef

  const startGame = () => {
    birdY.current = 250;
    pipes.current = [];
    items.current = [];
    lastTimeRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    lastItemSpawnRef.current = performance.now();
    setScore(0);
    setGameActive(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true;
      if (!gameActive && (e.code === 'Space' || e.code === 'Enter')) startGame();
    };
    const handleKeyUp = (e) => (keysPressed.current[e.code] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loop = (currentTime) => {
      // デルタタイムの計算
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // 移動の計算
      if (keysPressed.current['ArrowUp']) birdY.current -= MOVE_SPEED * deltaTime;
      if (keysPressed.current['ArrowDown']) birdY.current += MOVE_SPEED * deltaTime;

      if (birdY.current < 0) birdY.current = 0;
      if (birdY.current > canvas.height - BIRD_HEIGHT) birdY.current = canvas.height - BIRD_HEIGHT;

      // 土管生成
      if (currentTime - lastSpawnRef.current > SPAWN_INTERVAL) {
        const pipeHeight = Math.random() * 100 + 40;
        pipes.current.push({ x: canvas.width, top: pipeHeight });
        lastSpawnRef.current = currentTime;
      }

      // ごはん生成
      if (currentTime - lastItemSpawnRef.current > ITEM_INTERVAL) {
        items.current.push({ x: canvas.width, y: Math.random() * 300 + 50, collected: false });
        lastItemSpawnRef.current = currentTime;
      }

      // 移動と衝突判定
      pipes.current.forEach((pipe) => {
        pipe.x -= SPEED_PER_SECOND * deltaTime;
        if (
          50 < pipe.x + 40 &&
          50 + BIRD_WIDTH > pipe.x &&
          (birdY.current < pipe.top || birdY.current + BIRD_HEIGHT > pipe.top + PIPE_GAP)
        ) {
          setGameActive(false);
        }
      });

      items.current.forEach((item) => {
        item.x -= SPEED_PER_SECOND * deltaTime;
        if (!item.collected && Math.abs(50 - item.x) < 25 && Math.abs(birdY.current - item.y) < 25) {
          item.collected = true;
          setScore((s) => {
            const nextScore = s + 10;
            // ハイスコア更新はここで行うが、useEffectを再起動させないためにstateを直接参照しない
            setHighScore((prev) => (nextScore > prev ? nextScore : prev));
            return nextScore;
          });
        }
      });

      pipes.current = pipes.current.filter((p) => p.x > -50);
      items.current = items.current.filter((i) => i.x > -50);

      // 描画
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#B0E57C';
      pipes.current.forEach((p) => {
        ctx.fillRect(p.x, 0, 40, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, 40, canvas.height);
      });
      items.current.forEach((i) => {
        if (!i.collected) {
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.ellipse(i.x, i.y, 8, 5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      const bx = 50, by = birdY.current;
      ctx.fillStyle = '#4af14a'; ctx.fillRect(bx, by, BIRD_WIDTH, BIRD_HEIGHT);
      ctx.fillStyle = '#fff700'; ctx.fillRect(bx + 10, by, 14, 10);
      ctx.fillStyle = '#000'; ctx.fillRect(bx + 18, by + 2, 2, 2);

      // 次のフレームへ
      requestRef.current = requestAnimationFrame(loop);
    };

    // 初期化して開始
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(loop);

    // クリーンアップ: useEffectが再実行される前に古いループを止める
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameActive]); // highScore を依存配列から削除

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#F0F8FF', minHeight: '100vh', color: '#333', userSelect: 'none' }}>
      <h2 style={{ paddingTop: '20px' }}>インコの「ごはん」あつめ（完全等速）</h2>
      <p>ハイスコア: {highScore} / ポイント: {score}</p>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '10px solid #FFF', borderRadius: '30px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        {!gameActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', width: '240px' }}>
            <button onClick={startGame} style={{ padding: '12px 40px', fontSize: '20px', borderRadius: '30px', border: 'none', background: '#4af14a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>↑ ↓ ボタンでインコを動かしてね。</p>
        <p style={{ color: '#888' }}>パソコンが速くても、ごはんを食べても、ずっとこの速さだよ。</p>
      </div>
    </div>
  );
};

export default App;
