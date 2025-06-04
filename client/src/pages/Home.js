import React, { useState, useRef, useEffect } from 'react';
import '../styles/Home.css';

// Helper function to find image URL in text
const extractImageUrl = (text) => {
  const urlRegex = /(https?:\/\/.*?\.(?:png|jpg|jpeg|gif))/i;
  const match = text.match(urlRegex);
  return match ? match[1] : null;
};

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedImage) return;

    const newMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;
      if (selectedImage) {
        response = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: selectedImage.split(',')[1]
          }),
        });
      } else {
        response = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage
          }),
        });
      }

      const data = await response.json();
      // Extract image URL if present before setting the message
      const imageUrl = extractImageUrl(data.message);
      setMessages(prev => [...prev, { text: data.message, isUser: false, imageUrl }]);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <header className="chat-header">
          <h1>Sağlık Takviyesi Danışmanı</h1>
        </header>

        <div className="messages-container">
          {messages.map((message, index) => {
            // Check if it's a bot message with an image URL
            const isBotMessageWithImage = !message.isUser && message.imageUrl;
            let displayedText = message.text;

            // If it's a bot message with an image, remove the URL from the text
            if (isBotMessageWithImage) {
              const urlRegex = /(https?:\/\/.*?\.(?:png|jpg|jpeg|gif))/i;
               displayedText = message.text.replace(urlRegex, '').trim();
               // Remove any leftover markdown link syntax if it exists
               const markdownLinkRegex = /\[.*?\]\(https?:\/\/.*?\.(?:png|jpg|jpeg|gif)\)/i;
               displayedText = displayedText.replace(markdownLinkRegex, '').trim();
            }

            return (
              <div
                key={index}
                className={`message ${message.isUser ? 'user-message' : 'bot-message'} fade-in`}
              >
                {/* Render processed text content */}
                {displayedText}
                {/* Render image if imageUrl exists and it's a bot message */}
                {isBotMessageWithImage && (
                  <div className="message-image-preview">
                    <img src={message.imageUrl} alt="Ürün Görseli" />
                  </div>
                )}
              </div>
            );
          })}
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
};

export default Home; 