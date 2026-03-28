import React from 'react';
import { Calendar, Wand2 } from 'lucide-react';
import logoImage from '../assets/logo.png';

const PreferencePanel = ({ leaveDay, setLeaveDay, onGenerate }) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
        <div className="space-y-8 animate-fade-in delay-100">

            {/* Leave Day Preference */}
            <div className="bg-white dark:bg-gray-800/40 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500/30 transition-colors shadow-sm dark:shadow-none">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center mb-3">
                    <img
                        src={logoImage}
                        alt="PlanWizz"
                        className="w-5 h-5 object-contain mr-2 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    />
                    Leave Day Preference
                </label>

                <div className="relative">
                    <select
                        className="w-full p-3 pl-4 text-sm text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 appearance-none transition-all shadow-sm"
                        value={leaveDay}
                        onChange={(e) => setLeaveDay(e.target.value)}
                    >
                        <option value="" className="bg-white dark:bg-gray-900">None (Maximize Study)</option>
                        {days.map(day => (
                            <option key={day} value={day} className="bg-white dark:bg-gray-900">{day}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 pl-1">
                    {leaveDay ? `PlanWizz will attempt to keep ${leaveDay}s free.` : "No specific day off requested."}
                </p>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
                <button
                    onClick={onGenerate}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
                >
                    <Wand2 className="w-5 h-5 mr-2 animate-pulse group-hover:rotate-12 transition-transform" />
                    Generate My Timetable
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-3 uppercase tracking-wider font-semibold">
                    AI-Powered Optimization
                </p>
            </div>

        </div>
    );
};

export default PreferencePanel;
