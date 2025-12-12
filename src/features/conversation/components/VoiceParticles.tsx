import { useEffect, useRef } from 'react';

interface VoiceParticlesProps {
    mode: 'idle' | 'listening' | 'speaking' | 'thinking';
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    targetX: number;
    targetY: number;
    color: string;
}

export function VoiceParticles({ mode }: VoiceParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const frameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize Canvas Size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight * 0.6; // Top 60%
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize Particles
        const initParticles = () => {
            const count = 80;
            const newParticles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    alpha: Math.random() * 0.5 + 0.2,
                    targetX: canvas.width / 2,
                    targetY: canvas.height / 2,
                    color: `hsl(${Math.random() * 60 + 180}, 70%, 80%)` // Cyan/Blue range
                });
            }
            particlesRef.current = newParticles;
        };
        initParticles();

        // Animation Loop
        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            particlesRef.current.forEach((p, i) => {
                // Behavior based on Mode
                if (mode === 'idle') {
                    // Gentle float
                    p.x += p.vx;
                    p.y += p.vy;

                    // Boundary wrap
                    if (p.x < 0) p.x = canvas.width;
                    if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height;
                    if (p.y > canvas.height) p.y = 0;

                    p.alpha = Math.sin(Date.now() * 0.001 + i) * 0.2 + 0.4;
                }
                else if (mode === 'listening') {
                    // Orbit / Converge
                    const angle = Date.now() * 0.002 + i * 0.1;
                    const radius = 100 + Math.sin(Date.now() * 0.005) * 20;
                    const targetX = centerX + Math.cos(angle) * radius;
                    const targetY = centerY + Math.sin(angle) * radius;

                    p.x += (targetX - p.x) * 0.05;
                    p.y += (targetY - p.y) * 0.05;
                    p.alpha = 0.8;
                }
                else if (mode === 'speaking') {
                    // Vertical Wave / Voice visualization
                    const xOffset = (i - particlesRef.current.length / 2) * 10;
                    const waveHeight = Math.sin(Date.now() * 0.01 + i * 0.2) * 50;
                    const targetX = centerX + xOffset;
                    const targetY = centerY + waveHeight;

                    p.x += (targetX - p.x) * 0.1;
                    p.y += (targetY - p.y) * 0.1;
                    p.alpha = Math.random() * 0.5 + 0.5;
                }
                else if (mode === 'thinking') {
                    // Rapid chaotic swirl
                    const angle = Date.now() * 0.005 + i;
                    const radius = Math.random() * 200;
                    const targetX = centerX + Math.cos(angle) * radius;
                    const targetY = centerY + Math.sin(angle) * radius;

                    p.x += (targetX - p.x) * 0.08;
                    p.y += (targetY - p.y) * 0.08;
                    p.alpha = Math.random();
                }

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [mode]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-[60%] pointer-events-none z-0"
        />
    );
}
