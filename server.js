const port = process.env.PORT || 3000

const app = require("./src/router.js")
const http = require('http');
const { sessionMiddleware } = require('./src/config/session');
const ChatModel = require('./src/models/chatModel');
const ReviewModel = require('./src/models/reviewModel');
const { initializeChatSocket } = require('./src/socket');

const server = http.createServer(app);
const io = initializeChatSocket(server, sessionMiddleware);

app.set('io', io);

ChatModel.ensureSchema().catch((err) => {
  console.error('Gagal memastikan schema chat:', err);
});

ReviewModel.ensureSchema().catch((err) => {
  console.error('Gagal memastikan schema ulasan:', err);
});

server.listen(port, () => {
  console.log(`E-ruang listening on port ${port}`)
})
