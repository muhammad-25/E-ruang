const port = process.env.PORT || 3000

const app = require("./src/router.js")
const http = require('http');
const { sessionMiddleware } = require('./src/config/session');
const ChatModel = require('./src/models/chatModel');
const BookingModel = require('./src/models/bookingModel');
const { initializeChatSocket } = require('./src/socket');
const { startBookingReminderScheduler } = require('./src/schedulers/bookingReminderScheduler');

const server = http.createServer(app);
const io = initializeChatSocket(server, sessionMiddleware);

app.set('io', io);

Promise.all([
  ChatModel.ensureSchema(),
  BookingModel.ensureReminderSchema()
])
  .then(() => {
    startBookingReminderScheduler(io);
  })
  .catch((err) => {
    console.error('Gagal memastikan schema pendukung:', err);
  });

server.listen(port, () => {
  console.log(`E-ruang listening on port ${port}`)
})
