<script lang="ts">
// ... existing imports ...

let editingId = $state<number | null>(null);
let editText = $state<string>('');

// ... existing socket setup ...

socket.on('todoTitleUpdated', ({ id, title }) => {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.title = title;
  if (editingId === id) {
    editingId = null;
    editText = '';
  }
});

function startEdit(todo: Todos) {
  editingId = todo.id;
  editText = todo.title;
}

function saveEdit() {
  if (editingId && editText.trim() && socket) {
    socket.emit('updateTodoTitle', { id: editingId, title: editText.trim() });
  }
}

function cancelEdit() {
  editingId = null;
  editText = '';
}
</script>

<!-- Update the todo list item -->
<li
  animate:flip={{ duration: 300 }}
  in:scale|local={{ duration: 300, start: 0.98 }}
  out:fade|local={{ duration: 200 }}
  class="group flex items-center gap-4 py-3 border-b border-black/5"
>
  <input
    type="checkbox"
    checked={todo.completed}
    onchange={() => toggleComplete(todo)}
    class="w-4 h-4 rounded-none border-black/20 text-black/80 focus:ring-0 transition-colors"
  />
  
  {#if editingId === todo.id}
    <div class="flex-1 flex gap-2">
      <input
        type="text"
        bind:value={editText}
        class="flex-1 px-0 py-1 bg-transparent border-b border-black/20 font-serif text-xl focus:ring-0 focus:border-black/40"
        onkeydown={(e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
      />
      <button
        onclick={saveEdit}
        class="text-[10px] uppercase tracking-widest hover:text-black/50"
      >
        Save
      </button>
      <button
        onclick={cancelEdit}
        class="text-[10px] uppercase tracking-widest hover:text-black/50"
      >
        Cancel
      </button>
    </div>
  {:else}
    <span 
      class="flex-1 font-serif text-xl transition-all {todo.completed ? 'line-through text-black/30' : ''}"
      ondblclick={() => startEdit(todo)}
    >
      {todo.title}
    </span>
    <div class="opacity-0 group-hover:opacity-100 flex gap-3 transition-all">
      <button
        onclick={() => startEdit(todo)}
        class="text-[10px] uppercase tracking-widest text-black/30 hover:text-black/50"
      >
        Edit
      </button>
      <button
        onclick={() => deleteTodo(todo.id)}
        class="text-[10px] uppercase tracking-widest text-black/30 hover:text-red-900/50"
      >
        Remove
      </button>
    </div>
  {/if}
</li>