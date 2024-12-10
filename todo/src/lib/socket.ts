import { io } from 'socket.io-client';
import { env } from '$env/dynamic/public';

export function createSocketConnection(sessionToken: string) {
	const socket = io(env.PUBLIC_SOCKET_URL, {
		auth: {
			sessionToken
		}
	});
	return socket;
}
