<script lang="ts">
	import { onMount } from 'svelte';
	import { type CigaretteLog, fetchAllAnalytics, type ContextAnalytics } from '$lib/api';
	import Card from '$lib/components/Card.svelte';
	import ContextBarChart from '$lib/components/ContextBarChart.svelte';

	export let cigarettes: CigaretteLog[] = [];

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL' | null | undefined;

	let weekly: Array<Record<string, unknown>> = [];
	let monthly: Array<Record<string, unknown>> = [];
	let daily: Array<Record<string, unknown>> = [];
	let avgCraving: number | null = null;
	let longestStreak: number | null = null;
	let contextAnalytics: ContextAnalytics[] = [];
	let loading = true;
	let error: string | null = null;
	let lastCigaretteCount = 0;

	function trendLabel(trend: TrendDirection) {
		if (trend === 'UP') return 'Up';
		if (trend === 'DOWN') return 'Down';
		return 'Flat';
	}

	function extractTrendCount(item: unknown): TrendDirection {
		if (item && typeof item === 'object' && 'trendCount' in item) {
			const value = (item as { trendCount?: TrendDirection }).trendCount;
			if (value === 'UP' || value === 'DOWN' || value === 'NEUTRAL') return value;
		}
		return null;
	}

	function extractTrendCraving(item: unknown): TrendDirection {
		if (item && typeof item === 'object' && 'trendCraving' in item) {
			const value = (item as { trendCraving?: TrendDirection }).trendCraving;
			if (value === 'UP' || value === 'DOWN' || value === 'NEUTRAL') return value;
		}
		return null;
	}

	function parseApiDate(raw: string | undefined): Date | null {
		if (!raw) return null;
		if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
			const [y, m, d] = raw.split('-').map(Number);
			return new Date(y, (m ?? 1) - 1, d ?? 1);
		}
		if (/^\d{4}-\d{2}$/.test(raw)) {
			const [y, m] = raw.split('-').map(Number);
			return new Date(y, (m ?? 1) - 1, 1);
		}
		const parsed = new Date(raw);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	function totalFor(item: unknown): number {
		if (!item) return 0;
		if (typeof item !== 'object' || item === null) return 0;
		const record = item as Record<string, unknown>;
		const value =
			(record.totalCigarettes as number | undefined) ?? (record.count as number | undefined) ?? 0;
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : 0;
	}

	function labelFor(item: unknown, index: number): string {
		if (!item) return `Day ${index + 1}`;
		if (typeof item !== 'object' || item === null) return `Day ${index + 1}`;
		const record = item as Record<string, unknown>;
		const raw =
			(record.weekLabel as string | undefined) ??
			(record.month as string | undefined) ??
			(record.day as string | undefined) ??
			null;
		if (!raw) return `Day ${index + 1}`;

		// Handle ISO week format (YYYY-WW)
		if (/^\d{4}-\d{2}$/.test(raw) && record.weekLabel) {
			const week = raw.split('-')[1];
			return `W${week}`;
		}

		const parsed = parseApiDate(raw);
		if (parsed) {
			const options: Intl.DateTimeFormatOptions = { timeZone: userTimeZone };
			if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
				return parsed.toLocaleDateString([], {
					month: 'short',
					day: 'numeric',
					timeZone: userTimeZone
				});
			}
			if (/^\d{4}-\d{2}$/.test(raw)) {
				return parsed.toLocaleDateString([], {
					month: 'short',
					year: 'numeric',
					timeZone: userTimeZone
				});
			}
			return parsed.toLocaleDateString([], options);
		}
		return raw;
	}

	function safeNumber(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	function toEpoch(day: unknown): number {
		const dayStr = typeof day === 'string' ? day : undefined;
		const parsed = parseApiDate(dayStr);
		return parsed ? parsed.getTime() : 0;
	}

	$: latestDaily = daily.length
		? [...daily]
				.sort(
					(a, b) =>
						toEpoch((a as Record<string, unknown>).day) -
						toEpoch((b as Record<string, unknown>).day)
				)
				.slice(-7)
		: [];

	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			const data = await fetchAllAnalytics();
			weekly = data.weekly as Array<Record<string, unknown>>;
			monthly = data.monthly as Array<Record<string, unknown>>;
			daily = data.daily as Array<Record<string, unknown>>;
			avgCraving = data.avgCraving;
			longestStreak = data.longestStreak;
			contextAnalytics = data.contextAnalytics;
		} catch (e: unknown) {
			console.error(e);
			const errorMessage = e instanceof Error ? e.message : String(e);
			error = errorMessage ?? 'Unable to load insights right now.';
		} finally {
			loading = false;
		}
	}

	export async function refetchAnalytics(): Promise<void> {
		try {
			const data = await fetchAllAnalytics();
			weekly = data.weekly as Array<Record<string, unknown>>;
			monthly = data.monthly as Array<Record<string, unknown>>;
			daily = data.daily as Array<Record<string, unknown>>;
			avgCraving = data.avgCraving;
			longestStreak = data.longestStreak;
			contextAnalytics = data.contextAnalytics;
		} catch (e: unknown) {
			console.error('Failed to refetch analytics:', e);
		}
	}

	onMount(load);

	// Refetch all analytics when new cigarettes are logged
	$: if (cigarettes.length > lastCigaretteCount) {
		lastCigaretteCount = cigarettes.length;
		refetchAnalytics();
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
	<Card className="p-4">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Current moving average craving</h3>
			{#if !loading && weekly.length}
				{@const trend = extractTrendCraving(weekly[weekly.length - 1])}
				{#if trend === 'UP'}
					<span class="text-red-400" title="Trending up">↗</span>
				{:else if trend === 'DOWN'}
					<span class="text-green-400" title="Trending down">↘</span>
				{:else if trend === 'NEUTRAL'}
					<span class="text-gray-400" title="Stable">→</span>
				{/if}
			{/if}
		</div>
		<div class="mt-2 text-3xl">
			{#if loading}
				...
			{:else if !latestDaily.length}
				{avgCraving === null ? '–' : safeNumber(avgCraving).toFixed(2)}
			{:else}
				{safeNumber(
					(latestDaily[latestDaily.length - 1] as Record<string, unknown>)?.movingAvgCraving ??
						avgCraving
				).toFixed(2)}
			{/if}
		</div>
	</Card>

	<Card className="p-4">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Longest streak</h3>
			{#if !loading && weekly.length}
				{@const trend = extractTrendCount(weekly[weekly.length - 1])}
				{#if trend === 'UP'}
					<span class="text-red-400" title="Trending up">↗</span>
				{:else if trend === 'DOWN'}
					<span class="text-green-400" title="Trending down">↘</span>
				{:else if trend === 'NEUTRAL'}
					<span class="text-gray-400" title="Stable">→</span>
				{/if}
			{/if}
		</div>
		<div class="mt-2 text-3xl">
			{loading || longestStreak === null
				? '...'
				: `${longestStreak} day${longestStreak === 1 ? '' : 's'}`}
		</div>
	</Card>

	<Card className="p-4">
		<h3 class="font-semibold">Latest daily average craving</h3>
		<div class="mt-2 text-3xl">
			{#if loading}
				...
			{:else if !latestDaily.length}
				–
			{:else}
				{safeNumber(
					(latestDaily[latestDaily.length - 1] as Record<string, unknown>)?.avgCraving ?? avgCraving
				).toFixed(2)}
			{/if}
		</div>
		{#if !loading && latestDaily.length}
			<div class="mt-3 text-xs text-gray-300">
				Overall average craving {avgCraving === null ? '–' : safeNumber(avgCraving).toFixed(2)}
			</div>
		{/if}
	</Card>

	<Card className="p-4 md:col-span-3">
		<h3 class="font-semibold">Weekly cigarettes</h3>
		{#if loading}
			<div>Loading...</div>
		{:else if error}
			<div class="mt-2 text-sm text-red-300">{error}</div>
		{:else if !weekly.length}
			<div class="mt-2 text-sm text-gray-300">
				No weekly data yet. Log cigarettes to populate insights.
			</div>
		{:else}
			{@const lastFourWeeks = weekly.slice(-4)}
			{@const maxCount = Math.max(1, ...lastFourWeeks.map((item) => totalFor(item)))}
			{@const totalCigs = lastFourWeeks.reduce((sum, w) => sum + totalFor(w), 0)}
			{@const avgPerWeek = (totalCigs / lastFourWeeks.length).toFixed(1)}
			{@const lastWeek = lastFourWeeks[lastFourWeeks.length - 1]}
			{@const lastWeekCount = totalFor(lastWeek)}
			{@const trendWeek = extractTrendCount(lastWeek)}
			<div class="mt-4 space-y-4">
				<div class="flex h-48 w-full items-end justify-center gap-2">
					{#each lastFourWeeks as w, i (i)}
						{@const count = totalFor(w)}
						{@const heightPx = Math.max(24, (count / maxCount) * 192)}
						<div class="flex flex-1 flex-col items-center gap-2">
							<div class="relative flex w-full flex-col justify-end" style="height: 192px;">
								<div
									class="relative w-full rounded-t bg-linear-to-t from-emerald-500 to-emerald-400 transition-all hover:from-emerald-400 hover:to-emerald-300"
									style="height: {heightPx}px;"
								>
									<div class="absolute inset-0 flex items-center justify-center">
										<span class="text-xs font-bold text-white drop-shadow-lg">{count}</span>
									</div>
								</div>
							</div>
							<div class="text-center">
								<div class="text-xs text-gray-300">{labelFor(w, i)}</div>
								{#if extractTrendCount(w)}
									{@const trend = extractTrendCount(w)}
									<div class="text-[10px]">
										{#if trend === 'UP'}
											<span class="text-red-400" title="Up">↗</span>
										{:else if trend === 'DOWN'}
											<span class="text-green-400" title="Down">↘</span>
										{:else}
											<span class="text-gray-400" title="Stable">→</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				<div class="grid grid-cols-2 gap-2 text-xs text-gray-400 sm:grid-cols-4">
					<div class="rounded border border-white/10 bg-white/5 p-2">
						<div class="text-gray-500">Total</div>
						<div class="text-sm font-semibold text-white">{totalCigs}</div>
					</div>
					<div class="rounded border border-white/10 bg-white/5 p-2">
						<div class="text-gray-500">Avg/week</div>
						<div class="text-sm font-semibold text-white">{avgPerWeek}</div>
					</div>
					<div class="rounded border border-white/10 bg-white/5 p-2">
						<div class="text-gray-500">Last week</div>
						<div class="text-sm font-semibold text-white">{lastWeekCount}</div>
					</div>
					<div class="rounded border border-white/10 bg-white/5 p-2">
						<div class="text-gray-500">Trend</div>
						<div class="flex items-center gap-1 text-sm font-semibold">
							{#if trendWeek === 'UP'}
								<span class="text-red-400" title="Trending up">↗</span>
							{:else if trendWeek === 'DOWN'}
								<span class="text-green-400" title="Trending down">↘</span>
							{:else if trendWeek === 'NEUTRAL'}
								<span class="text-gray-400" title="Stable">→</span>
							{/if}
							<span class="text-white">{trendLabel(trendWeek)}</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</Card>

	<Card className="p-4 md:col-span-3">
		<h3 class="font-semibold">Monthly overview</h3>
		{#if loading}
			<div>Loading...</div>
		{:else if error}
			<div class="mt-2 text-sm text-red-300">{error}</div>
		{:else if !monthly.length}
			<div class="mt-2 text-sm text-gray-300">No monthly insights available yet.</div>
		{:else}
			<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
				{#each monthly as m, i (i)}
					{@const trend = extractTrendCount(m)}
					<div class="rounded border border-white/10 bg-white/5 p-3 text-left">
						<div class="flex items-center justify-between">
							<div class="text-sm font-medium text-white">{labelFor(m, 0)}</div>
							{#if trend === 'UP'}
								<span class="text-red-400" title="Trending up">↗</span>
							{:else if trend === 'DOWN'}
								<span class="text-green-400" title="Trending down">↘</span>
							{:else if trend === 'NEUTRAL'}
								<span class="text-gray-400" title="Stable">→</span>
							{/if}
						</div>
						<div class="mt-1 text-lg font-semibold text-emerald-200">{totalFor(m)}</div>
						<div class="text-xs text-gray-300">
							avg craving {safeNumber((m as Record<string, unknown>).avgCraving).toFixed(2)}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<Card className="p-4 md:col-span-3">
		<h3 class="font-semibold">Daily momentum</h3>
		{#if loading}
			<div>Loading...</div>
		{:else if error}
			<div class="mt-2 text-sm text-red-300">{error}</div>
		{:else if !latestDaily.length}
			<div class="mt-2 text-sm text-gray-300">No daily stats returned yet.</div>
		{:else}
			<div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
				{#each latestDaily as dayStat, i (i)}
					{@const trend = extractTrendCount(dayStat)}
					<div class="rounded border border-white/10 bg-white/5 p-3">
						<div class="flex items-center justify-between">
							<div class="text-sm font-semibold text-white">{labelFor(dayStat, 0)}</div>
							{#if trend === 'UP'}
								<span class="text-red-400" title="Trending up">↗</span>
							{:else if trend === 'DOWN'}
								<span class="text-green-400" title="Trending down">↘</span>
							{:else if trend === 'NEUTRAL'}
								<span class="text-gray-400" title="Stable">→</span>
							{/if}
						</div>
						<div class="mt-1 flex justify-between text-sm text-gray-300">
							<span>Count</span>
							<span>{totalFor(dayStat)}</span>
						</div>
						<div class="flex justify-between text-sm text-gray-300">
							<span>Moving avg</span>
							<span
								>{safeNumber((dayStat as Record<string, unknown>).movingAvgCount).toFixed(1)}</span
							>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<Card className="p-4 md:col-span-3">
		<h3 class="font-semibold">Cigarettes by context</h3>
		{#if loading}
			<div>Loading...</div>
		{:else if error}
			<div class="mt-2 text-sm text-red-300">{error}</div>
		{:else if !contextAnalytics.length}
			<div class="mt-2 text-sm text-gray-300">
				No context data yet. Tag cigarettes with contexts to see patterns.
			</div>
		{:else}
			<div class="mt-4">
				<ContextBarChart data={contextAnalytics} />
			</div>
		{/if}
	</Card>
</div>
