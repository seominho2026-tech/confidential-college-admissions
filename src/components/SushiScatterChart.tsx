import React, { useState } from 'react';
import { StudentRecord } from '../utils/dataLoader';

interface ScatterChartProps {
  data: StudentRecord[];
}

export function SushiScatterChart({ data }: ScatterChartProps) {
  const [chartMode, setChartMode] = useState<'status_bands' | 'scores'>('status_bands');
  const [hoveredPoint, setHoveredPoint] = useState<{
    record: StudentRecord;
    x: number;
    y: number;
  } | null>(null);
  const [clickedPoint, setClickedPoint] = useState<{
    record: StudentRecord;
    x: number;
    y: number;
  } | null>(null);

  const pointToShow = hoveredPoint || clickedPoint;

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        최적화된 차트를 표시할 데이터가 없습니다. 필터를 조정해 주세요.
      </div>
    );
  }

  // Calculate X bounds (환산등급 - 1.0 is best, 9.0 is worst)
  const grades = data.map((r) => r.grade);
  const minGradeInSubset = Math.min(...grades);
  const maxGradeInSubset = Math.max(...grades);

  // Pad the range slightly for premium visual distribution
  const marginX = 0.1;
  const minX = Math.max(1.0, parseFloat((minGradeInSubset - marginX).toFixed(2)));
  const maxX = Math.min(9.0, parseFloat((maxGradeInSubset + marginX).toFixed(2)));
  const rangeX = maxX - minX || 1.0;

  // Calculate Y bounds if using scores
  const scoreRecords = data.filter((r) => r.score !== null);
  const scores = scoreRecords.map((r) => r.score as number);
  const minScoreInSubset = scores.length ? Math.min(...scores) : 0;
  const maxScoreInSubset = scores.length ? Math.max(...scores) : 1000;
  
  // Padding for score Y-axis
  const minY = Math.max(0, minScoreInSubset * 0.95);
  const maxY = maxScoreInSubset * 1.05;
  const rangeY = maxY - minY || 100;

  // Chart Dimensions
  const paddingLeft = 60;
  const paddingRight = 45;
  const paddingTop = 40;
  const paddingBottom = 50;
  const width = 800;
  const height = 350;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Helper mapping functions
  const getXCoord = (grade: number) => {
    // 1.0 is highest, 9.0 is lowest, but people expect to see 1.0 on the left in Korea, so:
    // Left side = minX (best/lowest GPA), Right side = maxX (worst/highest GPA)
    const ratio = (grade - minX) / rangeX;
    return paddingLeft + ratio * plotWidth;
  };

  const getYCoord = (record: StudentRecord, index: number) => {
    if (chartMode === 'scores') {
      const score = record.score !== null ? record.score : minY + rangeY / 2;
      const ratio = (score - minY) / rangeY;
      // Invert Y because SVG coordinates start from top
      return paddingTop + plotHeight - ratio * plotHeight;
    } else {
      // Categorical status bands
      // Band positions: Pass (합) = 25%, Wait/Pass2 (합(충)) = 50%, Fail (불) = 75%
      let bandRatio = 0.75; // Default fail
      if (record.status === '합') {
        bandRatio = 0.25;
      } else if (record.status.includes('충') || record.status.includes('합(충)')) {
        bandRatio = 0.50;
      }

      // Add a clean deterministic jitter to prevent overlap on the same grade
      const jitterAmount = Math.sin(index * 984.55) * 22; // ±22px jitter
      return paddingTop + bandRatio * plotHeight + jitterAmount;
    }
  };

  // Generate gridlines for GPA
  const gridTicksX: number[] = [];
  const step = rangeX > 2 ? 0.5 : 0.1;
  const startTick = Math.ceil(minX / step) * step;
  for (let t = startTick; t <= maxX; t += step) {
    gridTicksX.push(parseFloat(t.toFixed(2)));
  }

  // Generate gridlines for Y
  const gridTicksY: { label: string; y: number }[] = [];
  if (chartMode === 'scores') {
    const yStep = rangeY / 4;
    for (let i = 0; i <= 4; i++) {
      const scoreVal = minY + i * yStep;
      gridTicksY.push({
        label: scoreVal.toFixed(0),
        y: paddingTop + plotHeight - (i / 4) * plotHeight,
      });
    }
  } else {
    gridTicksY.push({ label: '최초합격', y: paddingTop + 0.25 * plotHeight });
    gridTicksY.push({ label: '충원합격', y: paddingTop + 0.5 * plotHeight });
    gridTicksY.push({ label: '불합격', y: paddingTop + 0.75 * plotHeight });
  }

  return (
    <div className="relative bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight">등급별 합불 분포 (산점도)</h3>
          <p className="text-xs text-slate-500 mt-1">
            {chartMode === 'status_bands'
              ? '합격 상태 그룹별 분포 (마우스를 올리면 상세정보를 표출합니다)'
              : '대학별 환산점수 기준 종결 분포'}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => {
              setChartMode('status_bands');
              setHoveredPoint(null);
              setClickedPoint(null);
            }}
            className={`rounded-md px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              chartMode === 'status_bands'
                ? 'bg-white text-blue-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            합불 그룹 정렬 (추천)
          </button>
          <button
            onClick={() => {
              setChartMode('scores');
              setHoveredPoint(null);
              setClickedPoint(null);
            }}
            className={`rounded-md px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              chartMode === 'scores'
                ? 'bg-white text-blue-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            환산점수 매핑
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div 
        className="overflow-x-auto relative"
        onClick={() => setClickedPoint(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block select-none"
          style={{ width: '100%', minWidth: '100%', height: '100%', maxHeight: '400px' }}
        >
          {/* Background Grid Lines - X-axis (GPA) */}
          {gridTicksX.map((tick) => {
            const x = getXCoord(tick);
            return (
              <g key={`grid-x-${tick}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + plotHeight}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Background Grid Lines - Y-axis */}
          {gridTicksY.map((tick, i) => (
            <g key={`grid-y-${i}`}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeWidth={1}
                strokeDasharray={chartMode === 'status_bands' ? '4 4' : '0'}
              />
              <text
                x={paddingLeft - 12}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-medium"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Core Axis Lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={width - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth={1.5}
          />
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth={1.5}
          />

          {/* X Axis Title */}
          <text
            x={paddingLeft + plotWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="fill-slate-600 text-[11px] font-semibold"
          >
            ← 환산 내신등급 (왼쪽일수록 1등급에 가깝고 우수함) →
          </text>

          {/* Scatter Data Points */}
          {data.map((record, index) => {
            const cx = getXCoord(record.grade);
            const cy = getYCoord(record, index);
            
            // Assign custom premium colors based on admission status
            let fillColor = 'bg-rose-500';
            let strokeColor = 'border-rose-600';
            let colorKey = 'Rose';
            if (record.status === '합') {
              fillColor = 'fill-emerald-500';
              strokeColor = '#10b981';
              colorKey = '#10b981';
            } else if (record.status.includes('충') || record.status.includes('합(충)')) {
              fillColor = 'fill-cyan-500';
              strokeColor = '#06b6d4';
              colorKey = '#06b6d4';
            } else {
              fillColor = 'fill-rose-500';
              strokeColor = '#f43f5e';
              colorKey = '#f43f5e';
            }

            const isHovered = hoveredPoint?.record === record || clickedPoint?.record === record;

            return (
              <g key={`point-group-${index}`} className="group">
                {/* Visual circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 5}
                  className={`transition-all duration-150 ${fillColor}`}
                  stroke={isHovered ? '#0f172a' : strokeColor}
                  strokeWidth={isHovered ? 2.5 : 1}
                  strokeOpacity={isHovered ? 1 : 0.7}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  pointerEvents="none"
                />
                {/* Touch-optimized target circle (r=16px) for tablet users */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer select-none"
                  onMouseEnter={() => {
                    setHoveredPoint({
                      record,
                      x: cx,
                      y: cy,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (clickedPoint?.record === record) {
                      setClickedPoint(null);
                    } else {
                      setClickedPoint({
                        record,
                        x: cx,
                        y: cy,
                      });
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover & Tap Tooltip Overlay (Absolute HTML inside React) */}
        {pointToShow && (
          <div
            className="absolute z-20 w-64 rounded-xl border border-slate-200 bg-slate-950/95 p-3.5 text-white shadow-xl backdrop-blur-xs transition-all duration-150"
            style={{
              left: `${(pointToShow.x / width) * 100}%`,
              top: `${(pointToShow.y / height) * 100}%`,
              transform: `translate(${
                (pointToShow.x / width) * 100 < 25 
                  ? '0%' 
                  : (pointToShow.x / width) * 100 > 75 
                  ? '-100%' 
                  : '-50%'
              }, ${
                (pointToShow.y / height) * 100 < 35
                  ? '12px'
                  : '-105%'
              })`,
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {pointToShow.record.year || '24'}학년도 수시
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    pointToShow.record.status === '합'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : pointToShow.record.status.includes('충')
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {pointToShow.record.status === '합'
                    ? '최초합격'
                    : pointToShow.record.status.includes('충')
                    ? '충원합격'
                    : '불합격'}
                </span>
                {clickedPoint?.record === pointToShow.record && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setClickedPoint(null);
                    }}
                    className="text-slate-400 hover:text-white text-[11px] font-bold px-1 rounded-sm bg-slate-800/80 active:bg-slate-700"
                    title="닫기"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <h5 className="font-bold text-sm tracking-tight text-white m-0">
              {pointToShow.record.university}
            </h5>
            <p className="text-[11px] text-slate-300 font-semibold mb-2">
              {pointToShow.record.department}
            </p>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-slate-800 pt-2 text-[10px] font-mono">
              <div>
                <span className="text-slate-400 block text-[9px]">환산내신등급</span>
                <span className="text-emerald-400 font-bold text-xs">
                  {pointToShow.record.grade.toFixed(2)} 등급
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">환산 점수</span>
                <span className="text-slate-200 font-semibold">
                  {pointToShow.record.score !== null ? pointToShow.record.score.toFixed(1) : '-'} 점
                </span>
              </div>
              
              <div className="col-span-2 grid grid-cols-3 gap-1 border-t border-slate-900 pt-1.5 text-center">
                <div>
                  <span className="text-slate-400 block text-[8px]">전교과</span>
                  <span className="text-slate-200 block text-[10px]">
                    {pointToShow.record.allSubjects !== null ? pointToShow.record.allSubjects.toFixed(2) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">국수영시</span>
                  <span className="text-slate-200 block text-[10px]">
                    {pointToShow.record.korMathEngSoc !== null ? pointToShow.record.korMathEngSoc.toFixed(2) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">국영수과</span>
                  <span className="text-slate-200 block text-[10px]">
                    {pointToShow.record.korEngMathSci !== null ? pointToShow.record.korEngMathSci.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Block */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p className="text-[10px] text-slate-400 italic">
          *X축: 내신 환산 등급 | Y축: 지원 결과 밴드 구분 (동일 구간 겹침 방지용 세로 난수 분산 적용)
        </p>
        <div className="flex flex-wrap gap-4 font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block"></span>
            <span>합격</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 block"></span>
            <span>충원</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 block"></span>
            <span>불합</span>
          </div>
        </div>
      </div>
    </div>
  );
}
