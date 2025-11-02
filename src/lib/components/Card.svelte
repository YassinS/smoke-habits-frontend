<script lang="ts">
  import { fade } from 'svelte/transition';
  export let className = '';
  export let padding: string | undefined = undefined;
</script>

<div
  class={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm ${className}`}
  style={padding ? `padding: ${padding}` : ''}
  transition:fade={{ duration: 150 }}
>
  <slot />

</div>
