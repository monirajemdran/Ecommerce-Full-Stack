import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPaperPlane, FaUserCircle, FaImage, FaReply, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { io } from "socket.io-client";
import "./AdminChats.css";
import { swalError, swalConfirm } from "../utils/swal";

const AdminChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [image, setImage] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchChats();

    const newSocket = io("https://shopverse-m5i8.onrender.com");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit("joinChat", selectedChat.buyer._id);
      
      socket.on("newMessage", (updatedChat) => {
        if (updatedChat.buyer._id === selectedChat.buyer._id) {
          setSelectedChat(updatedChat);
        }
        setChats(prevChats => prevChats.map(c => c._id === updatedChat._id ? updatedChat : c));
        scrollToBottom();
      });

      return () => socket.off("newMessage");
    }
  }, [socket, selectedChat]);

  const fetchChats = async () => {
    try {
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/chat");
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    setReplyingTo(null);
    setEditingMessageId(null);
    setImage(null);
    setMessage("");
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!message.trim() && !image) return;

    try {
      if (editingMessageId) {
        // Edit message
        const res = await axios.put(`https://shopverse-m5i8.onrender.com/api/chat/${selectedChat.buyer._id}/message/${editingMessageId}`, {
          text: message
        });
        setSelectedChat(res.data);
        setChats(prevChats => prevChats.map(c => c._id === res.data._id ? res.data : c));
        setEditingMessageId(null);
      } else {
        // Send new message
        const formData = new FormData();
        formData.append("sender", "admin");
        if (message.trim()) formData.append("text", message);
        if (image) formData.append("image", image);
        if (replyingTo) formData.append("replyTo", JSON.stringify({ text: replyingTo.text, sender: replyingTo.sender }));

        const res = await axios.post(`https://shopverse-m5i8.onrender.com/api/chat/${selectedChat.buyer._id}/message`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSelectedChat(res.data);
        setChats(prevChats => prevChats.map(c => c._id === res.data._id ? res.data : c));
      }
      
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

  const deleteMessage = async (msgId) => {
    const ok = await swalConfirm("Delete this message?");
    if (!ok) return;
    try {
      const res = await axios.delete(`https://shopverse-m5i8.onrender.com/api/chat/${selectedChat.buyer._id}/message/${msgId}`);
      setSelectedChat(res.data);
      setChats(prevChats => prevChats.map(c => c._id === res.data._id ? res.data : c));
    } catch (err) {
      console.error(err);
      swalError('Failed to delete message.');
    }
  };

  const handleEdit = (msg) => {
    setEditingMessageId(msg._id);
    setMessage(msg.text || "");
    setReplyingTo(null);
  };

  const isEditable = (timestamp) => {
    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60);
    return timeDiff <= 30;
  };

  let touchStartX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e, msg) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (Math.abs(touchStartX - touchEndX) > 50) {
      setReplyingTo(msg);
      setEditingMessageId(null);
    }
  };

  return (
    <div className="admin-chats-container">
      <div className="chats-sidebar">
        <h3>Conversations</h3>
        <ul className="chat-list">
          {chats.map(chat => (
            <li 
              key={chat._id} 
              className={`chat-list-item ${selectedChat?._id === chat._id ? "active" : ""}`}
              onClick={() => selectChat(chat)}
            >
              <FaUserCircle className="chat-icon" />
              <div className="chat-info">
                <h4>{chat.buyer?.name || "Unknown"}</h4>
                <p>{chat.messages[chat.messages.length - 1]?.text?.substring(0, 20)}...</p>
              </div>
            </li>
          ))}
          {chats.length === 0 && <p className="no-chats">No active chats.</p>}
        </ul>
      </div>
      
      <div className="chat-window">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h3>{selectedChat.buyer?.name}</h3>
            </div>
            <div className="chat-messages">
              {selectedChat.messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.sender === "admin" ? "sent" : "received"}`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, msg)}
                >
                  <div className="message-content">
                    {msg.replyTo && (
                      <div className="reply-preview">
                        <strong>{msg.replyTo.sender}:</strong> {msg.replyTo.text}
                      </div>
                    )}
                    {msg.image && <img src={`https://shopverse-m5i8.onrender.com/${msg.image}`} alt="attached" className="chat-image" />}
                    {msg.text && <p>{msg.text}</p>}
                    
                    <div className="message-footer">
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.isEdited && " (edited)"}
                      </span>
                    </div>
                  </div>

                  <div className="message-actions">
                    <button onClick={() => { setReplyingTo(msg); setEditingMessageId(null); }} title="Reply"><FaReply /></button>
                    {msg.sender === "admin" && isEditable(msg.timestamp) && (
                      <button onClick={() => handleEdit(msg)} title="Edit"><FaEdit /></button>
                    )}
                    {msg.sender === "admin" && (
                      <button onClick={() => deleteMessage(msg._id)} title="Delete"><FaTrash /></button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {replyingTo && (
              <div className="replying-to-bar">
                <span>Replying to <strong>{replyingTo.sender}</strong>: {replyingTo.text}</span>
                <button type="button" onClick={() => setReplyingTo(null)}><FaTimes /></button>
              </div>
            )}
            
            {editingMessageId && (
              <div className="replying-to-bar edit-bar">
                <span>Editing message...</span>
                <button type="button" onClick={() => { setEditingMessageId(null); setMessage(""); }}><FaTimes /></button>
              </div>
            )}
            
            {image && (
              <div className="replying-to-bar image-bar">
                <span>Image selected: {image.name}</span>
                <button type="button" onClick={() => setImage(null)}><FaTimes /></button>
              </div>
            )}

            <form onSubmit={sendMessage} className="chat-input-area">
              <label className="upload-btn">
                <FaImage />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImage(e.target.files[0])} 
                  style={{ display: "none" }} 
                />
              </label>
              <input
                type="text"
                placeholder={editingMessageId ? "Edit your message..." : "Type a message... (Swipe message to reply)"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="send-btn">
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <FaUserCircle size={50} color="#ccc" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChats;

