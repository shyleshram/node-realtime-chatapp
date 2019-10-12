const express = require("express")
const http = require("http")
const path = require("path")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app) // pass in the express application
const io = socketio(server)

const port = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, "../public")))

// server to client send message
// listen

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment
// let count = 0;

io.on("connection", socket => {
  console.log("New WebSocket connection")

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit("message", generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit("message", generateMessage('Admin', `${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!")
    }

    io.to(user.room).emit("message", generateMessage(user.username, message))
    callback()
  })

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
    )
    callback()
  })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit("message", generateMessage('Admin', `${user.username} has left
      !`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })

  //   socket.emit("countUpdated", count);

  //   socket.on("increment", () => {
  //     count++;
  //     // socket.emit("countUpdated", count); for single connection
  //     io.emit("countUpdated", count); // emit o every single connection available
  //   });
})

server.listen(port, () => console.log(`Server started on port ${port}...`))

// WebSocket Protocol -> helps to set up communication
// WebSocket + NodeJS => Real time Application
// WebSockets allow for full-duplex communication
// Persistent connection between client and server
// Socket.io library
// refactoring
// configure websockets to work with our server
// reason: socketio expects it to be called with raw http server
// socket - is an object containing info about the new connection
// socket.emit() - to send an event
// socket.on() - to receive an events
// socket.join() - allows us to join a certain chat room
// io.to.emit() - emits an event to everyone in the specific room
// socket.broadcast.to.emit() - everyone except him in specific chat room