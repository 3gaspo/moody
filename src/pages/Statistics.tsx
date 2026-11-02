import { formatPercent, formatNumber } from '@3gaspo/app-ui/formats';
import { StateFeedback } from '../components/StateFeedback';
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
    <div className="space-y-6 pb-12 animate-fade-in" id="statistics-view">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-ui-text" id="statistics-title">
          Statistics
        </h1>
      </div>

      {/* Overview Cards (ISO Week, Month, Year Majorities) */}
      <div className="grid grid-cols-1 gap-6" id="stats-overview-grid">
        {/* Weekly Majority */}
        <div className="bg-ui-section p-6 rounded-[28px] space-y-3 shadow-sm" id="weekly-majority-card">
          <span className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted block">
            This Week
          </span>
          <div className="flex items-center gap-2.5 min-w-0">
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
                <h3 className="ui-item-title text-lg font-bold text-ui-text truncate">
                  {weeklyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="ui-item-title text-lg font-bold text-ui-muted">
                  {weeklyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Monthly Majority */}
        <div className="bg-ui-section p-6 rounded-[28px] space-y-3 shadow-sm" id="monthly-majority-card">
          <span className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted block">
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
                <h3 className="ui-item-title text-lg font-bold text-ui-text truncate">
                  {monthlyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="ui-item-title text-lg font-bold text-ui-muted">
                  {monthlyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Yearly Majority */}
        <div className="bg-ui-section p-6 rounded-[28px] space-y-3 shadow-sm" id="yearly-majority-card">
          <span className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted block">
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
                <h3 className="ui-item-title text-lg font-bold text-ui-text truncate">
                  {yearlyMajority.text}
                </h3>
              </>
            ) : (
              <>
                <span className="w-4.5 h-4.5 rounded-full bg-gray-300 dark:bg-gray-700 shadow-inner" />
                <h3 className="ui-item-title text-lg font-bold text-ui-muted">
                  {yearlyMajority.text}
                </h3>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Histogram bar breakdown with beautiful toggles */}
      <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6" id="yearly-histogram-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="ui-section-title text-[10px] font-bold uppercase tracking-widest text-ui-muted">
              Mood Histogram
            </h3>
            <h4 className="text-xl font-bold text-ui-text">
              {getPeriodLabel()} Moods
            </h4>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-ui-ink font-bold bg-ui-section px-3 py-1.5 rounded-full shadow-sm self-start sm:self-auto">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{totalLoggedPeriodDays} {totalLoggedPeriodDays === 1 ? 'Day' : 'Days'} Logged</span>
          </span>
        </div>

        {/* Beautiful Pill-Selectors for Period & Metric */}
        <div className="flex flex-col gap-4">
          {/* Period selector */}
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="ui-meta text-xs font-bold text-ui-muted">Period:</span>
            <div className="ui-segments flex bg-black/5 dark:bg-black/40 p-1 rounded-xl shadow-inner border border-ui-border">
              {(['yearly', 'monthly', 'weekly'] as const).map((p) => (
                <button type="button" aria-pressed={period === p}
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="ui-option"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Metric selector */}
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="ui-meta text-xs font-bold text-ui-muted">Metric:</span>
            <div className="ui-segments flex bg-black/5 dark:bg-black/40 p-1 rounded-xl shadow-inner border border-ui-border">
              {(['current', 'average'] as const).map((m) => (
                <button type="button" aria-pressed={metric === m}
                  key={m}
                  onClick={() => setMetric(m)}
                  className="ui-option"
                >
                  {m === 'current' ? 'Current' : 'Average'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {totalLoggedPeriodDays === 0 ? (
          <StateFeedback title="No entries" />
        ) : (
          <div className="ui-chart ui-chart-legend" id="histogram-container">
            {histogramData.map((item) => (
              <div key={item.id} className="space-y-2 group" id={`histogram-bar-${item.id}`}>
                {/* Info row */}
                <div className="ui-chart-row text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm animate-fade-in"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-ui-ink/70">
                      {item.name}
                    </span>
                  </div>
                  <div className="ui-meta flex items-center space-x-2 text-xs font-bold text-ui-muted">
                    <span>{formatNumber(item.count)} {item.count === 1 ? 'day' : 'days'}</span>
                    <span>&bull;</span>
                    <span>{formatPercent(item.percentage, 'percent')}</span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-4 bg-ui-surface rounded-full overflow-hidden shadow-inner border border-ui-border">
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
