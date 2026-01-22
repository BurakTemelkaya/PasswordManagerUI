import { useNavigate } from 'react-router-dom';
import '../styles/pages.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="not-found">
        <h1>404</h1>
        <p>Sayfa bulunamadı</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
};

export default NotFound;
