import { useMemo } from 'react';

interface RadarChartProps {
    data: {
        vitality: number;      // 核心活力 (Vitality)
        physio: number;        // 生理平衡 (Physio Balance)
        emotion: number;       // 情绪效价 (Emotional Valence)
        cognitive: number;     // 认知就绪 (Cognitive Readiness)
        social: number;        // 社交光彩 (Social Radiance)
    };
    size?: number;
    color?: string;
}

export function RadarChart5D({ data, size = 200, color = "#F472B6" }: RadarChartProps) {
    const center = size / 2;
    const radius = (size / 2) - 40; // Leave space for labels
    const maxVal = 10;

    const metrics = useMemo(() => [
        { key: 'vitality', label: '核心活力', value: data.vitality || 0 },
        { key: 'cognitive', label: '认知就绪', value: data.cognitive || 0 },
        { key: 'social', label: '社交光彩', value: data.social || 0 },
        { key: 'emotion', label: '情绪效价', value: data.emotion || 0 },
        { key: 'physio', label: '生理平衡', value: data.physio || 0 },
    ], [data]);

    // Helper to get coordinates
    const getPoint = (value: number, index: number, total: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2; // Start from top
        const r = (value / maxVal) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    // Generate Grid Polygons (2, 4, 6, 8, 10)
    const gridLevels = [2, 4, 6, 8, 10];

    // Generate Data Polygon
    const dataPoints = metrics.map((m, i) => getPoint(m.value, i, metrics.length));
    const dataPath = dataPoints.length > 0
        ? `M${dataPoints[0].x},${dataPoints[0].y}` + dataPoints.slice(1).map(p => `L${p.x},${p.y}`).join('') + 'Z'
        : '';

    return (
        <div className="relative flex justify-center items-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Grid */}
                {gridLevels.map((level) => {
                    const points = metrics.map((_, i) => getPoint(level, i, metrics.length));
                    const path = points.length > 0
                        ? `M${points[0].x},${points[0].y}` + points.slice(1).map(p => `L${p.x},${p.y}`).join('') + 'Z'
                        : '';
                    return (
                        <path
                            key={level}
                            d={path}
                            fill="none"
                            stroke="#E5E7EB" // gray-200
                            strokeWidth="1"
                            strokeDasharray={level === 10 ? "0" : "4 4"}
                        />
                    );
                })}

                {/* Axes */}
                {metrics.map((_, i) => {
                    const end = getPoint(maxVal, i, metrics.length);
                    return (
                        <line
                            key={i}
                            x1={center} y1={center}
                            x2={end.x} y2={end.y}
                            stroke="#E5E7EB"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data Polygon Area */}
                <path
                    d={dataPath}
                    fill={color}
                    fillOpacity="0.2"
                    stroke={color}
                    strokeWidth="2"
                    className="drop-shadow-sm transition-all duration-500 ease-out"
                />

                {/* Data Points */}
                {dataPoints.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x} cy={p.y}
                        r="3"
                        fill={color}
                        className="transition-all duration-500 ease-out"
                    />
                ))}

                {/* Labels */}
                {metrics.map((m, i) => {
                    const pos = getPoint(maxVal + 2.5, i, metrics.length); // Push slightly out
                    // Text Anchor Logic based on angle
                    // Top: middle, Right: start, Left: end, Bottom: middle
                    // Simple radial logic:
                    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
                    let textAnchor = 'middle';
                    let dy = '0.35em'; // Centered vertically

                    if (Math.abs(angle + Math.PI / 2) < 0.1) { // Top
                        dy = '-0.5em';
                    } else if (Math.abs(angle - Math.PI / 2) < 0.1) { // Bottom
                        dy = '1.2em';
                    } else if (Math.cos(angle) > 0.1) { // Right side
                        textAnchor = 'start';
                        pos.x += 5;
                    } else if (Math.cos(angle) < -0.1) { // Left side
                        textAnchor = 'end';
                        pos.x -= 5;
                    }

                    return (
                        <g key={i}>
                            <text
                                x={pos.x} y={pos.y}
                                dy={dy}
                                textAnchor={textAnchor as any}
                                className="text-xs font-semibold fill-gray-500"
                            >
                                {m.label}
                            </text>
                            <text
                                x={pos.x} y={pos.y}
                                dy={Number(dy.replace('em', '')) + 1.2 + 'em'}
                                textAnchor={textAnchor as any}
                                className="text-[11px] font-bold fill-gray-900"
                            >
                                {m.value.toFixed(1)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
