<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-[#f4f1ea] bg-paper">
  <main class="container mx-auto px-4 py-12 max-w-3xl">
    <div class="border-x border-black/10 min-h-screen px-8 py-12 bg-[#f9f6f1] shadow-inner">
      {@render children()}
    </div>
  </main>
</div>

<style>
  .bg-paper {
    background-image: 
      repeating-linear-gradient(#f4f1ea 0px, #f4f1ea 24px, #e7e4dd 25px);
    background-size: 100% 25px;
  }
</style> 