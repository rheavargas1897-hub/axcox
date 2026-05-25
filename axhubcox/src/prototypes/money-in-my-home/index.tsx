/**
 * @name MONEYINMYHOME - 双色球智能选号工具
 *
 * 参考资料：
 * - 双色球选号算法规则文档
 * - 中彩网双色球近期开奖数据
 */

import './style.css';
import React, { useState, useCallback, useEffect } from 'react';

// ====== Types ======

interface DrawResult {
  issueId: string;
  redBalls: number[];
  blueBall: number;
  drawDate: string;
}

interface GeneratedResult {
  redBalls: number[];
  blueBall: number;
}

// ====== Constants ======

const CONSTELLATIONS: Record<string, { name: string; range: string; luckyNums: number[] }> = {
  aries: { name: '白羊座', range: '3/21-4/19', luckyNums: [6, 7, 9] },
  taurus: { name: '金牛座', range: '4/20-5/20', luckyNums: [1, 5, 9] },
  gemini: { name: '双子座', range: '5/21-6/21', luckyNums: [3, 5, 7] },
  cancer: { name: '巨蟹座', range: '6/22-7/22', luckyNums: [2, 8, 11] },
  leo: { name: '狮子座', range: '7/23-8/22', luckyNums: [1, 5, 10] },
  virgo: { name: '处女座', range: '8/23-9/22', luckyNums: [4, 5, 8] },
  libra: { name: '天秤座', range: '9/23-10/23', luckyNums: [6, 9, 15] },
  scorpio: { name: '天蝎座', range: '10/24-11/22', luckyNums: [3, 5, 9] },
  sagittarius: { name: '射手座', range: '11/23-12/21', luckyNums: [3, 7, 9] },
  capricorn: { name: '摩羯座', range: '12/22-1/19', luckyNums: [3, 7, 8] },
  aquarius: { name: '水瓶座', range: '1/20-2/18', luckyNums: [4, 8, 13] },
  pisces: { name: '双鱼座', range: '2/19-3/20', luckyNums: [5, 7, 11] },
};

const ZODIACS: Record<string, { name: string; luckyNums: number[] }> = {
  rat: { name: '鼠', luckyNums: [2, 3, 6, 8] },
  ox: { name: '牛', luckyNums: [1, 4, 9, 13] },
  tiger: { name: '虎', luckyNums: [1, 3, 4, 7] },
  rabbit: { name: '兔', luckyNums: [3, 4, 6, 9] },
  dragon: { name: '龙', luckyNums: [1, 6, 7, 12] },
  snake: { name: '蛇', luckyNums: [2, 8, 9, 11] },
  horse: { name: '马', luckyNums: [2, 3, 7, 8] },
  goat: { name: '羊', luckyNums: [3, 4, 9, 12] },
  monkey: { name: '猴', luckyNums: [4, 9, 14, 16] },
  rooster: { name: '鸡', luckyNums: [5, 7, 8, 15] },
  dog: { name: '狗', luckyNums: [3, 4, 9, 10] },
  pig: { name: '猪', luckyNums: [2, 5, 8, 11] },
};

// Real data from 中彩网 (截至2026年5月24日第2026058期)
const REAL_DRAWS: DrawResult[] = [
  { issueId: '2026058', redBalls: [1, 4, 7, 21, 29, 30], blueBall: 1, drawDate: '2026-05-24' },
  { issueId: '2026057', redBalls: [1, 10, 22, 24, 28, 30], blueBall: 7, drawDate: '2026-05-21' },
  { issueId: '2026056', redBalls: [10, 19, 21, 22, 31, 33], blueBall: 5, drawDate: '2026-05-19' },
  { issueId: '2026055', redBalls: [4, 11, 24, 25, 32, 33], blueBall: 13, drawDate: '2026-05-17' },
  { issueId: '2026054', redBalls: [13, 20, 25, 29, 30, 33], blueBall: 2, drawDate: '2026-05-14' },
  { issueId: '2026053', redBalls: [1, 2, 3, 8, 13, 14], blueBall: 2, drawDate: '2026-05-12' },
  { issueId: '2026052', redBalls: [1, 3, 11, 22, 26, 31], blueBall: 11, drawDate: '2026-05-10' },
  { issueId: '2026051', redBalls: [9, 14, 15, 16, 29, 30], blueBall: 10, drawDate: '2026-05-07' },
  { issueId: '2026050', redBalls: [6, 9, 25, 27, 28, 30], blueBall: 3, drawDate: '2026-05-05' },
  { issueId: '2026049', redBalls: [3, 4, 14, 15, 18, 20], blueBall: 2, drawDate: '2026-05-03' },
  { issueId: '2026048', redBalls: [9, 15, 18, 24, 28, 33], blueBall: 1, drawDate: '2026-04-30' },
  { issueId: '2026047', redBalls: [7, 16, 21, 24, 27, 30], blueBall: 7, drawDate: '2026-04-28' },
  { issueId: '2026046', redBalls: [2, 9, 10, 24, 31, 33], blueBall: 16, drawDate: '2026-04-26' },
  { issueId: '2026045', redBalls: [4, 11, 15, 17, 24, 30], blueBall: 15, drawDate: '2026-04-23' },
  { issueId: '2026044', redBalls: [2, 14, 17, 18, 22, 30], blueBall: 1, drawDate: '2026-04-21' },
  { issueId: '2026043', redBalls: [6, 9, 14, 16, 25, 32], blueBall: 16, drawDate: '2026-04-19' },
  { issueId: '2026042', redBalls: [2, 7, 12, 19, 24, 31], blueBall: 10, drawDate: '2026-04-16' },
  { issueId: '2026041', redBalls: [2, 8, 10, 17, 19, 24], blueBall: 13, drawDate: '2026-04-14' },
  { issueId: '2026040', redBalls: [3, 4, 14, 22, 23, 33], blueBall: 4, drawDate: '2026-04-12' },
  { issueId: '2026039', redBalls: [8, 17, 18, 21, 25, 30], blueBall: 5, drawDate: '2026-04-09' },
];

const BET_COUNTS = [1, 2, 3, 5];

// Algorithm configuration
const ODD_EVEN_OPTIONS = [
  { odd: 3, even: 3, weight: 50 },
  { odd: 4, even: 2, weight: 25 },
  { odd: 2, even: 4, weight: 25 },
];

const BIG_SMALL_OPTIONS = [
  { small: 3, big: 3, weight: 50 },
  { small: 4, big: 2, weight: 25 },
  { small: 2, big: 4, weight: 25 },
];

const SUM_RANGE: [number, number] = [90, 130];
const MAX_RETRIES = 50;
const MAX_BET_RETRIES = 100;

// ====== Utility Functions ======

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr: number[], count: number): number[] {
  if (arr.length < count) return [];
  return shuffle(arr).slice(0, count).sort((a, b) => a - b);
}

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, item) => s + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ====== Algorithm Functions ======

function countConsecutivePairs(nums: number[]): number {
  let pairs = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] - nums[i] === 1) pairs++;
  }
  return pairs;
}

function hasThreeConsecutive(nums: number[]): boolean {
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i + 1] - nums[i] === 1 && nums[i + 2] - nums[i + 1] === 1) return true;
  }
  return false;
}

function countOddEven(nums: number[]): { odd: number; even: number } {
  const odd = nums.filter((n) => n % 2 === 1).length;
  return { odd, even: nums.length - odd };
}

function countBigSmall(nums: number[]): { small: number; big: number } {
  const small = nums.filter((n) => n <= 16).length;
  return { small, big: nums.length - small };
}

function countZones(nums: number[]): { small: number; mid: number; large: number } {
  return {
    small: nums.filter((n) => n <= 11).length,
    mid: nums.filter((n) => n >= 12 && n <= 22).length,
    large: nums.filter((n) => n >= 23).length,
  };
}

function countTailDuplicates(nums: number[]): number {
  const tails = nums.map((n) => n % 10);
  const seen = new Set<number>();
  let dupes = 0;
  for (const t of tails) {
    if (seen.has(t)) dupes++;
    else seen.add(t);
  }
  return dupes;
}

function hasTripleTail(nums: number[]): boolean {
  const tails = nums.map((n) => n % 10);
  const counts: Record<number, number> = {};
  for (const t of tails) {
    counts[t] = (counts[t] || 0) + 1;
    if (counts[t] >= 3) return true;
  }
  return false;
}

function generateRedBalls(excludedNums: Set<number>, pinnedReds: number[]): number[] {
  const pinned = [...new Set(pinnedReds)].filter((n) => n >= 1 && n <= 33).sort((a, b) => a - b);
  if (pinned.length >= 6) return pinned.slice(0, 6);

  const remaining = 6 - pinned.length;

  const smallZone = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const midZone = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const largeZone = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];

  const availSmall = smallZone.filter((n) => !excludedNums.has(n) && !pinned.includes(n));
  const availMid = midZone.filter((n) => !excludedNums.has(n) && !pinned.includes(n));
  const availLarge = largeZone.filter((n) => !excludedNums.has(n) && !pinned.includes(n));

  const pinnedInSmall = pinned.filter((n) => n <= 11).length;
  const pinnedInMid = pinned.filter((n) => n >= 12 && n <= 22).length;
  const pinnedInLarge = pinned.filter((n) => n >= 23).length;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Step 1: determine ratio targets
    const oddEvenTarget = weightedRandom(ODD_EVEN_OPTIONS);
    const bigSmallTarget = weightedRandom(BIG_SMALL_OPTIONS);

    // Step 2: target 2 picks per zone, adjusted for pins
    let needSmall = Math.min(availSmall.length, Math.max(0, 2 - pinnedInSmall));
    let needMid = Math.min(availMid.length, Math.max(0, 2 - pinnedInMid));
    let needLarge = Math.min(availLarge.length, Math.max(0, 2 - pinnedInLarge));
    // Step 3: adjust distribution to sum to `remaining`
    const curTotal = needSmall + needMid + needLarge;
    if (curTotal < remaining) {
      const diff = remaining - curTotal;
      for (let d = 0; d < diff; d++) {
        const opts: ("s" | "m" | "l")[] = [];
        if (availSmall.length > needSmall) opts.push("s");
        if (availMid.length > needMid) opts.push("m");
        if (availLarge.length > needLarge) opts.push("l");
        if (opts.length === 0) break;
        const pick = opts[Math.floor(Math.random() * opts.length)];
        if (pick === "s") needSmall++;
        else if (pick === "m") needMid++;
        else needLarge++;
      }
    } else if (curTotal > remaining) {
      const diff = curTotal - remaining;
      for (let d = 0; d < diff; d++) {
        if (needLarge >= needMid && needLarge >= needSmall && needLarge > 0) needLarge--;
        else if (needMid >= needSmall && needMid > 0) needMid--;
        else if (needSmall > 0) needSmall--;
      }
    }
    // Step 4: pick numbers from each zone
    const smallPicks = needSmall > 0 ? pickRandom(availSmall, needSmall) : [];
    const midPicks = needMid > 0 ? pickRandom(availMid, needMid) : [];
    const largePicks = needLarge > 0 ? pickRandom(availLarge, needLarge) : [];

    if ((needSmall > 0 && smallPicks.length < needSmall) ||
        (needMid > 0 && midPicks.length < needMid) ||
        (needLarge > 0 && largePicks.length < needLarge)) continue;

    const result = [...pinned, ...smallPicks, ...midPicks, ...largePicks].sort((a, b) => a - b);
    if (result.length !== 6) continue;

    // Step 5: validate constraints
    const { odd, even } = countOddEven(result);
    if (odd !== oddEvenTarget.odd) continue;

    const { small, big } = countBigSmall(result);
    if (small !== bigSmallTarget.small) continue;

    const pairs = countConsecutivePairs(result);
    if (pairs > 1) continue;
    if (hasThreeConsecutive(result)) continue;

    // Sum range check
    const sum = result.reduce((s, n) => s + n, 0);
    if (sum < SUM_RANGE[0] || sum > SUM_RANGE[1]) continue;

    // Tail dispersal: max 1 repeated tail, no triple same tail
    if (countTailDuplicates(result) > 1) continue;
    if (hasTripleTail(result)) continue;

    return result;
  }

  // Fallback: relax sum/tail constraints, keep structural ones
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let needSmall = Math.min(availSmall.length, Math.max(0, 2 - pinnedInSmall));
    let needMid = Math.min(availMid.length, Math.max(0, 2 - pinnedInMid));
    let needLarge = Math.min(availLarge.length, Math.max(0, 2 - pinnedInLarge));

    const smallPicks = needSmall > 0 ? pickRandom(availSmall, needSmall) : [];
    const midPicks = needMid > 0 ? pickRandom(availMid, needMid) : [];
    const largePicks = needLarge > 0 ? pickRandom(availLarge, needLarge) : [];

    const result = [...pinned, ...smallPicks, ...midPicks, ...largePicks].sort((a, b) => a - b);
    if (result.length !== 6) continue;

    const { odd, even } = countOddEven(result);
    if (odd === 6 || even === 6) continue;
    if (countConsecutivePairs(result) > 1) continue;
    if (hasThreeConsecutive(result)) continue;

    return result;
  }

  // Last resort
  const allAvail: number[] = [];
  for (let i = 1; i <= 33; i++) {
    if (!excludedNums.has(i) && !pinned.includes(i)) allAvail.push(i);
  }
  const extra = pickRandom(allAvail, Math.min(remaining, allAvail.length));
  return [...pinned, ...extra].sort((a, b) => a - b).slice(0, 6);
}

function generateBlueBall(
  constellation: string | null,
  zodiac: string | null,
  pinnedBlue: number | null,
): number {
  if (pinnedBlue !== null) return pinnedBlue;

  // Collect lucky set
  let luckySet: number[] = [];

  if (constellation && zodiac) {
    const cNums = CONSTELLATIONS[constellation]?.luckyNums || [];
    const zNums = ZODIACS[zodiac]?.luckyNums || [];
    luckySet = [...new Set([...cNums, ...zNums])];
  } else if (constellation) {
    luckySet = CONSTELLATIONS[constellation]?.luckyNums || [];
  } else if (zodiac) {
    luckySet = ZODIACS[zodiac]?.luckyNums || [];
  }

  // Filter to valid range (1-16)
  const availLucky = luckySet.filter((n) => n >= 1 && n <= 16);

  if (availLucky.length > 0) {
    return availLucky[Math.floor(Math.random() * availLucky.length)];
  }

  // Fallback: pure random 1-16
  return Math.floor(Math.random() * 16) + 1;
}

function makeFingerprint(redBalls: number[]): string {
  return redBalls.join('-');
}

function countRedOverlap(a: number[], b: number[]): number {
  const setB = new Set(b);
  return a.filter((n) => setB.has(n)).length;
}

function generateNumbers(
  excludePeriods: number,
  recentDraws: DrawResult[],
  constellation: string | null,
  zodiac: string | null,
  betCount: number,
  pinnedReds: number[],
  pinnedBlue: number | null,
): GeneratedResult[] {
  const excludedReds = new Set<number>();

  const drawsToExclude = recentDraws.slice(0, excludePeriods);
  for (const draw of drawsToExclude) {
    for (const n of draw.redBalls) {
      if (!pinnedReds.includes(n)) excludedReds.add(n);
    }
  }

  // Auto-reduce exclusions if too few available
  let effectivePeriods = excludePeriods;
  while (33 - excludedReds.size < 15 && effectivePeriods > 0) {
    effectivePeriods--;
    excludedReds.clear();
    const reduced = recentDraws.slice(0, effectivePeriods);
    for (const draw of reduced) {
      for (const n of draw.redBalls) {
        if (!pinnedReds.includes(n)) excludedReds.add(n);
      }
    }
  }

  const results: GeneratedResult[] = [];
  const fingerprints = new Set<string>();

  // Standard dedup: max 3 same reds, min 3 different
  const freeSlots = 6 - new Set(pinnedReds.filter((n) => n >= 1 && n <= 33)).size;
  let maxSimilarity = freeSlots <= 1 ? 5 : freeSlots <= 2 ? 4 : 3;
  let minDifference = freeSlots <= 1 ? 1 : freeSlots <= 2 ? 2 : 3;

  for (let i = 0; i < betCount; i++) {
    let found = false;

    for (let attempt = 0; attempt < MAX_BET_RETRIES; attempt++) {
      const redBalls = generateRedBalls(excludedReds, pinnedReds);
      const fingerprint = makeFingerprint(redBalls);

      // Check complete duplicate
      if (fingerprints.has(fingerprint)) continue;

      // Check similarity against all existing
      let tooSimilar = false;
      for (const prev of results) {
        const overlap = countRedOverlap(redBalls, prev.redBalls);
        if (overlap > maxSimilarity) { tooSimilar = true; break; }
        if (6 - overlap < minDifference) { tooSimilar = true; break; }
      }
      if (tooSimilar) continue;

      const blueBall = generateBlueBall(constellation, zodiac, pinnedBlue);

      fingerprints.add(fingerprint);
      results.push({ redBalls, blueBall });
      found = true;
      break;
    }

    // Degrade dedup on failure
    if (!found) {
      maxSimilarity = Math.min(5, maxSimilarity + 1);
      // Retry with relaxed constraint
      for (let attempt = 0; attempt < MAX_BET_RETRIES; attempt++) {
        const redBalls = generateRedBalls(excludedReds, pinnedReds);
        const fingerprint = makeFingerprint(redBalls);

        if (fingerprints.has(fingerprint)) continue;

        let tooSimilar = false;
        for (const prev of results) {
          if (countRedOverlap(redBalls, prev.redBalls) > maxSimilarity) { tooSimilar = true; break; }
        }
        if (tooSimilar) continue;

        const blueBall = generateBlueBall(constellation, zodiac, pinnedBlue);
        fingerprints.add(fingerprint);
        results.push({ redBalls, blueBall });
        break;
      }
    }
  }

  return results;
}

// ====== Sub-components ======

function Ball({ number, type }: { number: number; type: 'red' | 'blue'; small?: boolean }) {
  const isRed = type === 'red';
  const bgClass = isRed ? 'bg-red-600' : 'bg-blue-600';
  const shadowClass = isRed
    ? 'shadow-[0_4px_12px_rgba(220,38,38,0.4)]'
    : 'shadow-[0_4px_12px_rgba(37,99,235,0.4)]';

  return (
    <div
      className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full ${bgClass} ${shadowClass} text-white font-bold text-lg sm:text-xl`}
    >
      {String(number).padStart(2, '0')}
    </div>
  );
}

function SmallBall({ number, type }: { number: number; type: 'red' | 'blue' }) {
  const bgClass = type === 'red' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${bgClass} text-white font-semibold text-xs`}
    >
      {String(number).padStart(2, '0')}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-gray-700 mb-2">{children}</h3>;
}

// ====== Main Component ======

const Component = function Component() {
  const [recentDraws, setRecentDraws] = useState<DrawResult[]>(REAL_DRAWS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataError, setDataError] = useState(false);

  const [excludePeriods, setExcludePeriods] = useState(10);
  const [betCount, setBetCount] = useState(1);
  const [constellation, setConstellation] = useState<string | null>(null);
  const [zodiac, setZodiac] = useState<string | null>(null);
  const [pinnedReds, setPinnedReds] = useState<number[]>([]);
  const [pinnedBlue, setPinnedBlue] = useState<number | null>(null);

  const [results, setResults] = useState<GeneratedResult[] | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch recent lottery data
  useEffect(() => {
    if (dataLoaded) return;

    const controller = new AbortController();

    fetch(
      'https://jc.zhcw.com/port/client_json.php?callback=&transactionType=10001001&lotteryId=1&issueCount=20',
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) {
          const draws: DrawResult[] = json.data
            .map((item: Record<string, unknown>) => {
              const frontStr = String(item.frontWinningNum ?? '');
              const redBalls = frontStr
                .split(/\s+/)
                .map(Number)
                .filter((n: number) => !isNaN(n) && n > 0);
              const blueBall = Number(item.backWinningNum) || 0;
              return {
                issueId: String(item.issueId ?? item.issue ?? ''),
                redBalls,
                blueBall,
                drawDate: String(item.drawTime ?? item.drawDate ?? ''),
              };
            })
            .filter((d: DrawResult) => d.redBalls.length === 6 && d.blueBall > 0);

          if (draws.length > 0) {
            setRecentDraws(draws);
          }
        }
        setDataLoaded(true);
      })
      .catch(() => {
        setDataError(true);
        setDataLoaded(true);
      });

    return () => controller.abort();
  }, [dataLoaded]);

  const toggleRedPin = useCallback((num: number) => {
    setPinnedReds((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 6) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const gen = generateNumbers(
        excludePeriods,
        recentDraws,
        constellation,
        zodiac,
        betCount,
        pinnedReds,
        pinnedBlue,
      );
      setResults(gen);
      setGenerating(false);
    }, 300);
  }, [excludePeriods, recentDraws, constellation, zodiac, betCount, pinnedReds, pinnedBlue]);

  const handleReset = useCallback(() => {
    setResults(null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            MONEYINMYHOME
          </h1>
          <p className="mt-2 text-sm text-gray-500">双色球智能选号助手</p>
        </header>

        {/* Recent Draws Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              近期开奖
            </h2>
            {dataError && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                使用内置数据
              </span>
            )}
            {!dataError && dataLoaded && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                中彩网数据
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
            {recentDraws.slice(0, 10).map((draw) => (
              <div
                key={draw.issueId}
                className="flex-shrink-0 bg-gray-50 rounded-xl px-3 py-2.5 min-w-[200px]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500">
                    第{draw.issueId.slice(4)}期
                  </span>
                  <span className="text-xs text-gray-400">{draw.drawDate.slice(5)}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {draw.redBalls.map((n, i) => (
                    <SmallBall key={i} number={n} type="red" />
                  ))}
                  <SmallBall number={draw.blueBall} type="blue" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings Panel */}
        <section className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-5">
          {/* Exclude Periods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>排除最近期数</SectionTitle>
              <span className="text-sm font-bold text-red-600">{excludePeriods} 期</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={excludePeriods}
              onChange={(e) => setExcludePeriods(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0期（不排除）</span>
              <span>20期</span>
            </div>
          </div>

          {/* Bet Count + Generate */}
          <div>
            <SectionTitle>生成注数</SectionTitle>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {BET_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setBetCount(count)}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    betCount === count
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {count} 注
                </button>
              ))}
            </div>

            <button
              onClick={results ? handleReset : handleGenerate}
              disabled={generating}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                results
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-200'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {generating ? '生成中...' : results ? '重新生成' : '生成号码'}
            </button>
          </div>

          {/* Result Display */}
          {results && results.length > 0 && (
            <div className="animate-in fade-in duration-300">
              {results.length === 1 ? (
                <SingleResult result={results[0]} excludePeriods={excludePeriods} />
              ) : (
                <div className="space-y-3">
                  {results.map((result, i) => (
                    <MultiResult key={i} result={result} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Constellation Selector */}
          <div>
            <SectionTitle>
              星座模式 <span className="text-gray-400 font-normal">（可选）</span>
            </SectionTitle>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => setConstellation(null)}
                className={`text-xs py-1.5 px-1 rounded-lg border transition-colors ${
                  constellation === null
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                }`}
              >
                不限
              </button>
              {Object.entries(CONSTELLATIONS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setConstellation(key)}
                  className={`text-xs py-1.5 px-1 rounded-lg border transition-colors ${
                    constellation === key
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {val.name}
                </button>
              ))}
            </div>
            {constellation && CONSTELLATIONS[constellation] && (
              <p className="text-xs text-gray-400 mt-1.5">
                幸运数字：{CONSTELLATIONS[constellation].luckyNums.join('、')}
              </p>
            )}
          </div>

          {/* Zodiac Selector */}
          <div>
            <SectionTitle>
              生肖模式 <span className="text-gray-400 font-normal">（可选）</span>
            </SectionTitle>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => setZodiac(null)}
                className={`text-xs py-1.5 px-1 rounded-lg border transition-colors ${
                  zodiac === null
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                不限
              </button>
              {Object.entries(ZODIACS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setZodiac(key)}
                  className={`text-xs py-1.5 px-1 rounded-lg border transition-colors ${
                    zodiac === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {val.name}
                </button>
              ))}
            </div>
            {zodiac && ZODIACS[zodiac] && (
              <p className="text-xs text-gray-400 mt-1.5">
                幸运数字：{ZODIACS[zodiac].luckyNums.join('、')}
              </p>
            )}
          </div>

          {/* Pinned Red Balls */}
          <div>
            <SectionTitle>
              指定红球{' '}
              <span className="text-gray-400 font-normal">
                （{pinnedReds.length}/6）
              </span>
            </SectionTitle>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 33 }, (_, i) => i + 1).map((num) => {
                const isPinned = pinnedReds.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => toggleRedPin(num)}
                    className={`w-full aspect-square rounded-md text-xs font-semibold transition-colors ${
                      isPinned
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pinned Blue Ball */}
          <div>
            <SectionTitle>
              指定蓝球{' '}
              <span className="text-gray-400 font-normal">（可选）</span>
            </SectionTitle>
            <div className="grid grid-cols-8 gap-1.5">
              <button
                onClick={() => setPinnedBlue(null)}
                className={`w-full py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pinnedBlue === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
                }`}
              >
                不限
              </button>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPinnedBlue(num)}
                  className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pinnedBlue === num
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {String(num).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <footer className="mt-10 text-center text-xs text-gray-300">
          <p>本工具仅供娱乐参考，不构成投注建议</p>
          <p className="mt-1">彩票有风险，投注需谨慎</p>
        </footer>
      </div>
    </div>
  );
};

function SingleResult({ result }: { result: GeneratedResult; excludePeriods: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {result.redBalls.map((n, i) => (
          <Ball key={i} number={n} type="red" />
        ))}
        <Ball number={result.blueBall} type="blue" />
      </div>
    </div>
  );
}

function MultiResult({ result, index }: { result: GeneratedResult; index: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-gray-400 w-10 shrink-0">
          第{index + 1}注
        </span>
        <div className="flex items-center gap-1.5 flex-1">
          {result.redBalls.map((n, i) => (
            <SmallBall key={i} number={n} type="red" />
          ))}
          <SmallBall number={result.blueBall} type="blue" />
        </div>
      </div>
    </div>
  );
}

export default Component;
