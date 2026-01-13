const fs = require('fs').promises;
const http = require('http');
const path = require('path');
const url = require('url');
const { Readable } = require('stream');

let chalk;

// Dynamic import for chalk (ESM module)
const initChalk = async () => {
  chalk = (await import('chalk')).default;
};

const frames = [];
const flipped = [];
let framesLoaded = false;

// Setup frames in memory - fixed race condition with proper async/await
const loadFrames = async () => {
  const frameDir = './frames';
  const files = await fs.readdir(frameDir);
  const txtFiles = files.filter(f => f.endsWith('.txt')).sort();
  
  for (const file of txtFiles) {
    const content = await fs.readFile(path.join(frameDir, file), 'utf-8');
    frames.push(content);
    flipped.push(content.split('').reverse().join(''));
  }
  framesLoaded = true;
  console.log(`Loaded ${frames.length} frames`);
};

const colorsOptions = [
  'red',
  'yellow',
  'green',
  'blue',
  'magenta',
  'cyan',
  'white'
];
const numColors = colorsOptions.length;

const speedPresets = {
  slow: 200,
  normal: 100,
  fast: 50,
  ludicrous: 25
};

const streamer = (stream, opts) => {
  const { flip, speed } = opts;

  let index = 0;
  let lastColor = -1;
  let newColor = 0;
  let frame = null;

  const intervalMs = speedPresets[speed] || speedPresets.normal;

  return setInterval(() => {
    if (!framesLoaded || frames.length === 0) return;
    
    if (index >= frames.length) index = 0;
    if (index < 0) index = frames.length - 1;

    stream.push('\033[2J\033[H');
    newColor = Math.floor(Math.random() * numColors);

    // Reroll for a new color if it was the same as last frame
    if (newColor === lastColor) {
      newColor += 1 + Math.floor(Math.random() * (numColors - 1));
      newColor %= numColors;
    }

    lastColor = newColor;
    frame = flip ? flipped[index] : frames[index];
    stream.push(chalk[colorsOptions[newColor]](frame));
    index++;
  }, intervalMs);
};

const validateQuery = query => {
  const { flip, speed } = query;
  return {
    flip: typeof flip === 'string' && flip.toLowerCase() === 'true',
    speed: typeof speed === 'string' && speedPresets[speed.toLowerCase()] 
      ? speed.toLowerCase() 
      : 'normal'
  };
};

// HTML page for browser viewers
const getHtmlPage = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌈 Nyan Cat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --pink: #ff6b9d;
      --cyan: #00d4ff;
      --yellow: #ffeb3b;
      --purple: #9c27b0;
      --star: #fff;
    }
    
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'VT323', monospace;
      overflow: hidden;
      background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%);
    }
    
    .stars {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }
    
    .star {
      position: absolute;
      background: var(--star);
      border-radius: 50%;
      animation: twinkle 2s ease-in-out infinite;
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .container {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    
    h1 {
      font-size: 4rem;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
      background-size: 400% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: rainbow 3s linear infinite;
      text-shadow: 0 0 30px rgba(255,255,255,0.3);
    }
    
    @keyframes rainbow {
      0% { background-position: 0% 50%; }
      100% { background-position: 400% 50%; }
    }
    
    .terminal-wrapper {
      background: #1a1a2e;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 
        0 0 0 1px rgba(255,255,255,0.1),
        0 20px 60px rgba(0,0,0,0.5),
        0 0 100px rgba(255,107,157,0.2);
      margin: 2rem 0;
    }
    
    .terminal-header {
      background: linear-gradient(180deg, #3a3a5c 0%, #2d2d4a 100%);
      padding: 8px 12px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .terminal-btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .terminal-btn.red { background: #ff5f57; }
    .terminal-btn.yellow { background: #febc2e; }
    .terminal-btn.green { background: #28c840; }
    
    .terminal-title {
      flex: 1;
      text-align: center;
      color: #888;
      font-size: 0.9rem;
    }
    
    #terminal {
      background: #0a0a14;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      min-width: 700px;
      min-height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #nyan-frame {
      white-space: pre;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.1;
      transition: color 0.1s ease;
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 1rem;
    }
    
    .btn {
      background: linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: 'VT323', monospace;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      background: linear-gradient(180deg, #5a5a7a 0%, #4a4a6a 100%);
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(255,107,157,0.3);
    }
    
    .btn.active {
      background: linear-gradient(180deg, var(--pink) 0%, var(--purple) 100%);
      box-shadow: 0 0 20px rgba(255,107,157,0.5);
    }
    
    .curl-hint {
      margin-top: 2rem;
      color: #666;
      font-size: 1.1rem;
    }
    
    .curl-hint code {
      background: rgba(255,255,255,0.1);
      padding: 8px 16px;
      border-radius: 6px;
      color: var(--cyan);
    }
    
    .music-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      font-size: 2rem;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 100;
    }
    
    .music-btn:hover {
      background: rgba(255,255,255,0.2);
      transform: scale(1.1);
    }
    
    .music-btn.playing {
      animation: pulse 1s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,157,0.7); }
      50% { box-shadow: 0 0 0 15px rgba(255,107,157,0); }
    }
  </style>
</head>
<body>
  <div class="stars" id="stars"></div>
  
  <button class="music-btn" id="musicBtn" title="Toggle Music">🔇</button>
  
  <div class="container">
    <h1>~ NYAN CAT ~</h1>
    
    <div class="terminal-wrapper">
      <div class="terminal-header">
        <div class="terminal-btn red"></div>
        <div class="terminal-btn yellow"></div>
        <div class="terminal-btn green"></div>
        <span class="terminal-title">nyan@localhost:3000</span>
      </div>
      <div id="terminal">
        <pre id="nyan-frame">Loading frames...</pre>
      </div>
    </div>
    
    <div class="controls">
      <button class="btn" data-speed="slow">🐢 Slow</button>
      <button class="btn active" data-speed="normal">🐱 Normal</button>
      <button class="btn" data-speed="fast">🚀 Fast</button>
      <button class="btn" data-speed="ludicrous">⚡ Ludicrous</button>
    </div>
    
    <p class="curl-hint">
      Or use: <code>curl ${typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}</code>
    </p>
  </div>
  
  <audio id="nyanAudio" loop>
    <source src="/music" type="audio/mpeg">
  </audio>
  
  <script>
    const frames = ${JSON.stringify(frames)};
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#54a0ff', '#ffffff'];
    
    let currentFrame = 0;
    let speed = 100;
    let interval = null;
    const frameEl = document.getElementById('nyan-frame');
    const audio = document.getElementById('nyanAudio');
    const musicBtn = document.getElementById('musicBtn');
    
    // Create stars
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = star.style.height = (Math.random() * 3 + 1) + 'px';
      star.style.animationDelay = Math.random() * 2 + 's';
      starsContainer.appendChild(star);
    }
    
    let lastColor = -1;
    
    function animate() {
      if (frames.length === 0) return;
      
      let newColor = Math.floor(Math.random() * colors.length);
      if (newColor === lastColor) {
        newColor = (newColor + 1) % colors.length;
      }
      lastColor = newColor;
      
      frameEl.style.color = colors[newColor];
      frameEl.textContent = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    }
    
    function setSpeed(ms) {
      speed = ms;
      if (interval) clearInterval(interval);
      interval = setInterval(animate, speed);
    }
    
    // Speed buttons
    document.querySelectorAll('.btn[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speeds = { slow: 200, normal: 100, fast: 50, ludicrous: 25 };
        setSpeed(speeds[btn.dataset.speed]);
      });
    });
    
    // Music toggle
    let isPlaying = false;
    musicBtn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.remove('playing');
      } else {
        audio.play();
        musicBtn.textContent = '🔊';
        musicBtn.classList.add('playing');
      }
      isPlaying = !isPlaying;
    });
    
    // Start animation
    if (frames.length > 0) {
      setSpeed(100);
    } else {
      frameEl.textContent = 'No frames loaded!';
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Serve music file
  if (parsedUrl.pathname === '/music') {
    try {
      const music = await fs.readFile('./original.mp3');
      res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
      return res.end(music);
    } catch (err) {
      res.writeHead(404);
      return res.end('Music not found');
    }
  }
  
  // Check if it's a curl request
  const isCurl = req.headers && 
    req.headers['user-agent'] &&
    req.headers['user-agent'].toLowerCase().includes('curl');
  
  if (!isCurl) {
    // Serve HTML page for browsers
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(getHtmlPage());
  }
  
  // Stream ASCII animation for curl
  const { query } = parsedUrl;
  const stream = new Readable();
  stream._read = function noop() {};
  stream.pipe(res);
  const interval = streamer(stream, validateQuery(query));

  req.on('close', () => {
    stream.destroy();
    clearInterval(interval);
  });
});

const port = process.env.NYAN_PORT || 3000;

// Initialize everything and start server
(async () => {
  await initChalk();
  await loadFrames();
  
server.listen(port, err => {
  if (err) throw err;
    console.log(`
🌈 Nyan Cat Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━
Terminal:  curl localhost:${port}
Browser:   http://localhost:${port}

Options:
  ?speed=slow|normal|fast|ludicrous
  ?flip=true

Examples:
  curl "localhost:${port}?speed=fast"
  curl "localhost:${port}?flip=true"
━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});
})();
