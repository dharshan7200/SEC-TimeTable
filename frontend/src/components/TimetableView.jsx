import React, { useState, useRef } from 'react';
import { Maximize2, Minimize2, Clock, Download, FileImage, FileText } from 'lucide-react';
import logoImage from '../assets/logo.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TimetableView = ({ timetable, ghostSubjects = [], allGhostData = null }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const tableRef = useRef(null);
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const times = [
        "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00",
        "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
        "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
    ];

    // Helper to format time strings for comparison
    const parseTime = (timeStr) => {
        if (!timeStr) return -1;
        const [start] = timeStr.split(' - ');
        return parseInt(start.replace(':', ''), 10);
    };

    // Pre-process timetable for faster lookup
    const scheduleMap = {};
    timetable.forEach(slot => {
        if (!scheduleMap[slot.day]) scheduleMap[slot.day] = {};
        const startTimeKey = parseTime(slot.time);
        scheduleMap[slot.day][startTimeKey] = { ...slot, type: 'booked' };
    });

    // Pre-process ghosts
    const ghostMap = {};
    if (allGhostData && ghostSubjects.length > 0) {
        ghostSubjects.forEach(subj => {
            if (allGhostData[subj]) {
                allGhostData[subj].forEach(slot => {
                    if (!ghostMap[slot.day]) ghostMap[slot.day] = {};
                    const tKey = parseTime(slot.time);
                    if (!ghostMap[slot.day][tKey]) ghostMap[slot.day][tKey] = [];
                    ghostMap[slot.day][tKey].push({ ...slot, subject: subj, type: 'ghost' });
                });
            }
        });
    }

    const handleExportImage = async () => {
        if (!tableRef.current) return;
        try {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#030712',
                scale: 2,
                logging: true,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i];
                        const style = window.getComputedStyle(el);

                        // Comprehensive list of properties that might contain colors or unsupported formats
                        const props = [
                            'color', 'backgroundColor', 'backgroundImage',
                            'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                            'outlineColor',
                            'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor',
                            'boxShadow', 'textShadow',
                            'filter', 'backdropFilter',
                            'caretColor', 'textDecorationColor', 'columnRuleColor',
                            'webkitTextStrokeColor', 'webkitTextFillColor'
                        ];

                        props.forEach(prop => {
                            const val = style[prop];
                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('display-p3'))) {
                                // Provide safe fallbacks based on property type
                                if (prop.toLowerCase().includes('color') || prop === 'fill' || prop === 'stroke') {
                                    // Use simple hex/rgba fallbacks
                                    if (prop === 'color') el.style[prop] = '#f3f4f6';
                                    else if (prop === 'backgroundColor') el.style[prop] = 'rgba(17, 24, 39, 0.9)';
                                    else if (prop.includes('border')) el.style[prop] = 'rgba(31, 41, 55, 0.5)';
                                    else if (prop === 'fill' || prop === 'stroke') el.style[prop] = 'currentColor';
                                    else el.style[prop] = 'transparent';
                                } else {
                                    // For complex properties like images, shadows, filters -> remove them to prevent parse errors
                                    el.style[prop] = 'none';
                                }
                            }
                        });
                    }
                }
            });
            const link = document.createElement('a');
            link.download = 'PlanWizz-Timetable.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please try a different browser.");
        }
    };

    const handleExportPDF = async () => {
        if (!tableRef.current) return;
        try {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#030712',
                scale: 2,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i];
                        const style = window.getComputedStyle(el);

                        const props = [
                            'color', 'backgroundColor', 'backgroundImage',
                            'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                            'outlineColor',
                            'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor',
                            'boxShadow', 'textShadow',
                            'filter', 'backdropFilter',
                            'caretColor', 'textDecorationColor', 'columnRuleColor',
                            'webkitTextStrokeColor', 'webkitTextFillColor'
                        ];

                        props.forEach(prop => {
                            const val = style[prop];
                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('display-p3'))) {
                                if (prop.toLowerCase().includes('color') || prop === 'fill' || prop === 'stroke') {
                                    if (prop === 'color') el.style[prop] = '#f3f4f6';
                                    else if (prop === 'backgroundColor') el.style[prop] = 'rgba(17, 24, 39, 0.9)';
                                    else if (prop.includes('border')) el.style[prop] = 'rgba(31, 41, 55, 0.5)';
                                    else if (prop === 'fill' || prop === 'stroke') el.style[prop] = 'currentColor';
                                    else el.style[prop] = 'transparent';
                                } else {
                                    el.style[prop] = 'none';
                                }
                            }
                        });
                    }
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('PlanWizz-Timetable.pdf');
        } catch (err) {
            console.error("PDF Export failed:", err);
            alert("PDF Export failed.");
        }
    };

    return (
        <div className={`transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] bg-black p-8 overflow-y-auto' : 'space-y-4'}`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <img
                        src={logoImage}
                        alt="PlanWizz"
                        className="w-8 h-8 object-contain mr-3 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    />
                    My Timetable
                </h2>
                <div className="flex items-center gap-2">
                    {/* Export Buttons */}
                    <div className="flex bg-gray-900/60 p-1 rounded-xl border border-gray-800 shadow-lg mr-2">
                        <button
                            onClick={handleExportImage}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Download as PNG"
                        >
                            <FileImage className="w-4 h-4 text-emerald-400" />
                            <span className="hidden sm:inline">PNG</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Download as PDF"
                        >
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
                        title={isFullScreen ? "Exit Full Screen" : "View Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div
                ref={tableRef}
                className={`overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl ${isFullScreen ? 'h-auto' : ''}`}
            >
                <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm text-center">
                    <thead>
                        <tr>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 text-gray-500 dark:text-gray-400 font-bold sticky left-0 z-10 w-32 border-r border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" /> Time
                                </div>
                            </th>
                            {days.map(day => (
                                <th key={day} className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 text-indigo-600 dark:text-indigo-300 font-bold tracking-wider uppercase text-xs">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {times.map((time, index) => {
                            const timeKey = parseTime(time);
                            return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="p-3 border-r border-b border-gray-200 dark:border-gray-800 font-mono text-gray-500 dark:text-gray-500 text-xs bg-gray-50 dark:bg-gray-950/30 font-medium">
                                        {time}
                                    </td>
                                    {days.map(day => {
                                        const bookedSlot = scheduleMap[day]?.[timeKey];
                                        const ghosts = ghostMap[day]?.[timeKey];

                                        // Render logic
                                        let cellContent = null;
                                        let cellClass = "";

                                        if (bookedSlot) {
                                            cellContent = (
                                                <div className="h-full w-full p-2 flex flex-col justify-center items-center">
                                                    <span className="font-bold text-white text-sm line-clamp-1">{bookedSlot.course_name}</span>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/80 font-mono">{bookedSlot.course_code}</span>
                                                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/80 font-mono">{bookedSlot.venue}</span>
                                                    </div>
                                                    <span className="text-[10px] text-white/60 mt-1 italic">{bookedSlot.faculty}</span>
                                                </div>
                                            );
                                            cellClass = "bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 border-indigo-500/50 hover:to-indigo-500 dark:hover:to-indigo-600 shadow-lg transform hover:scale-[1.02] transition-transform z-10 relative";
                                        } else if (ghosts && ghosts.length > 0) {
                                            cellContent = (
                                                <div className="flex flex-col gap-1 items-center justify-center h-full opacity-100">
                                                    {ghosts.map((g, idx) => (
                                                        <span key={idx} className="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded border border-emerald-500/30">
                                                            {g.subject}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                            cellClass = "bg-gray-50 dark:bg-gray-900/30 relative border-dashed border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10";
                                        } else {
                                            cellContent = <span className="text-gray-300 dark:text-gray-800 text-xs select-none">.</span>;
                                            cellClass = "text-gray-300 dark:text-gray-800";
                                        }

                                        return (
                                            <td key={day} className={`border-b border-r border-gray-200 dark:border-gray-800 h-24 p-1 relative group ${cellClass}`}>
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default TimetableView;
