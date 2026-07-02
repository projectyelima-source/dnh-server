# Chat Module — HCP (Web / Dashboard)

All `hcp`-prefixed endpoints are protected by **Chronic Care JWT** (`Authorization: Bearer <jwt>`). The JWT `sub` claim must be the HCP's MongoDB ObjectId (matching a `Personnel` document).

---

## Auth Setup

1. Log in via the chronic care auth endpoint — receive a JWT
2. Attach to every HTTP request: `Authorization: Bearer <jwt>`
3. For WebSocket, pass the token in `auth.token` + `auth.clientType = 'hcp'`

---

## WebSocket (Real-time Chat)

**Connection**
```ts
import { io } from 'socket.io-client';

const socket = io('https://api.example.com', {
  transports: ['websocket'],
  auth: {
    token: jwtToken,
    clientType: 'hcp',
  },
});

socket.on('connect', () => console.log('connected'));
```

### Events

| Direction | Event | Payload | Notes |
|---|---|---|---|
| Client → Server | `joinPrivateChat` | `{ recipientId: string }` | `recipientId` = Patient's Firebase UID (`user_xxx`). Server returns the room. |
| Client → Server | `sendMessage` | `{ roomId: string, content: string, messageType?: string, parentMessageId?: string }` | Default `messageType` is `'text'`. |
| Server → Client | `newMessage` | `ChatMessage` object | Broadcast to all room participants. |
| Client → Server | `typing` | `{ roomId: string, isTyping: boolean }` | Start/stop typing indicator. |
| Server → Client | `typing` | `{ roomId: string, userId: string, isTyping: boolean }` | Other participant's typing state. |
| Client → Server | `markRead` | `{ roomId: string }` | Marks own unread messages as read. |

### Flow

```ts
// 1. Join room with a patient
socket.emit('joinPrivateChat', { recipientId: 'user_abc123' });

// 2. Listen for room response
socket.on('joinPrivateChat', (room) => {
  currentRoomId = room.id;
  loadHistory(room.id);
});

// 3. Send a message
socket.emit('sendMessage', {
  roomId: currentRoomId,
  content: 'Take your medication twice daily.',
});

// 4. Handle incoming messages
socket.on('newMessage', (msg) => {
  // prepend to message list or show notification
});

// 5. Typing indicator
socket.emit('typing', { roomId: currentRoomId, isTyping: true });

socket.on('typing', ({ userId, isTyping }) => {
  if (userId !== myId) setOtherTyping(isTyping);
});

// 6. Mark as read when viewing a room
socket.emit('markRead', { roomId: currentRoomId });
```

---

## HTTP Endpoints

Base URL: `https://api.example.com/api/v1`

### List Chat Sessions

```http
GET /chat/hcp/sessions
Authorization: Bearer <jwt>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "66a1b2c3d4e5f6a7b8c9d0e1",
      "otherParticipant": {
        "id": "user_abc123",
        "name": "Jane Doe",
        "role": "patient"
      },
      "latestMessage": {
        "id": "77a1b2c3d4e5f6a7b8c9d0e2",
        "content": "I have a headache",
        "messageType": "text",
        "senderId": "user_abc123",
        "createdAt": "2026-07-02T10:30:00.000Z"
      }
    }
  ],
  "message": "Chat sessions fetched successfully"
}
```

### Get Message History

```http
GET /chat/hcp/rooms/{roomId}/messages?limit=20&cursor=…
Authorization: Bearer <jwt>
```

| Param | Type | Required | Description |
|---|---|---|---|
| `roomId` | path | yes | MongoDB ObjectId of the room |
| `limit` | query | no | Messages per page (default 20) |
| `cursor` | query | no | `_id` of the oldest message from the previous page |

**Response shape** identical to the client endpoint (see `chat-client.md`).

### Upload Media

```http
POST /chat/hcp/rooms/{roomId}/media
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

file: <binary>
parentMessageId: <optional>
```

Same constraints as the client variant: max 50 MB, image/video/audio mime types only.

---

## UI Integration Tips

- **Contact list**: Fetch `GET /chat/hcp/sessions` on dashboard load to show the sidebar with patient names and last message previews.
- **Unread count**: Listen for `newMessage` events globally; if `senderId !== myId` and the room isn't the active one, increment a badge counter.
- **Infinite scroll**: Use cursor-based pagination on scroll-to-top (oldest messages load first within a page, but the list is reversed by the server so newest-appearing messages are at the bottom).
- **Media thumbnails**: Check `messageType` — `'image'` URLs can be used directly in `<img>` tags; `'video'` and `'audio'` URLs go in `<video>` / `<audio>` controls.
