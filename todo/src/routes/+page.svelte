<script lang="ts">
	import type { Todos } from '$lib/server/db/schema';
	import { createSocketConnection } from '$lib/socket';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { fade, slide, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let { data }: PageData = $props();
	let todos = $state<Todos[]>(data.todos);
	let newTodo = $state<string>('');
	let connectionStatus = $state<string>('Connecting...');
	let socket = $state<ReturnType<typeof createSocketConnection>>();
	let editingId = $state<number | null>(null);
	let editingText = $state<string>('');

	onMount(async () => {
		if (!data.sessionToken) {
			connectionStatus = 'No session token found';
			return;
		}

		socket = createSocketConnection(data.sessionToken);

		socket.on('connect', () => {
			connectionStatus = 'Connected';
			socket?.emit('fetchTodos', data.user.id);
		});

		socket.on('connect_error', () => {
			connectionStatus = 'Connection error. Retrying...';
		});

		socket.on('disconnect', () => {
			connectionStatus = 'Disconnected';
		});

		socket.emit('fetchTodos', data.user.id);

		socket.on('todos', (data) => {
			todos = data;
		});

		socket.on('todoAdded', (todo) => {
			todos = [...todos, todo];
			console.log('Todo added, new todos:', todos); // Add logging
		});

		socket.on('todoUpdated', ({ id, completed }) => {
			const todo = todos.find((t) => t.id === id);
			if (todo) todo.completed = completed;
		});

		socket.on('todoDeleted', (id) => {
			todos = todos.filter((t) => t.id !== id);
		});

		socket.on('todoTitleUpdated', ({ id, title }) => {
			const todo = todos.find((t) => t.id === id);
			if (todo) todo.title = title;
			editingId = null;
		});

		socket.on('error', (error) => {
			alert(error.message);
		});
	});

	function addTodo() {
		if (newTodo.trim() && socket) {
			socket.emit('addTodo', { title: newTodo, userId: data.user.id });
			newTodo = '';
		}
	}

	function fetchTodos() {
		socket?.emit('fetchTodos', data.user.id);
	}

	function toggleComplete(todo: Todos) {
		socket?.emit('updateTodo', { id: todo.id, completed: !todo.completed, userId: data.user.id });
	}

	function deleteTodo(id: number) {
		socket?.emit('deleteTodo', { id, userId: data.user.id });
	}

	function startEditing(todo: Todos) {
		editingId = todo.id;
		editingText = todo.title || '';
	}

	function saveEdit() {
		if (editingId && editingText.trim() && socket) {
			socket.emit('updateTodoTitle', { id: editingId, title: editingText });
		}
	}

	function cancelEdit() {
		editingId = null;
		editingText = '';
	}
</script>

<div class="max-w-2xl mx-auto px-4 py-8 space-y-12" in:fade={{ duration: 300 }}>
	<!-- Header Section -->
	<header class="border-b border-border/30 pb-6" in:slide={{ duration: 300, delay: 150 }}>
		<h1 class="font-serif text-3xl text-foreground/90">{data.user.username}'s Tasks</h1>
		<div class="flex items-center justify-between mt-4">
			<p class="font-mono text-xs text-muted-foreground">
				{connectionStatus} • ID: {data.user.id}
			</p>
			<div class="flex gap-3 text-sm">
				<button
					onclick={fetchTodos}
					class="text-muted-foreground hover:text-foreground transition-colors"
				>
					Refresh
				</button>
				<form method="post" action="?/logout" use:enhance>
					<button class="text-destructive/70 hover:text-destructive transition-colors">
						Sign out
					</button>
				</form>
			</div>
		</div>
	</header>

	{#if data.user}
		<!-- Input Section -->
		<div class="space-y-6" in:slide={{ duration: 300, delay: 450 }}>
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={newTodo}
					placeholder="What needs to be done?"
					class="flex-1 px-0 py-2 bg-transparent border-b border-border/30 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50"
					onkeydown={(e) => e.key === 'Enter' && addTodo()}
				/>
				<button
					onclick={addTodo}
					class="font-medium text-primary hover:text-primary/80 transition-colors"
				>
					Add Task
				</button>
			</div>

			<!-- Todo List -->
			<ul class="space-y-4">
				{#each todos as todo (todo.id)}
					<li
						animate:flip={{ duration: 300 }}
						in:scale|local={{ duration: 300, start: 0.98 }}
						out:fade|local={{ duration: 200 }}
						class="group flex items-center gap-4 py-3 border-b border-border/10 hover:border-border/30 transition-all"
					>
						<input
							type="checkbox"
							checked={todo.completed}
							onchange={() => toggleComplete(todo)}
							class="w-4 h-4 border-muted-foreground/30 text-primary/80 focus:ring-0 transition-colors"
						/>
						{#if editingId === todo.id}
							<div class="flex-1 flex gap-2">
								<input
									type="text"
									bind:value={editingText}
									class="flex-1 px-2 py-1 bg-background border border-border rounded focus:border-primary/50 outline-none"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveEdit();
										if (e.key === 'Escape') cancelEdit();
									}}
								/>
								<button
									onclick={saveEdit}
									class="text-xs text-primary hover:text-primary/80 transition-colors"
								>
									Save
								</button>
								<button
									onclick={cancelEdit}
									class="text-xs text-muted-foreground hover:text-destructive transition-colors"
								>
									Cancel
								</button>
							</div>
						{:else}
							<span 
								class="flex-1 font-serif text-lg transition-all duration-200 {todo.completed ? 'line-through text-muted-foreground/50' : ''}"
								ondblclick={() => startEditing(todo)}
							>
								{todo.title}
							</span>
						{/if}
						<button
							onclick={() => deleteTodo(todo.id)}
							class="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-all duration-200"
						>
							Remove
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<div 
			in:fade
			class="text-center py-12 text-muted-foreground font-serif text-lg"
		>
			Please log in to see your tasks.
		</div>
	{/if}
</div>
