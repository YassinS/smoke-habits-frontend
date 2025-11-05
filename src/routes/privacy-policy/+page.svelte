<script lang="ts">
	import Header from '$lib/components/Header.svelte';
</script>

<Header />

<main class="mx-auto max-w-4xl px-4 py-8">
	<div class="space-y-8">
		<div>
			<h1 class="mb-2 text-4xl font-bold text-white">Privacy Policy</h1>
			<p class="text-gray-400">Effective date: 05.11.2025</p>
		</div>

		<div class="prose prose-invert max-w-none space-y-6 text-gray-300">
			<p class="text-lg">
				SmokeHabits ("we", "our", "the app") respects your privacy and is committed to protecting
				your personal data. This Privacy Policy explains how we collect, use, store, and protect
				your information, as well as your rights under EU data protection laws (GDPR).
			</p>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">1. Information We Collect</h2>
				<p class="mb-4">We collect the following types of data when you use the app:</p>
				<ul class="space-y-3 pl-6">
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Account Information:</span>
						<span>Email, hashed password, and consent timestamp.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Health Data:</span>
						<span>Cigarettes logged, cravings, contexts, and optional notes.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Usage Data:</span>
						<span>App interactions, analytics, and anonymized performance data.</span>
					</li>
				</ul>
				<p class="mt-4">
					All data collected is necessary to provide the functionality of SmokeHabits and to help
					you track and improve your smoking habits.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">2. How We Use Your Data</h2>
				<p class="mb-4">Your data is used for:</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>Logging cigarettes and contexts.</li>
					<li>Providing analytics and insights about your smoking behavior.</li>
					<li>Improving the app's performance and features.</li>
					<li>Ensuring security and compliance with legal obligations.</li>
				</ul>
				<p class="mt-4 font-semibold text-white">
					We do not sell or share your personal data for marketing purposes.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">3. Legal Basis for Processing</h2>
				<p class="mb-4">We process your data on the following bases:</p>
				<ul class="space-y-3 pl-6">
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Consent:</span>
						<span>You provide explicit consent when registering an account.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Legitimate Interest:</span>
						<span
							>For internal analytics to improve app functionality, without impacting your rights or
							freedoms.</span
						>
					</li>
				</ul>
				<p class="mt-4">You can withdraw your consent at any time.</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">4. Data Retention and Deletion</h2>
				<ul class="list-disc space-y-2 pl-6">
					<li>Your data is retained until you delete your account or withdraw consent.</li>
					<li>Deleting your account will remove all associated personal and health data.</li>
					<li>You can request data export in JSON format before deletion.</li>
					<li>
						Accounts may also be placed in a "maintenance mode" if inactive, anonymizing personal
						identifiers.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">5. Your Rights</h2>
				<p class="mb-4">Under GDPR, you have the right to:</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>Access your personal data.</li>
					<li>Correct or update your information.</li>
					<li>Delete your account and associated data.</li>
					<li>Withdraw consent at any time.</li>
					<li>Export your data in a machine-readable format (JSON).</li>
				</ul>
				<p class="mt-4">To exercise any of these rights, contact us at yassin@yassinsassi.com.</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">6. Security Measures</h2>
				<p class="mb-4">
					We implement reasonable technical and organizational measures to protect your data:
				</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>Encrypted connections (HTTPS) for all data transmission.</li>
					<li>Hashed passwords.</li>
					<li>Token-based authentication (access and refresh tokens).</li>
					<li>Regular reviews of security practices.</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">7. Data Sharing</h2>
				<p class="mb-4">We may share your data with:</p>
				<ul class="space-y-3 pl-6">
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Service Providers:</span>
						<span>Hosting, storage, and analytics providers who process data on our behalf.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-semibold text-blue-400">Legal Obligations:</span>
						<span>If required by law or legal process.</span>
					</li>
				</ul>
				<p class="mt-4 font-semibold text-white">
					We do not sell or rent your personal information.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">8. Cookies and Tracking</h2>
				<p>
					If the app uses cookies or tracking scripts for analytics, the purpose and users' ability
					to opt-out will be disclosed in this section.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">9. Policy Updates</h2>
				<p>
					We may update this Privacy Policy from time to time. The latest version will be posted on
					our website.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">10. Contact Us</h2>
				<p class="mb-4">For questions about this Privacy Policy or to exercise your data rights:</p>
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
