const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormbutton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  // get the New message element
  const $newMessage = $messages.lastElementChild

  // get the height of new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible Height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  // scrollHeight - gives us the total height that we are able to scroll through 
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

// server(emit) -> client(receive) --acknowledgement--> server
// client(emit) -> server(receive) --acknowledgement--> client

socket.on("message", msg => {
  console.log(msg)
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("locationMessage", msg => {
  console.log(msg)
  const html = Mustache.render(locationMessageTemplate, {
    username: msg.username,
    url: msg.url,
    createdAt: moment(msg.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room: room,
    users: users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", e => {
  e.preventDefault()

  $messageFormbutton.setAttribute("disabled", "disabled")
  // disable
  const message = e.target.elements.message.value

  socket.emit("sendMessage", message, error => {
    $messageFormbutton.removeAttribute("disabled")
    $messageFormInput.value = ""
    $messageFormInput.focus()
    // enable

    if (error) {
      return console.log(error)
    }

    console.log("Message delivered!")
  })
})

$sendLocationButton.addEventListener("click", e => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser!")
  }

  $sendLocationButton.setAttribute("disabled", "disabled")

  // getCurrentPosition - sync(takes time), but doesn't support promise API
  // So, we can't use promises or async/await
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        $sendLocationButton.removeAttribute("disabled")
        console.log("Location shared!")
      }
    )
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

// socket.on("countUpdated", count => {
//   console.log("The count has been updated!", count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("Clicked");

//   socket.emit("increment"); // no need to send any data across as server knows current count and its just going to add one to it
// });

// Users location using browsers geolocation API
// fetch the latitude and longitude -> sent to server -> server shares to everyone
