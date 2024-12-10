import { io } from 'socket.io-client';

export function createSocketConnection(sessionToken: string) {
	const socket = io('http://localhost:3000', {
		auth: {
			sessionToken
		}
	});

	return socket;
}
