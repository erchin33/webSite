import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { text: "Merhaba! Ben sağlık takviyesi danışmanınızım. Size nasıl yardımcı olabilirim? Lütfen şikayetlerinizi veya tıbbi raporunuzu paylaşın.", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage && !selectedImage) return;

    const newMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (inputMessage) formData.append('message', inputMessage);
      if (selectedImage) {
        formData.append('image', selectedImage.split(',')[1]);
      }

      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.message, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', isUser: false }]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <header className="chat-header">
          <h1>Sağlık Takviyesi Danışmanı</h1>
        </header>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? 'user-message' : 'bot-message'} fade-in`}
            >
              {message.text}
            </div>
          ))}
          {isLoading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <p>Tıbbi raporunuzu yüklemek için tıklayın veya sürükleyin</p>
          <small>(Desteklenen formatlar: JPG, PNG)</small>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {selectedImage && (
          <div className="image-preview">
            <img src={selectedImage} alt="Preview" />
            <button onClick={() => setSelectedImage(null)}>Kaldır</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="message-input"
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
}

export default App; 