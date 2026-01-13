# 🌈 ASCII Nyan Cat

Put a Nyan Cat in your terminal, Emacs, or browser!

```bash
curl nyan-cat.joeheyming.workers.dev
```

![nyan](nyan.gif)

## ✨ Features

- **Terminal Animation** - Stream ASCII Nyan Cat via `curl`
- **Web Viewer** - Beautiful browser-based viewer with music
- **Emacs Integration** - Watch Nyan Cat in your editor
- **Speed Control** - From slow to LUDICROUS speed
- **Docker Support** - Easy deployment anywhere

## 🚀 Quick Start

### Terminal (curl)

```bash
# Install dependencies
npm install

# Start the server
npm start

# In another terminal
curl localhost:3000
```

### Browser

Just open [http://localhost:3000](http://localhost:3000) in your browser!

### Docker

```bash
# Build
docker build -t nyan-cat .

# Run
docker run -p 3000:3000 nyan-cat

# Then curl or browse to localhost:3000
```

## 🎮 Options

### Speed Control

```bash
curl "localhost:3000?speed=slow"      # 🐢 Relaxed viewing
curl "localhost:3000?speed=normal"    # 🐱 Default
curl "localhost:3000?speed=fast"      # 🚀 Speedy cat
curl "localhost:3000?speed=ludicrous" # ⚡ Maximum nyan
```

### Flip Mode

```bash
curl "localhost:3000?flip=true"       # ↩️ Reversed nyan
```

### Combine Options

```bash
curl "localhost:3000?speed=fast&flip=true"
```

## 🖥️ Bash Script

For a standalone terminal experience without the server:

```bash
./nyan.sh [-e] [-h] [-m]

-e → Run in Emacs
-m → Play music  
-h → Show help
```

### Emacs Setup

Make sure the emacsclient server is running:

```
M-x server-start
```

## 🎵 Music

The web viewer includes the original Nyan Cat music! Click the 🔇 button to toggle audio.

For the bash script, use the `-m` flag to play music.

## ☁️ Live Demo

Try it now - no install required!

```bash
curl nyan-cat.joeheyming.workers.dev

# With options
curl "nyan-cat.joeheyming.workers.dev?speed=fast"
curl "nyan-cat.joeheyming.workers.dev?speed=ludicrous"
curl "nyan-cat.joeheyming.workers.dev?flip=true"
```

Or visit [nyan-cat.joeheyming.workers.dev](https://nyan-cat.joeheyming.workers.dev) in your browser!

### Self-Hosting with Cloudflare Workers

Deploy your own globally with Cloudflare Workers:

```bash
cd worker
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

The worker fetches frames directly from GitHub at runtime (cached for 1 hour).

**Configuration** (`worker/wrangler.toml`):
```toml
[vars]
GITHUB_REPO = "joeheyming/ascii_nyan"
GITHUB_BRANCH = "master"
```

## 🐳 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NYAN_PORT` | `3000` | Server port |

## 📦 Tech Stack

- **Node.js 18+** - Runtime
- **Chalk** - Terminal colors
- **Pure HTML/CSS/JS** - Web viewer (no framework needed!)

## 🤝 Credits

- Original Nyan Cat by PRGuitarman & daniwell
- Server streaming inspired by [parrot.live](https://github.com/hugomd/parrot.live)

## 📄 License

MIT © Joe Heyming

---

*Enjoy! ^_^* 🐱🌈
