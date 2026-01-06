import React, { useState } from 'react';
import { RaceSetup } from './components/RaceSetup';
import { RaceView } from './components/RaceView';

function App() {
  const [gameState, setGameState] = useState<'setup' | 'race'>('setup');
  const [selectedHorses, setSelectedHorses] = useState<number[]>([]);
  const [selectedRace, setSelectedRace] = useState<number>(0);

  const startRace = (horses: number[], raceId: number) => {
    setSelectedHorses(horses);
    setSelectedRace(raceId);
    setGameState('race');
  };

  const resetGame = () => {
    setGameState('setup');
    setSelectedHorses([]);
  };

  return (
    <div className="font-sans">
      {gameState === 'setup' ? (
        <RaceSetup onStart={startRace} />
      ) : (
        <RaceView 
          horseIds={selectedHorses} 
          raceId={selectedRace} 
          onReset={resetGame} 
        />
      )}
    </div>
  );
}

export default App;