import { RunStyle, DistanceType, SurfaceType, Condition, Motivation, RuntimeHorse, RaceConfig, Attribute, StatusEffect, LogEntry, RaceEvent } from '../types';
import { FRAME_TIME, STRATEGY_DATA, CONDITION_DATA, APTITUDE_MODIFIERS, MOTIVATION_DATA, DISTANCE_DIFF_DICT } from '../constants';

// --- Utility Functions ---

const random = (max: number) => Math.floor(Math.random() * max);

const getDistanceType = (dist: number): DistanceType => {
  if (dist < 1600) return DistanceType.Short;
  if (dist < 2000) return DistanceType.Mile;
  if (dist < 2500) return DistanceType.Medium;
  return DistanceType.Long;
};

const getBaseSpeed = (raceLength: number) => {
  const val = 20 - (raceLength - 2000) / 1000;
  return val > 1 ? val : 1;
};

// --- Attribute Management ---

const getFinalAttribute = (attr: Attribute): number => {
  let val = attr.base;
  const sorted = [...attr.modifiers].sort((a, b) => b.priority - a.priority);
  
  sorted.forEach(mod => {
    if (mod.isAdditive) val += mod.value;
    else val *= mod.value;
  });
  return val;
};

const tickAttributes = (horse: RuntimeHorse, dt: number) => {
  [horse.speedAttr, horse.staminaAttr, horse.powerAttr, horse.gutsAttr, horse.intAttr, horse.currentSpeed, horse.targetSpeed, horse.currentAccel].forEach(attr => {
    for (let i = attr.modifiers.length - 1; i >= 0; i--) {
      const mod = attr.modifiers[i];
      if (mod.duration !== -1) {
        mod.duration -= dt;
        if (mod.duration <= 0) {
          attr.modifiers.splice(i, 1);
        }
      }
    }
  });
};

const createAttribute = (base: number): Attribute => ({ base, modifiers: [] });

// --- Game Logic ---

type EventHandler = (data: any) => void;

export class RaceSimulation {
  horses: RuntimeHorse[] = [];
  race: RaceConfig;
  condition: Condition;
  time: number = 0;
  logs: LogEntry[] = [];
  finishedCount: number = 0;
  
  // Event System
  private events: Record<string, EventHandler[]> = {};
  // Commentary State
  private reportedPhases: Set<number> = new Set();
  private phasesToCheck = [2, 5, 17, 21];

  constructor(horses: RuntimeHorse[], race: RaceConfig, condition: Condition) {
    this.horses = horses;
    this.race = race;
    this.condition = condition;
    this.initializeRace();
  }

  on(event: RaceEvent, handler: EventHandler) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
  }

  emit(event: RaceEvent, data: any) {
    if (this.events[event]) {
      this.events[event].forEach(h => h(data));
    }
  }

  log(msg: string, type: 'info' | 'critical' | 'finish' = 'info') {
    this.logs.push({ time: this.time, message: msg, type });
  }

  initializeRace() {
    this.time = -FRAME_TIME; // Start slightly negative to handle start gate delay logic
    const baseSpeed = getBaseSpeed(this.race.distance);

    this.horses.forEach((h, idx) => {
      // 1. Calculate Initial Stats based on Motivation & Condition
      const mot = MOTIVATION_DATA[h.motivation];
      const cond = CONDITION_DATA[this.condition];
      
      const isTurf = this.race.surface === SurfaceType.Turf;
      const speedCond = isTurf ? cond.turfSpeed : cond.dirtSpeed;
      const powerCond = isTurf ? cond.turfPower : cond.dirtPower;

      // Apply modifiers to base
      h.speedAttr.base = h.config.speed * mot.stat + speedCond;
      h.powerAttr.base = h.config.power * mot.stat + powerCond;
      h.staminaAttr.base = h.config.stamina * mot.stat;
      h.gutsAttr.base = h.config.guts * mot.stat;
      
      // Int modified by Strategy Aptitude
      let styleIdx = 0;
      if (h.strategy === RunStyle.GreatEscape || h.strategy === RunStyle.Escape) styleIdx = 0;
      else if (h.strategy === RunStyle.Leader) styleIdx = 1;
      else if (h.strategy === RunStyle.Betweener) styleIdx = 2;
      else if (h.strategy === RunStyle.Chaser) styleIdx = 3;

      const styleRank = h.config.styleAptitudes[styleIdx];
      const styleIntMod = APTITUDE_MODIFIERS.rank[styleRank as keyof typeof APTITUDE_MODIFIERS.rank]?.int || 1.0;
      
      h.intAttr.base = h.config.int * mot.stat * styleIntMod;

      // 2. Max Stamina
      const styleConfig = STRATEGY_DATA[h.strategy] || STRATEGY_DATA[RunStyle.Chaser];
      const finalStamina = getFinalAttribute(h.staminaAttr);
      h.maxStamina = styleConfig.staminaCoef * finalStamina + this.race.distance;
      h.stamina = h.maxStamina;

      // 3. Start Gate Delay (Simplified)
      // Delay logic: (Random + Random) * 0.05
      const delay = (Math.random() + Math.random()) * 0.05;
      
      h.statusEffects.push({
        name: "出闸",
        duration: delay,
        onRemove: (me) => {
            // Emit Start Event for Commentary
            this.emit(RaceEvent.START, me);

            // Start Dash
            me.currentSpeed.base = 3; 
            me.currentAccel.modifiers.push({ tags: ['start_dash'], priority: 300, isAdditive: true, value: 24, duration: -1 }); 
            // Trigger Sprint Logic Effect
            me.statusEffects.push({
                name: "起跑冲刺",
                duration: -1, 
                onTick: (runner, dt) => {
                     const actualSpd = getFinalAttribute(runner.currentSpeed);
                     if (actualSpd > 0.85 * baseSpeed) {
                         const idx = runner.currentAccel.modifiers.findIndex(m => m.tags.includes('start_dash'));
                         if (idx > -1) runner.currentAccel.modifiers.splice(idx, 1);
                         const selfIdx = runner.statusEffects.findIndex(e => e.name === "起跑冲刺");
                         if (selfIdx > -1) runner.statusEffects.splice(selfIdx, 1);
                     }
                }
            });
        }
      });

      // 4. Panic Check Logic (Jiaozao)
      const intVal = getFinalAttribute(h.intAttr);
      const panicChance = Math.pow(6.5 / Math.log10(0.1 * intVal + 1), 2) / 100;
      
      if (Math.random() < panicChance) {
          // Select section 2-9
          const panicSection = Math.floor(Math.random() * 8) + 2;
          
          h.statusEffects.push({
              name: "PanicWait",
              duration: -1,
              onTick: (runner, dt) => {
                  if (runner.section >= panicSection) {
                       // Activate Panic
                       const idx = runner.statusEffects.findIndex(e => e.name === "PanicWait");
                       if (idx > -1) runner.statusEffects.splice(idx, 1);
                       this.activatePanic(runner);
                  }
              }
          });
      }
      
      h.lane = idx; 
      h.section = 0;
      h.hasStaminaDepleted = false;
    });
  }

  activatePanic(horse: RuntimeHorse) {
      let remainingTime = 12;
      horse.isPanic = true;
      const originalAwareness = horse.strategyAwareness;

      // Determine new awareness based on rules
      const r = Math.random();
      if (horse.strategy === RunStyle.Escape || horse.strategy === RunStyle.GreatEscape) {
          // Clears cooldown (simplified to no change in awareness but logic knows it's rushing)
          // In this engine, using Escape awareness already implies rushing logic.
      } else if (horse.strategy === RunStyle.Leader) {
          horse.strategyAwareness = RunStyle.Escape;
      } else if (horse.strategy === RunStyle.Betweener) {
          if (r > 0.25) horse.strategyAwareness = RunStyle.Escape;
          else horse.strategyAwareness = RunStyle.Leader;
      } else if (horse.strategy === RunStyle.Chaser) {
          if (r > 0.3) horse.strategyAwareness = RunStyle.Escape;
          else if (r > 0.1) horse.strategyAwareness = RunStyle.Leader;
          else horse.strategyAwareness = RunStyle.Betweener;
      }

      horse.statusEffects.push({
          name: "PanicActive",
          duration: -1, // Managed internally
          onTick: (h, dt) => {
              // Formula: ((Cos(pi * t / 12) + 1) / 2) * dt
              // Multiply by dt to treat it as probability per second (since tick is high frequency)
              // This prevents instant exit.
              const probDensity = (Math.cos(Math.PI * remainingTime / 12) + 1) / 2;
              const prob = probDensity * dt; 
              
              if (Math.random() <= prob || remainingTime <= 0) {
                  // Exit Panic
                  h.isPanic = false;
                  h.strategyAwareness = originalAwareness;
                  const idx = h.statusEffects.findIndex(e => e.name === "PanicActive");
                  if (idx > -1) h.statusEffects.splice(idx, 1);
                  return;
              }

              remainingTime -= dt;
          }
      });
  }

  tick() {
    this.time += FRAME_TIME;
    const isRaceFinished = this.horses.every(h => h.finishTime !== null);
    if (isRaceFinished) return;

    // Sort by distance for positioning logic (Rank)
    const rankedHorses = [...this.horses].sort((a, b) => b.distanceRun - a.distanceRun);
    const leadingHorse = rankedHorses[0];

    // Check Phase Change for Leading Horse
    const leadSection = leadingHorse.section;
    // Check if we hit a milestone section we haven't reported yet
    for (const phaseVal of this.phasesToCheck) {
        if (leadSection >= phaseVal && !this.reportedPhases.has(phaseVal)) {
            this.reportedPhases.add(phaseVal);
            this.emit(RaceEvent.PHASE_CHANGE, { horse: leadingHorse, phase: phaseVal });
        }
    }

    const baseSpeed = getBaseSpeed(this.race.distance);
    const sectionLength = this.race.distance / 24;
    const finishersThisTick: RuntimeHorse[] = [];

    this.horses.forEach(h => {
      if (h.finishTime !== null) return;

      // Handle Status Effects
      for (let i = h.statusEffects.length - 1; i >= 0; i--) {
        const effect = h.statusEffects[i];
        if (effect.onTick) effect.onTick(h, FRAME_TIME);
        
        if (effect.duration !== -1) {
          effect.duration -= FRAME_TIME;
          if (effect.duration <= 0) {
            if (effect.onRemove) effect.onRemove(h);
            h.statusEffects.splice(i, 1);
          }
        }
      }

      const gate = h.statusEffects.find(e => e.name === "出闸");
      if (gate) return; 

      // --- Main Physics ---
      
      const section = Math.ceil(h.distanceRun / sectionLength);
      h.section = section;
      let phase = 0; // 0=Opening(0-4), 1=Mid(5-16), 2=End(17-20), 3=Spurt(21-24)
      if (section >= 5 && section <= 16) phase = 1;
      else if (section >= 17 && section <= 20) phase = 2;
      else if (section >= 21) phase = 3;

      h.isSpurt = phase === 3;

      // 2. Target Speed - USE strategyAwareness (for Panic logic)
      const styleData = STRATEGY_DATA[h.strategyAwareness] || STRATEGY_DATA[h.strategy];
      let targetBase = 0;
      
      if (h.stamina <= 0) {
          const guts = getFinalAttribute(h.gutsAttr);
          targetBase = 0.85 * baseSpeed + Math.sqrt(200 * guts) * 0.001;
      } else {
          if (phase === 0) targetBase = baseSpeed * styleData.startTarget;
          else if (phase === 1) targetBase = baseSpeed * styleData.midTarget;
          else {
              const spdStats = getFinalAttribute(h.speedAttr);
              const distType = getDistanceType(this.race.distance);
              const distMod = APTITUDE_MODIFIERS.rank[h.config.distanceAptitudes[distType] as keyof typeof APTITUDE_MODIFIERS.rank]?.speed || 1.0;
              targetBase = baseSpeed * styleData.endTarget + Math.sqrt(500 * spdStats) * distMod * 0.002;
          }
      }
      
      h.targetSpeed.base = targetBase > 30 ? 30 : targetBase;
      const finalTargetSpeed = getFinalAttribute(h.targetSpeed);
      const currentSpd = getFinalAttribute(h.currentSpeed);

      // 3. Acceleration
      let accelVal = 0;
      if (currentSpd <= finalTargetSpeed) {
          const power = getFinalAttribute(h.powerAttr);
          const distType = getDistanceType(this.race.distance);
          const distMod = APTITUDE_MODIFIERS.rank[h.config.distanceAptitudes[distType] as keyof typeof APTITUDE_MODIFIERS.rank]?.distAccel || 1.0;
          
          let surfaceMod = 1.0;
          if (this.race.surface === SurfaceType.Turf) {
             const rank = h.config.turfAptitude;
             surfaceMod = APTITUDE_MODIFIERS.rank[rank as keyof typeof APTITUDE_MODIFIERS.rank]?.turfAccel || 1.0;
          } else {
             surfaceMod = 1.0; 
          }

          let baseAccel = 0.0006 * Math.sqrt(500 * power) * distMod * surfaceMod;
          
          let phaseAccelMult = styleData.startAccel;
          if (phase === 1) phaseAccelMult = styleData.midAccel;
          else if (phase >= 2) phaseAccelMult = styleData.endAccel;

          accelVal = baseAccel * phaseAccelMult;
      } else {
          if (h.stamina > 0) {
              if (phase === 0) accelVal = -1.2;
              else if (phase === 1) accelVal = -0.8;
              else accelVal = -1.0;
          } else {
              accelVal = -1.2;
          }
      }

      h.currentAccel.base = accelVal;
      
      const finalAccel = getFinalAttribute(h.currentAccel);
      h.currentSpeed.base += finalAccel * FRAME_TIME;
      
      const guts = getFinalAttribute(h.gutsAttr);
      const minSpeed = 0.85 * baseSpeed + Math.sqrt(200 * guts) * 0.001;
      if (h.currentSpeed.base < minSpeed) h.currentSpeed.base = minSpeed;

      // 4. Update Position
      const moveDist = getFinalAttribute(h.currentSpeed) * FRAME_TIME;
      h.distanceRun += moveDist;

      // 5. Stamina
      let gutsCoef = 1.0;
      if (phase > 1) {
          gutsCoef += 200 / Math.sqrt(600 * getFinalAttribute(h.gutsAttr));
      }
      
      const condData = CONDITION_DATA[this.condition];
      const surfStaminaMult = this.race.surface === SurfaceType.Turf ? condData.turfStamina : condData.dirtStamina;
      
      const panicMult = h.isPanic ? 1.6 : 1.0;

      const consume = 20 * Math.pow(getFinalAttribute(h.currentSpeed) - baseSpeed + 12, 2) * gutsCoef * panicMult * surfStaminaMult / 144 * FRAME_TIME;
      
      if (h.stamina > 0 && consume > h.stamina) {
          // Trigger Stamina Event
          if (!h.hasStaminaDepleted) {
              h.hasStaminaDepleted = true;
              // Determine rank for context? The listener will check rank.
              this.emit(RaceEvent.STAMINA_DEPLETED, h);
          }
      }
      h.stamina = Math.max(0, h.stamina - consume);

      tickAttributes(h, FRAME_TIME);

      // Finish Check
      if (h.distanceRun >= this.race.distance && h.finishTime === null) {
          const over = h.distanceRun - this.race.distance;
          const finalSpd = getFinalAttribute(h.currentSpeed);
          const timeOver = over / finalSpd;
          h.finishTime = this.time - timeOver;
          this.finishedCount++;
          h.finishOrder = this.finishedCount;
          
          finishersThisTick.push(h);
      }
    });
    
    if (finishersThisTick.length > 0) {
        this.emit(RaceEvent.FINISH, finishersThisTick);
    }
  }
}