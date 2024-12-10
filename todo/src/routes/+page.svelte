<script lang="ts">
	import type { Todos } from '$lib/server/db/schema';
	import { createSocketConnection } from '$lib/socket';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

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

		// socket = createSocketConnection(data.sessionToken);
		socket = createSocketConnection('fake-token');

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

<main>
	<h1>Real-Time Todo App, {data.user.username}!</h1>
	<p>Connection status: {connectionStatus}</p>
	<p>Your user ID is {data.user.id}.</p>
	<button onclick={fetchTodos}>fetch todo</button>
	<form method="post" action="?/logout" use:enhance>
		<button>Sign out</button>
	</form>

	{#if data.user}
		<input
			type="text"
			bind:value={newTodo}
			placeholder="Add a new todo..."
			onkeydown={(e) => e.key === 'Enter' && addTodo()}
		/>
		<button onclick={addTodo}>Add</button>

		<ul>
			{#each todos as todo}
				<!-- Change from data.todos to todos -->
				<li>
					<input type="checkbox" checked={todo.completed} onchange={() => toggleComplete(todo)} />
					{todo.title}
					<button onclick={() => deleteTodo(todo.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Please log in to see your todos.</p>
	{/if}
</main>
