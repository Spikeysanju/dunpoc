<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
	<main class="container mx-auto px-4 py-12 max-w-xl">
		<div class="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border/5 p-8">
			{@render children()}
		</div>
	</main>
</div>
