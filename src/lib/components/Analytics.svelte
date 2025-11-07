<script lang="ts">
	import { onMount } from 'svelte';
	import { type CigaretteLog, fetchAllAnalytics, type ContextAnalytics } from '$lib/api';
	import Card from '$lib/components/Card.svelte';
	import ContextBarChart from '$lib/components/ContextBarChart.svelte';

	export let cigarettes: CigaretteLog[] = [];

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL' | null | undefined;

	interface WeeklyStat {
		weekLabel?: string;
		totalCigarettes?: number;
		avgCraving?: number | null;
		trendCount?: 'UP' | 'DOWN' | 'NEUTRAL';
		trendCraving?: 'UP' | 'DOWN' | 'NEUTRAL';
	}

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

	function startOfDay(d: Date): Date {
		const newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
		return newDate;
	}

	function deriveWeeklyFromLocal() {
		if (!cigarettes?.length) return [] as Array<{ totalCigarettes: number; weekLabel: string }>;
		const today = startOfDay(new Date());
		const days = Array.from({ length: 7 }, (_, i) => {
			const day = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() - (6 - i),
				0,
				0,
				0,
				0
			);
			return day;
		});
		return days.map((day) => {
			const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
			const count = cigarettes.filter((c) => {
				const ts = new Date(c.timestamp);
				return ts >= day && ts < next;
			}).length;
			return {
				totalCigarettes: count,
				weekLabel: day.toLocaleDateString([], { weekday: 'short', timeZone: userTimeZone })
			} satisfies WeeklyStat;
		});
	}

	function safeNumber(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	$: fallbackWeekly = deriveWeeklyFromLocal();
	$: displayWeekly = weekly.length ? weekly : fallbackWeekly;
	function toEpoch(day: unknown): number {
		const dayStr = typeof day === 'string' ? day : undefined;
		const parsed = parseApiDate(dayStr);
		return parsed ? parsed.getTime() : 0;
	}

	function computeWeeklyMax(data: Array<Record<string, unknown>>): number {
		return Math.max(1, ...data.map((item) => totalFor(item)));
	}

	$: weeklyMax = computeWeeklyMax(displayWeekly as Array<Record<string, unknown>>);
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
		<h3 class="font-semibold">Avg craving</h3>
		<div class="mt-2 text-3xl">
			{loading || avgCraving === null ? '...' : safeNumber(avgCraving).toFixed(2)}
		</div>
		{#if !loading && weekly.length}
			<div class="mt-3 text-xs text-gray-300">
				Last week: {trendLabel(extractTrendCraving(weekly[weekly.length - 1]))} craving trend
			</div>
		{/if}
	</Card>

	<Card className="p-4">
		<h3 class="font-semibold">Longest streak</h3>
		<div class="mt-2 text-3xl">
			{loading || longestStreak === null
				? '...'
				: `${longestStreak} day${longestStreak === 1 ? '' : 's'}`}
		</div>
		{#if !loading && weekly.length}
			<div class="mt-3 text-xs text-gray-300">
				Count trend: {trendLabel(extractTrendCount(weekly[weekly.length - 1]))}
			</div>
		{/if}
	</Card>

	<Card className="p-4">
		<h3 class="font-semibold">Latest daily avg</h3>
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
				7-day moving avg {safeNumber(
					(latestDaily[latestDaily.length - 1] as Record<string, unknown>)?.movingAvgCraving
				).toFixed(2)}
			</div>
		{/if}
	</Card>

	<Card className="p-4 md:col-span-3">
		<h3 class="font-semibold">Weekly cigarettes</h3>
		{#if loading}
			<div>Loading...</div>
		{:else if error}
			<div class="mt-2 text-sm text-red-300">{error}</div>
		{:else if !displayWeekly.length}
			<div class="mt-2 text-sm text-gray-300">
				No weekly data yet. Log cigarettes to populate insights.
			</div>
		{:else}
			<div class="mt-4 flex h-32 w-full items-end gap-2">
				{#each displayWeekly as w, i (i)}
					<div class="flex-1 text-center">
						<div
							class="rounded-t bg-emerald-400/80"
							style="height: {Math.max(6, (totalFor(w) / weeklyMax) * 100)}%"
						></div>
						<div class="mt-2 text-xs text-gray-300">{labelFor(w, i)}</div>
						{#if extractTrendCount(w)}
							<div class="text-[11px] text-gray-400">{trendLabel(extractTrendCount(w))}</div>
						{/if}
					</div>
				{/each}
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
					<div class="rounded border border-white/10 bg-white/5 p-3 text-left">
						<div class="text-sm font-medium text-white">{labelFor(m, 0)}</div>
						<div class="mt-1 text-lg font-semibold text-emerald-200">{totalFor(m)}</div>
						<div class="text-xs text-gray-300">
							avg craving {safeNumber((m as Record<string, unknown>).avgCraving).toFixed(2)}
						</div>
						<div class="text-[11px] text-gray-500">Trend {trendLabel(extractTrendCount(m))}</div>
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
					<div class="rounded border border-white/10 bg-white/5 p-3">
						<div class="text-sm font-semibold text-white">{labelFor(dayStat, 0)}</div>
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
						<div class="flex justify-between text-sm text-gray-300">
							<span>Trend</span>
							<span>{trendLabel(extractTrendCount(dayStat))}</span>
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
