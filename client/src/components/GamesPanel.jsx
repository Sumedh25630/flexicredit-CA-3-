import { useState, useEffect, useRef } from 'react';

const PACMAN_MAZE = [
  "1111111111111",
  "1000000000001",
  "1011110111101",
  "1010000000101",
  "1010111110101",
  "1000100010001",
  "1110101010111",
  "1000101010001",
  "1011101010111",
  "1000000000001",
  "1011111111101",
  "1000000000001",
  "1111111111111"
];

const GamesPanel = () => {
  const canvasRef = useRef(null);
  const [activeGame, setActiveGame] = useState('snake');
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [extra, setExtra] = useState('');
  const [overlayText, setOverlayText] = useState('Ready to slither?');
  const [btnText, setBtnText] = useState('Start');
  
  // Game state refs
  const loopRef = useRef(null);
  const gameState = useRef({});

  useEffect(() => {
    switchGame(activeGame);
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [activeGame]);

  const switchGame = (name) => {
    if (loopRef.current) clearInterval(loopRef.current);
    setGameRunning(false);
    setActiveGame(name);
    setScore(0);
    setExtra(name === 'pacman' ? 'Lives: 3' : '');
    setBtnText('Start');
    setOverlayText(name === 'snake' ? 'Ready to slither?' : 'Ready, player one?');
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startGame = () => {
    setGameRunning(true);
    if (activeGame === 'snake') startSnake();
    else startPacman();
  };

  const endGame = (title, sub) => {
    setGameRunning(false);
    if (loopRef.current) clearInterval(loopRef.current);
    setOverlayText(`${title} — ${sub}`);
    setBtnText('Play again');
  };

  const handleKeyDown = (e) => {
    const nav = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
    if(nav.includes(e.key)) e.preventDefault();
    if (!gameRunning) return;
    if (activeGame === 'snake') snakeKey(e.key);
    else pacmanKey(e.key);
  };

  // --- Snake ---
  const startSnake = () => {
    const canvas = canvasRef.current;
    canvas.width = 400; canvas.height = 400;
    const cols = 20;
    gameState.current = {
      snake: [{x:9,y:10},{x:8,y:10},{x:7,y:10}],
      dir: {x:1,y:0}, nextDir: {x:1,y:0},
      score: 0, cell: canvas.width/cols, cols, apple: {x:0,y:0}
    };
    setScore(0);
    placeApple();
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(snakeTick, 110);
    drawSnake();
  };

  const placeApple = () => {
    const gs = gameState.current;
    let pos;
    do { 
      pos = { x: Math.floor(Math.random()*gs.cols), y: Math.floor(Math.random()*gs.cols) }; 
    } while(gs.snake.some(s => s.x === pos.x && s.y === pos.y));
    gs.apple = pos;
  };

  const snakeKey = (k) => {
    const map = { ArrowUp:{x:0,y:-1}, w:{x:0,y:-1}, W:{x:0,y:-1}, ArrowDown:{x:0,y:1}, s:{x:0,y:1}, S:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, a:{x:-1,y:0}, A:{x:-1,y:0}, ArrowRight:{x:1,y:0}, d:{x:1,y:0}, D:{x:1,y:0} };
    const dir = map[k]; if(!dir) return;
    const gs = gameState.current;
    if(dir.x === -gs.dir.x && dir.y === -gs.dir.y) return;
    gs.nextDir = dir;
  };

  const snakeTick = () => {
    const gs = gameState.current;
    gs.dir = gs.nextDir;
    const head = { x: gs.snake[0].x + gs.dir.x, y: gs.snake[0].y + gs.dir.y };
    if(head.x<0||head.y<0||head.x>=gs.cols||head.y>=gs.cols || gs.snake.some(s=>s.x===head.x&&s.y===head.y)){
      endGame('Game over', `Score: ${gs.score}`); return;
    }
    gs.snake.unshift(head);
    if(head.x === gs.apple.x && head.y === gs.apple.y){
      gs.score += 1; setScore(gs.score); placeApple();
    } else {
      gs.snake.pop();
    }
    drawSnake();
  };

  const drawSnake = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gs = gameState.current;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#E2839C';
    ctx.beginPath();
    ctx.arc(gs.apple.x*gs.cell+gs.cell/2, gs.apple.y*gs.cell+gs.cell/2, gs.cell/2.4, 0, Math.PI*2);
    ctx.fill();
    gs.snake.forEach((s,i)=>{
      ctx.fillStyle = i===0 ? 'var(--gold)' : 'var(--teal)';
      ctx.fillRect(s.x*gs.cell+1, s.y*gs.cell+1, gs.cell-2, gs.cell-2);
    });
  };

  // --- Pacman ---
  const startPacman = () => {
    const grid = PACMAN_MAZE.map(row=>row.split('').map(Number));
    const cell = 28;
    const canvas = canvasRef.current;
    canvas.width = grid[0].length * cell; canvas.height = grid.length * cell;
    const dots = grid.map(row=>row.map(c=>c===0));
    dots[1][1] = false;
    gameState.current = {
      grid, dots, player: {r:1,c:1}, dir:{r:0,c:0}, nextDir:{r:0,c:0},
      ghosts: [ {r:5,c:5,color:'#E27D7D'}, {r:7,c:7,color:'#8a7238'} ],
      dotsLeft: dots.flat().filter(Boolean).length,
      score: 0, lives: 3, cell
    };
    setScore(0); setExtra('Lives: 3');
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(pacmanTick, 180);
    drawPacman();
  };

  const pacmanKey = (k) => {
    const map = { ArrowUp:{r:-1,c:0}, w:{r:-1,c:0}, W:{r:-1,c:0}, ArrowDown:{r:1,c:0}, s:{r:1,c:0}, S:{r:1,c:0}, ArrowLeft:{r:0,c:-1}, a:{r:0,c:-1}, A:{r:0,c:-1}, ArrowRight:{r:0,c:1}, d:{r:0,c:1}, D:{r:0,c:1} };
    const dir = map[k]; if(dir) gameState.current.nextDir = dir;
  };

  const pIsWall = (r,c) => {
    const gs = gameState.current;
    return !gs.grid[r] || gs.grid[r][c]===undefined || gs.grid[r][c]===1;
  };

  const pacmanTick = () => {
    const gs = gameState.current;
    if(!pIsWall(gs.player.r+gs.nextDir.r, gs.player.c+gs.nextDir.c)) gs.dir = gs.nextDir;
    const nr=gs.player.r+gs.dir.r, nc=gs.player.c+gs.dir.c;
    if(!pIsWall(nr,nc)) gs.player = {r:nr,c:nc};
    if(gs.dots[gs.player.r][gs.player.c]){ 
      gs.dots[gs.player.r][gs.player.c] = false; gs.score+=10; setScore(gs.score); gs.dotsLeft--; 
    }
    if(gs.dotsLeft<=0){ endGame('You win!', `Score: ${gs.score}`); return; }

    gs.ghosts.forEach(g=>{
      const opts=[{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}].filter(d=>!pIsWall(g.r+d.r,g.c+d.c));
      if(opts.length){
        let choice;
        if(Math.random()<0.6){
          choice = opts.reduce((best,d)=>{
            const dist = Math.abs((g.r+d.r)-gs.player.r)+Math.abs((g.c+d.c)-gs.player.c);
            const bestDist = Math.abs((g.r+best.r)-gs.player.r)+Math.abs((g.c+best.c)-gs.player.c);
            return dist<bestDist ? d : best;
          }, opts[0]);
        } else {
          choice = opts[Math.floor(Math.random()*opts.length)];
        }
        g.r += choice.r; g.c += choice.c;
      }
    });
    if(gs.ghosts.some(g=>g.r===gs.player.r && g.c===gs.player.c)){
      gs.lives--; setExtra(`Lives: ${gs.lives}`);
      if(gs.lives<=0){ endGame('Game over', `Score: ${gs.score}`); return; }
      gs.player={r:1,c:1};
    }
    drawPacman();
  };

  const drawPacman = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gs = gameState.current;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<gs.grid.length;r++){
      for(let c=0;c<gs.grid[r].length;c++){
        if(gs.grid[r][c]===1){
          ctx.fillStyle = '#1B2140';
          ctx.fillRect(c*gs.cell, r*gs.cell, gs.cell, gs.cell);
        } else if(gs.dots[r][c]){
          ctx.fillStyle = 'var(--gold)';
          ctx.beginPath();
          ctx.arc(c*gs.cell+gs.cell/2, r*gs.cell+gs.cell/2, 3, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
    gs.ghosts.forEach(g=>{
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.c*gs.cell+gs.cell/2, g.r*gs.cell+gs.cell/2, gs.cell/2.4, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.fillStyle = '#F5D142';
    ctx.beginPath();
    ctx.arc(gs.player.c*gs.cell+gs.cell/2, gs.player.r*gs.cell+gs.cell/2, gs.cell/2.4, 0.25*Math.PI, 1.75*Math.PI);
    ctx.lineTo(gs.player.c*gs.cell+gs.cell/2, gs.player.r*gs.cell+gs.cell/2);
    ctx.fill();
  };

  return (
    <div className="card">
      <div className="game-tabs">
        <button className={`game-tab ${activeGame === 'snake' ? 'active' : ''}`} onClick={() => setActiveGame('snake')}>Snake</button>
        <button className={`game-tab ${activeGame === 'pacman' ? 'active' : ''}`} onClick={() => setActiveGame('pacman')}>Pac-Man</button>
      </div>
      <div className="game-area">
        <div className="game-canvas-wrap">
          <canvas 
            ref={canvasRef} 
            tabIndex="0" 
            style={{ background: 'var(--navy-deep)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
            onKeyDown={handleKeyDown}
          />
          {!gameRunning && (
            <div className="game-overlay show" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'rgba(6,8,16,0.78)' }}>
              <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>{overlayText}</h3>
              <button className="game-btn" onClick={startGame} style={{ marginTop: '10px' }}>{btnText}</button>
            </div>
          )}
        </div>
        <div className="game-hud">
          <span>Score: <b>{score}</b></span>
          <span>{extra}</span>
        </div>
      </div>
    </div>
  );
};

export default GamesPanel;
