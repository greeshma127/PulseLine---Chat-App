import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./styles.css";

const socket = io("http://localhost:5000");

const CONTACTS = ["Amy", "David", "John", "Jane"];  //users

//profile images for users
const PROFILE_IMAGES = {
  Amy: "https://ui-avatars.com/api/?name=Amy",
  David: "https://ui-avatars.com/api/?name=David",
  John: "https://ui-avatars.com/api/?name=John",
  Jane: "https://ui-avatars.com/api/?name=Jane",
};


const getStoredMessages = () => {
  try {
    const data = localStorage.getItem("chatMessages");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveMessages = (messages) => {
  localStorage.setItem("chatMessages", JSON.stringify(messages));
};

export default function Chat() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ✅ Load messages + listen to socket messages
  useEffect(() => {
  // Load saved username
  const savedUsername = localStorage.getItem("chatUsername");
  if (savedUsername) {
    setUsername(savedUsername);
    setIsLoggedIn(true);
  }

  // Load saved messages
  const stored = getStoredMessages();
  setMessages(stored);

  // Listen for incoming messages
  socket.on("private message", (msg) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      saveMessages(updated);
      return updated;
    });
  });

  return () => {
    socket.off("private message");
  };
}, []);



  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
      localStorage.setItem("chatUsername", username);
    }
  };


  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setActiveContact(null);
    localStorage.removeItem("chatUsername");
  };



  const handleSend = () => {
    if (!input.trim() || !activeContact) return;

    const messageObj = {
      text: input,
      sender: username,
      receiver: activeContact,
      id: Date.now(),
    };

    const updatedMessages = [...messages, messageObj];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    socket.emit("private message", messageObj);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      isLoggedIn ? handleSend() : handleLogin();
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender === username && msg.receiver === activeContact) ||
      (msg.receiver === username && msg.sender === activeContact)
  );

  const handleClearChat = () => {
  const filtered = messages.filter(
    (msg) =>
      msg.sender !== activeContact && msg.receiver !== activeContact
  );
  setMessages(filtered);
  saveMessages(filtered); // if you save to localStorage or backend
};


  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Enter your username</h2>
        <input
          type="text"
          placeholder="Username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button onClick={handleLogin}>Join Chat</button>
      </div>
    );
  }

  return (
    <>
      <nav>
        <div className="nav-container">
          <div className="logo">PulseLine</div>
          <div className="hamburger" onClick={() => setShowMenu(!showMenu)}>
            ☰
          </div>
          <ul className={showMenu ? "nav-links show" : "nav-links"}>
            <li>Home</li>
            <li>Chat</li>
            <li>Contacts</li>
            <li>Settings</li>
            <li>Profile</li>
            <li className="mobile-only chats-dropdown-wrapper">
        <label htmlFor="chat-select" className="chat-label">
          Chats ▼
        </label>
        <select
          id="chat-select"
          value={activeContact || ""}
          onChange={(e) => setActiveContact(e.target.value)}
        >
          <option value="" disabled>
          
          </option>
          {CONTACTS.filter((c) => c !== username).map((contact) => (
            <option key={contact} value={contact}>
              {contact}
            </option>
          ))}
        </select>
      </li>

      {/* Logout button inside hamburger */}
      <li className="mobile-only">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="contacts">
          {CONTACTS.filter((c) => c !== username).map((contact) => {
            // Find last message with this contact
            const lastMessage = [...messages]
              .filter(
                (msg) =>
                  (msg.sender === username && msg.receiver === contact) ||
                  (msg.sender === contact && msg.receiver === username)
              )
              .sort((a, b) => b.id - a.id)[0];

              const formatTime = (timestamp) => {
                const date = new Date(timestamp);
                let hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12; // convert 0 to 12
                const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
                return `${hours}:${minutesStr} ${ampm}`;
              };
              
            return (
                    <div
        key={contact}
        className={`contact-1 ${activeContact === contact ? "active-contact" : ""}`}
        onClick={() => setActiveContact(contact)}
      >
        <div className="contact-content">
          <div className="contact-info">
            <img
              src={PROFILE_IMAGES[contact]}
              alt={contact}
              className="profile-pic"
            />
            <div className="text-info">
              <span className="contact-name">{contact}</span>
              <p className="last-message">
                <span>{lastMessage?.text || "No messages yet"}</span>
                <span className="msg-time">
                  {lastMessage ? formatTime(lastMessage.id) : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

                  );
                })}
                <div class="u desktop-only">
                  <p>Welcome, 
                  {username}{" "}<br></br>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </p>
                </div>
              </div>

        <div className="chat">
  <div className="box">
    {!activeContact ? (
      <p id="select" style={{ padding: 20 }}>Select a contact to start chatting</p>
    ) : (
      <>
        <div className="chat-header">
          <h2 className="recipient-name">{activeContact}</h2>
          <button className="clear-chat-btn" onClick={handleClearChat}>Clear Chat</button>
        </div>

        <div className="messages-container">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={msg.sender === username ? "user-msg" : "sender-msg"}
            >
              <p>
                <strong>{msg.sender}:</strong> {msg.text}
              </p>
            </div>
          ))}
        </div>
        <div className="input-container">
        <input
          type="text"
          name="msg"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSend}>➤</button>
      </div>
      </>
    )}
  </div>
</div>


      </div>
    </>
  );
}
