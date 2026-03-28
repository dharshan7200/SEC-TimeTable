import React, { useState, useEffect } from 'react';
import { Layers, Linkedin, User, X, Lamp, Download, FileImage } from 'lucide-react';
import logoImage from './assets/logo.png';
import UploadZone from './components/UploadZone.jsx';
import CourseSelector from './components/CourseSelector.jsx';
import PreferencePanel from './components/PreferencePanel.jsx';
import TimetableView from './components/TimetableView.jsx';
import Toast from './components/Toast.jsx';
import { generateTimetable, checkCompatibility } from './api';
import { exportAsPDF, exportAsPNG } from './utils/exportUtils';

function App() {
  const [courses, setCourses] = useState(null);
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

  const handleUploadSuccess = (data) => {
    setCourses(data);
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
      <div className={`min-h-screen flex flex-col justify-center items-center font-sans p-6 relative overflow-hidden transition-colors duration-300 ${isDarkMode
        ? 'dark bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black text-gray-100'
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
        }`}>

        {/* Ambient Background Glow */}
        <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${isDarkMode ? 'bg-indigo-900/20' : 'bg-blue-400/10'
          }`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${isDarkMode ? 'bg-violet-900/20' : 'bg-purple-400/10'
          }`}></div>

        <div className="text-center mb-12 animate-slide-up relative z-10">
          <div className="inline-flex mb-1 transition-all hover:scale-110 duration-500">
            <img
              src={logoImage}
              alt="PlanWizz Logo"
              className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(99,102,241,0.6)] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            />
          </div>
          <h1 className={`text-5xl font-extrabold tracking-tight mb-4 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            Plan<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Wizz</span>
          </h1>
          <p className={`text-xl font-medium max-w-md mx-auto leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Upload your enrollment PDF to generate an AI-optimized student timetable in seconds.
          </p>
        </div>

        <div className="w-full max-w-2xl animate-fade-in delay-100 relative z-10">
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </div>

        <footer className="mt-20 text-center space-y-4 relative z-10">
          <div className="flex flex-col items-center mb-3">
            <span className="text-gray-600 dark:text-gray-500 text-sm font-medium mb-3">Developed by</span>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <a
                href="https://www.linkedin.com/in/gurumurthys/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-lg transition-all group shadow-sm dark:shadow-none"
              >
                <Linkedin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 text-sm font-medium">Gurumurthy S</span>
              </a>
              <a
                href="https://www.linkedin.com/in/dharshan2006"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-lg transition-all group shadow-sm dark:shadow-none"
              >
                <Linkedin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 text-sm font-medium">Dharshan D</span>
              </a>
              <a
                href="https://www.linkedin.com/in/nb-sanjay-kumar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-lg transition-all group shadow-sm dark:shadow-none"
              >
                <Linkedin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 text-sm font-medium">NB Sanjay Kumar</span>
              </a>
              <a
                href="https://www.linkedin.com/in/sanjai-l-508a112b2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-lg transition-all group shadow-sm dark:shadow-none"
              >
                <Linkedin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 text-sm font-medium">Sanjai L</span>
              </a>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-600 text-sm">© 2026 PlanWizz. Intelligent Scheduling.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode
      ? 'dark bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black text-gray-100'
      : 'bg-white bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/30 via-white to-white text-gray-900'
      }`}>

      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300">
        <div className={`absolute inset-0 backdrop-blur-xl border-b transition-colors ${isDarkMode
          ? 'bg-black/60 border-gray-800'
          : 'bg-white/80 border-gray-200 shadow-sm'
          }`}></div>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className={`p-3 rounded-2xl shadow-lg transition-all overflow-hidden ${isDarkMode
              ? 'bg-indigo-600/20 border border-indigo-500/30 group-hover:bg-indigo-600/40'
              : 'bg-gradient-to-br from-indigo-100 to-purple-100 border border-purple-300 group-hover:shadow-xl'
              }`}>
              <img src={logoImage} alt="PlanWizz Logo" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />            </div>
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight transition-colors ${isDarkMode
                ? 'text-white group-hover:text-indigo-200'
                : 'text-gray-900 group-hover:text-indigo-600'
                }`}>PlanWizz</h1>
              <p className={`text-xs font-medium tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>SMART TIMETABLE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUserPopup(!showUserPopup)}
              className={`p-2 rounded-lg transition-all ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              title="User Info"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
            >
              Reset Session
            </button>
          </div>
        </div>
      </header>

      {/* User Popup in Right Corner */}
      {showUserPopup && (
        <div className="fixed top-20 right-6 z-50 animate-slide-up">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] p-6 w-80 relative">
            <button
              onClick={() => setShowUserPopup(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="transition-transform hover:scale-110">
                <img
                  src={logoImage}
                  alt="PlanWizz"
                  className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Welcome!</h3>
                <p className="text-gray-400 text-sm">Timetable Generator</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Subjects Selected</span>
                <span className="text-white font-bold">{selectedSubjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <span className={`font-bold text-sm ${status === 'success' ? 'text-green-400' :
                  status === 'conflict' ? 'text-red-400' :
                    status === 'loading' ? 'text-yellow-400' :
                      'text-gray-400'
                  }`}>
                  {status === 'success' ? 'Generated ✓' :
                    status === 'conflict' ? 'Conflict!' :
                      status === 'loading' ? 'Loading...' :
                        'Ready'}
                </span>
              </div>
              {leaveDay && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Leave Day</span>
                  <span className="text-white font-bold text-sm">{leaveDay}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs text-center mb-2">Developed by</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <a
                  href="https://www.linkedin.com/in/gurumurthys/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-all text-xs"
                >
                  <Linkedin className="w-3 h-3 text-indigo-400" />
                  <span className="text-gray-300">Gurumurthy S</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/dharshan2006"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-all text-xs"
                >
                  <Linkedin className="w-3 h-3 text-indigo-400" />
                  <span className="text-gray-300">Dharshan D</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/nb-sanjay-kumar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-all text-xs"
                >
                  <Linkedin className="w-3 h-3 text-indigo-400" />
                  <span className="text-gray-300">NB Sanjay Kumar</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/sanjai-l-508a112b2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-all text-xs"
                >
                  <Linkedin className="w-3 h-3 text-indigo-400" />
                  <span className="text-gray-300">Sanjai L</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content - Vertical Stack */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-12 animate-fade-in">

        {/* SECTION 1: Timetable & Feedback (TOP) */}
        <section className="space-y-6">
          <div className="glass-panel rounded-2xl shadow-2xl min-h-[400px] p-2 relative overflow-hidden group">

            {/* Status/Loading Overlay */}
            {status === 'loading' && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                <p className="text-indigo-300 font-medium tracking-wide animate-pulse">OPTIMIZING SCHEDULE...</p>
              </div>
            )}

            {/* Conflict Banner (Generic) */}
            {status === 'conflict' && (
              <div className="bg-red-900/20 border-b border-red-500/20 p-4 text-center">
                <p className="text-red-400 font-bold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></span>
                  Scheduling Conflict Detected
                </p>
              </div>
            )}

            {/* Note Banner */}
            {status === 'success_with_adjustment' && (
              <div className="bg-yellow-900/20 border-b border-yellow-500/20 p-3 text-center text-sm text-yellow-500">
                <strong>Note:</strong> {statusMessage}
              </div>
            )}

            {/* Empty State Instructions */}
            {!generatedTimetable && status !== 'loading' && status !== 'conflict' && status !== 'error' && (
              <div className="py-32 text-center">
                <span className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-4 text-gray-400 dark:text-gray-600">
                  <Layers className="w-8 h-8 opacity-50 text-gray-600 dark:text-gray-400" />
                </span>
                <p className="text-gray-600 dark:text-gray-500 font-medium text-lg">Select subjects below to begin.</p>
                <p className="text-gray-500 dark:text-gray-600 text-sm mt-2">Your optimized schedule will appear here.</p>
              </div>
            )}

            {/* Interactive Ghost Mode Header */}
            {(generatedTimetable || ghostData) && (
              <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3 bg-gray-50/50 dark:bg-black/20">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Mode:</span>
                {ghostData && Object.keys(ghostData).map(subj => (
                  <button
                    key={subj}
                    onClick={() => handleGhostClick(subj)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all border ${activeGhostSubjects.includes(subj)
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    {subj}
                  </button>
                ))}
                {activeGhostSubjects.length > 0 && (
                  <button onClick={() => setActiveGhostSubjects([])} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-2 transition-colors">Clear</button>
                )}
              </div>
            )}

            {/* Timetable View */}
            {(generatedTimetable || activeGhostSubjects.length > 0) && (
              <div className="p-2">
                <TimetableView
                  timetable={generatedTimetable || []}
                  ghostSubjects={activeGhostSubjects}
                  allGhostData={ghostData}
                />
              </div>
            )}
          </div>

          {/* CONFLICT FEEDBACK (BELOW TIMETABLE) */}
          {status === 'conflict' && conflictDetails && (
            <div className="animate-slide-up bg-gray-900/40 backdrop-blur-sm rounded-xl border-l-4 border-red-500 border-y border-r border-gray-800 shadow-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[50px] pointer-events-none"></div>

              <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center relative z-10">
                <span className="text-2xl mr-3 filter drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">⚠️</span> Conflict Analysis
              </h3>
              <div className="space-y-4 relative z-10">
                {conflictDetails.map((conflict, idx) => (
                  <div key={idx} className="bg-red-950/30 p-4 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
                    {conflict.type === 'hard_overlap' ? (
                      <div>
                        <p className="text-red-200 font-bold mb-1 flex items-center gap-2">
                          {conflict.subjects[0]} <span className="text-red-500/50">⚔️</span> {conflict.subjects[1]}
                        </p>
                        <p className="text-red-400/80 text-sm">
                          These subjects cross at the same time. One cannot be scheduled.
                        </p>
                      </div>
                    ) : (
                      <p className="text-red-300 text-sm">{conflict.message}</p>
                    )}
                  </div>
                ))}
                {suggestion && (
                  <div className="mt-2 pt-4 border-t border-red-500/20">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recommendation</p>
                    <p className="text-indigo-400 font-medium text-sm mt-1">{suggestion}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Controls (BOTTOM) */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Subtly Glowing Background Blob */}
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            {/* Subject Selection */}
            <div className="flex-1 w-full">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center border-b border-gray-200 dark:border-gray-800 pb-4">
                <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 w-7 h-7 rounded-lg flex items-center justify-center text-xs mr-3 shadow-[0_0_10px_rgba(99,102,241,0.2)]">1</span>
                Select Subjects & Staff
              </h2>
              <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
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

            {/* Preferences & Generate */}
            <div className="w-full md:w-1/3 border-l-0 md:border-l border-gray-200 dark:border-gray-800 pl-0 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-gray-800 md:border-l-gray-200 dark:md:border-l-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center border-b border-gray-200 dark:border-gray-800 pb-4">
                <span className="bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 w-7 h-7 rounded-lg flex items-center justify-center text-xs mr-3 shadow-[0_0_10px_rgba(139,92,246,0.2)]">2</span>
                Preferences
              </h2>
              <PreferencePanel
                leaveDay={leaveDay}
                setLeaveDay={setLeaveDay}
                onGenerate={handleGenerate}
              />
            </div>
          </div>
        </section>

      </main>

      {/* Dashboard Footer */}
      <footer className="w-full py-8 border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-black/40 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all cursor-default group">
            <img
              src={logoImage}
              alt="PlanWizz"
              className="w-5 h-5 object-contain filter drop-shadow-[0_0_5px_rgba(99,102,241,0.3)] group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            />
            <span className="text-xs font-bold tracking-widest text-gray-400">PLANWIZZ © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/in/gurumurthys/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/in/dharshan2006" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/in/nb-sanjay-kumar" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/in/sanjai-l-508a112b2" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

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
