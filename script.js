(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('#score');
  const bestEl = document.querySelector('#best-score');
  const statusPill = document.querySelector('#status-pill');
  const statusText = document.querySelector('#status-text');
  const overlay = document.querySelector('#overlay');
  const overlayMark = document.querySelector('#overlay-mark');
  const overlayEyebrow = document.querySelector('#overlay-eyebrow');
  const overlayTitle = document.querySelector('#overlay-title');
  const overlayCopy = document.querySelector('#overlay-copy');
  const startButton = document.querySelector('#start-button');
  const restartButton = document.querySelector('#restart-button');

  const CELLS = 24;
  const CELL = canvas.width / CELLS;
  const DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
  };

  let snake;
  let direction;
  let nextDirection;
  let food;
  let score = 0;
  let best = Number(localStorage.getItem('snake-best') || 0);
  let state = 'ready';
  let lastTime = 0;
  let elapsed = 0;
  let touchStart = null;

  bestEl.innerHTML = `${String(best).padStart(2, '0')} <span>điểm</span>`;

  function reset() {
    snake = [{ x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }];
    direction = { x: 1, y: 0 };
    nextDirection = direction;
    score = 0;
    scoreEl.textContent = '00';
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    } while (snake.some((part) => part.x === food.x && part.y === food.y));
  }

  function setState(next) {
    state = next;
    statusPill.classList.toggle('is-playing', next === 'playing');
    statusPill.classList.toggle('is-paused', next === 'paused');
    statusText.textContent = ({ ready: 'Sẵn sàng', playing: 'Đang chơi', paused: 'Đang tạm dừng', over: 'Kết thúc' })[next];
    overlay.classList.toggle('is-hidden', next === 'playing');

    if (next === 'ready') {
      overlayMark.textContent = '▶';
      overlayMark.classList.remove('is-lost');
      overlayEyebrow.textContent = 'SẴN SÀNG CHƯA?';
      overlayTitle.textContent = 'Bắt đầu thôi';
      overlayCopy.textContent = 'Ăn thật nhiều trái cây và đừng để đâm vào chính mình nhé.';
      startButton.innerHTML = 'Chơi ngay <span aria-hidden="true">→</span>';
    } else if (next === 'paused') {
      overlayMark.textContent = 'Ⅱ';
      overlayMark.classList.remove('is-lost');
      overlayEyebrow.textContent = 'NGHỈ MỘT CHÚT';
      overlayTitle.textContent = 'Đang tạm dừng';
      overlayCopy.textContent = 'Nhấn P hoặc nút bên dưới để tiếp tục cuộc chơi.';
      startButton.innerHTML = 'Tiếp tục <span aria-hidden="true">→</span>';
    } else if (next === 'over') {
      overlayMark.textContent = '↻';
      overlayMark.classList.add('is-lost');
      overlayEyebrow.textContent = 'VÁN NÀY KẾT THÚC';
      overlayTitle.textContent = score > 0 ? `Bạn được ${score} điểm!` : 'Suýt nữa rồi!';
      overlayCopy.textContent = 'Thử lại nhé — kỷ lục mới luôn chờ bạn phá.';
      startButton.innerHTML = 'Chơi lại <span aria-hidden="true">→</span>';
    }
  }

  function start() {
    if (state === 'ready' || state === 'over') reset();
    elapsed = 0;
    lastTime = 0;
    setState('playing');
  }

  function togglePause() {
    if (state === 'playing') setState('paused');
    else if (state === 'paused') start();
  }

  function endGame() {
    setState('over');
  }

  function step() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const ate = head.x === food.x && head.y === food.y;
    const body = ate ? snake : snake.slice(0, -1);

    if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS || body.some((part) => part.x === head.x && part.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (ate) {
      score += 1;
      scoreEl.textContent = String(score).padStart(2, '0');
      if (score > best) {
        best = score;
        localStorage.setItem('snake-best', String(best));
        bestEl.innerHTML = `${String(best).padStart(2, '0')} <span>điểm</span>`;
      }
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#19251f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(215, 235, 218, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 1; i < CELLS; i += 1) {
      const point = i * CELL;
      ctx.beginPath(); ctx.moveTo(point, 0); ctx.lineTo(point, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, point); ctx.lineTo(canvas.width, point); ctx.stroke();
    }

    if (food) {
      const fx = food.x * CELL + CELL / 2;
      const fy = food.y * CELL + CELL / 2;
      ctx.fillStyle = 'rgba(250, 128, 99, .14)';
      ctx.beginPath(); ctx.arc(fx, fy, CELL * .43, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fa8063';
      ctx.beginPath(); ctx.arc(fx, fy, CELL * .25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd1a7';
      ctx.beginPath(); ctx.arc(fx - 2, fy - 2, CELL * .065, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a5d66b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx + 1, fy - CELL * .21); ctx.quadraticCurveTo(fx + 5, fy - CELL * .38, fx + 9, fy - CELL * .28); ctx.stroke();
    }

    snake.forEach((part, index) => {
      const inset = index === 0 ? 2 : 3;
      const x = part.x * CELL + inset;
      const y = part.y * CELL + inset;
      const size = CELL - inset * 2;
      ctx.fillStyle = index === 0 ? '#c7f487' : `hsl(91 65% ${Math.max(43, 57 - index * .35)}%)`;
      roundedRect(x, y, size, size, index === 0 ? 7 : 6);
      if (index === 0) {
        const eyeOffsetX = direction.x === 0 ? 5 : direction.x > 0 ? 8 : 3;
        const eyeOffsetY = direction.y === 0 ? 5 : direction.y > 0 ? 8 : 3;
        const eyeGap = 7;
        ctx.fillStyle = '#263420';
        for (const side of [-1, 1]) {
          const ex = x + (direction.x === 0 ? eyeOffsetX + side * eyeGap / 2 : eyeOffsetX);
          const ey = y + (direction.y === 0 ? eyeOffsetY + side * eyeGap / 2 : eyeOffsetY);
          ctx.beginPath(); ctx.arc(ex, ey, 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  }

  function frame(time) {
    if (state === 'playing') {
      if (!lastTime) lastTime = time;
      elapsed += time - lastTime;
      lastTime = time;
      const speed = Math.max(72, 135 - score * 2.5);
      while (elapsed >= speed && state === 'playing') {
        step();
        elapsed -= speed;
      }
    } else {
      lastTime = time;
    }
    requestAnimationFrame(frame);
  }

  function setDirection(newDirection) {
    if (state === 'ready') start();
    if (state !== 'playing') return;
    if (newDirection.x === -direction.x && newDirection.y === -direction.y) return;
    nextDirection = newDirection;
  }

  document.addEventListener('keydown', (event) => {
    if (DIRECTIONS[event.key]) {
      event.preventDefault();
      setDirection(DIRECTIONS[event.key]);
    } else if (event.key.toLowerCase() === 'p' || event.code === 'Space') {
      event.preventDefault();
      if (state === 'ready') start();
      else togglePause();
    } else if (event.key === 'Enter' && state !== 'playing') {
      start();
    }
  });

  startButton.addEventListener('click', () => {
    if (state === 'paused') togglePause();
    else start();
  });
  restartButton.addEventListener('click', () => { reset(); setState('playing'); });

  canvas.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
      setDirection(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
    } else if (state === 'ready' || state === 'over') start();
    touchStart = null;
  }, { passive: true });

  reset();
  setState('ready');
  requestAnimationFrame(frame);
})();
