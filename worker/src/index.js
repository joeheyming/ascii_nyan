/**
 * Nyan Cat Cloudflare Worker
 * 
 * Streams ASCII Nyan Cat animation to curl clients.
 * Frames are fetched from GitHub and cached.
 */

const FRAME_COUNT = 8;
const COLORS = [
  '\x1b[31m', // red
  '\x1b[33m', // yellow
  '\x1b[32m', // green
  '\x1b[34m', // blue
  '\x1b[35m', // magenta
  '\x1b[36m', // cyan
  '\x1b[37m', // white
];
const RESET = '\x1b[0m';
const CLEAR = '\x1b[2J\x1b[H';

const SPEED_PRESETS = {
  slow: 200,
  normal: 100,
  fast: 50,
  ludicrous: 25,
};

// In-memory cache for frames (persists across requests in same isolate)
let framesCache = null;
let framesCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchFrames(env) {
  // Return cached frames if still valid
  if (framesCache && Date.now() - framesCacheTime < CACHE_TTL) {
    return framesCache;
  }

  const repo = env.GITHUB_REPO || 'joeheyming/ascii_nyan';
  const branch = env.GITHUB_BRANCH || 'master';
  const baseUrl = `https://raw.githubusercontent.com/${repo}/${branch}/frames`;

  const frames = [];
  const fetchPromises = [];

  for (let i = 0; i < FRAME_COUNT; i++) {
    const frameNum = String(i).padStart(3, '0');
    const url = `${baseUrl}/frame_${frameNum}.txt`;
    fetchPromises.push(
      fetch(url)
        .then(res => res.ok ? res.text() : null)
        .then(text => ({ index: i, text }))
    );
  }

  const results = await Promise.all(fetchPromises);
  
  // Sort by index and extract text
  results
    .sort((a, b) => a.index - b.index)
    .forEach(r => {
      if (r.text) frames.push(r.text);
    });

  // Cache the frames
  framesCache = frames;
  framesCacheTime = Date.now();

  return frames;
}

function getRandomColor(lastColor) {
  let newColor = Math.floor(Math.random() * COLORS.length);
  if (newColor === lastColor) {
    newColor = (newColor + 1) % COLORS.length;
  }
  return newColor;
}

async function streamNyan(frames, speed, flip) {
  const encoder = new TextEncoder();
  let frameIndex = 0;
  let lastColor = -1;
  let running = true;

  const stream = new ReadableStream({
    async start(controller) {
      while (running) {
        const colorIndex = getRandomColor(lastColor);
        lastColor = colorIndex;

        let frame = frames[frameIndex];
        if (flip) {
          frame = frame.split('').reverse().join('');
        }

        const output = CLEAR + COLORS[colorIndex] + frame + RESET;
        controller.enqueue(encoder.encode(output));

        frameIndex = (frameIndex + 1) % frames.length;

        await new Promise(resolve => setTimeout(resolve, speed));
      }
    },
    cancel() {
      running = false;
    }
  });

  return stream;
}

function getHtmlPage(env) {
  const repo = env.GITHUB_REPO || 'joeheyming/ascii_nyan';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌈 Nyan Cat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
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
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 0;
    }
    
    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      animation: twinkle 2s ease-in-out infinite;
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .container { position: relative; z-index: 1; text-align: center; }
    
    h1 {
      font-size: 4rem;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
      background-size: 400% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: rainbow 3s linear infinite;
    }
    
    @keyframes rainbow {
      0% { background-position: 0% 50%; }
      100% { background-position: 400% 50%; }
    }
    
    .terminal-wrapper {
      background: #1a1a2e;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5);
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
    
    .terminal-btn { width: 12px; height: 12px; border-radius: 50%; }
    .terminal-btn.red { background: #ff5f57; }
    .terminal-btn.yellow { background: #febc2e; }
    .terminal-btn.green { background: #28c840; }
    .terminal-title { flex: 1; text-align: center; color: #888; font-size: 0.9rem; }
    
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
    }
    
    .btn.active {
      background: linear-gradient(180deg, #ff6b9d 0%, #9c27b0 100%);
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
      color: #00d4ff;
    }
  </style>
</head>
<body>
  <div class="stars" id="stars"></div>
  
  <div class="container">
    <h1>~ NYAN CAT ~</h1>
    
    <div class="terminal-wrapper">
      <div class="terminal-header">
        <div class="terminal-btn red"></div>
        <div class="terminal-btn yellow"></div>
        <div class="terminal-btn green"></div>
        <span class="terminal-title">nyan.example.workers.dev</span>
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
      Use: <code>curl ${typeof location !== 'undefined' ? location.origin : 'https://nyan.example.workers.dev'}</code>
    </p>
  </div>
  
  <script>
    const FRAME_COUNT = 8;
    const GITHUB_BASE = 'https://raw.githubusercontent.com/${repo}/master/frames';
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#54a0ff', '#fff'];
    
    let frames = [];
    let currentFrame = 0;
    let speed = 100;
    let interval = null;
    const frameEl = document.getElementById('nyan-frame');
    
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
    
    // Fetch frames from GitHub
    async function loadFrames() {
      frameEl.textContent = 'Loading frames...';
      const promises = [];
      
      for (let i = 0; i < FRAME_COUNT; i++) {
        const num = String(i).padStart(3, '0');
        promises.push(
          fetch(GITHUB_BASE + '/frame_' + num + '.txt')
            .then(r => r.ok ? r.text() : null)
            .then(text => ({ i, text }))
        );
      }
      
      const results = await Promise.all(promises);
      frames = results.sort((a, b) => a.i - b.i).map(r => r.text).filter(Boolean);
      
      if (frames.length > 0) {
        setSpeed(100);
      } else {
        frameEl.textContent = 'Failed to load frames!';
      }
    }
    
    let lastColor = -1;
    
    function animate() {
      if (frames.length === 0) return;
      let newColor = Math.floor(Math.random() * colors.length);
      if (newColor === lastColor) newColor = (newColor + 1) % colors.length;
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
    
    document.querySelectorAll('.btn[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speeds = { slow: 200, normal: 100, fast: 50, ludicrous: 25 };
        setSpeed(speeds[btn.dataset.speed]);
      });
    });
    
    loadFrames();
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const isCurl = userAgent.toLowerCase().includes('curl');

    // Parse query params
    const speedParam = url.searchParams.get('speed') || 'normal';
    const flip = url.searchParams.get('flip') === 'true';
    const speed = SPEED_PRESETS[speedParam] || SPEED_PRESETS.normal;

    // Browser request - serve HTML
    if (!isCurl) {
      return new Response(getHtmlPage(env), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Curl request - stream ASCII animation
    try {
      const frames = await fetchFrames(env);
      
      if (frames.length === 0) {
        return new Response('Failed to load frames from GitHub\n', { status: 500 });
      }

      const stream = await streamNyan(frames, speed, flip);

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (err) {
      return new Response(`Error: ${err.message}\n`, { status: 500 });
    }
  },
};

