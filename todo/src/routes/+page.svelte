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
</script>

<div class="space-y-8" in:fade={{ duration: 300 }}>
	<div class="flex items-center justify-between" in:slide={{ duration: 300, delay: 150 }}>
		<div>
			<h1 class="text-2xl font-semibold text-foreground/90">Welcome, {data.user.username}</h1>
			<p class="text-sm text-muted-foreground mt-1 animate-in fade-in slide-in-from-left-1">
				{connectionStatus} • ID: {data.user.id}
			</p>
		</div>
		<div class="flex gap-2" in:slide={{ duration: 300, delay: 300, axis: 'x' }}>
			<button
				onclick={fetchTodos}
				class="px-3 py-1.5 text-sm rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all active:scale-95"
			>
				Refresh
			</button>
			<form method="post" action="?/logout" use:enhance>
				<button
					class="px-3 py-1.5 text-sm rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all active:scale-95"
				>
					Sign out
				</button>
			</form>
		</div>
	</div>

	{#if data.user}
		<div class="flex gap-2" in:slide={{ duration: 300, delay: 450 }}>
			<input
				type="text"
				bind:value={newTodo}
				placeholder="What needs to be done?"
				class="flex-1 px-4 py-2 rounded-lg bg-background/50 backdrop-blur-sm border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
				onkeydown={(e) => e.key === 'Enter' && addTodo()}
			/>
			<button
				onclick={addTodo}
				class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
			>
				Add
			</button>
		</div>

		<ul class="space-y-2">
			{#each todos as todo (todo.id)}
				<li
					animate:flip={{ duration: 300 }}
					in:scale|local={{ duration: 300, start: 0.95 }}
					out:fade|local={{ duration: 200 }}
					class="group flex items-center gap-3 px-4 py-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border hover:border-border/80 transition-all hover:translate-x-1 hover:shadow-md"
				>
					<input
						type="checkbox"
						checked={todo.completed}
						onchange={() => toggleComplete(todo)}
						class="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary transition-all"
					/>
					<span 
						class="flex-1 transition-all duration-200 {todo.completed ? 'line-through text-muted-foreground' : ''}"
					>
						{todo.title}
					</span>
					<button
						onclick={() => deleteTodo(todo.id)}
						class="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-sm text-destructive hover:bg-destructive/10 transition-all duration-200"
					>
						Delete
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<div 
			in:fade
			class="text-center py-8 text-muted-foreground"
		>
			Please log in to see your todos.
		</div>
	{/if}
</div>
