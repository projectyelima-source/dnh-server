# Testing Chat Endpoints with Postman

---

## 1. Setup Environment Variables

Create a Postman environment with:

| Variable | Example Value | Notes |
|---|---|---|
| `baseUrl` | `http://localhost:4815/api/v1` | Dev server |
| `hcpToken` | `eyJhbGciOi...` | JWT from chronic care login |
| `clientToken` | `eyJhbGciOi...` | Firebase ID token |
| `hcpId` | `66a1b2c3d4e5f6a7b8c9d0e1` | HCP's MongoDB ObjectId (`sub` claim) |
| `patientId` | `user_abc123` | Patient's Firebase UID |
| `roomId` | `66a1b2c3d4e5f6a7b8c9d0e1` | Created by WebSocket |

---

## 2. Getting Auth Tokens

### HCP JWT

1. Hit the login endpoint (e.g., `POST /api/v1/auth/login` with credentials)
2. Copy the JWT from the response into `{{hcpToken}}`

### Client Firebase Token

Use the Firebase REST API to get a custom token, then exchange it for an ID token:

**Step 1 — Sign in**
```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={{FIREBASE_API_KEY}}
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "****",
  "returnSecureToken": true
}
```

**Step 2** — Copy the `idToken` from the response into `{{clientToken}}`.

---

## 3. Testing HTTP Endpoints

### Health check

```http
GET {{baseUrl}}/
```

### HCP Sessions

```http
GET {{baseUrl}}/chat/hcp/sessions?page=1&limit=10
Authorization: Bearer {{hcpToken}}
```

### Client Sessions

```http
GET {{baseUrl}}/chat/client/sessions?page=1&limit=10
Authorization: Bearer {{clientToken}}
```

### Message History (HCP)

```http
GET {{baseUrl}}/chat/hcp/rooms/{{roomId}}/messages?page=1&limit=10
Authorization: Bearer {{hcpToken}}
```

To paginate:
```http
GET {{baseUrl}}/chat/hcp/rooms/{{roomId}}/messages?page=2&limit=10
```

### Message History (Client)

```http
GET {{baseUrl}}/chat/client/rooms/{{roomId}}/messages?page=1&limit=10
Authorization: Bearer {{clientToken}}
```

### Upload Media (HCP)

1. Set method to `POST`
2. URL: `{{baseUrl}}/chat/hcp/rooms/{{roomId}}/media`
3. Headers: `Authorization: Bearer {{hcpToken}}`
4. Body → `form-data`:
   - Key: `file` (type: File) — select an image/video/audio file
   - Key: `parentMessageId` (optional, type: Text)

### Upload Media (Client)

Same but use `{{clientToken}}` and `/chat/client/rooms/{{roomId}}/media`.

---

## 4. Testing WebSocket (Socket.IO)

Postman supports Socket.IO connections in **Postman v10+**.

### Create a Socket.IO Request

1. New → **Socket.IO**
2. Enter URL: `http://localhost:4815`
3. Go to the **Events** tab

### Auth Handshake

Set `auth` in the handshake options:
```json
{
  "token": "{{hcpToken}}",
  "clientType": "hcp"
}
```

Or for client:
```json
{
  "token": "{{clientToken}}",
  "clientType": "patient"
}
```

> Note: Postman may not show `auth` in the UI for Socket.IO. If so, use a **Pre-request Script** or connect via the **WebSocket** (raw) option instead. Alternatively, use `wscat` or a small Node script.

---

## 5. Testing WebSocket with Node.js (Alternative)

If Postman's Socket.IO support is limited, use a quick Node script:

```ts
// test-ws.mjs
import { io } from 'socket.io-client';

const socket = io('http://localhost:4815', {
  transports: ['websocket'],
  auth: {
    token: process.env.HCP_TOKEN,
    clientType: 'hcp',
  },
});

socket.on('connect', () => {
  console.log('connected as', socket.id);
});

socket.on('userConnected', (user) => {
  console.log('my user id:', user.id, 'role:', user.role);

  // Join a room
  socket.emit('joinPrivateChat', { recipientId: process.env.PATIENT_ID });
});

socket.on('roomJoined', (data) => {
  console.log('room:', data.roomId);

  // Send a message
  socket.emit('sendMessage', {
    roomId: data.roomId,
    content: 'Hello!',
  });

  // Edit it after 2s (paste the message id from newMessage)
  setTimeout(() => {
    socket.emit('editMessage', {
      roomId: data.roomId,
      messageId: '...', // paste the id from newMessage
      content: 'Edited message',
    });
  }, 2000);

  // Delete it after 4s (paste the message id)
  setTimeout(() => {
    socket.emit('deleteMessage', {
      roomId: data.roomId,
      messageId: '...', // paste the id
      deleteFor: 'everyone',
    });
  }, 4000);
});

socket.on('newMessage', (msg) => {
  console.log('new message:', msg.id, msg.content, 'edited:', msg.edited);
});

socket.on('messageEdited', ({ id, content, edited }) => {
  console.log('message edited:', id, content, edited);
});

socket.on('messageDeleted', ({ id, deletedForEveryone }) => {
  console.log('message deleted:', id, 'forEveryone:', deletedForEveryone);
});

socket.on('userStatus', ({ userId, online, lastSeen }) => {
  console.log('user', userId, online ? 'online' : 'offline', lastSeen || '');
});

socket.on('disconnect', () => console.log('disconnected'));
```

Run it:
```bash
HCP_TOKEN=eyJ... PATIENT_ID=user_abc123 node test-ws.mjs
```

---

## 6. WebSocket Events to Test Manually

| Step | Event | Payload | Expected Outcome |
|---|---|---|---|---|
| 0 | *(listen)* `userConnected` | — | Receive `{ id, role }` on connect |
| 1 | `joinPrivateChat` | `{ recipientId: "user_abc123" }` | Receive `roomJoined` with roomId |
| 2 | `sendMessage` | `{ roomId, content: "hi" }` | All room members receive `newMessage` |
| 2b | `sendMessage` (reply) | `{ roomId, content: "reply", parentMessageId: "..." }` | `newMessage` includes populated `parentMessageId` object |
| 2c | `editMessage` | `{ roomId, messageId, content: "edited" }` | All members receive `messageEdited` with updated content |
| 2d | `deleteMessage` | `{ roomId, messageId, deleteFor: "everyone" }` | All members receive `messageDeleted` with `deletedForEveryone: true` |
| 2e | `deleteMessage` | `{ roomId, messageId, deleteFor: "me" }` | Only the requester receives `messageDeleted` with `deletedForEveryone: false` |
| 3 | `typing` | `{ roomId, isTyping: true }` | Other member receives `userTyping` with `userId` + `isTyping: true` |
| 4 | `audioRecording` | `{ roomId, isRecording: true }` | Other member receives `userAudioRecording` with `userId` + `isRecording: true` |
| 5 | `markRead` | `{ roomId }` | Sender receives `messagesRead`; message history shows `isRead: true` |
| 6 | *(listen)* `userStatus` | — | Receive presence updates when the other user connects/disconnects |

---

## 7. End-to-End Test Flow

```
 0.  WS    *(listen)* userConnected                 → receive `{ id, role }`
 1.  WS    joinPrivateChat(recipientId: patientId)   → roomJoined with roomId
 2.  WS    sendMessage(roomId, "Test message")       → newMessage event
  2b. WS    editMessage(roomId, msgId, "Edited")      → messageEdited event
  2c. WS    sendMessage(roomId, "Reply", parentMessageId: "...") → newMessage with parentMessageId populated
  2d. WS    deleteMessage(roomId, msgId, "everyone")   → messageDeleted event (all see placeholder)
  2e. WS    deleteMessage(roomId, msgId, "me")         → messageDeleted event (only sender, message removed)
  3.  WS    markRead(roomId)                          → messagesRead event + isRead flips
 4.  POST  /api/v1/chat/hcp/rooms/{roomId}/media     → upload image, get URL back
 5.  GET   /api/v1/chat/hcp/rooms/{roomId}/messages   → see messages with `edited`, `parentMessageId` fields
 6.  GET   /api/v1/chat/client/sessions              → patient sees session with `unread: true`
 7.  WS    (as patient) joinPrivateChat(hcpId)       → join same room
 8.  WS    (as patient) sendMessage("Reply")         → reply visible to HCP
 9.  WS    *(listen)* userStatus                     → receive online/offline updates
```
