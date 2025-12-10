
import { useState } from 'react';
import { TimelineView } from '../../features/timeline/TimelineView';
import { InsightsView } from '../../features/insights/InsightsView';
import { SettingsView } from '../../features/settings/SettingsView';

export function AppLayout() {
    // Tabs: 'timeline' | 'insights' | 'settings'
    const [activeTab, setActiveTab] = useState<'timeline' | 'insights' | 'settings'>('timeline');

    return (
        <div className="h-screen w-full bg-bg-canvas flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden font-sans text-text-main relative">

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar relative">
                {activeTab === 'timeline' && (
                    <TimelineView />
                )}

                {activeTab === 'insights' && (
                    <InsightsView onNavigateToTimeline={() => setActiveTab('timeline')} />
                )}

                {activeTab === 'settings' && (
                    <SettingsView />
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="h-[60px] bg-white/90 backdrop-blur-md border-t border-border-soft/50 flex items-center justify-around shrink-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">

                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'timeline' ? 'text-primary scale-105' : 'text-text-subtle hover:text-primary/70'}`}
                >
                    {/* Clock Icon for Timeline */}
                    <svg className={`w-6 h-6 ${activeTab === 'timeline' ? 'stroke-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-medium tracking-wide">时间线</span>
                </button>

                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'insights' ? 'text-primary scale-105' : 'text-text-subtle hover:text-primary/70'}`}
                >
                    {/* Chart Outline (Always used, color changes) */}
                    <svg className={`w-6 h-6 ${activeTab === 'insights' ? 'stroke-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <span className="text-[10px] font-medium tracking-wide">洞察</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === 'settings' ? 'text-primary scale-105' : 'text-text-subtle hover:text-primary/70'}`}
                >
                    {/* Settings Outline (Always used, color changes) */}
                    <svg className={`w-6 h-6 ${activeTab === 'settings' ? 'stroke-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-[10px] font-medium tracking-wide">设置</span>
                </button>
            </nav>
        </div>
    );
}
