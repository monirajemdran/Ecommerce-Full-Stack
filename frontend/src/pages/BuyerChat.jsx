import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FaPaperPlane,
  FaUserCircle,
  FaImage,
  FaReply,
  FaEdit,
  FaTrash,
  FaTimes
} from "react-icons/fa";
import { io } from "socket.io-client";
import "./BuyerChat.css";
import { swalError, swalConfirm } from "../utils/swal";

const BuyerChat = () => {
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [image, setImage] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const complaintChoices = [
    "Where is my order?",
    "Received a damaged product",
    "Payment failed / deducted twice",
    "Want to cancel my order",
    "Wrong item received",
    "Other issue"
  ];

  useEffect(() => {
    if (!user || user.role !== "buyer") {
      navigate("/");
      return;
    }

    fetchChat();

    const newSocket = io("https://shopverse-m5i8.onrender.com");
    setSocket(newSocket);

    newSocket.emit("joinChat", user._id);

    newSocket.on("newMessage", (updatedChat) => {
      setChat(updatedChat);
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, navigate]);

  const fetchChat = async () => {
    try {
      const res = await axios.get(
        `https://shopverse-m5i8.onrender.com/api/chat/${user._id}`
      );

      setChat(res.data);

      if (res.data?.messages?.length > 0) {
        setShowWelcome(false);
      }

      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() && !image) return;

    try {
      if (editingMessageId) {
        // Edit Message
        const res = await axios.put(
          `https://shopverse-m5i8.onrender.com/api/chat/${user._id}/message/${editingMessageId}`,
          {
            text: message
          }
        );

        setChat(res.data);
        setEditingMessageId(null);
      } else {
        // Send New Message
        const formData = new FormData();

        formData.append("sender", "buyer");

        if (message.trim()) {
          formData.append("text", message);
        }

        if (image) {
          formData.append("image", image);
        }

        if (replyingTo) {
          formData.append(
            "replyTo",
            JSON.stringify({
              text: replyingTo.text,
              sender: replyingTo.sender
            })
          );
        }

        const res = await axios.post(
          `https://shopverse-m5i8.onrender.com/api/chat/${user._id}/message`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );

        setChat(res.data);
      }

      setShowWelcome(false);
      setMessage("");
      setImage(null);
      setReplyingTo(null);

      scrollToBottom();
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message) {
        swalError(err.response.data.message);
      }
    }
  };

  const sendQuickReply = async (text) => {
    try {
      const formData = new FormData();

      formData.append("sender", "buyer");
      formData.append("text", text);

      const res = await axios.post(
        `https://shopverse-m5i8.onrender.com/api/chat/${user._id}/message`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setChat(res.data);
      setShowWelcome(false);

      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (msgId) => {
    const ok = await swalConfirm("Delete this message?");

    if (!ok) return;

    try {
      const res = await axios.delete(
        `https://shopverse-m5i8.onrender.com/api/chat/${user._id}/message/${msgId}`
      );

      setChat(res.data);
    } catch (err) {
      console.error(err);
      swalError("Failed to delete message.");
    }
  };

  const handleEdit = (msg) => {
    setEditingMessageId(msg._id);
    setMessage(msg.text || "");
    setReplyingTo(null);
  };

  const isEditable = (timestamp) => {
    const timeDiff =
      (Date.now() - new Date(timestamp).getTime()) / (1000 * 60);

    return timeDiff <= 30;
  };

  // FIXED CLOSE FUNCTION
  const closeChatSupport = (e) => {
  e.preventDefault();
  e.stopPropagation();

  socket?.disconnect();

  window.location.href = "/buyer";
};

  // Swipe Logic
  let touchStartX = 0;

  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e, msg) => {
    const touchEndX = e.changedTouches[0].screenX;

    // Swipe Left
    if (touchStartX - touchEndX > 50) {
      setReplyingTo(msg);
      setEditingMessageId(null);
    }

    // Swipe Right
    else if (touchEndX - touchStartX > 50) {
      setReplyingTo(msg);
      setEditingMessageId(null);
    }
  };

  return (
    <div className="buyer-chat-page">
      <Navbar />

      <div className="chat-container">
        {/* HEADER */}
        <div className="chat-header">
          <h2>
            <FaUserCircle /> Chat Support
          </h2>

          <button
            type="button"
            className="chat-close-btn"
            onClick={closeChatSupport}
            aria-label="Close chat support"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* MESSAGES */}
        <div className="chat-messages">
          {chat?.messages?.map((msg, index) => (
            <React.Fragment key={index}>
              <div
                className={`chat-message ${
                  msg.sender === "buyer" ? "sent" : "received"
                }`}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, msg)}
              >
                <div className="message-content">
                  {/* Reply Preview */}
                  {msg.replyTo && (
                    <div className="reply-preview">
                      <strong>{msg.replyTo.sender}:</strong>{" "}
                      {msg.replyTo.text}
                    </div>
                  )}

                  {/* Image */}
                  {msg.image && (
                    <img
                      src={`https://shopverse-m5i8.onrender.com/${msg.image}`}
                      alt="attached"
                      className="chat-image"
                    />
                  )}

                  {/* Text */}
                  {msg.text && <p>{msg.text}</p>}

                  {/* Footer */}
                  <div className="message-footer">
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}

                      {msg.isEdited && " (edited)"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="message-actions">
                  {/* Reply */}
                  <button
                    onClick={() => {
                      setReplyingTo(msg);
                      setEditingMessageId(null);
                    }}
                    title="Reply"
                  >
                    <FaReply />
                  </button>

                  {/* Edit */}
                  {msg.sender === "buyer" &&
                    isEditable(msg.timestamp) && (
                      <button
                        onClick={() => handleEdit(msg)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                    )}

                  {/* Delete */}
                  {msg.sender === "buyer" && (
                    <button
                      onClick={() => deleteMessage(msg._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Welcome Section */}
          {showWelcome && (
            <>
              <div className="chat-message received">
                <div className="message-content">
                  <p>
                    Hello {user.name}, thank you for using our
                    platform. Any problem feel free to ask.
                  </p>
                </div>
              </div>

              <div className="quick-replies-container">
                <p className="quick-replies-title">
                  Please select your issue:
                </p>

                <div className="quick-reply-buttons">
                  {complaintChoices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => sendQuickReply(choice)}
                      className="quick-reply-btn"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Reply Bar */}
        {replyingTo && (
          <div className="replying-to-bar">
            <span>
              Replying to <strong>{replyingTo.sender}</strong>:{" "}
              {replyingTo.text}
            </span>

            <button onClick={() => setReplyingTo(null)}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* Edit Bar */}
        {editingMessageId && (
          <div className="replying-to-bar edit-bar">
            <span>Editing message...</span>

            <button
              onClick={() => {
                setEditingMessageId(null);
                setMessage("");
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Image Preview Bar */}
        {image && (
          <div className="replying-to-bar image-bar">
            <span>Image selected: {image.name}</span>

            <button onClick={() => setImage(null)}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <form onSubmit={sendMessage} className="chat-input-area">
          {/* Upload Button */}
          <label className="upload-btn">
            <FaImage />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>

          {/* Input */}
          <input
            type="text"
            placeholder={
              editingMessageId
                ? "Edit your message..."
                : "Type your message... (Swipe message to reply)"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Send Button */}
          <button type="submit" className="send-btn">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyerChat;
