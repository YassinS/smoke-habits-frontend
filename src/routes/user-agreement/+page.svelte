<script lang="ts">
	import Header from '$lib/components/Header.svelte';
</script>

<Header />

<main class="mx-auto max-w-4xl px-4 py-8">
	<div class="space-y-8">
		<div>
			<h1 class="mb-2 text-4xl font-bold text-white">User Agreement</h1>
			<p class="text-gray-400">Effective Date: 05.11.2025</p>
		</div>

		<div class="prose prose-invert max-w-none space-y-6 text-gray-300">
			<div class="rounded-lg border-l-4 border-yellow-500 bg-yellow-900/20 p-4">
				<h2 class="mb-2 font-semibold text-yellow-300">⚠️ Development Version Disclaimer</h2>
				<p class="text-sm text-yellow-100">
					This version of the application is a development build and is provided solely for testing,
					feedback, and internal use. It is not intended for general public use, and features may be
					incomplete or unstable. Users should not rely on the app for medical advice or as a
					primary tool for smoking cessation.
				</p>
			</div>

			<p class="text-lg">
				By creating an account or using the SmokeHabits app ("we", "our", "the app"), you agree to
				the terms outlined in this User Agreement ("Agreement"). Please read carefully.
			</p>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
				<p>
					By using the app, you agree to comply with this Agreement and all applicable laws and
					regulations. If you do not agree, you must not use the app.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">2. Eligibility</h2>
				<p>
					You must be at least 18 years old to use the app. By registering, you confirm that you
					meet this requirement.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">3. Account Registration</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>You must provide accurate and complete information when registering.</li>
					<li>
						Consent to process your personal and health data is required to create an account.
					</li>
					<li>
						You are responsible for maintaining the confidentiality of your account credentials.
					</li>
					<li>You are responsible for all activity under your account.</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">4. Use of the App</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>The app is intended to help track smoking habits and provide insights.</li>
					<li>
						You agree not to use the app for unlawful purposes or in ways that may harm others.
					</li>
					<li>
						You acknowledge that the app does not provide medical advice and should not replace
						professional guidance.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">5. Data and Privacy</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>
						Your use of the app is governed by our Privacy Policy, which explains how we collect,
						store, and use your data.
					</li>
					<li>You may request deletion or export of your personal data at any time.</li>
					<li>You may withdraw consent, which will result in deletion of your account.</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">6. Intellectual Property</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>
						All content, designs, software, and other materials in the app are owned by SmokeHabits
						or its licensors.
					</li>
					<li>
						You may not copy, reproduce, distribute, or create derivative works without prior
						written permission.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">7. Termination</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>You may delete your account at any time.</li>
					<li>
						We reserve the right to suspend or terminate accounts that violate this Agreement or
						applicable laws.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">8. Limitation of Liability</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>Use of the app is at your own risk.</li>
					<li>
						We are not liable for any indirect, incidental, or consequential damages arising from
						your use of the app.
					</li>
					<li>The app is provided "as-is" without warranties of any kind.</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">9. Updates to the Agreement</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>We may modify this Agreement at any time.</li>
					<li>Changes will be effective upon posting within the app.</li>
					<li>Continued use after updates constitutes acceptance of the revised Agreement.</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">10. Governing Law</h2>
				<p class="mb-3">
					This Agreement is governed by the laws of Germany, without regard to its conflict of law
					rules.
				</p>
				<p>Disputes will be resolved in the courts of Germany.</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">11. Contact Information</h2>
				<p class="mb-4">For questions regarding this User Agreement:</p>
				<ul class="space-y-2 pl-6 text-gray-300">
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Email:</span>
						<span>yassin@yassinsassi.com</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</main>

<style>
	:global(main) {
		background-color: rgb(17, 24, 39);
		min-height: calc(100vh - 80px);
	}
</style>
