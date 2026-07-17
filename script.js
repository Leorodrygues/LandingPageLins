/* ==========================================================================
   AUDIO MANAGER (Sons Reais & Sintetizador Fallback)
   ========================================================================== */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.backgroundMusic = null;
        this.currentTrackIndex = 0;
        this.musicTracks = ['music1', 'music2'];

        // Elementos de UI de áudio
        this.musicToggle = document.getElementById('music-toggle');
        this.musicOnIcon = document.getElementById('music-on-icon');
        this.musicOffIcon = document.getElementById('music-off-icon');

        // Mapeamento de sons locais
        this.sounds = {
            music1: 'assets/audio/contramao.mp3',
            music2: 'assets/audio/princesa.mp3',
            presentOpen: 'assets/audio/present-open.mp3',
            tick: 'assets/audio/tick.mp3',
            fireworks: 'assets/audio/fireworks.mp3',
            confetti: 'assets/audio/confetti.mp3',
            letterOpen: 'assets/audio/letter.mp3',
            chime: 'assets/audio/chime.mp3',
            blow: 'assets/audio/blow.mp3'
        };

        this.initMusicToggle();
    }

    // Inicializa o contexto de áudio sob demanda (evita restrições do browser)
    initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initMusicToggle() {
        this.musicToggle.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.musicOnIcon.classList.add('hidden');
                this.musicOffIcon.classList.remove('hidden');
                this.pauseMusic();
            } else {
                this.musicOnIcon.classList.remove('hidden');
                this.musicOffIcon.classList.add('hidden');
                this.playMusic();
            }
        });
    }

    showToggleBtn() {
        this.musicToggle.classList.remove('hidden');
    }

    // Toca música de fundo com fallback sintético
    playMusic() {
        this.initContext();
        if (this.isMuted) return;

        this.currentTrackIndex = 0;
        this.playTrack(0);
    }

    playTrack(index) {
        if (this.isMuted) return;
        if (index >= this.musicTracks.length) {
            index = 0;
        }

        const trackKey = this.musicTracks[index];
        const src = this.sounds[trackKey];
        if (!src) return;

        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic = null;
        }

        this.backgroundMusic = new Audio(src);
        this.backgroundMusic.loop = false;
        this.backgroundMusic.volume = 0.4;
        this.currentTrackIndex = index;

        this.backgroundMusic.addEventListener('ended', () => {
            this.playTrack(index + 1);
        });

        this.backgroundMusic.play().catch(() => {
            console.log("Arquivo de música ausente. Iniciando sintetizador de música de fundo.");
            this.playSynthBackgroundMusic();
        });
    }

    pauseMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
        if (this.synthInterval) {
            clearInterval(this.synthInterval);
            this.synthInterval = null;
        }
    }

    // Toca um efeito sonoro (tenta arquivo local, senão sintetiza)
    playSound(soundName) {
        this.initContext();
        if (this.isMuted) return;

        const audio = new Audio(this.sounds[soundName]);
        audio.volume = 0.6;
        audio.play().catch(() => {
            // Se o arquivo falhar, sintetiza o som equivalente via Web Audio API
            this.synthesizeSound(soundName);
        });
    }

    // Fallback: Sintetizador Web Audio API para música de fundo
    playSynthBackgroundMusic() {
        if (this.synthInterval) return;

        let notes = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25, 783.99]; // Arpejo de Lá menor 7 / Sol
        let step = 0;

        this.synthInterval = setInterval(() => {
            if (this.isMuted) return;
            this.initContext();

            let osc = this.ctx.createOscillator();
            let gainNode = this.ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(notes[step % notes.length], this.ctx.currentTime);

            gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

            osc.start();
            osc.stop(this.ctx.currentTime + 1.5);

            step++;
        }, 1200); // Batida lenta e relaxante
    }

    // Fallback: Sintetizador para efeitos sonoros
    synthesizeSound(type) {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        switch (type) {
            case 'presentOpen':
                // Sweep ascendente brilhante (Chime mágico)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);

                // Adiciona um segundo tom metálico fino
                setTimeout(() => {
                    let osc2 = this.ctx.createOscillator();
                    let gain2 = this.ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(this.ctx.destination);
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(1500, this.ctx.currentTime);
                    gain2.gain.setValueAtTime(0.1, this.ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                    osc2.start();
                    osc2.stop(this.ctx.currentTime + 0.5);
                }, 100);
                break;

            case 'tick':
                // Som curto de metrônomo (click)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'fireworks':
                // Ruído explosivo seguido de chiado
                this.synthesizeExplosion(0.3, 200, 30);
                break;

            case 'confetti':
                // Cliques múltiplos e agudos simulando poppers
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        let o = this.ctx.createOscillator();
                        let g = this.ctx.createGain();
                        o.connect(g);
                        g.connect(this.ctx.destination);
                        o.type = 'triangle';
                        o.frequency.setValueAtTime(1000 + Math.random() * 800, this.ctx.currentTime);
                        g.gain.setValueAtTime(0.08, this.ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                        o.start();
                        o.stop(this.ctx.currentTime + 0.1);
                    }, i * 50);
                }
                break;

            case 'letterOpen':
                // Som simulando papel (ruído branco suave filtrado)
                try {
                    let bufferSize = this.ctx.sampleRate * 0.4;
                    let buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    let data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    let noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;

                    let filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 600;
                    filter.Q.value = 1.5;

                    let g = this.ctx.createGain();
                    g.gain.setValueAtTime(0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                    noise.connect(filter);
                    filter.connect(g);
                    g.connect(this.ctx.destination);

                    noise.start(now);
                    noise.stop(now + 0.4);
                } catch (e) {
                    // Fallback se o gerador de ruído der erro
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(150, now);
                    gainNode.gain.setValueAtTime(0.05, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                }
                break;

            case 'chime':
                // Som de sino glassmorphic
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                osc.start(now);
                osc.stop(now + 1.2);

                // Harmônico superior
                let oscH = this.ctx.createOscillator();
                let gainH = this.ctx.createGain();
                oscH.connect(gainH);
                gainH.connect(this.ctx.destination);
                oscH.type = 'sine';
                oscH.frequency.setValueAtTime(1320, now);
                gainH.gain.setValueAtTime(0.06, now);
                gainH.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                oscH.start(now);
                oscH.stop(now + 0.8);
                break;

            case 'blow':
                // Som de sopro (ruído de baixa frequência com decaimento)
                try {
                    let bufferSize = this.ctx.sampleRate * 0.3;
                    let buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    let data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    let noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;

                    let filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 250;

                    let g = this.ctx.createGain();
                    g.gain.setValueAtTime(0.25, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                    noise.connect(filter);
                    filter.connect(g);
                    g.connect(this.ctx.destination);

                    noise.start(now);
                    noise.stop(now + 0.3);
                } catch (e) {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(80, now);
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                }
                break;
        }
    }

    synthesizeExplosion(duration, startFreq, endFreq) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

        // Filtro passa-baixo para encorpar
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(300, now);

        osc.disconnect(gainNode);
        osc.connect(lp);
        lp.connect(gainNode);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Faz o volume da música baixar suavemente (para o encerramento)
    fadeMusic(targetVolume = 0.1, durationMs = 4000) {
        if (!this.backgroundMusic) return;
        const startVolume = this.backgroundMusic.volume;
        const steps = 40;
        const interval = durationMs / steps;
        const delta = (startVolume - targetVolume) / steps;
        let step = 0;
        const fade = setInterval(() => {
            step++;
            const newVol = startVolume - delta * step;
            this.backgroundMusic.volume = Math.max(0, Math.min(1, newVol));
            if (step >= steps) clearInterval(fade);
        }, interval);
    }
}


/* ==========================================================================
   PARTICLE ENGINE (Canvas de Partículas 2D)
   ========================================================================== */
class ParticleEngine {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.fireworks = [];
        this.stars = [];

        // Estado de animação
        this.mode = 'ambient'; // ambient, constellation, celebration
        this.constellationTarget = []; // Pontos alvos para as constelações
        this.constellationProgress = 0; // Transição para constelação (0 a 1)

        this.initResize();
        this.generateAmbientStars();
        this.loop();
    }

    initResize() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Regenera estrelas com base na nova tela
        if (this.stars.length === 0) {
            this.generateAmbientStars();
        }
    }

    generateAmbientStars() {
        this.stars = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 8000);
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                twinkleSpeed: 0.01 + Math.random() * 0.03,
                alpha: Math.random(),
                color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#ff758f' : '#60a5fa')
            });
        }
    }

    // Adiciona confete na tela
    spawnConfetti(count = 100) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'confetti',
                x: Math.random() * this.canvas.width,
                y: -20 - Math.random() * 50,
                vx: (Math.random() - 0.5) * 6,
                vy: 3 + Math.random() * 6,
                color: ['#ff758f', '#fcd34d', '#60a5fa', '#c084fc', '#4ade80', '#ff8b3d'][Math.floor(Math.random() * 6)],
                size: Math.random() * 6 + 4,
                rotation: Math.random() * 360,
                vRotation: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }
    }

    // Adiciona balão subindo
    spawnBalloons(count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'balloon',
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + 50 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -(1.5 + Math.random() * 2),
                color: ['#ff758f', '#60a5fa', '#fcd34d', '#c084fc'][Math.floor(Math.random() * 4)],
                width: 30 + Math.random() * 15,
                height: 40 + Math.random() * 20,
                stringLength: 50 + Math.random() * 30,
                swingSpeed: 0.02 + Math.random() * 0.03,
                swingAmp: 0.5 + Math.random() * 1.5,
                angle: Math.random() * 10
            });
        }
    }

    // Adiciona fogos de artifício
    spawnFirework(x = null, y = null) {
        const fwX = x || (0.2 + Math.random() * 0.6) * this.canvas.width;
        const fwY = y || (0.2 + Math.random() * 0.4) * this.canvas.height;
        const color = ['#ff758f', '#fcd34d', '#60a5fa', '#c084fc', '#ff8b3d'][Math.floor(Math.random() * 5)];
        const count = 60 + Math.floor(Math.random() * 40);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.fireworks.push({
                x: fwX,
                y: fwY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 2 + 1,
                alpha: 1,
                decay: 0.012 + Math.random() * 0.015,
                gravity: 0.04
            });
        }
    }

    // Prepara as estrelas para a constelação na Etapa 8
    setConstellation(targetPoints) {
        this.mode = 'constellation';
        this.constellationTarget = targetPoints;
        this.constellationProgress = 0;

        // Embaralha os pontos alvo para preencher a forma por inteiro
        const shuffledTargets = [...targetPoints].sort(() => Math.random() - 0.5);

        // Limita o número de estrelas para coincidir com os pontos se necessário, ou atribui alvos a estrelas existentes
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const target = shuffledTargets[i % shuffledTargets.length];

            // Armazena a posição de partida e o alvo
            star.startX = star.x;
            star.startY = star.y;
            // Se o alvo não existe (menos pontos que estrelas), mantemos alguns pontos flutuantes
            star.targetX = target ? target.x : Math.random() * this.canvas.width;
            star.targetY = target ? target.y : Math.random() * this.canvas.height;
            star.inConstellation = !!target;
        }
    }

    resetConstellation() {
        this.mode = 'ambient';
        this.stars.forEach(star => {
            star.inConstellation = false;
        });
    }

    update() {
        // 1. Atualiza estrelas de fundo / constelação
        if (this.mode === 'constellation') {
            if (this.constellationProgress < 1) {
                this.constellationProgress += 0.01; // Velocidade da animação de migração
            }

            this.stars.forEach(star => {
                if (star.inConstellation) {
                    // Interpolação suave (ease-in-out)
                    const t = this.constellationProgress;
                    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                    star.x = star.startX + (star.targetX - star.startX) * ease;
                    star.y = star.startY + (star.targetY - star.startY) * ease;
                    star.alpha = 0.8 + Math.sin(Date.now() * 0.01) * 0.2; // Brilho pulsante estável
                } else {
                    // Estrelas sobressalentes piscam normalmente
                    star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.05;
                    star.alpha = Math.max(0.1, Math.min(0.7, star.alpha));
                }
            });
        } else {
            this.stars.forEach(star => {
                star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.05;
                // Clampa alpha entre 0.1 e 1
                star.alpha = Math.max(0.1, Math.min(1, star.alpha));
            });
        }

        // 2. Atualiza confetes e balões
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'confetti') {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.vRotation;
                p.vy += 0.02; // Gravidade do confete

                // Vento lateral leve
                p.vx += Math.sin(Date.now() * 0.005 + i) * 0.05;

                // Remove se sair da tela
                if (p.y > this.canvas.height) {
                    this.particles.splice(i, 1);
                }
            } else if (p.type === 'balloon') {
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.swingSpeed;

                // Balanço senoidal
                p.vx = Math.sin(p.angle) * p.swingAmp;

                // Remove se subir além da tela
                if (p.y < -p.height - p.stringLength) {
                    this.particles.splice(i, 1);
                }
            } else if (p.type === 'heart_rain') {
                p.x += p.vx + Math.sin(Date.now() * 0.001 + p.y * 0.02) * 0.3;
                p.y += p.vy;
                p.rotation += p.vRotation;
                // Remove ao sair da tela
                if (p.y > this.canvas.height + 30) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // 3. Atualiza fogos de artifício
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const f = this.fireworks[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vy += f.gravity; // Gravidade
            f.vx *= 0.98; // Resistência do ar
            f.vy *= 0.98;
            f.alpha -= f.decay;

            if (f.alpha <= 0) {
                this.fireworks.splice(i, 1);
            }
        }
    }

    draw() {
        // Limpeza cinematográfica para rastro dos fogos de artifício
        this.ctx.fillStyle = 'rgba(10, 11, 30, 0.2)'; // Fundo escuro com persistência
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Desenha Estrelas
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // 2. Desenha Partículas (Confete, Balões)
        this.particles.forEach(p => {
            if (p.type === 'confetti') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation * Math.PI / 180);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
                this.ctx.restore();
            } else if (p.type === 'balloon') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);

                // Fio do Balão
                this.ctx.beginPath();
                this.ctx.moveTo(0, p.height / 2);
                this.ctx.bezierCurveTo(
                    Math.sin(p.angle) * 10, p.height / 2 + p.stringLength / 3,
                    -Math.sin(p.angle) * 10, p.height / 2 + (p.stringLength * 2) / 3,
                    0, p.height / 2 + p.stringLength
                );
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                // Corpo do balão
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();

                // Nó do Balão
                this.ctx.beginPath();
                this.ctx.moveTo(-4, p.height / 2);
                this.ctx.lineTo(4, p.height / 2);
                this.ctx.lineTo(0, p.height / 2 + 5);
                this.ctx.closePath();
                this.ctx.fillStyle = p.color;
                this.ctx.fill();

                // Brilho no balão para 3D
                this.ctx.beginPath();
                this.ctx.ellipse(-p.width / 6, -p.height / 6, p.width / 10, p.height / 8, Math.PI / 4, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.fill();

                this.ctx.restore();
            }
        });

        // 3. Desenha Fogos de Artifício
        this.fireworks.forEach(f => {
            this.ctx.save();
            this.ctx.globalAlpha = f.alpha;
            this.ctx.fillStyle = f.color;
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            // Efeito de Glow
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = f.color;
            this.ctx.fill();
            this.ctx.restore();
        });

        // 4. Desenha corações da chuva final
        this.particles.filter(p => p.type === 'heart_rain').forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.scale(p.size / 16, p.size / 16);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            // Coração pequeno
            this.ctx.moveTo(0, -4);
            this.ctx.bezierCurveTo(-8, -14, -18, -4, 0, 8);
            this.ctx.bezierCurveTo(18, -4, 8, -14, 0, -4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        });
        this.ctx.globalAlpha = 1.0;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // Gera coordenadas para formar textos/formas no Canvas
    generateCoordinatesFromText(text, scaleFactor = 1) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Configura tamanho temporário
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Desenha o texto de forma centralizada
        tempCtx.fillStyle = '#fff';
        const fontSize = Math.min(tempCanvas.width / 10, 70) * scaleFactor;
        tempCtx.font = `600 ${fontSize}px 'Playfair Display', serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';

        // Divide o texto por quebras de linha se existirem
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.3;
        const startY = tempCanvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            tempCtx.fillText(line, tempCanvas.width / 2, startY + index * lineHeight);
        });

        // Extrai pontos
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        const points = [];
        const step = Math.max(4, Math.floor(tempCanvas.width / 250)); // Espaçamento de pontos dependendo da largura

        for (let y = 0; y < tempCanvas.height; y += step) {
            for (let x = 0; x < tempCanvas.width; x += step) {
                const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
                if (alpha > 128) {
                    points.push({ x: x, y: y });
                }
            }
        }
        return points;
    }

    // Gera pontos que formam um coração
    generateHeartCoordinates() {
        const points = [];
        const scale = Math.min(this.canvas.width, this.canvas.height) / 60;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (let t = 0; t < Math.PI * 2; t += 0.04) {
            const sinT = Math.sin(t);
            const x = 16 * (sinT * sinT * sinT);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            points.push({
                x: centerX + x * scale,
                y: centerY - y * scale
            });
        }

        for (let i = 0; i < 200; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.cbrt(Math.random());
            const sinT = Math.sin(t);
            const x = 16 * (sinT * sinT * sinT) * r;
            const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
            points.push({
                x: centerX + x * scale,
                y: centerY - y * scale
            });
        }

        return points;
    }

    // Chuva suave de corações que traverssa a tela durante o encerramento
    spawnHeartRain() {
        const colors = ['#ff758f', '#c084fc', '#fcd34d', '#ff9fad', '#e879f9'];
        const count = 25;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                this.particles.push({
                    type: 'heart_rain',
                    x: x,
                    y: -20,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: 0.6 + Math.random() * 1.2,
                    size: 6 + Math.random() * 10,
                    alpha: 0.6 + Math.random() * 0.4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: (Math.random() - 0.5) * 0.3,
                    vRotation: (Math.random() - 0.5) * 0.015
                });
            }, i * 300);
        }
    }
}


/* ==========================================================================
   STAGE MANAGER (Controlador Geral da Experiência)
   ========================================================================== */
class StageManager {
    constructor(audioManager, particleEngine) {
        this.audio = audioManager;
        this.particles = particleEngine;
        this.currentStageId = 'stage-1';
        this.cinemaOverlay = document.getElementById('cinema-overlay');
        this.flashOverlay = document.getElementById('flash-overlay');

        this.initEvents();
    }

    // Transição de etapa com escurecimento cinematográfico
    transitionTo(nextStageId, callbackBeforeShow = null) {
        const currentStage = document.getElementById(this.currentStageId);
        const nextStage = document.getElementById(nextStageId);

        if (!nextStage) return;

        // 1. Escurece a tela suavemente
        this.cinemaOverlay.classList.add('active');

        setTimeout(() => {
            // 2. Oculta a etapa anterior
            if (currentStage) {
                currentStage.classList.add('hidden');
                currentStage.classList.remove('active');
            }

            // Executa callback pré-exibição se houver
            if (callbackBeforeShow) {
                callbackBeforeShow();
            }

            // 3. Exibe a nova etapa
            nextStage.classList.remove('hidden');
            nextStage.classList.add('active');
            this.currentStageId = nextStageId;

            // 4. Clareia a tela
            setTimeout(() => {
                this.cinemaOverlay.classList.remove('active');
            }, 200);

        }, 1200); // Tempo correspondente à transição CSS da overlay
    }

    // Transição de flash rápido (explosão de luz para contagem -> parabéns)
    flashTransition(nextStageId, callbackBeforeShow = null) {
        const currentStage = document.getElementById(this.currentStageId);
        const nextStage = document.getElementById(nextStageId);

        if (!nextStage) return;

        // Ativa flash branco rápido
        this.flashOverlay.classList.add('active');

        setTimeout(() => {
            if (currentStage) {
                currentStage.classList.add('hidden');
                currentStage.classList.remove('active');
            }

            if (callbackBeforeShow) {
                callbackBeforeShow();
            }

            nextStage.classList.remove('hidden');
            nextStage.classList.add('active');
            this.currentStageId = nextStageId;

            this.flashOverlay.classList.remove('active');
        }, 300);
    }

    initEvents() {
        // --- ETAPA 1 -> ETAPA 2 ---
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audio.initContext();
            this.audio.playMusic();
            this.audio.showToggleBtn();
            this.audio.playSound('chime');

            this.transitionTo('stage-2');
        });

        // --- ETAPA 2 (PRESENTE) -> ETAPA 3 (CONTAGEM) ---
        const giftBox = document.getElementById('gift-box');
        const giftScene = giftBox.parentElement;
        let giftClicked = false;

        giftBox.addEventListener('click', () => {
            if (giftClicked) return;
            giftClicked = true;

            // Animação de tremor rápida
            giftScene.classList.add('shake');
            this.audio.playSound('presentOpen');

            setTimeout(() => {
                giftScene.classList.remove('shake');
                // Tampa voa, câmera dá zoom e luz acende
                giftScene.classList.add('open');

                // Avança para contagem após animação de abertura
                setTimeout(() => {
                    this.transitionTo('stage-3', () => {
                        this.startCountdown();
                    });
                }, 2200);
            }, 600);
        });

        // --- ETAPA 4 -> ETAPA 5 (MURAL) ---
        document.getElementById('btn-to-mural').addEventListener('click', () => {
            this.audio.playSound('chime');
            this.transitionTo('stage-5', () => {
                // Ativa a animação de lançamento das Polaroids
                setTimeout(() => {
                    const polaroids = document.querySelectorAll('.polaroid');
                    polaroids.forEach(p => p.classList.add('throw'));
                }, 300);
            });
        });

        // --- ETAPA 5 -> ETAPA 6 (TIMELINE) ---
        document.getElementById('btn-to-timeline').addEventListener('click', () => {
            this.audio.playSound('chime');
            this.transitionTo('stage-6', () => {
                // Animação de entrada dos itens da Timeline
                setTimeout(() => {
                    const items = document.querySelectorAll('.timeline-item');
                    items.forEach(item => item.classList.add('show'));
                }, 200);
            });
        });

        // Configuração interativa da Timeline (expandir corpo)
        const timelineContents = document.querySelectorAll('.timeline-content');
        timelineContents.forEach(content => {
            content.addEventListener('click', () => {
                const body = content.querySelector('.timeline-body');
                const wasActive = body.classList.contains('active');

                // Fecha outros
                document.querySelectorAll('.timeline-body').forEach(b => b.classList.remove('active'));

                if (!wasActive) {
                    body.classList.add('active');
                    this.audio.playSound('tick');
                }
            });
        });

        // --- ETAPA 6 -> ETAPA 7 (CARTA) ---
        document.getElementById('btn-to-letter').addEventListener('click', () => {
            this.audio.playSound('chime');
            this.transitionTo('stage-7');
        });

        // Configuração interativa da Carta & Envelope
        const envelope = document.getElementById('envelope');
        const btnCloseLetter = document.getElementById('btn-close-letter');
        let letterOpened = false;

        envelope.addEventListener('click', () => {
            if (letterOpened) return;
            letterOpened = true;

            envelope.classList.add('open');
            this.audio.playSound('letterOpen');

            // Revela botão de fechar após a carta abrir por completo
            setTimeout(() => {
                btnCloseLetter.classList.remove('hidden');
                btnCloseLetter.classList.add('fade-in');
            }, 1200);
        });

        // --- ETAPA 7 -> ETAPA 8 (CÉU ESTRELADO) ---
        btnCloseLetter.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede o clique de redisparar no envelope
            this.audio.playSound('chime');

            this.transitionTo('stage-8', () => {
                this.startSkyConstellation();
            });
        });

        // --- ETAPA 9 (FRASES SURPRESA) ---
        const boxBtns = document.querySelectorAll('.box-btn');
        const modal = document.getElementById('message-modal');
        const closeModal = document.getElementById('close-modal');
        const modalBody = document.getElementById('modal-body-content');

        const messages = {
            happy: {
                title: "❤️ Abra quando estiver feliz",
                body: "Se você está feliz, então meu coração sorri junto! E, se lembrar de mim nesse instante, saiba que vou ficar feliz em saber que um dos seus sorrisos também fez parte do meu dia ❤️. Continue compartilhando essa energia positiva com o mundo e lembre-se de registrar este momento na memória! ✨"
            },
            miss: {
                title: "🤍 Abra quando sentir saudade",
                body: "A distância física ou o tempo sem se falar não diminui em nada o carinho que guardo por você. Feche os olhos por um segundo e sinta este abraço virtual apertado que estou te enviando agora. Não importa onde, estarei sempre torcendo por você e lembrando dos nossos melhores momentos, se sentir vontade 📞, Vou gostar de ouvir sua voz⏳"
            },
            smile: {
                title: "✨ Abra quando precisar sorrir",
                body: "Respira... Lembra de quantas vezes a gente riu de coisas sem sentido? Você é uma pessoa incrível. A vida pode ser pesada às vezes, mas nunca deixe que ela roube esse sorriso bonito que você tem. E, se ele insistir em não aparecer, me chama. A gente dá um jeito de encontrar um motivo para rir de novo 😊❤️. Deixo aqui um lembrete especial de que você é extremamente especial para mim, Sorria, o dia vai melhorar! 🌟"
            }
        };

        let currentMessage = null;

        boxBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const msgType = btn.getAttribute('data-message');
                const msg = messages[msgType];

                if (currentMessage === msgType) {
                    modal.classList.add('hidden');
                    currentMessage = null;
                    this.audio.playSound('tick');
                    return;
                }

                modalBody.innerHTML = `
                    <h3 class="modal-message-title">${msg.title}</h3>
                    <p class="modal-message-body">${msg.body}</p>
                `;

                this.audio.playSound('chime');
                modal.classList.remove('hidden');
                currentMessage = msgType;
            });
        });

        const closeMessageModal = () => {
            modal.classList.add('hidden');
            currentMessage = null;
            this.audio.playSound('tick');
        }

        closeModal.addEventListener('click', () => {
            closeMessageModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMessageModal();
            }
        });

        // --- ETAPA 9 -> ETAPA 10 (BOLO) ---
        document.getElementById('btn-to-cake').addEventListener('click', () => {
            modal.classList.add('hidden');
            this.audio.playSound('chime');
            this.transitionTo('stage-10');
        });

        // Configuração interativa do Bolo (Apagar Velas)
        const flames = document.querySelectorAll('.flame');
        let blownOutCount = 0;
        const btnToFinal = document.getElementById('btn-to-final');

        flames.forEach(flame => {
            flame.addEventListener('click', (e) => {
                const candle = e.target.parentElement;
                if (!candle.classList.contains('blown-out')) {
                    candle.classList.add('blown-out');
                    this.audio.playSound('blow');
                    blownOutCount++;

                    // Se apagou todas as 3 velas
                    if (blownOutCount === 3) {
                        setTimeout(() => {
                            this.audio.playSound('confetti');
                            this.particles.spawnConfetti(120);

                            // Mostra botão para ir à etapa final
                            setTimeout(() => {
                                btnToFinal.classList.remove('hidden');
                                btnToFinal.classList.add('fade-in');
                            }, 1000);
                        }, 500);
                    }
                }
            });
        });

        // --- ETAPA 10 -> ETAPA FINAL ---
        btnToFinal.addEventListener('click', () => {
            this.audio.playSound('chime');
            this.transitionTo('stage-final', () => {
                this.startFinalCinema();
            });
        });

        // --- BOTÃO REINICIAR (Encerramento Especial) ---
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.audio.playSound('chime');
            this.resetApp();
        });
    }

    // Efeito da Contagem Regressiva
    startCountdown() {
        const countdownEl = document.getElementById('countdown-number');
        let count = 3;
        countdownEl.innerText = count;
        countdownEl.classList.add('impact');
        this.audio.playSound('tick');

        const interval = setInterval(() => {
            count--;
            countdownEl.classList.remove('impact');

            // Pequeno trigger de layout para relançar animação do elemento
            void countdownEl.offsetWidth;

            if (count > 0) {
                countdownEl.innerText = count;
                countdownEl.classList.add('impact');
                this.audio.playSound('tick');
            } else {
                clearInterval(interval);
                // Transição de flash explosivo no Zero
                this.flashTransition('stage-4', () => {
                    // Explosões em cadeia no Canvas
                    this.audio.playSound('fireworks');
                    this.particles.spawnFirework();
                    this.particles.spawnConfetti(150);
                    this.particles.spawnBalloons(20);

                    // Lança mais fogos alternados nos próximos segundos
                    for (let i = 1; i <= 4; i++) {
                        setTimeout(() => {
                            this.audio.playSound('fireworks');
                            this.particles.spawnFirework();
                            if (i % 2 === 0) this.particles.spawnBalloons(5);
                        }, i * 800);
                    }
                });
            }
        }, 1200);
    }

    // Efeito do Céu Estrelado Especial (Constelações)
    startSkyConstellation() {
        const overlayText = document.getElementById('sky-text-overlay');
        overlayText.innerText = "";
        overlayText.classList.remove('show');

        // 1. Gera e aplica constelação de "Feliz Aniversário"
        setTimeout(() => {
            const pointsText = this.particles.generateCoordinatesFromText("Feliz\nAniversário", 1.1);
            if (pointsText.length > 0) {
                this.particles.setConstellation(pointsText);
            }
            overlayText.innerText = "Olhe para as estrelas...";
            overlayText.classList.add('show');
            this.audio.playSound('chime');
        }, 1000);

        // 2. Muda a constelação para formato de Coração
        setTimeout(() => {
            overlayText.classList.remove('show');

            setTimeout(() => {
                const pointsHeart = this.particles.generateHeartCoordinates();
                if (pointsHeart.length > 0) {
                    this.particles.setConstellation(pointsHeart);
                }
                overlayText.innerText = "Elas brilham por você 🤍";
                overlayText.classList.add('show');
                this.audio.playSound('chime');
            }, 1000);

        }, 6000);

        // 3. Reseta constelação e transita para frases surpresas
        setTimeout(() => {
            overlayText.classList.remove('show');
            this.particles.resetConstellation();

            setTimeout(() => {
                this.transitionTo('stage-9');
            }, 1500);

        }, 11500);
    }

    // Sequenciador de legendas da Etapa Final
    startFinalCinema() {
        const text1 = document.getElementById('final-text-1');
        const text2 = document.getElementById('final-text-2');
        const text3 = document.getElementById('final-text-3');
        const textTitle = document.getElementById('final-text-4');
        const specialEnding = document.getElementById('special-ending');
        const endingText1 = document.getElementById('ending-text-1');
        const endingText2 = document.getElementById('ending-text-2');
        const finalFooter = document.getElementById('final-footer');

        // Sequência temporal de fades cinematográficos
        setTimeout(() => {
            text1.classList.add('show');
        }, 1500);

        setTimeout(() => {
            text1.classList.remove('show');
            setTimeout(() => {
                text2.classList.add('show');
            }, 1000);
        }, 5500);

        setTimeout(() => {
            text2.classList.remove('show');
            setTimeout(() => {
                text3.classList.add('show');
            }, 1000);
        }, 9500);

        setTimeout(() => {
            text3.classList.remove('show');

            setTimeout(() => {
                textTitle.classList.add('show');
                this.audio.playSound('chime');
                // Lança partículas festivas finais suaves no fundo
                this.particles.spawnConfetti(80);

                const fireworkInterval = setInterval(() => {
                    if (this.currentStageId === 'stage-final' && Math.random() > 0.6) {
                        this.particles.spawnFirework();
                    }
                }, 3000);
                // Guarda referência para poder parar depois
                this._fireworkInterval = fireworkInterval;
            }, 1500);
        }, 13000);

        // --- ENCERRAMENTO ESPECIAL (começa após 18s) ---
        // Silêncio: o título fica pulsando por alguns segundos
        setTimeout(() => {
            // O título some suavemente
            textTitle.classList.remove('show');

            // Para fogos e abaixa a música
            if (this._fireworkInterval) clearInterval(this._fireworkInterval);
            this.audio.fadeMusic(0.08, 5000);

        }, 18000);

        setTimeout(() => {
            // Mostra o container do encerramento
            specialEnding.classList.remove('hidden');
            requestAnimationFrame(() => specialEnding.classList.add('show'));

            // Primeiro texto aparece
            setTimeout(() => {
                endingText1.classList.remove('hidden');
                requestAnimationFrame(() => endingText1.classList.add('show'));
            }, 800);

        }, 20000);

        setTimeout(() => {
            // Assinatura com efeito de escrita
            endingText2.classList.remove('hidden');
            requestAnimationFrame(() => endingText2.classList.add('show'));
            this.audio.playSound('chime');

            // Dispara chuva de corações
            this.particles.spawnHeartRain();

        }, 23500);

        // Rodapé aparece por último
        setTimeout(() => {
            finalFooter.classList.remove('hidden');
            requestAnimationFrame(() => finalFooter.classList.add('show'));
        }, 27000);
    }

    // Reinicia toda a experiência do zero
    resetApp() {
        // Escurece a tela antes de reiniciar
        this.cinemaOverlay.classList.add('active');

        setTimeout(() => {
            // Oculta todos os stages
            document.querySelectorAll('.stage').forEach(s => {
                s.classList.add('hidden');
                s.classList.remove('active');
            });

            // Reseta textos sequenciais (só usam opacity via .show)
            ['final-text-1', 'final-text-2', 'final-text-3', 'final-text-4'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('show');
            });

            // Reseta textos do encerramento (voltam ao hidden)
            ['ending-text-1', 'ending-text-2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.classList.remove('show'); el.classList.add('hidden'); }
            });
            const specialEnding = document.getElementById('special-ending');
            if (specialEnding) { specialEnding.classList.remove('show'); specialEnding.classList.add('hidden'); }

            const finalFooter = document.getElementById('final-footer');
            if (finalFooter) { finalFooter.classList.remove('show'); finalFooter.classList.add('hidden'); }

            // Limpa partículas (mantém estrelas)
            this.particles.particles = [];
            this.particles.fireworks = [];

            // Reseta e reinicia música
            this.audio.playMusic();

            // Volta ao stage-1
            this.currentStageId = 'stage-1';
            const stage1 = document.getElementById('stage-1');
            if (stage1) {
                stage1.classList.remove('hidden');
                stage1.classList.add('active');
            }

            // Clareia a tela
            setTimeout(() => {
                this.cinemaOverlay.classList.remove('active');
            }, 300);

        }, 1200);
    }
}


/* ==========================================================================
   INICIALIZAÇÃO DO APP
   ========================================================================== */
function initBirthdayApp() {
    const audio = new AudioManager();
    const particles = new ParticleEngine();
    const app = new StageManager(audio, particles);

    // Oculta a tela de loading
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 1000);
    }

    // Armazena no escopo global para depuração/interações diretas caso necessário
    window.BirthdayApp = { audio, particles, app };
}

/* ==========================================================================
   PASSWORD GATE
   ========================================================================== */
function initPasswordGate() {
    const gate = document.getElementById('password-gate');
    const input = document.getElementById('password-input');
    const submitBtn = document.getElementById('password-submit');
    const error = document.getElementById('password-error');

    const correctPassword = 'lins2026';

    function checkPassword() {
        if (input.value === correctPassword) {
            gate.classList.add('hidden');
            setTimeout(() => {
                gate.style.display = 'none';
                initBirthdayApp();
            }, 800);
        } else {
            error.classList.remove('hidden');
            input.value = '';
            input.focus();
            setTimeout(() => error.classList.add('hidden'), 3000);
        }
    }

    submitBtn.addEventListener('click', checkPassword);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
    input.focus();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordGate);
} else {
    initPasswordGate();
}
