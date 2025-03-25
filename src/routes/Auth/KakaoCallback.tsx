import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../App';

const KakaoCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            // TODO: Send the code to your backend
            console.log('Authorization code:', code);

            // For now, just set logged in state and redirect
            localStorage.setItem('isLoggedIn', 'true');
            setLoggedIn(true);
            navigate('/setup');
        } else {
            // Handle error
            console.error('No authorization code found');
            navigate('/login');
        }
    }, [searchParams, navigate, setLoggedIn]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            카카오 로그인 처리중...
        </div>
    );
};

export default KakaoCallback; 