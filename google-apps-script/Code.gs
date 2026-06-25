// Code.gs - Google Apps Script 서버측 파일
/**
 * 웹앱 진입점: Index.html을 렌더링하여 사용자 브라우저에 배포합니다.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('대입 수시 결과 대시보드 WebApp')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 구글 스프레드시트 '수시' 시트의 데이터를 읽어와 JSON 형태로 반환합니다.
 * 환산등급(H열)이 비어있거나 올바른 숫자가 아닌 행은 전처리 과정에서 제외됩니다.
 */
function getSushiData() {
  // 사용자의 구글 스프레드시트 ID
  var SPREADSHEET_ID = "17BPrRpIKTw8LRBnT7vPQgTOs7Nk1cy7278zn_5c2_gQ";
  var sheet;
  
  try {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("수시");
  } catch(e) {
    try {
      // 컨테이너 바인딩된 방식일 경우 활성 스프레드시트 시도
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("수시");
    } catch(err) {
      throw new Error("스프레드시트를 열 수 없거나 '수시' 시트를 찾을 수 없습니다. (ID: " + SPREADSHEET_ID + ")");
    }
  }
  
  if (!sheet) {
    throw new Error("'수시' 시트를 시트 목록에서 찾을 수 없습니다.");
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return []; // 헤더만 존재하거나 데이터가 없음
  }
  
  var result = [];
  
  // A열부터 R열까지 인덱스:
  // 0: 학년도, 1: 지역, 2: 대학명, 3: 전형유형, 4: 세부유형, 5: 계열, 6: 학과, 
  // 7: 환산등급, 8: 환산점수, 9: 합불여부, 10: 전교과, 11: 국수영시, 12: 국영수과, 
  // 13: 국어, 14: 수학, 15: 영어, 16: 사회, 17: 과학
  
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r || r.length < 10) continue;
    
    // H열: 환산등급 (인덱스 7)
    var gradeRaw = r[7];
    if (gradeRaw === "" || gradeRaw === null || gradeRaw === undefined) {
      continue; // '환산등급'이 비어있는 데이터는 규칙에 의해 제외
    }
    
    var grade = parseFloat(gradeRaw);
    if (isNaN(grade)) {
      continue; // 숫자로 변환이 불가능한 등급도 제외
    }
    
    // 각 열의 데이터 추출 후 안전 가공
    var record = {
      year: r[0] ? String(r[0]).trim() : "",
      region: r[1] ? String(r[1]).trim() : "",
      university: r[2] ? String(r[2]).trim() : "",
      admissionType: r[3] ? String(r[3]).trim() : "",
      subType: r[4] ? String(r[4]).trim() : "",
      track: r[5] ? String(r[5]).trim() : "",
      department: r[6] ? String(r[6]).trim() : "",
      grade: grade, // 가공된 환산등급 (실수)
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
    };
    
    result.push(record);
  }
  
  return result;
}
