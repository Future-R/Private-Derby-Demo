import { HorseConfig, RaceConfig, SurfaceType, RunStyle, Motivation, Condition } from './types';

// 杂项表
export const FRAME_TIME = 0.05;
export const BASE_STAT_CAP = 300;
export const TRACK_STAT_MULTIPLIER = 0.05;

// 马的基础属性
// Helper to parse rank letters to numbers (S=7, A=6, B=5, C=4, D=3, E=2, F=1, G=0)
const R = (rank: string): number => {
  const map: Record<string, number> = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1, 'G': 0 };
  return map[rank.trim()] ?? 0;
};

export const HORSES_DATA: HorseConfig[] = [
  { id: 1, name: "东海帝皇", speed: 540, stamina: 534, power: 498, guts: 552, int: 576, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('F'), R('E'), R('A'), R('B')], styleAptitudes: [R('D'), R('A'), R('C'), R('E')] },
  { id: 2, name: "名将怒涛", speed: 558, stamina: 570, power: 510, guts: 576, int: 486, turfAptitude: R('A'), dirtAptitude: R('E'), distanceAptitudes: [R('G'), R('F'), R('A'), R('A')], styleAptitudes: [R('F'), R('A'), R('B'), R('E')] },
  { id: 3, name: "优秀素质", speed: 616, stamina: 532, power: 634, guts: 614, int: 604, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('G'), R('C'), R('A'), R('A')], styleAptitudes: [R('F'), R('B'), R('A'), R('D')] },
  { id: 4, name: "米浴", speed: 426, stamina: 702, power: 420, guts: 612, int: 540, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('E'), R('C'), R('A'), R('A')], styleAptitudes: [R('B'), R('A'), R('C'), R('G')] },
  { id: 5, name: "醒目飞鹰", speed: 564, stamina: 510, power: 510, guts: 600, int: 516, turfAptitude: R('E'), dirtAptitude: R('A'), distanceAptitudes: [R('B'), R('A'), R('A'), R('E')], styleAptitudes: [R('A'), R('D'), R('G'), R('G')] },
  { id: 6, name: "小栗帽", speed: 672, stamina: 444, power: 708, guts: 564, int: 612, turfAptitude: R('A'), dirtAptitude: R('B'), distanceAptitudes: [R('E'), R('A'), R('A'), R('B')], styleAptitudes: [R('F'), R('A'), R('A'), R('D')] },
  { id: 7, name: "目白麦昆", speed: 426, stamina: 666, power: 426, guts: 618, int: 564, turfAptitude: R('A'), dirtAptitude: R('E'), distanceAptitudes: [R('G'), R('F'), R('A'), R('A')], styleAptitudes: [R('B'), R('A'), R('D'), R('F')] },
  { id: 8, name: "玛雅重炮", speed: 438, stamina: 600, power: 402, guts: 570, int: 540, turfAptitude: R('A'), dirtAptitude: R('E'), distanceAptitudes: [R('D'), R('D'), R('A'), R('A')], styleAptitudes: [R('A'), R('A'), R('B'), R('B')] },
  { id: 9, name: "美浦波旁", speed: 576, stamina: 432, power: 552, guts: 612, int: 528, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('C'), R('B'), R('A'), R('B')], styleAptitudes: [R('A'), R('E'), R('G'), R('G')] },
  { id: 10, name: "鲁道夫象征", speed: 576, stamina: 606, power: 552, guts: 642, int: 624, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('E'), R('C'), R('A'), R('A')], styleAptitudes: [R('B'), R('A'), R('A'), R('C')] },
  { id: 11, name: "爱丽速子", speed: 492, stamina: 456, power: 456, guts: 474, int: 522, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('G'), R('D'), R('A'), R('B')], styleAptitudes: [R('E'), R('A'), R('B'), R('F')] },
  { id: 12, name: "爱丽数码", speed: 510, stamina: 546, power: 498, guts: 600, int: 546, turfAptitude: R('A'), dirtAptitude: R('A'), distanceAptitudes: [R('F'), R('A'), R('A'), R('G')], styleAptitudes: [R('G'), R('A'), R('A'), R('B')] },
  { id: 13, name: "好歌剧", speed: 498, stamina: 720, power: 498, guts: 678, int: 606, turfAptitude: R('A'), dirtAptitude: R('E'), distanceAptitudes: [R('G'), R('E'), R('A'), R('A')], styleAptitudes: [R('C'), R('A'), R('A'), R('G')] },
  { id: 14, name: "真机伶", speed: 582, stamina: 348, power: 642, guts: 546, int: 582, turfAptitude: R('A'), dirtAptitude: R('F'), distanceAptitudes: [R('A'), R('D'), R('G'), R('G')], styleAptitudes: [R('B'), R('A'), R('E'), R('G')] },
  { id: 15, name: "黄金船", speed: 492, stamina: 576, power: 600, guts: 462, int: 420, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('G'), R('C'), R('A'), R('A')], styleAptitudes: [R('G'), R('B'), R('B'), R('A')] },
  { id: 16, name: "春乌拉拉", speed: 498, stamina: 348, power: 534, guts: 516, int: 504, turfAptitude: R('G'), dirtAptitude: R('A'), distanceAptitudes: [R('A'), R('B'), R('G'), R('G')], styleAptitudes: [R('G'), R('G'), R('A'), R('B')] },
  { id: 17, name: "金枪六十", speed: 708, stamina: 456, power: 654, guts: 606, int: 576, turfAptitude: R('A'), dirtAptitude: R('D'), distanceAptitudes: [R('B'), R('S'), R('A'), R('E')], styleAptitudes: [R('F'), R('C'), R('A'), R('S')] },
  { id: 18, name: "无敌", speed: 504, stamina: 782, power: 522, guts: 694, int: 498, turfAptitude: R('A'), dirtAptitude: R('A'), distanceAptitudes: [R('D'), R('C'), R('A'), R('S')], styleAptitudes: [R('C'), R('A'), R('B'), R('C')] },
  { id: 19, name: "丰收时刻", speed: 864, stamina: 510, power: 510, guts: 600, int: 516, turfAptitude: R('A'), dirtAptitude: R('G'), distanceAptitudes: [R('D'), R('C'), R('B'), R('A')], styleAptitudes: [R('A'), R('F'), R('G'), R('G')] },
  { id: 20, name: "北方风味", speed: 426, stamina: 620, power: 426, guts: 602, int: 626, turfAptitude: R('A'), dirtAptitude: R('B'), distanceAptitudes: [R('G'), R('C'), R('A'), R('A')], styleAptitudes: [R('C'), R('A'), R('C'), R('F')] },
  { id: 21, name: "快乐米可", speed: 600, stamina: 576, power: 492, guts: 462, int: 420, turfAptitude: R('A'), dirtAptitude: R('A'), distanceAptitudes: [R('A'), R('A'), R('A'), R('A')], styleAptitudes: [R('A'), R('A'), R('A'), R('A')] },
];

// 比赛表
export const RACES_DATA: RaceConfig[] = [
  { name: "日本杯", surface: SurfaceType.Turf, distance: 2400, attributes: "" },
  { name: "有马纪念", surface: SurfaceType.Turf, distance: 2500, attributes: "意志;耐力" },
  { name: "天皇赏春", surface: SurfaceType.Turf, distance: 3200, attributes: "" },
  { name: "天皇赏秋", surface: SurfaceType.Turf, distance: 2000, attributes: "" },
  { name: "宝塚纪念", surface: SurfaceType.Turf, distance: 2200, attributes: "速度" },
  { name: "皋月赏", surface: SurfaceType.Turf, distance: 2000, attributes: "速度" },
  { name: "日本德比", surface: SurfaceType.Turf, distance: 2400, attributes: "" },
  { name: "菊花赏", surface: SurfaceType.Turf, distance: 3000, attributes: "力量;智力" },
  { name: "樱花赏", surface: SurfaceType.Turf, distance: 1600, attributes: "力量" },
  { name: "奥克斯", surface: SurfaceType.Turf, distance: 2000, attributes: "" },
  { name: "秋华赏", surface: SurfaceType.Turf, distance: 2400, attributes: "力量" },
  { name: "二月锦标赛", surface: SurfaceType.Dirt, distance: 1600, attributes: "" },
  { name: "日本冠军杯", surface: SurfaceType.Dirt, distance: 1800, attributes: "" },
  { name: "帝王赏", surface: SurfaceType.Dirt, distance: 2000, attributes: "耐力" },
  { name: "高松宫纪念", surface: SurfaceType.Turf, distance: 1200, attributes: "" },
  { name: "短途马锦标", surface: SurfaceType.Turf, distance: 1200, attributes: "" },
  { name: "香港杯", surface: SurfaceType.Turf, distance: 2000, attributes: "" },
  { name: "蒙古德比", surface: SurfaceType.Turf, distance: 1000000, attributes: "意志" },
  { name: "中国杯", surface: SurfaceType.Dirt, distance: 1949, attributes: "" },
  { name: "凯旋门大赛", surface: SurfaceType.Turf, distance: 2400, attributes: "力量" },
];

// 跑法配置
export const STRATEGY_DATA = {
  [RunStyle.GreatEscape]: { initialLaneSpeed: 0.03, startTarget: 1.063, midTarget: 0.962, endTarget: 0.95, startAccel: 1.17, midAccel: 0.94, endAccel: 0.956, staminaCoef: 0.86, posMin: 0, posMax: 0 },
  [RunStyle.Escape]: { initialLaneSpeed: 0.02, startTarget: 1.003, midTarget: 0.98, endTarget: 0.962, startAccel: 1.07, midAccel: 1.0, endAccel: 0.996, staminaCoef: 0.95, posMin: 0, posMax: 0 },
  [RunStyle.Leader]: { initialLaneSpeed: 0.01, startTarget: 0.978, midTarget: 0.991, endTarget: 0.975, startAccel: 0.985, midAccel: 1.0, endAccel: 0.996, staminaCoef: 0.89, posMin: 2.5, posMax: 5 },
  [RunStyle.Betweener]: { initialLaneSpeed: 0.01, startTarget: 0.938, midTarget: 0.998, endTarget: 0.994, startAccel: 0.975, midAccel: 1.0, endAccel: 1.0, staminaCoef: 1.0, posMin: 6.5, posMax: 7 },
  [RunStyle.Chaser]: { initialLaneSpeed: 0.03, startTarget: 0.931, midTarget: 1.0, endTarget: 1.0, startAccel: 0.945, midAccel: 1.0, endAccel: 0.997, staminaCoef: 0.995, posMin: 7.5, posMax: 8 },
};

// 适应性修正
export const APTITUDE_MODIFIERS = {
  rank: {
    0: { int: 0.1, speed: 0.1, turfAccel: 0.1, distAccel: 0.4 }, // G
    1: { int: 0.2, speed: 0.2, turfAccel: 0.3, distAccel: 0.5 }, // F
    2: { int: 0.4, speed: 0.4, turfAccel: 0.5, distAccel: 0.6 }, // E
    3: { int: 0.6, speed: 0.6, turfAccel: 0.7, distAccel: 1.0 }, // D
    4: { int: 0.75, speed: 0.8, turfAccel: 0.8, distAccel: 1.0 }, // C
    5: { int: 0.85, speed: 0.9, turfAccel: 0.9, distAccel: 1.0 }, // B
    6: { int: 1.0, speed: 1.0, turfAccel: 1.0, distAccel: 1.0 }, // A
    7: { int: 1.1, speed: 1.05, turfAccel: 1.05, distAccel: 1.0 }, // S
  }
};

// 干劲
export const MOTIVATION_DATA = {
  [Motivation.Excellent]: { name: "绝佳", train: 1.2, stat: 1.2 }, // 0.2 in C# text actually means +0.2 so 1.2 factor? Actually table says "绝佳 1.2"
  [Motivation.Good]: { name: "良好", train: 1.1, stat: 1.1 },
  [Motivation.Normal]: { name: "普通", train: 1.0, stat: 1.0 },
  [Motivation.Bad]: { name: "不佳", train: 0.9, stat: 0.9 },
  [Motivation.Terrible]: { name: "极差", train: 0.8, stat: 0.8 },
};

// 场地状况
export const CONDITION_DATA = {
  [Condition.Good]: { name: "良好", turfSpeed: 0, dirtSpeed: 0, turfPower: 0, dirtPower: -100, turfStamina: 1, dirtStamina: 1 },
  [Condition.SlightlyHeavy]: { name: "略差", turfSpeed: 0, dirtSpeed: 0, turfPower: -50, dirtPower: -50, turfStamina: 1, dirtStamina: 1 },
  [Condition.Heavy]: { name: "差", turfSpeed: 0, dirtSpeed: 0, turfPower: -50, dirtPower: -100, turfStamina: 1.2, dirtStamina: 1.1 },
  [Condition.Bad]: { name: "极差", turfSpeed: -50, dirtSpeed: -50, turfPower: -50, dirtPower: -100, turfStamina: 1.2, dirtStamina: 1.2 },
};

export const DISTANCE_DIFF_DICT = [
    { diff: 25, text: "大差" },
    { diff: 2.5, text: "马身" }, // Special handling for > 2.5
    { diff: 2.5, text: "1马身" },
    { diff: 1.875, text: "3/4马身" },
    { diff: 1.25, text: "1/2马身" },
    { diff: 0.8, text: "颈差" },
    { diff: 0.6, text: "短颈差" },
    { diff: 0.4, text: "头差" },
    { diff: 0.3, text: "短头差" },
    { diff: 0.2, text: "鼻差" }
];