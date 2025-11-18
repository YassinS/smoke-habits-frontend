<script lang="ts">
	
	import { getTokens } from '$lib/auth';
	import { onMount } from 'svelte';

	let isLoggedIn = false;

	onMount(() => {
		isLoggedIn = !!getTokens();
	});

	function scrollToFeatures() {
		document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
	}

	function scrollToHowItWorks() {
		document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Smoke Habits - Track, Understand & Reduce Your Smoking</title>
	<meta
		name="description"
		content="Take control of your smoking habits with smart tracking, insightful analytics, and personalized reduction goals."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
	<!-- Navigation -->
	<nav class="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur-lg">
		<div class="container mx-auto flex items-center justify-between px-6 py-4">
			<div class="flex items-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
					<span class="text-2xl">🚭</span>
				</div>
				<span class="text-xl font-bold text-white">Smoke Habits</span>
			</div>
			<div class="flex items-center gap-4">
				<button on:click={scrollToFeatures} class="hidden text-sm text-gray-300 transition-colors hover:text-white md:block">
					Features
				</button>
				<button on:click={scrollToHowItWorks} class="hidden text-sm text-gray-300 transition-colors hover:text-white md:block">
					How it Works
				</button>
				<a
					href="/app" data-sveltekit-preload-data
					class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
				>
					Get Started
				</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="container mx-auto px-6 pt-32 pb-20">
		<div class="mx-auto max-w-4xl text-center">
			<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
				</span>
				Smart Reduction Technology
			</div>

			<h1 class="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
				Take Control of Your
				<span class="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
					Smoking Habits
				</span>
			</h1>

			<p class="mb-8 text-xl text-gray-400 md:text-2xl">
				Track your cigarette consumption, understand your triggers, and create personalized reduction goals with data-driven insights.
			</p>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="/app" data-sveltekit-preload-data
					class="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/30"
				>
					Start Your Journey
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
				<button
					on:click={scrollToHowItWorks}
					class="rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
				>
					Learn More
				</button>
			</div>

			<!-- Stats -->
			<div class="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
				<div class="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
					<div class="mb-2 text-4xl font-bold text-green-400">100%</div>
					<div class="text-sm text-gray-400">Free & Private</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
					<div class="mb-2 text-4xl font-bold text-blue-400">24/7</div>
					<div class="text-sm text-gray-400">Offline Support</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
					<div class="mb-2 text-4xl font-bold text-purple-400">Smart</div>
					<div class="text-sm text-gray-400">AI-Powered Insights</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="border-t border-white/10 bg-gradient-to-b from-gray-900 to-gray-800 py-20">
		<div class="container mx-auto px-6">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-4xl font-bold text-white">Powerful Features</h2>
				<p class="text-xl text-gray-400">Everything you need to understand and reduce your smoking</p>
			</div>

			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				<!-- Feature 1 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-green-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-3xl">
						📊
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Smart Tracking</h3>
					<p class="text-gray-400">
						Log cigarettes instantly with craving levels and context tags. Works offline, syncs automatically.
					</p>
				</div>

				<!-- Feature 2 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 text-3xl">
						🎯
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Reduction Goals</h3>
					<p class="text-gray-400">
						Create personalized goals with auto-calculated starting points. Choose from LINEAR, STEPPED, or GRADUAL strategies.
					</p>
				</div>

				<!-- Feature 3 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-purple-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-3xl">
						📈
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Deep Analytics</h3>
					<p class="text-gray-400">
						Visualize trends with daily, weekly, and monthly charts. Identify patterns and trigger contexts.
					</p>
				</div>

				<!-- Feature 4 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-3xl">
						🏷️
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Context Awareness</h3>
					<p class="text-gray-400">
						Tag smoking situations (coffee, stress, social). Discover which contexts trigger you most.
					</p>
				</div>

				<!-- Feature 5 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-red-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/20 text-3xl">
						🔒
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Privacy First</h3>
					<p class="text-gray-400">
						Your data stays yours. Secure authentication, encrypted storage, and no third-party tracking.
					</p>
				</div>

				<!-- Feature 6 -->
				<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-teal-500/30 hover:bg-white/10">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 text-3xl">
						📱
					</div>
					<h3 class="mb-3 text-xl font-semibold text-white">Works Everywhere</h3>
					<p class="text-gray-400">
						Progressive web app works on any device. Install on your phone for quick access anytime, anywhere.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="border-t border-white/10 py-20">
		<div class="container mx-auto px-6">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-4xl font-bold text-white">How It Works</h2>
				<p class="text-xl text-gray-400">Your journey to reduced smoking in three simple steps</p>
			</div>

			<div class="mx-auto max-w-4xl space-y-12">
				<!-- Step 1 -->
				<div class="flex flex-col items-center gap-8 md:flex-row">
					<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-2xl font-bold text-white">
						1
					</div>
					<div class="flex-1 text-center md:text-left">
						<h3 class="mb-2 text-2xl font-semibold text-white">Track Your Habits</h3>
						<p class="text-gray-400">
							Log each cigarette with a single tap. Add craving levels and context tags to understand your patterns. Works offline, so you never miss a log.
						</p>
					</div>
					<div class="h-32 w-48 rounded-xl border border-white/10 bg-gradient-to-br from-green-500/10 to-emerald-600/10 p-4">
						<div class="mb-2 h-3 w-3/4 rounded bg-white/20"></div>
						<div class="mb-2 h-3 w-1/2 rounded bg-white/20"></div>
						<div class="h-3 w-2/3 rounded bg-white/20"></div>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex flex-col items-center gap-8 md:flex-row-reverse">
					<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-2xl font-bold text-white">
						2
					</div>
					<div class="flex-1 text-center md:text-right">
						<h3 class="mb-2 text-2xl font-semibold text-white">Discover Insights</h3>
						<p class="text-gray-400">
							View beautiful charts showing your smoking trends over time. Identify which situations trigger you most and when you smoke the most.
						</p>
					</div>
					<div class="h-32 w-48 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 p-4">
						<div class="flex h-full items-end justify-around gap-2">
							<div class="h-1/3 w-6 rounded-t bg-blue-400/40"></div>
							<div class="h-2/3 w-6 rounded-t bg-blue-400/60"></div>
							<div class="h-full w-6 rounded-t bg-blue-400/80"></div>
							<div class="h-1/2 w-6 rounded-t bg-blue-400/40"></div>
						</div>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex flex-col items-center gap-8 md:flex-row">
					<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-2xl font-bold text-white">
						3
					</div>
					<div class="flex-1 text-center md:text-left">
						<h3 class="mb-2 text-2xl font-semibold text-white">Set Your Goal</h3>
						<p class="text-gray-400">
							Create a personalized reduction plan. Choose your target, duration, and strategy. Track your progress daily with smart reminders.
						</p>
					</div>
					<div class="h-32 w-48 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-600/10 p-4">
						<div class="mb-3 flex items-center justify-between">
							<div class="text-xs text-white/60">Goal Progress</div>
							<div class="text-xs font-bold text-purple-400">75%</div>
						</div>
						<div class="h-2 overflow-hidden rounded-full bg-white/10">
							<div class="h-full w-3/4 bg-gradient-to-r from-purple-500 to-pink-600"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="border-t border-white/10 bg-gradient-to-br from-green-600/10 to-emerald-600/10 py-20">
		<div class="container mx-auto px-6 text-center">
			<h2 class="mb-4 text-4xl font-bold text-white">Ready to Make a Change?</h2>
			<p class="mb-8 text-xl text-gray-400">Join others taking control of their smoking habits today.</p>
			<a
				href="/app" data-sveltekit-preload-data
				class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/30"
			>
				Get Started Free
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
				</svg>
			</a>
		</div>
	</section>


</div>

<style>
	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>
