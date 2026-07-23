/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useData } from '../providers/Providers';
import { BarChart3 } from 'lucide-react';
import { MoodEntry, Mood } from '../types';

interface MajorityMoodResult {
  text: string;
  moods: { name: string; color: string }[];
}

export const Statistics: React.FC = () => {
  const { moods, entries } = useData();

  // Selected period and metric for the histogram
  const [period, setPeriod] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  const [metric, setMetric] = useState<'current' | 'average'>('current');

  // Helper: Get local date objects and boundaries
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // ISO Week boundary computation for current week
  const isoWeekBounds = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    // Monday is day 1, Sunday is 0.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  }, [now]);

  // Filter entries with active (non-null and non-deleted) moods
  const validEntries = useMemo(() => {
    return (Object.values(entries) as MoodEntry[]).filter((entry: MoodEntry) => {
      if (!entry.moodId) return false;
      // Ensure the referenced mood still exists
      return moods.some(m => m.id === entry.moodId);
    });
  }, [entries, moods]);

  // Compute stats for a given subset of entries
  const calculateMajorityMood = (periodEntries: typeof validEntries): MajorityMoodResult => {
    if (periodEntries.length === 0) {
      return { text: 'No data', moods: [] };
    }

    // Count frequencies of each mood
    const counts: Record<string, number> = {};
    periodEntries.forEach(entry => {
      const moodId = entry.moodId!;
      counts[moodId] = (counts[moodId] || 0) + 1;
    });

    // Find max frequency
    let maxCount = 0;
    Object.values(counts).forEach(c => {
      if (c > maxCount) maxCount = c;
    });

    if (maxCount === 0) {
      return { text: 'No data', moods: [] };
    }

    // Identify all moods with that max count
    const tiedMoodIds = Object.keys(counts).filter(id => counts[id] === maxCount);
    const tiedMoods = tiedMoodIds
      .map(id => moods.find(m => m.id === id))
      .filter((m): m is Mood => !!m);

    if (tiedMoods.length === 1) {
      return { 
        text: tiedMoods[0].name, 
        moods: [{ name: tiedMoods[0].name, color: tiedMoods[0].color }] 
      };
    } else if (tiedMoods.length > 1) {
      return { 
        text: `Tie: ${tiedMoods.map(m => m.name).join(', ')}`, 
        moods: tiedMoods.map(m => ({ name: m.name, color: m.color })) 
      };
    }
    return { text: 'No data', moods: [] };
  };

  // 1. Current Week Entries (ISO Week)
  const currentWeekEntries = useMemo(() => {
    return validEntries.filter(entry => {
      const entryDate = new Date(`${entry.date}T12:00:00`);
      return entryDate >= isoWeekBounds.monday && entryDate <= isoWeekBounds.sunday;
    });
  }, [validEntries, isoWeekBounds]);

  const weeklyMajority = useMemo(() => {
    return calculateMajorityMood(currentWeekEntries);
  }, [currentWeekEntries, moods]);

  // 2. Current Month Entries
  const currentMonthEntries = useMemo(() => {
    return validEntries.filter(entry => {
      const entryDate = new Date(`${entry.date}T12:00:00`);
      return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
    });
  }, [validEntries, currentYear, currentMonth]);

  const monthlyMajority = useMemo(() => {
    return calculateMajorityMood(currentMonthEntries);
  }, [currentMonthEntries, moods]);

  // 3. Current Year Entries
  const currentYearEntries = useMemo(() => {
    return validEntries.filter(entry => {
      const entryDate = new Date(`${entry.date}T12:00:00`);
      return entryDate.getFullYear() === currentYear;
    });
  }, [validEntries, currentYear]);

  const yearlyMajority = useMemo(() => {
    return calculateMajorityMood(currentYearEntries);
  }, [currentYearEntries, moods]);

  // Determine active period entries based on period toggle
  const activePeriodEntries = useMemo(() => {
    switch (period) {
      case 'weekly':
        return currentWeekEntries;
      case 'monthly':
        return currentMonthEntries;
      case 'yearly':
      default:
        return currentYearEntries;
    }
  }, [period, currentWeekEntries, currentMonthEntries, currentYearEntries]);

  // Compute stats depending on period and metric selection
  const histogramData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize all configured moods to 0 to preserve ordering and present stable chart
    moods.forEach(mood => {
      counts[mood.id] = 0;
    });

    const entriesToCount = metric === 'average' ? validEntries : activePeriodEntries;
    let totalEntriesCount = 0;

    entriesToCount.forEach(entry => {
      const moodId = entry.moodId!;
      if (counts[moodId] !== undefined) {
        counts[moodId] += 1;
        totalEntriesCount++;
      }
    });

    return moods.map(mood => {
      const count = counts[mood.id] || 0;
      const percentage = totalEntriesCount > 0 ? (count / totalEntriesCount) * 100 : 0;
      return {
        ...mood,
        count,
        percentage: Number.isNaN(percentage) ? 0 : percentage
      };
    });
  }, [moods, metric, activePeriodEntries, validEntries]);

  // Get total logged days for current query
  const totalLoggedPeriodDays = useMemo(() => {
    return metric === 'average' ? validEntries.length : activePeriodEntries.length;
  }, [metric, validEntries, activePeriodEntries]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
    }
  };

  const getMetricLabel = () => {
    return metric === 'current' ? 'Current' : 'Average';
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="statistics-view">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white" id="statistics-title">
          Statistics
        </h1>
      </div>

      {/* Overview Cards (ISO Week, Month, Year Majorities) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="stats-overview-grid">
        {/* Weekly Majority */}
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[28px] space-y-3 shadow-sm" id="weekly-majority-card">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
            This Week
          </span>
          <div className="flex items-center space-x-2.5">
            {weeklyMajority.moods.length > 0 ? (
              <>
                <div className="flex -space-x-1 shrink-0">
                  {weeklyMajority.moods.map((m, i) => (
                    <span 
                      key={i}
                      className="w-4.5 h-4.5 rounded-full border border-white dark:border-neutral-900 shadow-sm"
                      style={{ backgroundColor: m.color }}
                      title={m.name}
                    />
                  ))}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                  {weeklyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {weeklyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Monthly Majority */}
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[28px] space-y-3 shadow-sm" id="monthly-majority-card">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
            This Month
          </span>
          <div className="flex items-center space-x-2.5">
            {monthlyMajority.moods.length > 0 ? (
              <>
                <div className="flex -space-x-1 shrink-0">
                  {monthlyMajority.moods.map((m, i) => (
                    <span 
                      key={i}
                      className="w-4.5 h-4.5 rounded-full border border-white dark:border-neutral-900 shadow-sm"
                      style={{ backgroundColor: m.color }}
                      title={m.name}
                    />
                  ))}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                  {monthlyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {monthlyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Yearly Majority */}
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[28px] space-y-3 shadow-sm" id="yearly-majority-card">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
            This Year
          </span>
          <div className="flex items-center space-x-2.5">
            {yearlyMajority.moods.length > 0 ? (
              <>
                <div className="flex -space-x-1 shrink-0">
                  {yearlyMajority.moods.map((m, i) => (
                    <span 
                      key={i}
                      className="w-4.5 h-4.5 rounded-full border border-white dark:border-neutral-900 shadow-sm"
                      style={{ backgroundColor: m.color }}
                      title={m.name}
                    />
                  ))}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                  {yearlyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {yearlyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Histogram bar breakdown with beautiful toggles */}
      <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6" id="yearly-histogram-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Mood Histogram
            </h3>
            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {getPeriodLabel()} Moods
            </h4>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-blue-500 font-bold bg-blue-500/10 px-3 py-1.5 rounded-full shadow-sm self-start sm:self-auto">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{totalLoggedPeriodDays} {totalLoggedPeriodDays === 1 ? 'Day' : 'Days'} Logged</span>
          </span>
        </div>

        {/* Beautiful Pill-Selectors for Period & Metric */}
        <div className="flex flex-col gap-4 bg-white/50 dark:bg-black/10 p-4 rounded-2xl border border-black/5 dark:border-white/5">
          {/* Period selector */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Period:</span>
            <div className="flex bg-black/5 dark:bg-black/40 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
              {(['yearly', 'monthly', 'weekly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Metric selector */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Metric:</span>
            <div className="flex bg-black/5 dark:bg-black/40 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
              {(['current', 'average'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    metric === m
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                  }`}
                >
                  {m === 'current' ? 'Current' : 'Average'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {totalLoggedPeriodDays === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No entries found for this selection. Start tracking today to generate charts!
          </div>
        ) : (
          <div className="space-y-5" id="histogram-container">
            {histogramData.map((item) => (
              <div key={item.id} className="space-y-2 group" id={`histogram-bar-${item.id}`}>
                {/* Info row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm animate-fade-in"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 dark:text-gray-500">
                    <span>{item.count} {item.count === 1 ? 'day' : 'days'}</span>
                    <span>&bull;</span>
                    <span>{Math.round(item.percentage)}%</span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-4 bg-white dark:bg-black/25 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                  <div
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
