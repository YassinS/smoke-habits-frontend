<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  export let cigarettes: Array<{ id: number; timestamp: string; cravingLevel?: number }> = [];

  let selectedDate = new Date();
  selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  function endOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  function startOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fmtDateHeading(date: Date) {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: userTimeZone
    });
  }

  function fmtTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimeZone
    });
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
  }

  function describeTimeOfDay(date: Date) {
    const hour = date.getHours();
    if (hour < 6) return 'Late-night check-in';
    if (hour < 11) return 'Morning moment';
    if (hour < 16) return 'Midday pause';
    if (hour < 20) return 'Evening reset';
    return 'Night wind-down';
  }

  $: dayCigs = cigarettes.filter((c) => {
    try {
      const ts = new Date(c.timestamp);
      return ts >= startOfDay(selectedDate) && ts <= endOfDay(selectedDate);
    } catch {
      return false;
    }
  });

  $: sortedCigs = [...dayCigs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  $: timeline = sortedCigs.map((c, index) => {
    const ts = new Date(c.timestamp);
    const prev = index > 0 ? sortedCigs[index - 1] : null;
    const gapMinutes = prev ? Math.max(0, Math.round((ts.getTime() - new Date(prev.timestamp).getTime()) / 60000)) : null;
    const craving = typeof c.cravingLevel === 'number' ? c.cravingLevel : null;
    return {
      timestamp: c.timestamp,
      timeLabel: fmtTime(c.timestamp),
      summary: describeTimeOfDay(ts),
      gapText: gapMinutes === null ? 'First entry today' : `${formatDuration(gapMinutes)} since previous`,
      craving,
      accent: craving !== null ? Math.min(1, craving / 10) : 0.35,
      gapMinutes
    };
  });

  $: totalForDay = timeline.length;

  $: avgCraving = (() => {
    const values = timeline.map((t) => t.craving).filter((value): value is number => typeof value === 'number');
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  })();

  $: longestGapLabel = (() => {
    const gaps = timeline.map((t) => t.gapMinutes ?? 0).filter((n) => n > 0);
    if (!gaps.length) return '–';
    return formatDuration(Math.max(...gaps));
  })();

  $: hours = (() => {
    const buckets = Array.from({ length: 24 }, () => ({ count: 0, sum: 0, n: 0 }));
    for (const cig of dayCigs) {
      const ts = new Date(cig.timestamp);
      const hour = ts.getHours();
      const craving = typeof cig.cravingLevel === 'number' ? cig.cravingLevel : null;
      buckets[hour].count++;
      if (craving !== null) {
        buckets[hour].sum += craving;
        buckets[hour].n++;
      }
    }
    return buckets.map((bucket, hour) => ({
      hour,
      count: bucket.count,
      avgCraving: bucket.n ? bucket.sum / bucket.n : null
    }));
  })();

  $: maxHourlyCount = Math.max(1, ...hours.map((h) => h.count));
  $: heatmap = hours.map((h) => {
    const intensity = h.count ? 0.18 + 0.82 * (h.count / maxHourlyCount) : 0;
    return {
      hour: h.hour,
      intensity,
      count: h.count,
      avgCraving: h.avgCraving
    };
  });

  function prevDay() {
    selectedDate = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
  }

  function nextDay() {
    selectedDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
  }

  function onDateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    selectedDate = new Date(y, m - 1, d);
  }

  function goToToday() {
    const now = new Date();
    selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
</script>

<div class="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 text-white">

  <div class="relative flex flex-col gap-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 class="text-lg font-semibold">Daily rhythm</h3>
        <div class="text-sm text-gray-300">{fmtDateHeading(selectedDate)}</div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button class="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 hover:bg-white/15" on:click={prevDay} aria-label="Previous day">◀</button>
  <input type="date" class="rounded-full border border-white/10 bg-neutral-900 px-3 py-1 text-sm" value={formatDateForInput(selectedDate)} on:change={onDateChange} />
        <button class="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 hover:bg-white/15" on:click={nextDay} aria-label="Next day">▶</button>
        <button class="rounded-full border border-white/10 bg-transparent px-3 py-1 text-xs uppercase tracking-wide text-gray-300 hover:bg-white/10" on:click={goToToday}>Today</button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-wide text-gray-400">Total today</div>
        <div class="mt-2 flex items-end gap-2">
          <span class="text-3xl font-semibold">{totalForDay}</span>
          <span class="text-xs text-gray-400">cigarettes</span>
        </div>
      </div>
      <div class="rounded-lg border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-wide text-gray-400">Average craving</div>
        <div class="mt-2 text-3xl font-semibold">{avgCraving === null ? '–' : avgCraving.toFixed(1)}</div>
      </div>
      <div class="rounded-lg border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-wide text-gray-400">Longest gap</div>
        <div class="mt-2 text-lg font-medium">{longestGapLabel === '–' ? '–' : `${longestGapLabel}`}</div>
      </div>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
        <span>Dawn</span>
        <span>Midday</span>
        <span>Dusk</span>
        <span>Night</span>
      </div>
  <div class="grid h-16 gap-1" style="grid-template-columns: repeat(24, minmax(0, 1fr));">
        {#each heatmap as slot}
          <div class="group relative flex h-full items-end justify-center overflow-hidden rounded bg-emerald-500/10">
            <div class="w-full rounded-t" style={`height:${slot.intensity * 100}%; background: linear-gradient(180deg, rgba(52,211,153,${slot.intensity}) 0%, rgba(16,185,129,${Math.max(0.2, slot.intensity - 0.15)}) 100%);`}></div>
            {#if slot.count}
              <div class="pointer-events-none absolute bottom-1.5 hidden rounded bg-neutral-900/90 px-2 py-1 text-[11px] text-emerald-200 shadow-lg group-hover:block">
                <div class="font-medium">{slot.count} {slot.count === 1 ? 'cigarette' : 'cigarettes'}</div>
                {#if slot.avgCraving !== null}
                  <div class="text-[10px] text-gray-400">Avg craving {slot.avgCraving.toFixed(1)}</div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="space-y-4">
      {#if timeline.length === 0}
        <div class="rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-gray-300" transition:fade>
          No cigarettes logged for this day yet. Log one to begin spotting patterns.
        </div>
      {:else}
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-px bg-linear-to-b from-emerald-500/40 via-white/10 to-transparent"></div>
          <div class="space-y-3">
            {#each timeline as entry, index}
              <div class="relative flex gap-4" transition:fly={{ y: 12, duration: 180, delay: index * 30 }}>
                <div class="relative z-10 mt-1 flex flex-col items-center">
                  <span class="text-xs uppercase tracking-wide text-gray-400">{entry.timeLabel}</span>
                  <div
                    class="mt-2 h-3 w-3 rounded-full border border-emerald-300/60"
                    style={`box-shadow: 0 0 0 4px rgba(52,211,153,0.12); background: rgba(52,211,153,${entry.accent});`}
                  ></div>
                </div>
                <div class="flex-1 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium text-white">{entry.summary}</div>
                    {#if entry.craving !== null}
                      <div class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">Craving {entry.craving}/10</div>
                    {/if}
                  </div>
                  <div class="mt-2 text-sm text-gray-300">{entry.gapText}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
