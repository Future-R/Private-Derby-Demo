export enum RunStyle {
  Unknown = -1,
  GreatEscape = 0, // 爆领/大逃
  Escape = 1, // 领头/逃
  Leader = 2, // 前列/先
  Betweener = 3, // 居中/差
  Chaser = 4 // 后追/追
}

export enum DistanceType {
  Unknown = -1,
  Short = 0, // < 1600
  Mile = 1,  // < 2000
  Medium = 2, // < 2500
  Long = 3   // >= 2500
}

export enum SurfaceType {
  Turf,
  Dirt
}

export enum Condition {
  Good = 0, // 良好
  SlightlyHeavy = 1, // 略差
  Heavy = 2, // 差
  Bad = 3 // 极差
}

export enum Motivation {
  Excellent = 0, // 绝佳
  Good = 1, // 良好
  Normal = 2, // 普通
  Bad = 3, // 不佳
  Terrible = 4 // 极差
}

export interface AttributeModifier {
  tags: string[];
  priority: number;
  isAdditive: boolean;
  value: number;
  duration: number; // -1 for infinite
}

export interface Attribute {
  base: number;
  modifiers: AttributeModifier[];
}

export interface HorseConfig {
  id: number;
  name: string;
  speed: number;
  stamina: number;
  power: number;
  guts: number; // 意志
  int: number; // 智力
  turfAptitude: number; // S=7, A=6 ... G=0
  dirtAptitude: number;
  distanceAptitudes: number[]; // [Short, Mile, Medium, Long]
  styleAptitudes: number[]; // [Escape, Leader, Betweener, Chaser] (Index 0 is GreatEscape/Escape shared usually, logic handles this)
}

export interface RaceConfig {
  name: string;
  surface: SurfaceType;
  distance: number;
  attributes?: string; // e.g. "意志;耐力"
}

export interface RuntimeHorse {
  config: HorseConfig;
  currentSpeed: Attribute;
  targetSpeed: Attribute;
  currentAccel: Attribute;
  stamina: number;
  maxStamina: number;
  
  // Real-time stats
  distanceRun: number;
  lane: number; // Visual only, simple lane logic
  section: number; // Current section (0-24)
  
  // Logic states
  strategy: RunStyle;
  strategyAwareness: RunStyle; // "Consciousness"
  motivation: Motivation;
  
  // Effective Attributes (Calculated after modifiers)
  speedAttr: Attribute;
  staminaAttr: Attribute;
  powerAttr: Attribute;
  gutsAttr: Attribute;
  intAttr: Attribute;
  
  // Status Effects (Simplified "YiNeng")
  statusEffects: StatusEffect[];
  
  // Finish stats
  finishTime: number | null;
  finishOrder: number | null;
  finishDiff: string; // "1马身" etc.
  
  // Events flags for UI
  isBlocked: boolean;
  isPanic: boolean; // 焦躁
  isSpurt: boolean;
  hasStaminaDepleted: boolean; // For commentary
}

export interface StatusEffect {
  name: string;
  duration: number;
  onTick?: (horse: RuntimeHorse, dt: number) => void;
  onRemove?: (horse: RuntimeHorse) => void;
}

export interface GameState {
  time: number;
  horses: RuntimeHorse[];
  race: RaceConfig;
  condition: Condition;
  logs: LogEntry[];
  isFinished: boolean;
  isPaused: boolean;
}

export interface LogEntry {
  time: number;
  message: string;
  type: 'info' | 'critical' | 'finish';
}

export enum RaceEvent {
  START = 'START',
  PHASE_CHANGE = 'PHASE_CHANGE',
  STAMINA_DEPLETED = 'STAMINA_DEPLETED',
  FINISH = 'FINISH'
}