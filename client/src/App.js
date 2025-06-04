import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
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
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 