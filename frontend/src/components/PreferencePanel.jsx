import React from 'react';
import { Calendar, Wand2 } from 'lucide-react';
import logoImage from '../assets/planwizz_banner.png';

const PreferencePanel = ({ leaveDay, setLeaveDay, onGenerate }) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
        <div className="space-y-6 animate-fade-in delay-100 w-full">

            {/* Leave Day Preference */}
            <div className="bg-[#fcf8f8] dark:bg-[#1a1a1a]/50 p-5 rounded-2xl border border-gray-200/60 dark:border-white/5 transition-all w-full">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center mb-3">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    Leave Day Preference
                </label>

                <div className="relative">
                    <select
                        className="w-full p-2.5 pl-3 text-sm text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#2c2c2c] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-4 focus:ring-gray-100 dark:focus:ring-white/5 appearance-none transition-all cursor-pointer"
                        value={leaveDay}
                        onChange={(e) => setLeaveDay(e.target.value)}
                    >
                        <option value="" className="bg-white dark:bg-[#2c2c2c]">None (Maximize Study)</option>
                        {days.map(day => (
                            <option key={day} value={day} className="bg-white dark:bg-[#2c2c2c]">{day}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5">
                    {leaveDay ? `Attempting to keep ${leaveDay}s free.` : "No specific day off requested."}
                </p>
            </div>

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                className="w-full py-3.5 px-6 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
                <Wand2 className="w-4 h-4" />
                Generate Timetable
            </button>

        </div>
    );
};

export default PreferencePanel;

