import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RaceSimulation } from '../logic/engine';
import { RaceCommentary } from '../logic/commentary';
import { GameState, RuntimeHorse, Condition, Motivation, Attribute, RunStyle, SurfaceType } from '../types';
import { HORSES_DATA, RACES_DATA, MOTIVATION_DATA } from '../constants';
import { formatDiff } from '../utils';

interface Props {
  horseIds: number[];
  raceId: number;
  onReset: () => void;
}

const STRATEGY_LABELS = {
    [RunStyle.GreatEscape]: "大逃",
    [RunStyle.Escape]: "逃",
    [RunStyle.Leader]: "先",
    [RunStyle.Betweener]: "差",
    [RunStyle.Chaser]: "追",
    [RunStyle.Unknown]: "?"
};

const VIEW_WINDOW = 50; // Total view width in meters (+/- 25m)

// Optimized Horse Component with View Window Logic
const HorseRenderer = React.memo(({ horse, viewStart, totalHorses }: { horse: RuntimeHorse, viewStart: number, totalHorses: number }) => {
    // Calculate relative position in the view window (0% to 100% of the screen width)
    // viewStart is the distance at the left edge of the screen
    const relativeDist = horse.distanceRun - viewStart;
    const progress = (relativeDist / VIEW_WINDOW) * 100;
    
    // Hide horses well outside the view to prevent DOM overload (optional, but good for large races)
    // Keeping a bit of buffer (e.g., -10% to 110%) to avoid pop-in
    const isVisible = progress > -10 && progress < 110;

    const laneIndex = horse.lane;
    const topPos = (laneIndex * (100 / totalHorses));

    // Determine badge color
    let badgeClass = 'bg-purple-500 border-purple-300';
    if (horse.finishTime) badgeClass = 'bg-yellow-500 border-yellow-200 text-black';
    else if (horse.strategy === RunStyle.Escape || horse.strategy === RunStyle.GreatEscape) badgeClass = 'bg-pink-500 border-pink-300';
    else if (horse.strategy === RunStyle.Leader) badgeClass = 'bg-blue-500 border-blue-300';

    if (!isVisible) return null;

    return (
        <div 
            className="absolute transition-transform duration-75 ease-linear flex items-center will-change-transform"
            style={{ 
                left: `${progress}%`, 
                top: `${topPos}%`,
                width: '40px',
                height: '40px',
                transform: 'translate(-50%, 0)' // Center the horse on the point
            }}
        >
            <div className="relative">
                {/* Horse Icon - Now showing Lane Number (Gate) */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-lg z-10 ${badgeClass}`}>
                    {horse.lane + 1}
                </div>
                 {/* Name Tooltip */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-black/50 px-1 rounded text-white z-20 pointer-events-none">
                    {horse.finishOrder ? `${horse.finishOrder}着` : horse.config.name}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return false; // Force update
});

const Track = ({ horses, viewStart, raceDist }: { horses: RuntimeHorse[], viewStart: number, raceDist: number }) => {
    // Generate dynamic distance markers
    const markers = useMemo(() => {
        const result = [];
        // Align to nearest 25m since window is smaller
        const startMarker = Math.floor(viewStart / 25) * 25;
        const endMarker = Math.ceil((viewStart + VIEW_WINDOW) / 25) * 25;
        
        for (let m = startMarker; m <= endMarker; m += 25) {
            if (m < 0 || m > raceDist) continue;
            result.push(m);
        }
        return result;
    }, [viewStart, raceDist]);

    // Calculate fixed lines positions
    const startLinePos = ((0 - viewStart) / VIEW_WINDOW) * 100;
    const finishLinePos = ((raceDist - viewStart) / VIEW_WINDOW) * 100;

    return (
        <div className="relative w-full max-w-6xl mx-auto h-[60vh] overflow-hidden">
            {/* Background Texture/Grid (Moving) */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                     backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 24px, #ffffff 25px)',
                     backgroundPosition: `${-viewStart * (100/VIEW_WINDOW)}% 0`,
                     backgroundSize: `${(100 / VIEW_WINDOW) * 100}% 100%`
                 }} 
            />

            {/* Distance Markers */}
            {markers.map(m => {
                const pos = ((m - viewStart) / VIEW_WINDOW) * 100;
                return (
                    <div key={m} className="absolute top-0 bottom-0 border-l border-white/20" style={{ left: `${pos}%` }}>
                        <span className="absolute bottom-2 left-1 text-xs font-mono text-white/50">{m}m</span>
                    </div>
                );
            })}

            {/* Start Line */}
            {startLinePos > -10 && startLinePos < 110 && (
                 <div className="absolute top-0 bottom-0 w-1 bg-white z-0" style={{ left: `${startLinePos}%` }}>
                    <span className="absolute top-2 -left-8 text-xs font-bold text-white">START</span>
                </div>
            )}

            {/* Finish Line */}
            {finishLinePos > -10 && finishLinePos < 110 && (
                <div className="absolute top-0 bottom-0 w-1 bg-red-500/50 border-l border-white z-0" style={{ left: `${finishLinePos}%` }}>
                    <span className="absolute top-2 -left-8 text-xs font-bold text-red-300">GOAL</span>
                </div>
            )}

            {/* Horses */}
            {horses.map((horse) => (
                <HorseRenderer 
                    key={horse.config.id} 
                    horse={horse} 
                    viewStart={viewStart} 
                    totalHorses={horses.length}
                />
            ))}
        </div>
    );
};

// Helper to create RuntimeHorse from ID
const createRuntimeHorse = (id: number): RuntimeHorse => {
  const config = HORSES_DATA.find(h => h.id === id)!;
  return {
    config,
    currentSpeed: { base: 0, modifiers: [] },
    targetSpeed: { base: 0, modifiers: [] },
    currentAccel: { base: 0, modifiers: [] },
    stamina: 0,
    maxStamina: 0,
    distanceRun: 0,
    lane: 0,
    section: 0,
    strategy: RunStyle.Betweener,
    strategyAwareness: RunStyle.Betweener,
    motivation: Math.floor(Math.random() * 5),
    speedAttr: { base: 0, modifiers: [] },
    staminaAttr: { base: 0, modifiers: [] },
    powerAttr: { base: 0, modifiers: [] },
    gutsAttr: { base: 0, modifiers: [] },
    intAttr: { base: 0, modifiers: [] },
    statusEffects: [],
    finishTime: null,
    finishOrder: null,
    finishDiff: '',
    isBlocked: false,
    isPanic: false,
    isSpurt: false,
    hasStaminaDepleted: false
  };
};

const PreRaceInfo = ({ engine, focusedId, setFocusedId, onStart }: { 
    engine: RaceSimulation, 
    focusedId: number, 
    setFocusedId: (id: number) => void,
    onStart: () => void 
}) => {
    return (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">{engine.race.name}</h2>
            <p className="text-gray-400 mb-6">
                {engine.race.surface === SurfaceType.Turf ? "草地" : "泥地"} {engine.race.distance}m · 
                状况: {["良好","略差","差","极差"][engine.condition]}
            </p>
            
            <p className="text-blue-300 text-sm mb-2 animate-pulse">👇 点击列表选择关注的赛马娘</p>

            <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-4xl mb-8 flex flex-col max-h-[60vh]">
                <div className="overflow-y-auto">
                    <table className="w-full text-sm text-left text-gray-800">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-200 sticky top-0 z-10 shadow">
                            <tr>
                                <th className="px-4 py-3">关注</th>
                                <th className="px-4 py-3">闸番</th>
                                <th className="px-4 py-3">马名</th>
                                <th className="px-4 py-3">跑法</th>
                                <th className="px-4 py-3">干劲</th>
                                <th className="px-4 py-3 text-center">速度</th>
                                <th className="px-4 py-3 text-center">耐力</th>
                                <th className="px-4 py-3 text-center">力量</th>
                                <th className="px-4 py-3 text-center">意志</th>
                                <th className="px-4 py-3 text-center">智力</th>
                            </tr>
                        </thead>
                        <tbody>
                            {engine.horses.map((h, idx) => (
                                <tr 
                                    key={h.config.id} 
                                    className={`border-b cursor-pointer transition-colors ${focusedId === h.config.id ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'}`}
                                    onClick={() => setFocusedId(h.config.id)}
                                >
                                    <td className="px-4 py-2 text-center">
                                        <input 
                                            type="radio" 
                                            name="focusedHorse" 
                                            checked={focusedId === h.config.id} 
                                            onChange={() => setFocusedId(h.config.id)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-2 font-bold">{idx + 1}</td>
                                    <td className="px-4 py-2 font-bold">{h.config.name}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs text-white ${
                                            h.strategy === RunStyle.Escape ? 'bg-pink-500' :
                                            h.strategy === RunStyle.Leader ? 'bg-blue-500' :
                                            h.strategy === RunStyle.Betweener ? 'bg-purple-500' : 'bg-gray-500'
                                        }`}>
                                            {STRATEGY_LABELS[h.strategy]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`${h.motivation === Motivation.Excellent ? 'text-pink-600 font-bold' : h.motivation === Motivation.Terrible ? 'text-blue-600' : 'text-gray-600'}`}>
                                            {MOTIVATION_DATA[h.motivation].name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center text-gray-600">{Math.round(h.speedAttr.base)}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{Math.round(h.staminaAttr.base)}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{Math.round(h.powerAttr.base)}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{Math.round(h.gutsAttr.base)}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{Math.round(h.intAttr.base)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <button 
                onClick={onStart}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transform transition active:scale-95 animate-bounce"
            >
                各就各位
            </button>
        </div>
    );
};

export const RaceView: React.FC<Props> = ({ horseIds, raceId, onReset }) => {
  const [engine, setEngine] = useState<RaceSimulation | null>(null);
  const [frame, setFrame] = useState(0); 
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [focusedId, setFocusedId] = useState<number>(horseIds[0]);
  const requestRef = useRef<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize engine only once
  useEffect(() => {
    const raceConfig = RACES_DATA[raceId];
    const horses = horseIds.map(createRuntimeHorse);
    
    // Strategy logic
    horses.forEach(h => {
       const weights = [0, h.config.styleAptitudes[0]**2, h.config.styleAptitudes[1]**2, h.config.styleAptitudes[2]**2, h.config.styleAptitudes[3]**2];
       let sum = weights.reduce((a,b)=>a+b, 0);
       let r = Math.random() * sum;
       let s = 1;
       if (r < weights[1]) s = 1; 
       else if (r < weights[1]+weights[2]) s = 2;
       else if (r < weights[1]+weights[2]+weights[3]) s = 3;
       else s = 4;
       h.strategy = s;
       h.strategyAwareness = s;
    });

    const sim = new RaceSimulation(horses, raceConfig, Math.floor(Math.random() * 4));
    new RaceCommentary(sim);
    setEngine(sim);
    
    // Default focus to first horse
    if (horses.length > 0) setFocusedId(horses[0].config.id);
    
    // Cleanup on unmount
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [horseIds, raceId]);

  // Game Loop Control
  useEffect(() => {
      if (!isStarted || !engine) return;

      const loop = () => {
          if (!isPaused) {
            engine.tick();
            setFrame(f => f + 1);
          }
          
          // Keep requesting frames if paused OR race not finished, so UI stays responsive and resume works
          if (isPaused || engine.horses.some(h => h.finishTime === null)) {
              requestRef.current = requestAnimationFrame(loop);
          } else {
              setFrame(f => f + 1); // Final frame
          }
      };

      requestRef.current = requestAnimationFrame(loop);

      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [isStarted, engine, isPaused]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [engine?.logs.length, frame]);

  if (!engine) return <div>Loading...</div>;

  const sortedHorses = [...engine.horses].sort((a, b) => b.distanceRun - a.distanceRun);
  const leadingHorse = sortedHorses[0];
  const finishedHorses = engine.horses.filter(h => h.finishTime !== null).sort((a, b) => (a.finishOrder || 99) - (b.finishOrder || 99));

  // Determine Camera View
  const focusedHorse = engine.horses.find(h => h.config.id === focusedId) || engine.horses[0];
  const cameraCenter = focusedHorse.distanceRun;
  // View window: Center - 25m to Center + 25m. 
  const viewStart = cameraCenter - (VIEW_WINDOW / 2);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden relative">
      {/* Pre-Race Overlay */}
      {!isStarted && (
          <PreRaceInfo 
            engine={engine} 
            focusedId={focusedId} 
            setFocusedId={setFocusedId} 
            onStart={() => setIsStarted(true)} 
          />
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 shadow flex justify-between items-center z-10 shrink-0">
        <div>
           <h2 className="text-xl font-bold text-yellow-400">{engine.race.name}</h2>
           <span className="text-xs text-gray-400">
             {engine.race.surface === SurfaceType.Turf ? "草地" : "泥地"} {engine.race.distance}m · 
             状况: {["良好","略差","差","极差"][engine.condition]}
           </span>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-300 border border-blue-500/50 rounded px-2 py-1">
                关注: <span className="font-bold">{focusedHorse.config.name}</span>
            </div>
            {/* Pause Button */}
            <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`px-4 py-1 rounded font-bold transition ${isPaused ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                {isPaused ? '继续' : '暂停'}
            </button>
            <div className="text-3xl font-mono text-white">
                {engine.time < 0 ? "0.00" : engine.time.toFixed(2)}<span className="text-sm">s</span>
            </div>
        </div>
      </div>

      {/* Track Visualization */}
      <div className="flex-1 relative bg-green-800 overflow-hidden shadow-inner flex flex-col justify-center">
        {/* Render Track with Dynamic Window */}
        <Track 
            horses={engine.horses} 
            viewStart={viewStart} 
            raceDist={engine.race.distance} 
        />
        
        {/* Camera Overlay/Crosshair (Optional) */}
        <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-white/20 pointer-events-none"></div>
      </div>

      {/* Bottom Panel */}
      <div className="h-[35%] bg-gray-900 border-t border-gray-700 flex shrink-0">
         {/* Live Standings */}
         <div className="w-1/3 p-4 overflow-y-auto border-r border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">实时顺位 (点击切换关注)</h3>
            <div className="space-y-1">
                {sortedHorses.map((h, i) => (
                    <div 
                        key={h.config.id} 
                        onClick={() => setFocusedId(h.config.id)}
                        className={`flex items-center justify-between text-xs p-1 rounded px-2 cursor-pointer transition-colors ${
                            focusedId === h.config.id 
                                ? 'bg-blue-900 border border-blue-500' 
                                : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center space-x-2 w-24 truncate">
                            <span className={`font-mono font-bold w-4 ${i<3 ? 'text-yellow-400':'text-gray-500'}`}>{i+1}</span>
                            <span className={h.finishTime ? 'text-yellow-200':''}>{h.config.name}</span>
                        </div>
                        <div className="flex-1 mx-2">
                            <div className="flex space-x-1 text-[10px] text-gray-500">
                                <span>{(h.currentSpeed.base).toFixed(1)}m/s</span>
                                {h.isPanic && <span className="text-red-500 animate-pulse">焦躁</span>}
                                {h.stamina <= 0 && <span className="text-gray-600">力尽</span>}
                            </div>
                        </div>
                        <div className="text-right w-12 text-gray-400">
                            {i === 0 ? 'Lead' : `${(leadingHorse.distanceRun - h.distanceRun).toFixed(1)}m`}
                        </div>
                    </div>
                ))}
            </div>
         </div>

         {/* Commentary Log */}
         <div className="w-1/3 p-4 overflow-y-auto relative scrollbar-hide flex flex-col">
             <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-gray-900 pb-2 z-10 shrink-0">实况解说</h3>
             <div className="space-y-2 font-mono text-sm flex-1">
                 {engine.logs.map((log, i) => (
                     <div key={i} className={`
                        ${log.type === 'critical' ? 'text-red-400 font-bold' : ''}
                        ${log.type === 'finish' ? 'text-yellow-400 font-bold' : 'text-gray-300'}
                     `}>
                         <span className="text-gray-600 text-xs mr-2">[{log.time.toFixed(1)}]</span>
                         {log.message}
                     </div>
                 ))}
                 <div ref={logsEndRef} />
             </div>
         </div>

         {/* Result/Controls */}
         <div className="w-1/3 p-4 flex flex-col justify-between bg-gray-800">
             {finishedHorses.length === engine.horses.length ? (
                 <div className="h-full flex flex-col">
                     <h3 className="text-center text-yellow-400 font-bold text-xl mb-4">比赛结果</h3>
                     <div className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide">
                        {finishedHorses.map((h, i) => (
                            <div key={h.config.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-1">
                                <span className="font-bold w-8">{i+1}着</span>
                                <span className="flex-1 text-center">{h.config.name}</span>
                                <span className="text-gray-400 text-xs">
                                    {h.finishTime?.toFixed(2)}s
                                    {i > 0 && finishedHorses[i-1].finishTime && 
                                      ` (+${formatDiff( (h.distanceRun - (finishedHorses[i-1].distanceRun - finishedHorses[i-1].currentSpeed.base * (h.finishTime! - finishedHorses[i-1].finishTime!))) ) })` 
                                    } 
                                </span>
                            </div>
                        ))}
                     </div>
                     <button onClick={onReset} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition">
                         再来一场
                     </button>
                 </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <p className="text-xl animate-pulse">比赛进行中...</p>
                    <div className="mt-4 text-xs text-gray-500">
                        {finishedHorses.length} / {engine.horses.length} 已冲线
                    </div>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};