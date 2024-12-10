import { env } from '$env/dynamic/public';
import { io, Socket } from 'socket.io-client';

// Enhanced connection configuration
export const socket = io(env.PUBLIC_SOCKET_URL, {
	withCredentials: true,
	autoConnect: true,
	transports: ['websocket', 'polling'],
	reconnection: true,
	reconnectionAttempts: 10, // Increased attempts
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000, // Added max delay
	timeout: 20000,
	forceNew: true // Ensure clean connection
});

// Enhanced error handling
socket.on('connect_error', (error) => {
	console.error('Socket connection error:', {
		timestamp: new Date().toISOString(),
		error: error.message,
		type: error.type
	});
});

// Enhanced disconnect handling
socket.on('disconnect', (reason) => {
	console.log('Socket disconnected:', {
		timestamp: new Date().toISOString(),
		reason,
		wasClean: reason === 'io client disconnect'
	});
});

// Added connection monitoring
socket.on('connect', () => {
	console.log('Socket connected:', {
		timestamp: new Date().toISOString(),
		id: socket.id
	});
});

// Added reconnect attempt monitoring
socket.on('reconnect_attempt', (attemptNumber) => {
	console.log('Reconnection attempt:', {
		timestamp: new Date().toISOString(),
		attempt: attemptNumber
	});
});

export const createSocketConnection = (token: string): Socket => {
	const socket = io(env.PUBLIC_SOCKET_URL, {
		auth: {
			token: token // Pass JWT token received after login
		},
		reconnection: true,
		reconnectionDelay: 1000
	});

	// Enhanced error handling
	socket.on('connect_error', (error) => {
		console.error('Socket connection error:', {
			timestamp: new Date().toISOString(),
			error: error.message,
			type: error.type
		});
	});

	// Enhanced disconnect handling
	socket.on('disconnect', (reason) => {
		console.log('Socket disconnected:', {
			timestamp: new Date().toISOString(),
			reason,
			wasClean: reason === 'io client disconnect'
		});
	});

	// Added connection monitoring
	socket.on('connect', () => {
		console.log('Socket connected:', {
			timestamp: new Date().toISOString(),
			id: socket.id
		});
	});

	// Added reconnect attempt monitoring
	socket.on('reconnect_attempt', (attemptNumber) => {
		console.log('Reconnection attempt:', {
			timestamp: new Date().toISOString(),
			attempt: attemptNumber
		});
	});

	return socket;
};
