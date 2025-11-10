<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import { apiGet, type CigaretteLog } from '$lib/api';
	import { onMount, onDestroy } from 'svelte';

	export let cigarettes: CigaretteLog[] = [];

	let avgCraving: number | null = null;
	let movingAvgCraving: number | null = null;
	let weekly: any[] = [];
	let daily: any[] = [];
	let loading = false;
	let lastCount = -1;
	let fetchTicket = 0;
	let now = new Date();
	let ticker: ReturnType<typeof setInterval> | null = null;
	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL';
	let cravingTrend: TrendDirection | null = null;
	let countTrend: TrendDirection | null = null;

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

	function toEpoch(value: unknown): number | null {
		if (typeof value !== 'string') return null;
		const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
		const normalized = hasTimezone || value.endsWith('Z') ? value : `${value}Z`;
		const time = Date.parse(normalized);
		return Number.isFinite(time) ? time : null;
	}

	function formatDuration(diffMs: number) {
		if (diffMs < 0) diffMs = 0;
		const totalSeconds = Math.floor(diffMs / 1000);
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const parts: string[] = [];
		if (days) parts.push(`${days}d`);
		if (days || hours) parts.push(`${hours.toString().padStart(2, '0')}h`);
		parts.push(`${minutes.toString().padStart(2, '0')}m`);
		parts.push(`${seconds.toString().padStart(2, '0')}s`);
		return parts.join(' ');
	}

	function formatTimeLabel(ts: Date) {
		return ts.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			timeZone: userTimeZone
		});
	}

	function totalFor(item: any): number {
		if (!item) return 0;
		const value =
			item.totalCigarettes ?? item.total ?? item.count ?? item.value ?? item.cigarettes ?? 0;
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
		const s = startOfDay(now),
			e = endOfDay(now);
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
	$: displayAvgCraving = movingAvgCraving ?? localAvgCraving ?? safeAvg(avgCraving);
	$: latestTimestamp = (() => {
		const epochs = cigarettes
			.map((c) => toEpoch(c.timestamp))
			.filter((n): n is number => n !== null);
		if (!epochs.length) return null;
		return Math.max(...epochs);
	})();

	$: latestDate = latestTimestamp !== null ? new Date(latestTimestamp) : null;
	$: timeSince = latestDate ? formatDuration(now.getTime() - latestDate.getTime()) : null;
	$: lastLoggedLabel = latestDate ? formatTimeLabel(latestDate) : null;

	$: if (cigarettes.length !== lastCount) {
		lastCount = cigarettes.length;
		void load();
	}

	async function load() {
		const ticket = ++fetchTicket;
		loading = true;
		try {
			const [avg, weeklyData, dailyData] = await Promise.all([
				apiGet('/analytics/avg-craving'),
				apiGet('/analytics/weekly'),
				apiGet('/analytics/daily')
			]);
			if (ticket === fetchTicket) {
				avgCraving = safeAvg(avg);
				weekly = Array.isArray(weeklyData) ? weeklyData : [];
				daily = Array.isArray(dailyData) ? dailyData : [];

				// Extract moving average and trends from latest daily data
				if (daily.length > 0) {
					const latestDaily = daily[daily.length - 1];
					movingAvgCraving = safeAvg(latestDaily?.movingAvgCraving);
					cravingTrend = latestDaily?.trendCraving || null;
					countTrend = latestDaily?.trendCount || null;
				}

				// If we don't have daily trends, try weekly
				if (!cravingTrend && weekly.length > 0) {
					const latestWeekly = weekly[weekly.length - 1];
					cravingTrend = latestWeekly?.trendCraving || null;
				}
				if (!countTrend && weekly.length > 0) {
					const latestWeekly = weekly[weekly.length - 1];
					countTrend = latestWeekly?.trendCount || null;
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			if (ticket === fetchTicket) loading = false;
		}
	}

	onMount(() => {
		ticker = setInterval(() => {
			now = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (ticker) clearInterval(ticker);
	});
</script>

{#if timeSince}
	<Card
		className="col-span-full overflow-hidden border border-emerald-400/20 bg-linear-to-b from-emerald-500/20 via-emerald-500/10 to-transparent"
	>
		<div class="flex flex-col items-center gap-4 text-center">
			<div
				class="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-100/80 uppercase"
			>
				Since last cigarette
			</div>
			<div class="flex flex-col items-center gap-1">
				<div class="text-[0.9rem] text-emerald-100/80">Logged at {lastLoggedLabel}</div>
				<div
					class="text-5xl font-semibold text-emerald-50 md:text-6xl"
					style="font-feature-settings: 'tnum' 1; letter-spacing: 0.04em;"
				>
					{timeSince}
				</div>
			</div>
			<div
				class="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 shadow-inner"
			>
				Every second counts—keep breathing steady.
			</div>
		</div>
	</Card>
{:else}
	<Card className="col-span-full border border-white/10 bg-white/5">
		<div class="flex flex-col items-center gap-2 text-center text-gray-300">
			<div
				class="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs tracking-[0.2em] uppercase"
			>
				Since last cigarette
			</div>
			<div class="text-sm">No cigarettes logged yet.</div>
		</div>
	</Card>
{/if}

<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
	<Card className="p-4">
		<div class="flex items-center justify-between">
			<div class="text-sm text-gray-300">Today</div>
			{#if countTrend === 'UP'}
				<span class="text-red-400" title="Trending up">↗</span>
			{:else if countTrend === 'DOWN'}
				<span class="text-green-400" title="Trending down">↘</span>
			{:else if countTrend === 'NEUTRAL'}
				<span class="text-gray-400" title="Stable">→</span>
			{/if}
		</div>
		<div class="mt-1 flex items-end gap-2">
			<div class="text-3xl font-semibold text-white">{todayCount}</div>
			<div class="mb-1 text-xs text-gray-400">cigarettes</div>
		</div>
	</Card>

	<Card className="p-4">
		<div class="flex items-center justify-between">
			<div class="text-sm text-gray-300">Moving avg craving</div>
			{#if cravingTrend === 'UP'}
				<span class="text-red-400" title="Trending up">↗</span>
			{:else if cravingTrend === 'DOWN'}
				<span class="text-green-400" title="Trending down">↘</span>
			{:else if cravingTrend === 'NEUTRAL'}
				<span class="text-gray-400" title="Stable">→</span>
			{/if}
		</div>
		<div class="mt-1 text-3xl font-semibold text-white">
			{#if displayAvgCraving === null}
				...
			{:else}
				{displayAvgCraving.toFixed(1)}
			{/if}
		</div>
		{#if loading}
			<div class="mt-1 text-[11px] tracking-wide text-gray-500 uppercase">Syncing...</div>
		{:else if avgCraving !== null && movingAvgCraving === null}
			<div class="mt-1 text-[11px] tracking-wide text-gray-500 uppercase">
				Overall: {avgCraving.toFixed(1)}
			</div>
		{/if}
	</Card>

	<Card className="p-4">
		<div class="flex items-center justify-between">
			<div class="text-sm text-gray-300">This week</div>
			{#if countTrend === 'UP'}
				<span class="text-red-400" title="Trending up">↗</span>
			{:else if countTrend === 'DOWN'}
				<span class="text-green-400" title="Trending down">↘</span>
			{:else if countTrend === 'NEUTRAL'}
				<span class="text-gray-400" title="Stable">→</span>
			{/if}
		</div>
		<div class="mt-1 flex items-end gap-2">
			<div class="text-3xl font-semibold text-white">{displayWeekTotal}</div>
			<div class="mb-1 text-xs text-gray-400">cigarettes</div>
		</div>
		{#if loading}
			<div class="mt-1 text-[11px] tracking-wide text-gray-500 uppercase">Syncing...</div>
		{/if}
	</Card>
</div>
