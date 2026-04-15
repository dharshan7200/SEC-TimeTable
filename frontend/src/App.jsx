import React, { useState, useEffect } from 'react';
import { Layers, Linkedin, User, X } from 'lucide-react';
import logoImage from './assets/planwizz_banner.png';
import UploadZone from './components/UploadZone.jsx';
import CourseSelector from './components/CourseSelector.jsx';
import PreferencePanel from './components/PreferencePanel.jsx';
import TimetableView from './components/TimetableView.jsx';
import Toast from './components/Toast.jsx';
import { generateTimetable, checkCompatibility, uploadText } from './api';

function App() {
  const [courses, setCourses] = useState(null);
  const [rawText, setRawText] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [preferredFaculties, setPreferredFaculties] = useState({});
  const [leaveDay, setLeaveDay] = useState("");
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [status, setStatus] = useState(null); // 'loading', 'error', 'success', 'conflict'
  const [statusMessage, setStatusMessage] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [conflictDetails, setConflictDetails] = useState(null);
  const [ghostData, setGhostData] = useState(null);
  const [activeGhostSubjects, setActiveGhostSubjects] = useState([]);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toast, setToast] = useState(null);

  // Intelligence: Active list of subjects that fit with current selection
  const [compatibleSubjects, setCompatibleSubjects] = useState(null);

  // Debounced Compatibility Check
  useEffect(() => {
    // If no course data, reset
    if (!courses) {
      setCompatibleSubjects(null);
      return;
    }

    // Auto-check availability based on current Selection + Preferences
    const timer = setTimeout(async () => {
      try {
        const data = await checkCompatibility({
          selected_subjects: selectedSubjects,
          courses_data: courses,
          leave_day: leaveDay,
          preferred_faculties: preferredFaculties
        });
        setCompatibleSubjects(data.compatible_subjects);
      } catch (e) {
        console.error("Auto-check failed", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedSubjects, leaveDay, preferredFaculties, courses]);

  const handleGhostClick = (subject) => {
    setActiveGhostSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      }
      return [...prev, subject];
    });
  };

  const handleUploadSuccess = (data, raw_text) => {
    setCourses(data);
    setRawText(raw_text || "");
    setSelectedSubjects([]);
    setGeneratedTimetable(null);
    setGhostData(null);
    setConflictDetails(null);
    setActiveGhostSubjects([]);
    setStatus(null);
    setSuggestion("");
    setCompatibleSubjects(null);
    setToast({ message: '✅ PDF uploaded and analyzed successfully!', type: 'success' });
  };

  const handleSaveRawText = async () => {
    setIsEditorLoading(true);
    try {
      const data = await uploadText(rawText);
      setCourses(data.courses);
      setGeneratedTimetable(null);
      setStatus(null);
      setToast({ message: '✅ Source data updated and parsed successfully!', type: 'success' });
      setIsEditorOpen(false);
    } catch (err) {
      setToast({ message: '❌ Error parsing text. Please fix formatting.', type: 'error' });
    } finally {
      setIsEditorLoading(false);
    }
  };

  const handleToggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      }
      return [...prev, subject];
    });
  };

  const handleSetPreference = (subject, faculty) => {
    setPreferredFaculties(prev => ({
      ...prev,
      [subject]: faculty
    }));
  };

  const handleGenerate = async () => {
    if (selectedSubjects.length < 2) {
      alert("Please select at least 2 subjects.");
      return;
    }

    setStatus('loading');
    setGeneratedTimetable(null);
    setSuggestion("");
    setConflictDetails(null);

    try {
      const result = await generateTimetable({
        selected_subjects: selectedSubjects,
        courses_data: courses,
        leave_day: leaveDay,
        preferred_faculties: preferredFaculties
      });

      if (result.status === 'success') {
        setGeneratedTimetable(result.timetable);
        setStatus('success');
        setToast({ message: '✅ Timetable generated successfully!', type: 'success' });
      } else if (result.status === 'success_with_adjustment') {
        setGeneratedTimetable(result.timetable);
        setStatus('success_with_adjustment');
        setStatusMessage(result.message);
        setToast({ message: `⚠️ Timetable generated with faculty changes: ${result.message}`, type: 'info' });
      } else if (result.status === 'conflict') {
        setStatus('conflict');
        setStatusMessage(result.reason);
        setConflictDetails(result.conflict_details);
        setSuggestion(result.suggestion || "Try changing your leave day or faculty preferences.");
        setGhostData(result.all_possible_slots || {}); // Even on conflict show ghosts
        setToast({
          message: `❌ Scheduling Conflict: Please change your preference or leave day to generate the timetable.`,
          type: 'error'
        });
      } else {
        setStatus('error');
        setStatusMessage(result.reason || "Unknown error");
        setToast({ message: `❌ Error: ${result.reason || 'Unknown error'}`, type: 'error' });
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage("Failed to connect to server.");
      setToast({ message: '❌ Failed to connect to server', type: 'error' });
      console.error(err);
    }
  };

  // View 1: Upload Page (Landing)
  if (!courses) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center font-sans p-6 relative overflow-hidden transition-colors duration-500 ${isDarkMode
        ? 'dark bg-[#030014] text-white'
        : 'bg-[#fafafa] text-gray-900'
        }`}>

        {/* Mesmerizing Animated Background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob ${isDarkMode ? 'bg-indigo-600/40' : 'bg-indigo-300/60'}`}></div>
          <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-purple-600/40' : 'bg-purple-300/60'}`}></div>
          <div className={`absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-pink-600/30' : 'bg-pink-300/50'}`}></div>
        </div>

        <div className="text-center mb-10 animate-slide-up relative z-10 w-full max-w-3xl">
          <div className="inline-flex items-center justify-center p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30 mb-8 animate-float hover:scale-105 transition-transform cursor-pointer">
            <img
              src={logoImage}
              alt="PlanWizz Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
            <span className="text-gradient">PlanWizz</span>
          </h1>
          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed px-4 drop-shadow-sm text-gray-600 dark:text-gray-300">
            Intelligent timetable scheduling. Clean, fast, and conflict-free.
          </p>
        </div>

        <div className="w-full max-w-2xl animate-fade-in delay-100 relative z-10 glass-panel p-6 shadow-sm">
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </div>

        <footer className="mt-16 text-center space-y-4 relative z-10">
          <div className="flex flex-col items-center mb-3">
            <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Developed by</span>
            <div className="flex flex-wrap justify-center gap-3 max-w-md">
              <a
                href="https://www.linkedin.com/in/gurumurthys/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-[#1a1a1a]/50 hover:bg-white dark:hover:bg-[#2c2c2c] border border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg transition-all shadow-sm"
              >
                <Linkedin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300 text-[13px] font-medium">Gurumurthy S</span>
              </a>
              <a
                href="https://www.linkedin.com/in/dharshan2006"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-[#1a1a1a]/50 hover:bg-white dark:hover:bg-[#2c2c2c] border border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg transition-all shadow-sm"
              >
                <Linkedin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300 text-[13px] font-medium">Dharshan D</span>
              </a>
              <a
                href="https://www.linkedin.com/in/nb-sanjay-kumar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-[#1a1a1a]/50 hover:bg-white dark:hover:bg-[#2c2c2c] border border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg transition-all shadow-sm"
              >
                <Linkedin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300 text-[13px] font-medium">NB Sanjay Kumar</span>
              </a>
              <a
                href="https://www.linkedin.com/in/sanjai-l-508a112b2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-[#1a1a1a]/50 hover:bg-white dark:hover:bg-[#2c2c2c] border border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg transition-all shadow-sm"
              >
                <Linkedin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300 text-[13px] font-medium">Sanjai L</span>
              </a>
            </div>
          </div>
          <p className="text-gray-400 text-xs">© 2026 PlanWizz.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-x-hidden ${isDarkMode
      ? 'dark bg-[#030014] text-white'
      : 'bg-[#fafafa] text-gray-900'
      }`}>

      {/* Mesmerizing Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-300/40'}`}></div>
        <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-300/40'}`}></div>
        <div className={`absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-pink-900/30' : 'bg-pink-300/30'}`}></div>
      </div>

      {/* Header Minimal */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 bg-white/70 dark:bg-[#1a1a1a]/70"></div>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <img src={logoImage} alt="PlanWizz Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">PlanWizz</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2c] transition-colors shadow-sm"
            >
              Edit Source
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2c] transition-colors shadow-sm"
            >
              Reset
            </button>
            <button
              onClick={() => setShowUserPopup(!showUserPopup)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-500 dark:text-gray-400 transition-colors ml-2"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* User Popup Overlay */}
      {showUserPopup && (
        <div className="fixed top-14 right-6 z-50 animate-fade-in shadow-xl w-72">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-white/10 rounded-xl p-5 relative">
            <button
              onClick={() => setShowUserPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImage} alt="PlanWizz" className="w-8 h-8 object-contain" />
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-sm">Status</h3>
                <p className="text-gray-500 text-xs">Scheduler</p>
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-100 dark:border-white/5 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Selected</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSubjects.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold ${status === 'success' ? 'text-green-500' :
                  status === 'conflict' ? 'text-red-500' :
                    status === 'loading' ? 'text-yellow-500' : 'text-gray-500'
                  }`}>
                  {status || 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in flex flex-col gap-8">
        
        {/* Top Section: Table */}
        <section className="glass-panel overflow-hidden relative">
          {status === 'loading' && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700 border-t-gray-800 dark:border-t-white rounded-full animate-spin mb-4" />
              <p className="text-gray-800 dark:text-gray-200 font-medium text-sm">Processing...</p>
            </div>
          )}

          {status === 'conflict' && (
             <div className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 p-3 text-center">
               <p className="text-red-600 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-2">
                 <AlertCircle className="w-4 h-4" />
                 Scheduling Conflict Detected
               </p>
             </div>
          )}

          {status === 'success_with_adjustment' && (
             <div className="bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/30 p-3 text-center text-xs text-orange-700 dark:text-orange-400 font-medium">
               Note: {statusMessage}
             </div>
          )}

          {/* Empty State Instructions */}
          {!generatedTimetable && status !== 'loading' && status !== 'conflict' && status !== 'error' && (
             <div className="py-24 text-center">
               <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
               <p className="text-gray-800 dark:text-gray-200 font-semibold">Select subjects to begin</p>
               <p className="text-gray-500 text-sm mt-1">Your generated timetable will seamlessly appear here.</p>
             </div>
          )}

          {/* Interactive Ghost Mode Tags */}
          {(generatedTimetable || ghostData) && (
             <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-2 bg-gray-50/50 dark:bg-[#1a1a1a]/50">
               <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mr-2">Highlight Availability:</span>
               {ghostData && Object.keys(ghostData).map(subj => (
                 <button
                   key={subj}
                   onClick={() => handleGhostClick(subj)}
                   className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${activeGhostSubjects.includes(subj)
                     ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white cursor-pointer'
                     : 'bg-white dark:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 cursor-pointer'
                     }`}
                 >
                   {subj}
                 </button>
               ))}
               {activeGhostSubjects.length > 0 && (
                 <button onClick={() => setActiveGhostSubjects([])} className="text-[11px] text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium ml-1">Clear</button>
               )}
             </div>
          )}

          {/* Table Viewer */}
          {(generatedTimetable || activeGhostSubjects.length > 0) && (
            <div className="p-0">
               <TimetableView
                 timetable={generatedTimetable || []}
                 ghostSubjects={activeGhostSubjects}
                 allGhostData={ghostData}
               />
            </div>
          )}
        </section>

        {/* Conflict Details Area */}
        {status === 'conflict' && conflictDetails && (
          <section className="glass-panel p-5 border-l-4 border-l-red-500 shadow-sm">
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Conflict Analysis
            </h3>
            <div className="space-y-3">
              {conflictDetails.map((conflict, idx) => (
                <div key={idx} className="bg-red-50/50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                  {conflict.type === 'hard_overlap' ? (
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium text-xs md:text-sm">
                        {conflict.subjects[0]} <span className="mx-2 text-red-500">✕</span> {conflict.subjects[1]}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 text-xs">{conflict.message}</p>
                  )}
                </div>
              ))}
              {suggestion && (
                <div className="mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommendation</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-xs mt-1">{suggestion}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Bottom Section: Controls */}
        <section className="relative w-full">
          {/* Subtly Glowing Background Blob */}
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
          
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="md:col-span-2 glass-panel p-6 rounded-2xl shadow-lg ring-1 ring-white/10 dark:ring-white/5 bg-white/60 dark:bg-[#1a1a1a]/60">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
                1. Select Subjects
              </h2>
             <div className="max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
               <CourseSelector
                 courses={courses}
                 selectedSubjects={selectedSubjects}
                 compatibleSubjects={compatibleSubjects}
                 onToggleSubject={handleToggleSubject}
                 preferredFaculties={preferredFaculties}
                 onSetPreference={handleSetPreference}
               />
             </div>
          </div>
          <div className="md:col-span-1 glass-panel p-6 flex flex-col rounded-2xl shadow-lg ring-1 ring-white/10 dark:ring-white/5 bg-white/60 dark:bg-[#1a1a1a]/60">
             <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
               2. Configuration
             </h2>
             <div className="flex-1">
               <PreferencePanel
                 leaveDay={leaveDay}
                 setLeaveDay={setLeaveDay}
                 onGenerate={handleGenerate}
               />
             </div>
          </div>
          </div>
        </section>

      </main>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[200] flex bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#121212] flex flex-col h-full shadow-2xl ml-auto border-l border-gray-200 dark:border-white/5">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                Raw Data Source
              </h3>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] rounded-md text-gray-500 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <textarea 
                className="flex-1 w-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-300 font-mono text-[11px] p-4 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 custom-scrollbar resize-none shadow-inner"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                spellCheck="false"
              />
              <button 
                  onClick={handleSaveRawText}
                  disabled={isEditorLoading}
                  className="mt-4 py-3 rounded-lg font-semibold bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center shadow-sm"
              >
                  {isEditorLoading ? "Saving..." : "Save & Re-parse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistence Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
