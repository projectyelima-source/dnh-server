import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '@/core/auth/auth.service';
import { FirebaseService } from '@/core/firebase/firebase.service';

export interface AuthenticatedUser {
	id: string;
	role: 'patient' | 'hcp';
	email?: string;
}

@Injectable()
export class WsAuthVerifier {
	private logger = new Logger(WsAuthVerifier.name);

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly authService: AuthService,
	) {}

	async verify(client: Socket): Promise<AuthenticatedUser> {
		const auth = client.handshake.auth;
		let token = auth?.token;
		const clientType = auth?.clientType;

		if (!token) {
			throw new WsException('Authentication token is required');
		}

		if (!clientType || !['patient', 'hcp'].includes(clientType)) {
			throw new WsException('Invalid clientType. Must be "patient" or "hcp"');
		}

		if (token.startsWith('Bearer ')) {
			token = token.slice(7);
		}

		try {
			if (clientType === 'patient') {
				const decoded = await this.firebaseService.verifyAsync(token);
				return {
					id: decoded.uid,
					role: 'patient',
					email: decoded.email,
				};
			}

			const decoded = await this.authService.verifyChronicCareToken(token);
			return {
				id: (decoded as any).sub || (decoded as any).id,
				role: 'hcp',
				email: (decoded as any).email,
			};
		} catch (error) {
			this.logger.error('WebSocket auth verification failed', error);
			throw new WsException('Invalid or expired token');
		}
	}
}
