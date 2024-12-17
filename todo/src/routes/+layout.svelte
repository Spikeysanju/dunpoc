<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="bg-paper min-h-screen bg-[#f4f1ea]">
	<main class="container mx-auto max-w-3xl px-4 py-12">
		<div class="min-h-screen border-x border-black/10 bg-[#f9f6f1] px-8 py-12 shadow-inner">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.bg-paper {
		background-image: repeating-linear-gradient(#f4f1ea 0px, #f4f1ea 24px, #e7e4dd 25px);
		background-size: 100% 25px;
	}
</style>
