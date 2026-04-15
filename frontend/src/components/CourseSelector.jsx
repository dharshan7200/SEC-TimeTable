import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Check, Search, BookOpen } from 'lucide-react';

const CourseSelector = ({ courses, selectedSubjects, compatibleSubjects, onToggleSubject, preferredFaculties, onSetPreference }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const structure = React.useMemo(() => {
        if (!courses) return {};
        const subjs = {};
        courses.forEach(c => {
            if (!subjs[c.course_name]) {
                subjs[c.course_name] = {
                    code: c.course_code,
                    credits: c.credits,
                    faculties: new Set()
                };
            }
            subjs[c.course_name].faculties.add(c.faculty);
        });
        return subjs;
    }, [courses]);

    const uniqueSubjects = Object.keys(structure);

    const totalCredits = selectedSubjects.reduce((acc, subj) => {
        const creds = structure[subj] ? parseInt(structure[subj].credits, 10) : 0;
        return acc + creds;
    }, 0);

    const filteredSubjects = uniqueSubjects.filter(subject => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        const code = structure[subject]?.code?.toLowerCase() || "";
        return subject.toLowerCase().includes(lowerTerm) || code.includes(lowerTerm);
    });

    return (
        <div className="w-full space-y-4">
            {/* Search and Summary */}
            <div className="flex flex-col gap-3 bg-white/60 dark:bg-[#1a1a1a]/60 border border-gray-200/60 dark:border-white/5 rounded-2xl p-3 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-[#333] px-2.5 py-1 rounded-md">
                            {selectedSubjects.length} <span className="font-normal text-gray-500">Selected</span>
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-[#333] px-2.5 py-1 rounded-md">
                            {totalCredits} <span className="font-normal text-gray-500">Credits</span>
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#2c2c2c] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-4 focus:ring-gray-100 dark:focus:ring-white/5 transition-all shadow-sm"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {filteredSubjects.length > 0 ? (
                    filteredSubjects.map(subject => {
                        const isSelected = selectedSubjects.includes(subject);
                        const details = structure[subject];
                        const facultyList = Array.from(details.faculties);

                        const isCompatible = compatibleSubjects ? compatibleSubjects.includes(subject) : true;
                        const isDisabled = !isCompatible && !isSelected;

                        return (
                            <div
                                key={subject}
                                className={`p-4 rounded-2xl border transition-all duration-200 relative group ${isSelected
                                    ? 'border-gray-900 dark:border-gray-100 bg-white dark:bg-[#2c2c2c] shadow-sm'
                                    : isDisabled
                                        ? 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#151515] opacity-50 grayscale'
                                        : 'border-gray-200/60 dark:border-white/5 bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer'
                                    }`}
                                onClick={() => !isDisabled && !isSelected && onToggleSubject(subject)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-3">
                                        <h3 className={`font-semibold text-sm line-clamp-2 ${isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {subject}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                                            <span className="bg-gray-100 dark:bg-[#333] px-1.5 py-0.5 rounded font-mono text-[10px]">{details.code}</span>
                                            <span>•</span>
                                            <span>{details.credits} Credits</span>
                                        </p>

                                        {isDisabled && (
                                            <div className="flex items-center text-[11px] text-red-600 dark:text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-900/10 w-fit px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/30">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Time Clash
                                            </div>
                                        )}
                                    </div>

                                    <label className="relative flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleSubject(subject)}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                                            ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white'
                                            : isDisabled
                                                ? 'border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900'
                                                : 'border-gray-300 dark:border-gray-600 bg-transparent group-hover:border-gray-400'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-black" />}
                                        </div>
                                    </label>
                                </div>

                                {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center mb-1.5">
                                            <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                            Faculty Preference
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-2 pl-2.5 text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700/50 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5 appearance-none cursor-pointer"
                                                value={preferredFaculties[subject] || ""}
                                                onChange={(e) => onSetPreference(subject, e.target.value)}
                                            >
                                                <option value="" className="bg-white dark:bg-[#1a1a1a]">Any Available</option>
                                                {facultyList.map(f => (
                                                    <option key={f} value={f} className="bg-white dark:bg-[#1a1a1a]">{f}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-1 md:col-span-2 text-center py-10 bg-white/50 dark:bg-[#1a1a1a]/50 rounded-2xl border border-gray-200/50 dark:border-white/5 border-dashed">
                        <BookOpen className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">No courses found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseSelector;
