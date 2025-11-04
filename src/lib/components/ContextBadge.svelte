<script lang="ts">
  export let label: string;
  export let color: string = '#34d399';
</script>

<span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white" style={`border-color:${color}33; background-color:${color}22; color:${color}` }>
  <span class="h-2 w-2 rounded-full" style={`background:${color}`}></span>
  {label}
</span>
