import { useEffect, useRef } from 'react';

interface VoiceParticlesProps {
    mode: 'idle' | 'listening' | 'speaking' | 'thinking';
}

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    baseX: number;
    baseY: number;
    size: number;
    targetSize: number;
    alpha: number;
    targetAlpha: number;
    hue: number;
    saturation: number;
    lightness: number;
    noiseOffsetX: number;
    noiseOffsetY: number;
    speed: number;
    orbitAngle: number;
    orbitRadius: number;
    layer: number; // 0 = back, 1 = mid, 2 = front
}

// Simple noise function for organic movement
function noise(x: number, y: number, t: number): number {
    return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.7) * 0.5 +
        Math.sin(x * 0.02 - t * 0.5) * Math.cos(y * 0.015 + t * 0.3) * 0.3 +
        Math.sin(x * 0.005 + y * 0.005 + t * 0.2) * 0.2;
}

// Lerp helper
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function VoiceParticles({ mode }: VoiceParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const frameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const modeRef = useRef(mode);

    // Update mode ref for smooth transitions
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize Canvas Size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Color palette inspired by the garden scene
        const createColor = (): { hue: number; saturation: number; lightness: number } => {
            const colorType = Math.random();
            if (colorType < 0.35) {
                // Greens
                return { hue: 120 + Math.random() * 40, saturation: 40 + Math.random() * 30, lightness: 50 + Math.random() * 30 };
            } else if (colorType < 0.6) {
                // Cyans/Teals
                return { hue: 160 + Math.random() * 40, saturation: 50 + Math.random() * 30, lightness: 55 + Math.random() * 25 };
            } else if (colorType < 0.8) {
                // Whites/Light blues
                return { hue: 180 + Math.random() * 40, saturation: 20 + Math.random() * 20, lightness: 80 + Math.random() * 15 };
            } else {
                // Subtle purples/pinks
                return { hue: 270 + Math.random() * 40, saturation: 30 + Math.random() * 25, lightness: 60 + Math.random() * 25 };
            }
        };

        // Initialize Particles
        const initParticles = () => {
            const count = 2000; // High particle count for fine granularity
            const newParticles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const color = createColor();
                const layer = Math.floor(Math.random() * 3);

                // Size distribution: 90% tiny, 8% small, 2% medium (no large)
                const sizeRoll = Math.random();
                let baseSize: number;
                if (sizeRoll < 0.90) {
                    // Tiny particles (majority)
                    baseSize = 0.2 + Math.random() * 0.5; // 0.2 - 0.7px
                } else if (sizeRoll < 0.98) {
                    // Small particles
                    baseSize = 0.6 + Math.random() * 0.6; // 0.6 - 1.2px
                } else {
                    // Medium particles (accent)
                    baseSize = 1.0 + Math.random() * 1.0; // 1.0 - 2.0px
                }

                // Layer multiplier (back smaller, front larger)
                const layerMultiplier = layer === 0 ? 0.6 : layer === 1 ? 0.9 : 1.2;

                newParticles.push({
                    x,
                    y,
                    targetX: x,
                    targetY: y,
                    baseX: x,
                    baseY: y,
                    size: baseSize * layerMultiplier,
                    targetSize: baseSize * layerMultiplier,
                    alpha: 0.15 + Math.random() * 0.4,
                    targetAlpha: 0.2 + Math.random() * 0.5,
                    hue: color.hue,
                    saturation: color.saturation,
                    lightness: color.lightness,
                    noiseOffsetX: Math.random() * 1000,
                    noiseOffsetY: Math.random() * 1000,
                    speed: 0.3 + Math.random() * 0.7,
                    orbitAngle: Math.random() * Math.PI * 2,
                    orbitRadius: 50 + Math.random() * 150,
                    layer
                });
            }
            particlesRef.current = newParticles;
        };
        initParticles();

        // Animation Loop
        const animate = (timestamp: number) => {
            if (!canvas || !ctx) return;

            const deltaTime = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;
            timeRef.current += deltaTime * 0.001;
            const t = timeRef.current;

            // Fade effect for trails
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const activeCenterY = canvas.height * 0.35; // Higher center for listening/speaking/thinking
            const currentMode = modeRef.current;

            // Lerp speed for smooth transitions
            const transitionSpeed = 0.02;

            particlesRef.current.forEach((p, i) => {
                // Calculate target position based on mode
                if (currentMode === 'idle') {
                    // Gentle floating across screen with noise
                    const noiseVal = noise(p.noiseOffsetX + t * 20, p.noiseOffsetY + t * 20, t);
                    p.targetX = p.baseX + Math.sin(t * 0.3 + i * 0.1) * 80 + noiseVal * 60;
                    p.targetY = p.baseY + Math.cos(t * 0.2 + i * 0.15) * 60 + noiseVal * 40;

                    // Wrap around screen
                    if (p.targetX < -50) p.baseX += canvas.width + 100;
                    if (p.targetX > canvas.width + 50) p.baseX -= canvas.width + 100;
                    if (p.targetY < -50) p.baseY += canvas.height + 100;
                    if (p.targetY > canvas.height + 50) p.baseY -= canvas.height + 100;

                    p.targetAlpha = 0.5 + Math.sin(t + i * 0.5) * 0.25; // Increased from 0.3 to 0.5 base
                    p.targetSize = (0.6 + Math.sin(t * 0.5 + i) * 0.25) * (p.layer === 0 ? 0.6 : p.layer === 1 ? 1.0 : 1.4); // Increased sizes
                }
                else if (currentMode === 'listening') {
                    // Gather toward center in breathing cluster
                    const breathe = 1 + Math.sin(t * 2) * 0.2; // Increased breathing amplitude
                    const clusterRadius = 140 * breathe; // Larger cluster
                    const angle = p.orbitAngle + t * 0.4 * p.speed; // Slightly faster rotation
                    const radiusVariation = Math.sin(t * 1.5 + i * 0.3) * 40;
                    const targetRadius = (clusterRadius + radiusVariation) * (0.2 + (i / particlesRef.current.length) * 0.8);

                    p.targetX = centerX + Math.cos(angle) * targetRadius;
                    p.targetY = activeCenterY + Math.sin(angle) * targetRadius;
                    p.targetAlpha = 0.7 + Math.sin(t * 3 + i * 0.2) * 0.25; // Increased from 0.6 to 0.7 base
                    p.targetSize = (0.55 + Math.sin(t * 2 + i * 0.5) * 0.25) * (p.layer === 0 ? 0.6 : p.layer === 1 ? 1.0 : 1.3); // Increased sizes
                }
                else if (currentMode === 'speaking') {
                    // Wave-like expansion with longer wavelength
                    const wavePhase = t * 1.5 + i * 0.02; // Slower phase, longer wavelength
                    const waveAmplitude = 50 + Math.sin(t * 1.2) * 20; // Gentler amplitude
                    const spreadX = (i / particlesRef.current.length - 0.5) * canvas.width * 0.85;
                    const waveY = Math.sin(wavePhase) * waveAmplitude;
                    const pulse = 1 + Math.sin(t * 3) * 0.05;

                    p.targetX = centerX + spreadX * pulse;
                    p.targetY = activeCenterY + waveY;
                    p.targetAlpha = 0.45 + Math.abs(Math.sin(wavePhase)) * 0.35;
                    p.targetSize = (0.35 + Math.sin(t * 2 + i * 0.2) * 0.15) * (p.layer === 0 ? 0.5 : p.layer === 1 ? 0.8 : 1.0);
                }
                else if (currentMode === 'thinking') {
                    // Orbital swirl with varying speeds
                    const orbitSpeed = 0.5 + (i % 5) * 0.15;
                    const angle = p.orbitAngle + t * orbitSpeed;
                    const radiusPulse = 1 + Math.sin(t * 1.5 + i * 0.1) * 0.2;
                    const radius = p.orbitRadius * radiusPulse * 0.8;
                    const verticalOffset = Math.sin(t * 0.8 + i * 0.2) * 40;

                    p.targetX = centerX + Math.cos(angle) * radius;
                    p.targetY = activeCenterY + Math.sin(angle) * radius * 0.6 + verticalOffset;
                    p.targetAlpha = 0.4 + Math.sin(t * 2 + i * 0.3) * 0.25;
                    p.targetSize = (1 + Math.sin(t * 3 + i * 0.4) * 0.3) * (p.layer === 0 ? 0.5 : p.layer === 1 ? 0.9 : 1.2);
                }

                // Smooth lerp to target position
                const lerpSpeed = transitionSpeed + p.speed * 0.02;
                p.x = lerp(p.x, p.targetX, lerpSpeed);
                p.y = lerp(p.y, p.targetY, lerpSpeed);
                p.alpha = lerp(p.alpha, p.targetAlpha, transitionSpeed * 2);
                p.size = lerp(p.size, p.targetSize, transitionSpeed);

                // Dynamic color shifting
                const hueShift = Math.sin(t * 0.5 + i * 0.1) * 10;
                const color = `hsla(${p.hue + hueShift}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`;

                // Draw particle with glow effect
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // Add subtle glow for larger particles
                if (p.size > 1.5 && p.alpha > 0.4) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                    const glowColor = `hsla(${p.hue + hueShift}, ${p.saturation}%, ${p.lightness + 10}%, ${p.alpha * 0.15})`;
                    ctx.fillStyle = glowColor;
                    ctx.fill();
                }
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, []); // Only run once, mode changes handled via ref

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        />
    );
}
