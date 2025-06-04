import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [trainingData, setTrainingData] = useState({
    personality: '',
    behavior: '',
    responseStyle: ''
  });
  const [rules, setRules] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    imageUrl: '',
    description: '',
    content: '',
    benefits: ''
  });
  const [newRuleText, setNewRuleText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchTrainingData();
      fetchRules();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Ürünler yüklenirken bir hata oluştu.');
    }
  };

  const fetchTrainingData = async () => {
    try {
      const response = await fetch('/api/training');
      const data = await response.json();
      setTrainingData(data);
    } catch (error) {
      console.error('Error fetching training data:', error);
      setError('Eğitim verileri yüklenirken bir hata oluştu.');
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
      setError('Kurallar yüklenirken bir hata oluştu.');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Hatalı şifre!');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        setSuccess('Ürün başarıyla eklendi!');
        setNewProduct({
          name: '',
          imageUrl: '',
          description: '',
          content: '',
          benefits: ''
        });
        fetchProducts();
      } else {
        setError('Ürün eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Ürün eklenirken bir hata oluştu.');
    }
  };

  const handleTrainingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });

      if (response.ok) {
        setSuccess('Eğitim verileri başarıyla güncellendi!');
      } else {
        setError('Eğitim verileri güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error updating training data:', error);
      setError('Eğitim verileri güncellenirken bir hata oluştu.');
    }
  };

  const handleRulesUpdate = async () => {
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
      });

      if (response.ok) {
        setSuccess('Kurallar başarıyla güncellendi!');
      } else {
        setError('Kurallar güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error updating rules:', error);
      setError('Kurallar güncellenirken bir hata oluştu.');
    }
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    setNewProduct(product);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSuccess('Ürün başarıyla silindi!');
          fetchProducts();
        } else {
          setError('Ürün silinirken bir hata oluştu.');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Ürün silinirken bir hata oluştu.');
      }
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        setSuccess('Ürün başarıyla güncellendi!');
        setIsEditing(false);
        setEditingProductId(null);
        setNewProduct({
          name: '',
          imageUrl: '',
          description: '',
          content: '',
          benefits: ''
        });
        fetchProducts();
      } else {
        setError('Ürün güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Ürün güncellenirken bir hata oluştu.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleRuleChange = (index, value) => {
    const updatedRules = [...rules];
    updatedRules[index] = value;
    setRules(updatedRules);
  };

  const handleAddRule = () => {
    if (newRuleText.trim()) {
      setRules([...rules, newRuleText.trim()]);
      setNewRuleText('');
    }
  };

  const handleDeleteRule = (index) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h2>Admin Girişi</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
          />
          <button type="submit">Giriş Yap</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Paneli</h2>
        <button onClick={handleLogout} className="logout-button">Çıkış Yap</button>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div className="admin-section">
        <h3>Ürün Yönetimi</h3>
        <form onSubmit={isEditing ? handleUpdateProduct : handleProductSubmit}>
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            placeholder="Ürün Adı"
            required
          />
          <input
            type="text"
            value={newProduct.imageUrl}
            onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
            placeholder="Görsel URL"
            required
          />
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            placeholder="Ürün Açıklaması"
            required
          />
          <textarea
            value={newProduct.content}
            onChange={(e) => setNewProduct({...newProduct, content: e.target.value})}
            placeholder="İçerik"
            required
          />
          <textarea
            value={newProduct.benefits}
            onChange={(e) => setNewProduct({...newProduct, benefits: e.target.value})}
            placeholder="Faydalar"
            required
          />
          <div className="form-buttons">
            <button type="submit">{isEditing ? 'Ürünü Güncelle' : 'Ürün Ekle'}</button>
            {isEditing && (
              <button type="button" onClick={() => {
                setIsEditing(false);
                setEditingProductId(null);
                setNewProduct({
                  name: '',
                  imageUrl: '',
                  description: '',
                  content: '',
                  benefits: ''
                });
              }} className="cancel-button">
                İptal
              </button>
            )}
          </div>
        </form>

        <div className="products-list">
          <h4>Mevcut Ürünler</h4>
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <img src={product.imageUrl} alt={product.name} />
              <div className="product-info">
                <h5>{product.name}</h5>
                <p>{product.description}</p>
                <div className="product-actions">
                  <button onClick={() => handleEditProduct(product)} className="edit-button">
                    Düzenle
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="delete-button">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h3>Yapay Zeka Eğitimi (Kişilik ve Stil)</h3>
        <form onSubmit={handleTrainingSubmit}>
          <textarea
            value={trainingData.personality}
            onChange={(e) => setTrainingData({...trainingData, personality: e.target.value})}
            placeholder="Kişilik"
            required
          />
          <textarea
            value={trainingData.behavior}
            onChange={(e) => setTrainingData({...trainingData, behavior: e.target.value})}
            placeholder="Davranış Kuralları"
            required
          />
          <textarea
            value={trainingData.responseStyle}
            onChange={(e) => setTrainingData({...trainingData, responseStyle: e.target.value})}
            placeholder="Yanıt Stili"
            required
          />
          <button type="submit">Eğitim Verilerini Güncelle</button>
        </form>
      </div>

      <div className="admin-section">
        <h3>Yapay Zeka Kuralları Yönetimi</h3>
        <div className="rules-list">
          {rules.map((rule, index) => (
            <div key={index} className="rule-item">
              <textarea
                value={rule}
                onChange={(e) => handleRuleChange(index, e.target.value)}
                rows="3"
              />
              <button onClick={() => handleDeleteRule(index)} className="delete-button">Sil</button>
            </div>
          ))}
        </div>
        <div className="add-rule-form">
          <input
            type="text"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="Yeni kural ekle..."
          />
          <button onClick={handleAddRule} className="add-button">Kural Ekle</button>
        </div>
        <button onClick={handleRulesUpdate} className="update-rules-button">Kuralları Kaydet</button>
      </div>
    </div>
  );
};

export default Admin; 