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

  // Join a room
  socket.emit('joinPrivateChat', { recipientId: process.env.PATIENT_ID });

  // Listen for room response
  socket.on('joinPrivateChat', (room) => {
    console.log('room:', room);

    // Send a message
    socket.emit('sendMessage', {
      roomId: room.id,
      content: 'Hello from Postman test!',
    });
  });

  // Listen for new messages
  socket.on('newMessage', (msg) => {
    console.log('new message:', msg);
  });
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
|---|---|---|---|
| 1 | `joinPrivateChat` | `{ recipientId: "user_abc123" }` | Receive room object back |
| 2 | `sendMessage` | `{ roomId, content: "hi" }` | All room members receive `newMessage` |
| 3 | `typing` | `{ roomId, isTyping: true }` | Other member receives `typing` with `userId` + `isTyping: true` |
| 4 | `markRead` | `{ roomId }` | Sender's unread messages in the room get `isRead: true` (check via history endpoint) |

---

## 7. End-to-End Test Flow

```
1.  POST  /api/v1/chat/hcp/sessions              → get roomId (or empty array)
2.  WS    joinPrivateChat(recipientId: patientId) → room object (create if none)
3.  WS    sendMessage(roomId, "Test message")     → newMessage event
4.  GET   /api/v1/chat/hcp/rooms/{roomId}/messages → see the message
5.  WS    markRead(roomId)                        → isRead flips to true
6.  POST  /api/v1/chat/hcp/rooms/{roomId}/media   → upload image, get URL back
7.  GET   /api/v1/chat/client/sessions            → patient sees the session
8.  WS    (as patient) joinPrivateChat(hcpId)     → join same room
9.  WS    (as patient) sendMessage("Reply")       → reply visible to HCP
```
