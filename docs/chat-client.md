# Chat Module — Client (Flutter / Mobile)

All `client`-prefixed endpoints are protected by **Firebase Auth** (`Authorization: Bearer <id-token>`).

---

## Auth Setup

1. Authenticate user via Firebase (email/password, Google, etc.)
2. Extract the **Firebase ID token** (JWT) from the auth result
3. Attach to every HTTP request: `Authorization: Bearer <token>`
4. For WebSocket, pass the token in `auth.token` + `auth.clientType = 'patient'`

---

## WebSocket (Real-time Chat)

**Connection**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://api.example.com',
  IO.OptionBuilder()
    .setTransports(WebSocket) // or ['websocket']
    .setAuth({
      'token': firebaseIdToken,
      'clientType': 'patient',
    })
    .build(),
);

socket.onConnect((_) => print('connected'));
socket.onDisconnect((_) => print('disconnected'));
```

### Events

| Direction | Event | Payload | Notes |
|---|---|---|---|
| Client → Server | `joinPrivateChat` | `{ recipientId: string }` | `recipientId` = HCP's MongoDB ObjectId string. Server returns the room. |
| Client → Server | `sendMessage` | `{ roomId: string, content: string, messageType?: 'text' \| 'image' \| 'video' \| 'audio', parentMessageId?: string }` | Default `messageType` is `'text'`. |
| Server → Client | `newMessage` | `ChatMessage` object | Emitted to everyone in the room. |
| Client → Server | `typing` | `{ roomId: string, isTyping: boolean }` | Emitted as the user starts/stops typing. |
| Client → Server | `markRead` | `{ roomId: string }` | Marks all unread messages in the room as read (sent by the recipient). |

### Flow

```dart
// 1. Join a room with an HCP
socket.emit('joinPrivateChat', { 'recipientId': hcpObjectId });

// 2. Listen for the room response
socket.on('joinPrivateChat', (room) {
  setState(() => currentRoomId = room['id']);
});

// 3. Send a message
socket.emit('sendMessage', {
  'roomId': currentRoomId,
  'content': 'Hello doctor!',
});

// 4. Receive messages
socket.on('newMessage', (msg) {
  messages.add(ChatMessage.fromJson(msg));
});

// 5. Typing indicator
socket.emit('typing', { 'roomId': currentRoomId, 'isTyping': true });
socket.on('typing', (data) {
  // show/hide typing indicator based on data['isTyping']
});

// 6. Mark messages as read when viewing a room
socket.emit('markRead', { 'roomId': currentRoomId });
```

---

## HTTP Endpoints

Base URL: `https://api.example.com/api/v1`

### List Chat Sessions

```http
GET /chat/client/sessions
Authorization: Bearer <firebase-token>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "66a1b2c3d4e5f6a7b8c9d0e1",
      "otherParticipant": {
        "id": "66f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Dr. John Doe",
        "role": "hcp"
      },
      "latestMessage": {
        "id": "77a1b2c3d4e5f6a7b8c9d0e2",
        "content": "Hello, how are you?",
        "messageType": "text",
        "senderId": "66f1a2b3c4d5e6f7a8b9c0d1",
        "createdAt": "2026-07-02T10:30:00.000Z"
      }
    }
  ],
  "message": "Chat sessions fetched successfully"
}
```

Sorted by most recent message first. `latestMessage` is `null` if no messages yet.

### Get Message History (Paginated)

```http
GET /chat/client/rooms/{roomId}/messages?limit=20&cursor=…
Authorization: Bearer <firebase-token>
```

| Param | Type | Required | Description |
|---|---|---|---|
| `roomId` | path | yes | MongoDB ObjectId of the room |
| `limit` | query | no | Number of messages (default 20) |
| `cursor` | query | no | `_id` of the **oldest** message from the previous page |

**Pagination**: Messages are returned oldest-first within a page. To get the next page, pass the `id` of the first message in the current page as `cursor`.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "66a1b2c3d4e5f6a7b8c9d0e1",
      "senderId": "user_abc123",
      "roomId": "66a1b2c3d4e5f6a7b8c9d0e1",
      "messageType": "text",
      "content": "Hello doctor!",
      "isRead": true,
      "parentMessageId": null,
      "createdAt": "2026-07-02T10:30:00.000Z",
      "updatedAt": "2026-07-02T10:30:00.000Z"
    }
  ],
  "message": "Messages fetched successfully"
}
```

### Upload Media

```http
POST /chat/client/rooms/{roomId}/media
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

file: <binary>
parentMessageId: <optional - string>
```

| Field | Type | Required | Description |
|---|---|---|---|
| `roomId` | path | yes | Room to upload to |
| `file` | file | yes | Max 50 MB — jpeg, jpg, png, gif, mp4, mpeg, m4a, mp3, quicktime, webm |
| `parentMessageId` | query | no | If this media is a reply to another message |

Returns the saved `ChatMessage` with the Firebase Storage URL in `content`.
