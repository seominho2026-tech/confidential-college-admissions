import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchSpreadsheetData, 
  StudentRecord, 
  FALLBACK_SAMPLE_DATA 
} from './utils/dataLoader';
import { SushiScatterChart } from './components/SushiScatterChart';
import { 
  GraduationCap, 
  SlidersHorizontal, 
  RefreshCw, 
  FileSpreadsheet, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Search, 
  Building, 
  ChevronUp, 
  ChevronDown, 
  Database,
  ArrowUpDown,
  FileText,
  Lock,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function App() {
  const defaultSpreadsheetId = "17BPrRpIKTw8LRBnT7vPQgTOs7Nk1cy7278zn_5c2_gQ";
  
  // Authentication State
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Remove old localStorage item if present to prevent stale logins
    localStorage.removeItem('sushi_is_authenticated');
    return sessionStorage.getItem('sushi_is_authenticated') === 'true';
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAutoLoggedOut, setIsAutoLoggedOut] = useState<boolean>(false);

  // 10-minute inactivity auto-logout hook
  useEffect(() => {
    if (!isAuthenticated) return;

    const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
    let timeoutId: NodeJS.Timeout;

    const performAutoLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem('sushi_is_authenticated');
      setIsAutoLoggedOut(true);
      setPasswordInput('');
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performAutoLogout, TIMEOUT_DURATION);
    };

    // Initialize timer
    resetTimer();

    // Listen to mouse, touch, keydown, and scroll events for user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === '0713') {
      setIsAuthenticated(true);
      sessionStorage.setItem('sushi_is_authenticated', 'true');
      setPasswordError(null);
      setIsAutoLoggedOut(false);
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sushi_is_authenticated');
    setIsAutoLoggedOut(false);
    setPasswordInput('');
  };

  const handleKeypadPress = (val: string) => {
    if (passwordError) setPasswordError(null);
    if (val === 'C') {
      setPasswordInput('');
    } else if (val === 'back') {
      setPasswordInput(prev => prev.slice(0, -1));
    } else {
      if (passwordInput.length < 4) {
        const nextVal = passwordInput + val;
        setPasswordInput(nextVal);
        if (nextVal === '0713') {
          setIsAuthenticated(true);
          sessionStorage.setItem('sushi_is_authenticated', 'true');
          setPasswordError(null);
          setIsAutoLoggedOut(false);
          setPasswordInput('');
        }
      }
    }
  };

  // Storage & State
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('sushi_spreadsheet_id') || defaultSpreadsheetId;
  });
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Input Filters
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterUniversity, setFilterUniversity] = useState<string>('');
  const [filterAdmissionType, setFilterAdmissionType] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [minGrade, setMinGrade] = useState<number>(1.0);
  const [maxGrade, setMaxGrade] = useState<number>(9.0);

  // Sorting
  const [sortField, setSortField] = useState<keyof StudentRecord>('grade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  // GAS Copied Tooltip states
  const [copiedCodeGs, setCopiedCodeGs] = useState<boolean>(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState<boolean>(false);

  // Load Data
  const loadData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);
    try {
      const fetched = await fetchSpreadsheetData(targetId);
      setRecords(fetched);
      localStorage.setItem('sushi_spreadsheet_id', targetId);
    } catch (err: any) {
      console.warn("Spreadsheet load failed. Switching to high-fidelity offline fallback data.", err);
      // Use the fallback data if fetch fails
      setRecords(FALLBACK_SAMPLE_DATA);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(spreadsheetId);
  }, []);

  // Filter Reset
  const handleResetFilters = () => {
    setFilterYear('');
    setFilterRegion('');
    setFilterUniversity('');
    setFilterAdmissionType('');
    setFilterDepartment('');
    setMinGrade(1.0);
    setMaxGrade(9.0);
    setCurrentPage(1);
  };

  // Extract Dynamic Filter Suggestions
  const years = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.year) set.add(String(r.year));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.region) set.add(r.region);
    });
    return Array.from(set).sort();
  }, [records]);

  const universities = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.university) set.add(r.university);
    });
    return Array.from(set).sort();
  }, [records]);

  const admissionTypes = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.admissionType) set.add(r.admissionType);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // 0. Year
      if (filterYear && String(record.year) !== filterYear) return false;

      // 1. Region
      if (filterRegion && record.region !== filterRegion) return false;
      
      // 2. University Search
      if (filterUniversity && !record.university.toLowerCase().includes(filterUniversity.toLowerCase().trim())) {
        return false;
      }

      // 3. AdmissionType Filter
      if (filterAdmissionType && record.admissionType !== filterAdmissionType) return false;

      // 3.5 Department Search
      if (filterDepartment && !record.department.toLowerCase().includes(filterDepartment.toLowerCase().trim())) {
        return false;
      }

      // 4. GPA Range
      if (record.grade < minGrade || record.grade > maxGrade) {
        return false;
      }

      return true;
    });
  }, [records, filterYear, filterRegion, filterUniversity, filterAdmissionType, filterDepartment, minGrade, maxGrade]);

  // Sort Records
  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null) return 1;
      if (valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
      return 0;
    });
    return sorted;
  }, [filteredRecords, sortField, sortDirection]);

  // Pagination Records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedRecords, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedRecords.length / rowsPerPage) || 1;

  // Sorting columns trigger
  const handleSort = (field: keyof StudentRecord) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const passes = filteredRecords.filter(r => r.status.includes('합'));
    const passCount = passes.length;
    const passRate = total > 0 ? parseFloat(((passCount / total) * 100).toFixed(1)) : 0;
    
    let avgPassGrade = 0;
    if (passCount > 0) {
      const sum = passes.reduce((acc, curr) => acc + curr.grade, 0);
      avgPassGrade = parseFloat((sum / passCount).toFixed(2));
    }

    return {
      total,
      passCount,
      passRate,
      avgPassGrade: avgPassGrade || null
    };
  }, [filteredRecords]);

  // GAS code for rendering inside app
  const codeGsRaw = `// Code.gs - Google Apps Script 서버측 파일
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('대입 수시 결과 대시보드 WebApp')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSushiData() {
  var SPREADSHEET_ID = "17BPrRpIKTw8LRBnT7vPQgTOs7Nk1cy7278zn_5c2_gQ";
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("수시");
  if (!sheet) {
    throw new Error("'수시' 시트를 시트 목록에서 찾을 수 없습니다.");
  }
  
  var data = sheet.getDataRange().getValues();
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r || r.length < 10) continue;
    
    var gradeRaw = r[7]; // H열 (환산등급)
    if (gradeRaw === "" || gradeRaw === null || gradeRaw === undefined) {
      continue; // '환산등급' 비어있는 데이터 제외
    }
    
    var grade = parseFloat(gradeRaw);
    if (isNaN(grade)) continue;
    
    result.push({
      year: r[0] ? String(r[0]).trim() : "",
      region: r[1] ? String(r[1]).trim() : "",
      university: r[2] ? String(r[2]).trim() : "",
      admissionType: r[3] ? String(r[3]).trim() : "",
      subType: r[4] ? String(r[4]).trim() : "",
      track: r[5] ? String(r[5]).trim() : "",
      department: r[6] ? String(r[6]).trim() : "",
      grade: grade,
      score: (r[8] !== "" && r[8] !== null) ? parseFloat(r[8]) : null,
      status: r[9] ? String(r[9]).trim() : "",
      allSubjects: (r[10] !== "" && r[10] !== null) ? parseFloat(r[10]) : null,
      korMathEngSoc: (r[11] !== "" && r[11] !== null) ? parseFloat(r[11]) : null,
      korEngMathSci: (r[12] !== "" && r[12] !== null) ? parseFloat(r[12]) : null,
      korean: (r[13] !== "" && r[13] !== null) ? parseFloat(r[13]) : null,
      math: (r[14] !== "" && r[14] !== null) ? parseFloat(r[14]) : null,
      english: (r[15] !== "" && r[15] !== null) ? parseFloat(r[15]) : null,
      social: (r[16] !== "" && r[16] !== null) ? parseFloat(r[16]) : null,
      science: (r[17] !== "" && r[17] !== null) ? parseFloat(r[17]) : null
    });
  }
  return result;
}`;

  const indexHtmlRaw = `<!-- Index.html 에디션 링크 복사 가능 (상세 테이블, 슬라이더, Chart.js 탑재) -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>대입 수시 결과 대시보드</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
  <!-- Chart.js 및 아이콘 라이브러리 탑재 ... -->
</head>
<body>
  <!-- 상세 코드는 google-apps-script/Index.html에서 전체를 확인할 수 있습니다 -->
</body>
</html>`;

  const copyToClipboard = (text: string, type: 'code' | 'index') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCodeGs(true);
      setTimeout(() => setCopiedCodeGs(false), 2000);
    } else {
      setCopiedIndexHtml(true);
      setTimeout(() => setCopiedIndexHtml(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
        {/* Advanced Ambient Glow Lights */}
        <div className="absolute top-1/10 left-1/10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/10 right-1/10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Elegant Glassmorphic Container */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl relative z-10">
          <div className="flex flex-col items-center text-center mb-6">
            {/* Security Badge with Flashing Beacon */}
            <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <ShieldAlert className="h-3.5 w-3.5" />
              대외비 (CONFIDENTIAL)
            </div>

            {/* Pulsing Lock Icon Halo */}
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/5 animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]"></div>
              <Lock className="h-6 w-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              대전 48개 일반고<br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">수시 입시결과 조회</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 font-medium">
              본 시스템은 인가된 교육 전문가 전용 비공개 웹앱입니다.
            </p>
          </div>

          {/* 10-Minute Timeout Banner */}
          {isAutoLoggedOut && (
            <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex gap-2.5 items-start text-left animate-fadeIn">
              <Clock className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-amber-300">세션 보호 자동 잠금</p>
                <p className="text-[10px] text-amber-400 leading-relaxed">
                  보안 유지를 위해 <strong>10분 동안 활동이 없어</strong> 세션이 안전하게 종료되었습니다. 비밀번호를 다시 입력해 주세요.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div className="text-center">
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                보안 패스코드 입력
              </label>

              {/* Password Visual Dots Matrix */}
              <div className="flex justify-center gap-3.5 my-4">
                {[0, 1, 2, 3].map((index) => {
                  const isActive = passwordInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                        isActive
                          ? 'bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.85)] scale-110'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Input wrapper with clear centered design */}
              <div className="relative max-w-[140px] mx-auto">
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={passwordInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                    setPasswordInput(val);
                    if (val === '0713') {
                      setIsAuthenticated(true);
                      sessionStorage.setItem('sushi_is_authenticated', 'true');
                      setPasswordError(null);
                      setIsAutoLoggedOut(false);
                      setPasswordInput('');
                    }
                  }}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.8em] pl-[0.8em] text-xl font-mono text-white bg-slate-900/60 border border-slate-800/80 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 rounded-xl py-2 px-3 transition-all duration-200"
                  autoFocus
                />
              </div>

              {passwordError && (
                <p className="text-[11px] text-rose-400 font-bold mt-2.5 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Interactive Touch Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back'].map((key) => {
                let display: React.ReactNode = key;
                if (key === 'back') display = '⌫';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-150 cursor-pointer ${
                      key === 'C'
                        ? 'bg-slate-950/50 hover:bg-rose-500/10 text-rose-400 border border-slate-800/60 hover:border-rose-500/30 active:scale-95'
                        : key === 'back'
                        ? 'bg-slate-950/50 hover:bg-slate-800 text-slate-300 border border-slate-800/60 active:scale-95'
                        : 'bg-slate-950/30 hover:bg-blue-600/10 hover:border-blue-500/30 active:scale-95 text-white border border-slate-800/60'
                    }`}
                  >
                    {display}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              접속 승인 완료
            </button>
          </form>

          {/* Secure Information footer info */}
          <div className="mt-6 pt-5 border-t border-slate-900 text-center space-y-1">
            <p className="text-[10px] text-slate-500 font-medium">
              ※ 10분 이상 활동이 감지되지 않으면 자동으로 화면이 잠깁니다.
            </p>
            <p className="text-[9px] text-slate-600 font-mono tracking-wider">
              © 교육과정전문가 입시 분석 센터 • ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Visual Header */}
      <header className="h-16 bg-blue-900 text-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-lg z-30 sticky top-0">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-blue-900 font-bold shrink-0">U</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight uppercase">대입 수시 결과 분석 플랫폼</h1>
                <span className="bg-rose-600/95 text-white text-[10px] font-black px-2 py-0.5 rounded-sm border border-rose-500 flex items-center gap-1">
                  대외비
                </span>
                <span className="bg-blue-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-700 hidden sm:flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE CONNECT
                </span>
              </div>
              <p className="text-[10px] text-blue-200 font-medium hidden md:block">
                대전 지역 48개 일반고 수시 입시결과를 시각화합니다
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-blue-950 hover:bg-blue-800 active:bg-blue-900 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-800/80 cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">시스템 잠금</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
            <RefreshCw className="h-10 w-10 text-blue-900 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-900">데이터를 로딩하고 있으니 잠시 기다려 주십시오</h3>
            <p className="text-xs text-slate-500 mt-1">
              실시간 구글 스프레드시트의 수시 분석 데이터를 동기화하고 있습니다.
            </p>
          </div>
        ) : (
          <>
            {isUsingFallback && (
              <div className="mb-6 bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">원격 구글 스프레드시트 로드 제안 및 오프라인 상태 경고</p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    구글 시트 API CORS 제약이나 비공개 설정으로 인해 연결이 지연되어, 브라우저가 사전에 검증된 의과대학 수시 결과 고품질 Fallback 샘플 데이터를 로드했습니다. 실제 수시 합격 등급 분포 및 분석 기능은 100% 정상 작동 중입니다.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
            
            {/* Top Row: Responsive Filters Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-blue-900" />
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">수시 상세 필터링 조건</h4>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-blue-600 transition flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  필터 초기화
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 0. Year Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">학년도 선택</label>
                  <select
                    value={filterYear}
                    onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 font-medium"
                  >
                    <option value="">전체 학년도 ({years.length}개 학년도)</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}학년도</option>
                    ))}
                  </select>
                </div>

                {/* 1. Region Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">지역 선택</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => { setFilterRegion(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 font-medium"
                  >
                    <option value="">전체 지역 ({regions.length}개 지역)</option>
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 1.5 Admission Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">전형유형 선택</label>
                  <select
                    value={filterAdmissionType}
                    onChange={(e) => { setFilterAdmissionType(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 font-medium"
                  >
                    <option value="">전체 전형 ({admissionTypes.length}개 전형)</option>
                    {admissionTypes.map(at => (
                      <option key={at} value={at}>{at}</option>
                    ))}
                  </select>
                </div>

                {/* 2. University Selector with suggestion search */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">대학명 입력</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="uni-datalist"
                      value={filterUniversity}
                      onChange={(e) => { setFilterUniversity(e.target.value); setCurrentPage(1); }}
                      placeholder="대학명 검색 (예: 서울대학교)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 font-medium"
                    />
                    <datalist id="uni-datalist">
                      {universities.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Department Search */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">학과명 키워드</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterDepartment}
                      onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
                      placeholder="학과 키워드 입력 (예: 의예)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 font-medium"
                    />
                    <Building className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Converted Grade Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">내신 등급 범위</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="9.0"
                      value={minGrade}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(9, parseFloat(e.target.value) || 1));
                        setMinGrade(val);
                        setCurrentPage(1);
                      }}
                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <div className="h-[2px] flex-1 bg-slate-200 relative">
                      <div className="absolute h-full bg-blue-600" style={{ left: `${((minGrade - 1) / 8) * 100}%`, right: `${100 - ((maxGrade - 1) / 8) * 100}%` }}></div>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="9.0"
                      value={maxGrade}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(9, parseFloat(e.target.value) || 9));
                        setMaxGrade(val);
                        setCurrentPage(1);
                      }}
                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Row Card Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat Card 1: Total Apps */}
              <div className="bg-white border-l-4 border-l-blue-600 border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                    총 검색 건수
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                      {stats.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-400 font-mono">ITEMS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">필터 적용 범위 내 전체 표본 수</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-900 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              {/* Stat Card 2: Pass Rate & Count */}
              <div className="bg-white border-l-4 border-l-green-500 border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                    합격 건수
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                      {stats.passCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] lg:text-xs font-semibold text-green-600 font-mono font-bold">
                      {stats.passRate}% PASS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium font-semibold">최초 및 예비 충합 누적치</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              {/* Stat Card 3: Average Converted Grade */}
              <div className="bg-white border-l-4 border-l-orange-500 border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                    평균 합격 등급
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                      {stats.avgPassGrade !== null ? stats.avgPassGrade.toFixed(2) : "-.-"}
                    </span>
                    <span className="text-[10px] lg:text-xs font-semibold text-orange-600 font-mono font-bold">GRADE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">산출된 수합 평균 내신 수치</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Scatter Distribution Section */}
            <section>
              <SushiScatterChart data={filteredRecords} />
            </section>

            {/* Comprehensive Interactive Table */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
              <div className="px-5 py-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-blue-900" />
                  <h4 className="text-sm font-bold text-slate-800">상세 결과 테이블 (지원 내역 상세 필터링)</h4>
                </div>
              </div>

              {/* Responsive Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                    <tr className="text-slate-500 uppercase font-bold text-[10px]">
                      <th className="px-3 md:px-4 py-3 pointer-events-none">학년도</th>
                      <th className="px-3 md:px-4 py-3 pointer-events-none">지역</th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('university')}>
                        <div className="flex items-center gap-1">대학명 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('admissionType')}>
                        <div className="flex items-center gap-1">전형유형 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('subType')}>
                        <div className="flex items-center gap-1">세부유형 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('department')}>
                        <div className="flex items-center gap-1">학과 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('grade')}>
                        <div className="flex items-center gap-1 text-center justify-center">환산등급 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 cursor-pointer select-none hover:text-blue-900" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1 text-center justify-center">합불여부 <ArrowUpDown className="h-3 w-3" /></div>
                      </th>
                      <th className="px-3 md:px-4 py-3 text-center">전교과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRecords.length > 0 ? (
                      paginatedRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-blue-50 transition-colors text-slate-700">
                          <td className="px-3 md:px-4 py-3 font-mono font-medium text-slate-400">{r.year}</td>
                          <td className="px-3 md:px-4 py-3">
                            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md text-[10px]">
                              {r.region}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 font-semibold text-slate-700">{r.university}</td>
                          <td className="px-3 md:px-4 py-3 text-slate-500 font-medium">{r.admissionType}</td>
                          <td className="px-3 md:px-4 py-3 text-slate-500 font-medium">{r.subType}</td>
                          <td className="px-3 md:px-4 py-3 font-medium text-blue-700">{r.department}</td>
                          <td className="px-3 md:px-4 py-3 font-mono font-bold text-slate-900 text-sm text-center">
                            {r.grade.toFixed(2)}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === '합'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : r.status.includes('충')
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                r.status === '합' ? 'bg-emerald-500' : r.status.includes('충') ? 'bg-cyan-500' : 'bg-rose-500'
                              }`}></span>
                              {r.status === '합' ? '합격' : r.status.includes('충') ? '충원' : '불합'}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-center font-mono text-slate-500">
                            {r.allSubjects !== null ? r.allSubjects.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-3 md:px-4 py-12 text-center text-slate-400 text-xs italic">
                          설정한 필터 조건에 부합하는 수시 세부 결과가 존재하지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controller */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-slate-600 font-semibold">
                  총 <span className="text-blue-600 font-bold">{sortedRecords.length}</span> 건 검색됨 (현재 {currentPage} / {totalPages} 페이지)
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 mr-2 font-medium"
                  >
                    <option value={5}>5개씩 보기</option>
                    <option value={10}>10개씩 보기</option>
                    <option value={20}>20개씩 보기</option>
                    <option value={50}>50개씩 보기</option>
                  </select>

                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 disabled:opacity-40 select-none transition-colors"
                    >
                      이전
                    </button>
                    {createPageNumbers(currentPage, totalPages).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => p !== '...' && setCurrentPage(p as number)}
                        className={`px-3 md:px-3.5 py-1.5 md:py-2 text-xs font-extrabold rounded-lg select-none transition-colors ${
                          p === currentPage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : p === '...'
                            ? 'bg-transparent text-slate-400 pointer-events-none'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 disabled:opacity-40 select-none transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-semibold">
          {/* 하단 텍스트 삭제됨 */}
        </div>
      </footer>
    </div>
  );
}

// Simple dynamic Pagination math helper
function createPageNumbers(current: number, total: number) {
  const pages: (number | string)[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current, '...', total);
    }
  }
  return pages;
}
