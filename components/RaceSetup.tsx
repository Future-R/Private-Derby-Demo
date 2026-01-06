import React, { useState } from 'react';
import { HORSES_DATA, RACES_DATA } from '../constants';
import { Motivation, RaceConfig, RunStyle, SurfaceType } from '../types';
import { shuffle } from '../utils';

interface Props {
  onStart: (selectedHorses: number[], raceId: number) => void;
}

export const RaceSetup: React.FC<Props> = ({ onStart }) => {
  const [horseCount, setHorseCount] = useState(12);
  const [selectedRaceIdx, setSelectedRaceIdx] = useState(0);

  const handleStart = () => {
    // Randomly select N horses based on aptitude logic (simplified to random for now as per "按适性抽取" requires logic available in engine, doing basic shuffle here)
    const allIds = HORSES_DATA.map(h => h.id);
    const shuffled = shuffle(allIds);
    const selected = shuffled.slice(0, Math.min(horseCount, allIds.length));
    onStart(selected, selectedRaceIdx);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">私密马赛 Private Derby</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">参赛马娘数量 (2-18)</label>
          <input 
            type="number" 
            min="2" 
            max="18" 
            value={horseCount}
            onChange={(e) => setHorseCount(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择比赛</label>
            <div className="h-64 overflow-y-auto border border-gray-200 rounded">
                {RACES_DATA.map((race, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setSelectedRaceIdx(idx)}
                        className={`p-3 cursor-pointer flex justify-between items-center border-b border-gray-100 transition-colors ${selectedRaceIdx === idx ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                    >
                        <div>
                            <div className="font-bold text-gray-800">{race.name}</div>
                            <div className="text-xs text-gray-500">
                                {race.surface === SurfaceType.Turf ? '草地' : '泥地'} · {race.distance}m · {race.attributes || '无加成'}
                            </div>
                        </div>
                        {selectedRaceIdx === idx && <span className="text-blue-500 font-bold">✓</span>}
                    </div>
                ))}
            </div>
        </div>

        <button 
            onClick={handleStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition transform active:scale-95"
        >
            开始比赛
        </button>
      </div>
    </div>
  );
};