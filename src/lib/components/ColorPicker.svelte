<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const presetColors = [
    '#34d399',
    '#22d3ee',
    '#f472b6',
    '#fbbf24',
    '#60a5fa',
    '#c084fc',
    '#f87171',
    '#f97316',
    '#a3e635',
    '#14b8a6'
  ];

  export let value = '#34d399';
  export let labelledBy: string | undefined;

  const dispatch = createEventDispatcher<{ change: string }>();

  function setColor(color: string) {
    value = color;
    dispatch('change', color);
  }

  function handleCustomInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    setColor(input.value);
  }
</script>

<div class="space-y-2" role="group" aria-labelledby={labelledBy}>
  <div class="grid grid-cols-5 gap-2">
    {#each presetColors as color}
      <button
        type="button"
        class={`h-9 rounded-full border transition-all ${value === color ? 'border-white/70 ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-900' : 'border-white/10 hover:border-white/30'}`}
        style={`background:${color};`}
        on:click={() => setColor(color)}
        aria-pressed={value === color}
        aria-label={`Select ${color} color`}
      ></button>
    {/each}
  </div>
  <div class="flex items-center gap-3 text-xs text-gray-300">
    <input
      type="color"
      class="h-8 w-12 cursor-pointer rounded border border-white/10 bg-neutral-900"
      value={value}
      on:input={handleCustomInput}
      aria-label="Pick a custom color"
    />
    <span class="font-mono uppercase text-gray-400">{value}</span>
  </div>
</div>
