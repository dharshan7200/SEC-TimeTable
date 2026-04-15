import React, { useState, useRef } from 'react';
import { Clock, Download, Maximize2, Minimize2, FileImage, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import planwizzBanner from '../assets/planwizz_banner.png';
import logoImage from '../assets/planwizz_banner.png';

const TimetableView = ({ timetable, ghostSubjects = [], allGhostData = null }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const tableRef = useRef(null);
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const times = [
        "08:00 - 10:00", "10:00 - 12:00",
        "13:00 - 15:00", "15:00 - 17:00"
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
        
        const [startStr, endStr] = slot.time.split(' - ');
        if (!startStr || !endStr) return;
        
        const startH = parseInt(startStr.split(':')[0], 10);
        const endH = parseInt(endStr.split(':')[0], 10);
        
        for (let h = startH; h < endH; h += 2) {
            const timeKey = h * 100;
            scheduleMap[slot.day][timeKey] = { ...slot, type: 'booked' };
        }
    });

    // Pre-process ghosts
    const ghostMap = {};
    if (allGhostData && ghostSubjects.length > 0) {
        ghostSubjects.forEach(subj => {
            if (allGhostData[subj]) {
                allGhostData[subj].forEach(slot => {
                    if (!ghostMap[slot.day]) ghostMap[slot.day] = {};
                    
                    const [startStr, endStr] = slot.time.split(' - ');
                    if (!startStr || !endStr) return;
                    
                    const startH = parseInt(startStr.split(':')[0], 10);
                    const endH = parseInt(endStr.split(':')[0], 10);
                    
                    for (let h = startH; h < endH; h += 2) {
                        const tKey = h * 100;
                        if (!ghostMap[slot.day][tKey]) ghostMap[slot.day][tKey] = [];
                        // Check to avoid duplicates
                        if (!ghostMap[slot.day][tKey].find(g => g.subject === subj)) {
                            ghostMap[slot.day][tKey].push({ ...slot, subject: subj, type: 'ghost' });
                        }
                    }
                });
            }
        });
    }

    const exportRef = useRef(null);

    const generateImage = async () => {
        if (!exportRef.current) return null;
        
        // Target specifically the internal export-container, not the outer scrolling viewport
        const targetNode = exportRef.current;
        
        // Produce a beautifully scaled highly crisp canvas preserving ALL gradients/shadows natively 
        const dataUrl = await toPng(targetNode, {
            quality: 1.0,
            pixelRatio: 3, // Ultra-HD 3x Retina output
            style: {
                transform: 'scale(1)', // Defeat any weird zoom scalings
                transformOrigin: 'top left'
            }
        });
        
        return dataUrl;
    };

    const handleExportImage = async () => {
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) return;

            const link = document.createElement('a');
            link.download = 'PlanWizz-Timetable.png';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please try a different browser.");
        }
    };

    const handleExportPDF = async () => {
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) return;

            // Generate an A4 landscape canvas
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate aspect ratio mapping to fit precisely inside A4 width securely mapping 3x resolution 
            const imgProps = pdf.getImageProperties(dataUrl);
            const ratio = imgProps.width / imgProps.height;
            
            // Allow 20pt margin
            const targetWidth = pdfWidth - 40;
            const targetHeight = targetWidth / ratio;
            
            const startX = 20;
            const startY = (pdfHeight - targetHeight) / 2; // Vertically center it!

            // Fill back with pure dark to match canvas
            pdf.setFillColor(3, 7, 18); // gray-950 backend mapping #030712
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
            
            pdf.addImage(dataUrl, 'PNG', startX, startY >= 20 ? startY : 20, targetWidth, targetHeight);
            pdf.save('PlanWizz-Timetable.pdf');
            
        } catch (err) {
            console.error("PDF Export failed:", err);
            alert("PDF Export failed.");
        }
    };

    return (
        <div className={`transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] bg-[#f7f7f5] dark:bg-[#0f0f0f] p-4 md:p-8 overflow-y-auto' : 'space-y-4'}`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <img
                        src={logoImage}
                        alt="PlanWizz"
                        className="w-7 h-7 object-contain"
                    />
                    Generated Timetable
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white dark:bg-[#1a1a1a] p-1 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm mr-1">
                        <button
                            onClick={handleExportImage}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2c2c2c] rounded-md transition-all"
                            title="Download as PNG"
                        >
                            <FileImage className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PNG</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2c2c2c] rounded-md transition-all"
                            title="Download as PDF"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#2c2c2c] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors border border-gray-200 dark:border-white/5 shadow-sm"
                        title={isFullScreen ? "Exit Full Screen" : "View Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div
                ref={exportRef}
                className={`relative bg-white dark:bg-[#141414] p-6 lg:p-8 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-sm overflow-hidden min-w-[900px] ${isFullScreen ? 'h-auto mx-auto max-w-7xl' : ''}`}
            >
                <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-gray-900 dark:bg-white inline-block"></span>
                            Timetable
                        </h2>
                        <div className="text-right">
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">PlanWizz Platform</p>
                            <p className="text-gray-400 font-mono text-[10px] mt-1">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>

                    <div
                        ref={tableRef}
                        className={`overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]`}
                    >
                        <table className="w-full border-collapse text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 font-bold sticky left-0 z-10 w-28 border-r backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500" /> Time
                                        </div>
                                    </th>
                                    {days.map((day, idx) => (
                                        <th key={day} className={`p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase text-[11px] backdrop-blur-sm ${idx !== days.length -1 ? 'border-r border-gray-200 dark:border-white/10' : ''}`}>
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {times.map((time, index) => {
                                    const timeKey = parseTime(time);
                                    return (
                                        <tr key={index} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                            <td className="p-3 border-r border-b border-gray-200 dark:border-white/10 font-mono text-gray-600 dark:text-gray-400 text-xs bg-gray-50/40 dark:bg-gray-900/40 font-semibold whitespace-nowrap">
                                                {time}
                                            </td>
                                            {days.map((day, dIdx) => {
                                                const bookedSlot = scheduleMap[day]?.[timeKey];
                                                const ghosts = ghostMap[day]?.[timeKey];

                                                let cellContent = null;
                                                let cellClass = "";

                                                if (bookedSlot) {
                                                    cellContent = (
                                                        <div className="h-full w-full p-3 flex flex-col justify-between items-start text-white">
                                                            <div className="mb-2">
                                                                <span className="font-bold text-white text-sm block leading-tight drop-shadow-md">{bookedSlot.course_name}</span>
                                                            </div>
                                                            <div className="flex gap-2 flex-wrap items-center mt-auto">
                                                                <span className="text-[10px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-white font-medium tracking-wide border border-white/10">{bookedSlot.course_code}</span>
                                                                <span className="text-[10px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-white font-medium tracking-wide border border-white/10">{bookedSlot.venue}</span>
                                                            </div>
                                                            <span className="text-[10px] text-white/80 mt-2 block w-full truncate font-medium">{bookedSlot.faculty}</span>
                                                        </div>
                                                    );
                                                    cellClass = "bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20 border border-white/20 hover:scale-[1.02] transition-transform rounded-xl m-1 relative z-10 p-0";
                                                } else if (ghosts && ghosts.length > 0) {
                                                    cellContent = (
                                                        <div className="flex flex-col gap-1 items-start h-full">
                                                            {ghosts.map((g, idx) => (
                                                                <span key={idx} className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1a1a1a] px-2 py-1 rounded border border-gray-200 dark:border-white/10 shadow-sm">
                                                                    {g.subject}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                    cellClass = "bg-gray-50/50 dark:bg-[#151515] relative p-2 border-dashed border border-gray-200 dark:border-white/10 m-1 rounded-lg";
                                                } else {
                                                    cellContent = null;
                                                    cellClass = "bg-transparent";
                                                }

                                                return (
                                                    <td key={day} className={`border-b border-gray-200 dark:border-white/5 h-32 align-top ${dIdx !== days.length -1 ? 'border-r' : ''}`}>
                                                        <div className={`h-[calc(100%-8px)] w-[calc(100%-8px)] mx-1 mt-1 ${cellClass}`}>
                                                            {cellContent}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableView;
