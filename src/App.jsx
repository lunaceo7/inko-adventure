import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- 設定：ずっと同じスピード、上下キーで移動 ---
  const PIPE_SPEED = 1.2;      // ずっとこの低速。何があっても早くなりません。
  const MOVE_SPEED = 4;        // 上下キーを押した時の動く速さ
  const PIPE_GAP = 280;        // 隙間はたっぷり
  const SPAWN_RATE = 180;      // 土管の間隔
  const ITEM_SPAWN_RATE = 60;  // ごはん（ひまわりの種）の頻度

  const BIRD_WIDTH = 24;
  const BIRD_HEIGHT = 18;
  
  const birdY = useRef(250);
  const pipes = useRef([]);
  const items = useRef([]); 
  const frame = useRef(0);
  const keysPressed = useRef({}); // 押されているキーを管理

  const startGame = () => {
    birdY.current = 250;
    pipes.current = [];
    items.current = [];
    frame.current = 0;
    setScore(0);
    setGameActive(true);
  };

  // キー入力を監視
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true;
      // スペースかエンターでスタート
      if (!gameActive && (e.code === 'Space' || e.code === 'Enter')) startGame();
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;
    };
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

    const update = () => {
      // --- 上下キーによる移動（重力なし） ---
      if (keysPressed.current['ArrowUp']) {
        birdY.current -= MOVE_SPEED;
      }
      if (keysPressed.current['ArrowDown']) {
        birdY.current += MOVE_SPEED;
      }

      // 画面端の制限
      if (birdY.current < 0) birdY.current = 0;
      if (birdY.current > canvas.height - BIRD_HEIGHT) birdY.current = canvas.height - BIRD_HEIGHT;

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

      // 土管の移動（等速）
      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;
        // 当たり判定
        if (50 + 5 < pipe.x + 40 && 50 + BIRD_WIDTH - 5 > pipe.x &&
            (birdY.current + 5 < pipe.top || birdY.current + BIRD_HEIGHT - 5 > pipe.top + PIPE_GAP)) {
          setGameActive(false);
        }
      });

      // ごはんの移動と獲得
      items.current.forEach((item) => {
        item.x -= PIPE_SPEED;
        // インコがごはんに触れた判定
        if (!item.collected && 
            Math.abs(50 - item.x) < 25 && 
            Math.abs(birdY.current - item.y) < 25) {
          item.collected = true;
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
        }
      });

      if (pipes.current[0]?.x < -50) pipes.current.shift();
      if (items.current[0]?.x < -50) items.current.shift();
      frame.current++;
    };

    const draw = () => {
      // 背景
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 土管
      ctx.fillStyle = '#B0E57C';
      pipes.current.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, 40, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, 40, canvas.height);
      });

      // ごはん（ひまわりの種）
      items.current.forEach((item) => {
        if (!item.collected) {
          ctx.fillStyle = '#FFA500'; 
          ctx.beginPath();
          ctx.ellipse(item.x, item.y, 8, 5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // インコ（セキセイインコ風）
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
    <div style={{ 
      textAlign: 'center', backgroundColor: '#F0F8FF', minHeight: '100vh', color: '#333', 
      fontFamily: 'sans-serif', userSelect: 'none', touchAction: 'none'
    }}>
      <h2 style={{ paddingTop: '20px' }}>インコの「ごはん」あつめ</h2>
      <p>ハイスコア: {highScore} / ポイント: {score}</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width="360" height="480" style={{ border: '10px solid #FFF', borderRadius: '30px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        {!gameActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', width: '240px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>お散歩にいこう！</h3>
            <button onClick={startGame} style={{ padding: '12px 40px', fontSize: '20px', borderRadius: '30px', border: 'none', background: '#4af14a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>スタート</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>キーボードの <b>↑ ↓ ボタン</b> で移動できるよ！</p>
        <p style={{ fontSize: '14px', color: '#888' }}>ごはんを食べてもスピードは変わらないから、安心してね。</p>
      </div>
    </div>
  );
};

export default App;
