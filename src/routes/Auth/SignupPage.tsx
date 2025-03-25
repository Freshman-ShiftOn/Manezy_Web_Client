import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Divider,
    Alert,
} from '@mui/material';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        name: '',
        phone: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 기본적인 유효성 검사
        if (!formData.email || !formData.password || !formData.name) {
            setError('모든 필수 항목을 입력해주세요.');
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            // TODO: API 호출로 회원가입 처리
            // const response = await signup(formData);

            // 회원가입 성공 시 로그인 처리
            localStorage.setItem('isLoggedIn', 'true');

            // 설정 마법사로 이동
            navigate('/setup');
        } catch (err) {
            setError('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        회원가입
                    </Typography>
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        매장 관리를 시작하기 위해 회원가입을 진행해주세요.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="이메일"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="비밀번호"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="비밀번호 확인"
                            name="passwordConfirm"
                            type="password"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="이름"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="전화번호"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="010-0000-0000"
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            회원가입
                        </Button>
                    </form>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            이미 계정이 있으신가요?{' '}
                            <Link to="/login" style={{ color: 'primary' }}>
                                로그인
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default SignupPage; 