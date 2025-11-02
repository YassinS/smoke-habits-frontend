<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import { apiGet } from '$lib/api';

  export let cigarettes: Array<{ id: number; timestamp: string; cravingLevel?: number }> = [];

  let avgCraving: number | null = null;
  let weekly: any[] = [];
  let loading = false;
  let lastCount = -1;
  let fetchTicket = 0;

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

  function totalFor(item: any): number {
    if (!item) return 0;
    const value = item.totalCigarettes ?? item.total ?? item.count ?? item.value ?? item.cigarettes ?? 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function safeAvg(value: any): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  $: todayCount = (() => {
    const now = new Date();
    const s = startOfDay(now), e = endOfDay(now);
    return cigarettes.filter((c) => {
      const t = new Date(c.timestamp);
      return t >= s && t <= e;
    }).length;
  })();

  $: localAvgCraving = (() => {
    const values = cigarettes
      .map((c) => (typeof c.cravingLevel === 'number' ? c.cravingLevel : null))
      .filter((n): n is number => n !== null);
    if (!values.length) return null;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  })();

  $: localWeekTotal = (() => {
    if (!cigarettes.length) return 0;
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return cigarettes.filter((c) => {
      const ts = new Date(c.timestamp);
      return ts >= start && ts < end;
    }).length;
  })();

  $: apiWeekTotal = weekly.length ? totalFor(weekly[weekly.length - 1]) : 0;
  $: displayWeekTotal = Math.max(apiWeekTotal, localWeekTotal);
  $: displayAvgCraving = localAvgCraving ?? safeAvg(avgCraving);

  $: if (cigarettes.length !== lastCount) {
    lastCount = cigarettes.length;
    void load();
  }

  async function load() {
    const ticket = ++fetchTicket;
    loading = true;
    try {
      const avg = await apiGet('/analytics/avg-craving');
      const weeklyData = await apiGet('/analytics/weekly');
      if (ticket === fetchTicket) {
        avgCraving = safeAvg(avg);
        weekly = Array.isArray(weeklyData) ? weeklyData : [];
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (ticket === fetchTicket) loading = false;
    }
  }
</script>

<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
  <Card className="p-4">
    <div class="text-sm text-gray-300">Today</div>
    <div class="mt-1 flex items-end gap-2">
      <div class="text-3xl font-semibold text-white">{todayCount}</div>
      <div class="mb-1 text-xs text-gray-400">cigarettes</div>
    </div>
  </Card>

  <Card className="p-4">
    <div class="text-sm text-gray-300">Average craving</div>
    <div class="mt-1 text-3xl font-semibold text-white">
      {#if displayAvgCraving === null}
        ...
      {:else}
        {displayAvgCraving.toFixed(1)}
      {/if}
    </div>
    {#if loading}
      <div class="mt-1 text-[11px] uppercase tracking-wide text-gray-500">Syncing...</div>
    {/if}
  </Card>

  <Card className="p-4">
    <div class="text-sm text-gray-300">This week</div>
    <div class="mt-1 flex items-end gap-2">
      <div class="text-3xl font-semibold text-white">{displayWeekTotal}</div>
      <div class="mb-1 text-xs text-gray-400">cigarettes</div>
    </div>
    {#if loading}
      <div class="mt-1 text-[11px] uppercase tracking-wide text-gray-500">Syncing...</div>
    {/if}
  </Card>
</div>
