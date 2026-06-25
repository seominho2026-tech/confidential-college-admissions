/**
 * Google Sheet data loader and parser
 */

export interface StudentRecord {
  year: string;
  region: string;
  university: string;
  admissionType: string;
  subType: string;
  track: string;
  department: string;
  grade: number; // 환산등급 (내신 성적)
  score: number | null; // 환산점수
  status: string; // 합불여부 ('합', '합(충)', '불' 등)
  allSubjects: number | null; // 전교과
  korMathEngSoc: number | null; // 국수영시
  korEngMathSci: number | null; // 국영수과
  korean: number | null; // 국어
  math: number | null; // 수학
  english: number | null; // 영어
  social: number | null; // 사회
  science: number | null; // 과학
}

export async function fetchSpreadsheetData(spreadsheetId: string): Promise<StudentRecord[]> {
  const sheetName = "수시";
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    
    // Google Visualization API returns "/*O_o*/\ngoogle.visualization.Query.setResponse({...});"
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Invalid format received from Google Sheets visualization API");
    }
    
    const jsonStr = text.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);
    
    if (!data.table || !data.table.rows) {
      throw new Error("No data found in Google Sheet table rows");
    }

    const rows = data.table.rows;
    const records: StudentRecord[] = [];

    // Helper to get string value safely
    const getString = (cells: any[], idx: number): string => {
      if (!cells || idx >= cells.length || !cells[idx]) return "";
      const val = cells[idx].v;
      return val !== null && val !== undefined ? String(val).trim() : "";
    };

    // Helper to get number value safely
    const getNumber = (cells: any[], idx: number): number | null => {
      if (!cells || idx >= cells.length || !cells[idx]) return null;
      const val = cells[idx].v;
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    // Skip header row if it contains column labels (gviz API excludes header if detected, but let's be safe)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.c) continue;
      
      const cells = row.c;

      // Extract details
      const grade = getNumber(cells, 7); // H열 (환산등급)
      
      // '환산등급'이 비어있는 데이터는 제외하고 계산해줘.
      if (grade === null) {
        continue;
      }

      const year = getString(cells, 0); // A열 (학년도)
      // Check if this looks like a header row - e.g. year contains "학년도"
      if (year.includes("학년도") || getString(cells, 1).includes("지역")) {
        continue;
      }

      const region = getString(cells, 1);       // B열
      const university = getString(cells, 2);   // C열
      const admissionType = getString(cells, 3); // D열
      const subType = getString(cells, 4);       // E열
      const track = getString(cells, 5);         // F열
      const department = getString(cells, 6);    // G열
      const score = getNumber(cells, 8);         // I열
      const status = getString(cells, 9);        // J열
      const allSubjects = getNumber(cells, 10);  // K열
      const korMathEngSoc = getNumber(cells, 11);// L열
      const korEngMathSci = getNumber(cells, 12);// M열
      const korean = getNumber(cells, 13);       // N열
      const math = getNumber(cells, 14);         // O열
      const english = getNumber(cells, 15);      // P열
      const social = getNumber(cells, 16);       // Q열
      const science = getNumber(cells, 17);      // R열

      records.push({
        year,
        region,
        university,
        admissionType,
        subType,
        track,
        department,
        grade,
        score,
        status,
        allSubjects,
        korMathEngSoc,
        korEngMathSci,
        korean,
        math,
        english,
        social,
        science
      });
    }

    return records;
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    throw error;
  }
}

/**
 * Fallback static mock data based on the screenshot provided in case spreadsheet fetch fails (CORS/offline)
 */
export const FALLBACK_SAMPLE_DATA: StudentRecord[] = [
  { year: "24", region: "대전", university: "충남대학교(대전)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "의예과", grade: 1.00, score: 100.00, status: "합", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "가톨릭대학교(성의)", admissionType: "종합", subType: "학생부종합(학교장추천전형)", track: "자연", department: "의예과", grade: 1.00, score: null, status: "합(충)", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "경희대학교(서울)", admissionType: "교과", subType: "학생부교과(지역균형전형)", track: "자연", department: "의예과(자연계열)", grade: 1.00, score: 700.00, status: "불", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "고려대학교(서울)", admissionType: "교과", subType: "학생부교과:학교추천", track: "자연", department: "의과대학", grade: 1.00, score: 80.00, status: "불", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "충남", university: "순천향대학교(아산)", admissionType: "교과", subType: "학생부교과(메타버스전형)", track: "자연", department: "의예과", grade: 1.00, score: 1000.00, status: "합", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "충북", university: "충북대학교(청주)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "의예과", grade: 1.00, score: 80.00, status: "합", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "경기", university: "성균관대학교(수원)", admissionType: "종합", subType: "학생부종합(학과모집)", track: "자연", department: "의예과", grade: 1.00, score: null, status: "합(충)", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "가톨릭대학교(성의)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "의예과", grade: 1.00, score: 100.00, status: "합", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "경희대학교(서울)", admissionType: "교과", subType: "학생부교과(지역균형전형)", track: "자연", department: "의예과(자연계열)", grade: 1.00, score: 700.00, status: "합(충)", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "고려대학교(서울)", admissionType: "교과", subType: "학생부교과:학교추천", track: "자연", department: "의과대학", grade: 1.00, score: 80.00, status: "합(충)", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "서울대학교(서울)", admissionType: "종합", subType: "학생부종합전형(수시모집 지역)", track: "자연", department: "의예과", grade: 1.00, score: null, status: "불", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "연세대학교(서울)", admissionType: "교과", subType: "학생부교과(추천형)", track: "자연", department: "의예과", grade: 1.00, score: 98.68, status: "합", allSubjects: 1.00, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "고려대학교(서울)", admissionType: "교과", subType: "학생부교과:학교추천", track: "자연", department: "의과대학", grade: 1.02, score: 79.96, status: "불", allSubjects: 1.03, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "인천", university: "가천대학교(메디컬)", admissionType: "교과", subType: "학생부교과(학생부우수자)", track: "자연", department: "의예과", grade: 1.00, score: 1000.00, status: "합(충)", allSubjects: 1.03, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "제주", university: "제주대학교(제주)", admissionType: "교과", subType: "학생부교과(일반학생전형)", track: "자연", department: "의예과", grade: 1.00, score: 1000.00, status: "합", allSubjects: 1.03, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "충북", university: "건국대학교(글로컬)", admissionType: "교과", subType: "학생부교과(지역인재)", track: "자연", department: "의예과", grade: 1.04, score: 1027.90, status: "합", allSubjects: 1.03, korMathEngSoc: 1.00, korEngMathSci: 1.00, korean: 1.00, math: 1.00, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "대전", university: "건양대학교(대전)", admissionType: "교과", subType: "학생부교과(지역인재전형[면접])", track: "자연", department: "의학과", grade: 1.02, score: 900.00, status: "불", allSubjects: 1.04, korMathEngSoc: 1.03, korEngMathSci: 1.02, korean: 1.02, math: 1.00, english: 1.08, social: 1.00, science: 1.00 },
  { year: "24", region: "대전", university: "대전대학교(대전)", admissionType: "교과", subType: "학생부교과(지역인재 I 전형)", track: "자연", department: "한의예과", grade: 1.03, score: 999.73, status: "불", allSubjects: 1.04, korMathEngSoc: 1.03, korEngMathSci: 1.02, korean: 1.00, math: 1.08, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "한양대학교(서울)", admissionType: "교과", subType: "학생부교과(지역균형발전)", track: "자연", department: "융합전자공학부", grade: 1.02, score: 999.27, status: "합", allSubjects: 1.04, korMathEngSoc: 1.03, korEngMathSci: 1.02, korean: 1.00, math: 1.08, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "전북", university: "전북대학교(전주)", admissionType: "교과", subType: "학생부교과(일반학생 전형)", track: "자연", department: "치의예과", grade: 1.02, score: 1001.43, status: "불", allSubjects: 1.04, korMathEngSoc: 1.03, korEngMathSci: 1.02, korean: 1.00, math: 1.08, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "충북", university: "충북대학교(청주)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "수의예과", grade: 1.02, score: 79.97, status: "합", allSubjects: 1.04, korMathEngSoc: 1.03, korEngMathSci: 1.02, korean: 1.00, math: 1.08, english: 1.00, social: 1.00, science: 1.00 },
  { year: "24", region: "대전", university: "충남대학교(대전)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "의예과", grade: 1.03, score: 99.70, status: "불", allSubjects: 1.04, korMathEngSoc: 1.06, korEngMathSci: 1.05, korean: 1.00, math: 1.00, english: 1.20, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "가톨릭대학교(성의)", admissionType: "종합", subType: "학생부종합(학교장추천전형)", track: "자연", department: "의예과", grade: 1.04, score: null, status: "합(충)", allSubjects: 1.04, korMathEngSoc: 1.06, korEngMathSci: 1.05, korean: 1.00, math: 1.00, english: 1.20, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "경희대학교(서울)", admissionType: "종합", subType: "학생부종합(네오르네상스전형)", track: "자연", department: "의예과(자연계열)", grade: 1.04, score: null, status: "합", allSubjects: 1.04, korMathEngSoc: 1.06, korEngMathSci: 1.05, korean: 1.00, math: 1.00, english: 1.20, social: 1.00, science: 1.00 },
  { year: "24", region: "제주", university: "제주대학교(제주)", admissionType: "교과", subType: "학생부교과(일반학생전형)", track: "자연", department: "의예과", grade: 1.04, score: 999.10, status: "합(충)", allSubjects: 1.04, korMathEngSoc: 1.06, korEngMathSci: 1.05, korean: 1.00, math: 1.00, english: 1.20, social: 1.00, science: 1.00 },
  { year: "24", region: "서울", university: "고려대학교(서울)", admissionType: "종합", subType: "학생부종합(학업우수형)", track: "자연", department: "의과대학", grade: 1.08, score: null, status: "합", allSubjects: 1.08, korMathEngSoc: 1.08, korEngMathSci: 1.08, korean: 1.00, math: 1.10, english: 1.10, social: 1.00, science: 1.05 },
  { year: "24", region: "서울", university: "서울대학교(서울)", admissionType: "종합", subType: "학생부종합전형(일반전형)", track: "자연", department: "의예과", grade: 1.10, score: null, status: "불", allSubjects: 1.10, korMathEngSoc: 1.10, korEngMathSci: 1.10, korean: 1.10, math: 1.10, english: 1.10, social: 1.10, science: 1.10 },
  { year: "24", region: "강원", university: "연세대학교(미래)", admissionType: "종합", subType: "학교생활우수자전형", track: "자연", department: "의예과", grade: 1.12, score: null, status: "합(충)", allSubjects: 1.12, korMathEngSoc: 1.12, korEngMathSci: 1.12, korean: 1.11, math: 1.15, english: 1.12, social: 1.00, science: 1.13 },
  { year: "24", region: "대구", university: "경북대학교(대구)", admissionType: "교과", subType: "교과우수자전형", track: "자연", department: "치의예과", grade: 1.15, score: 495.30, status: "합", allSubjects: 1.15, korMathEngSoc: 1.15, korEngMathSci: 1.15, korean: 1.10, math: 1.20, english: 1.10, social: 1.00, science: 1.20 },
  { year: "24", region: "부산", university: "부산대학교(부산)", admissionType: "교과", subType: "학생부교과(지역인재전형)", track: "자연", department: "한의학전문대학원", grade: 1.21, score: 98.24, status: "합", allSubjects: 1.22, korMathEngSoc: 1.21, korEngMathSci: 1.22, korean: 1.15, math: 1.30, english: 1.15, social: 1.00, science: 1.25 }
];
