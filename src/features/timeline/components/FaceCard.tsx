import React from 'react';
import type { FaceHistoryRecord } from '../../../services/historyStore';

interface FaceCardProps {
    record: FaceHistoryRecord;
    onDelete: (e: React.MouseEvent) => void;
    onClick: () => void;
    isActive: boolean;
}

export function FaceCard({ record, onDelete, onClick, isActive }: FaceCardProps) {
    const topTags = record.emotion.tags.slice(0, 3);
    const dateLabel = new Date(record.date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Normalize scores
    const energy = Math.min(10, Math.max(0, record.emotion.energy_level || 0));
    const mood = Math.min(10, Math.max(0, record.emotion.mood_brightness || 0));
    const vitality = Math.min(10, Math.max(0, record.emotion.vitality_score || 0));

    // Soft explanation logic
    const avgScore = (energy + mood) / 2;
    let softText = "这只是当下的一帧，给自己一点小小的观察就好。";
    if (avgScore < 5) {
        softText = "今天看起来有点累，允许自己慢一点没关系。";
    } else if (avgScore >= 7) {
        softText = "今天的状态挺不错，可以安排一点对自己重要的事情。";
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative w-full rounded-3xl overflow-hidden
                min-h-[260px]
                transition-all duration-500 ease-out
                cursor-pointer
                ${isActive ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] scale-[1.02]' : 'shadow-md opacity-90 scale-100'}
            `}
        >
            {/* Background Layer: Photo with Filters */}
            <div className="absolute inset-0 z-0">
                {record.thumbnail.includes('camera_icon_custom') ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <svg className="w-24 h-24 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                ) : (
                    <img
                        src={record.thumbnail}
                        alt="Background"
                        className="w-full h-full object-cover brightness-75 saturate-75 blur-[2px] scale-105"
                    />
                )}
            </div>

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-0" />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col justify-between h-full p-4 gap-3">

                {/* 1. Header Row */}
                <div className="flex items-center justify-between mb-1">
                    {/* Date Pill */}
                    <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[11px] text-white/85 border border-white/10">
                        {dateLabel}
                    </div>

                    {/* Right: Avatar + Menu */}
                    <div className="flex items-center gap-3">
                        {/* More/Delete Action - kept subtle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        {/* Circular Avatar */}
                        {record.thumbnail.includes('camera_icon_custom') ? (
                            <div className="w-12 h-12 rounded-full border border-white/70 shadow-md bg-white/20 flex items-center justify-center text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        ) : (
                            <img
                                src={record.thumbnail}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full border border-white/70 shadow-md object-cover object-center"
                            />
                        )}
                    </div>
                </div>

                {/* 2. Middle Section: Title + Tags */}
                <div className="mt-2">
                    <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
                        {record.emotion.summary}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {topTags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] text-white/90 backdrop-blur-[2px]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Spacer to push bottom section down if needed, though flex justify-between handles logic */}
                <div className="flex-1" />

                {/* 3. Bottom Section: Metrics + Soft Text */}
                <div className="mt-1">
                    {/* Metrics Row */}
                    <div className="flex items-center justify-between gap-2">
                        <MetricColumn label="精力" value={energy} color="bg-emerald-400" />
                        <MetricColumn label="心情" value={mood} color="bg-blue-400" />
                        <MetricColumn label="气色" value={vitality} color="bg-orange-400" />
                    </div>

                    {/* Soft Explanation */}
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-white/75 leading-relaxed font-medium">
                        {softText}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricColumn({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="flex flex-col items-start w-[30%]">
            <span className="text-[11px] text-white/70 mb-0.5">{label}</span>
            <div className="text-sm font-semibold text-white mb-1 leading-none tabular-nums">
                {value.toFixed(1)}
            </div>
            <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-1000 opacity-90`}
                    style={{ width: `${value * 10}%` }}
                />
            </div>
        </div>
    );
}
