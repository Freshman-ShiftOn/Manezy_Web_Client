import React from 'react';
import { Box, Container, Paper, Button, Typography, Divider, Grid } from '@mui/material';
import { CalendarMonth, Group, Payment } from '@mui/icons-material';
import { colors } from '../../theme';

const LoginPage: React.FC = () => {
    const handleKakaoLogin = () => {
        const KAKAO_REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
        const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;

        console.log('${KAKAO_REST_API_KEY}');

        window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                background: `linear-gradient(135deg, ${colors.accent} 0%, #ffffff 100%)`,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `radial-gradient(circle at 10% 20%, rgba(64, 80, 181, 0.05) 0%, transparent 20%),
                        radial-gradient(circle at 90% 30%, rgba(96, 112, 255, 0.07) 0%, transparent 20%),
                        radial-gradient(circle at 30% 70%, rgba(64, 80, 181, 0.05) 0%, transparent 30%),
                        radial-gradient(circle at 70% 80%, rgba(96, 112, 255, 0.07) 0%, transparent 20%)`,
                    animation: 'backgroundShift 30s ease infinite alternate',
                    zIndex: 0,
                },
                '@keyframes backgroundShift': {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '100% 100%' },
                },
            }}
        >
            {/* 움직이는 배경 도형들 */}
            <Box
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    zIndex: 0,
                }}
            >
                {/* 상단 왼쪽 도형 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '-50px',
                        left: '-50px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: `linear-gradient(45deg, ${colors.primary}22, ${colors.secondary}11)`,
                        animation: 'float1 15s ease-in-out infinite',
                        '@keyframes float1': {
                            '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                            '50%': { transform: 'translate(20px, 20px) rotate(5deg)' },
                            '100%': { transform: 'translate(0, 0) rotate(0deg)' },
                        },
                    }}
                />

                {/* 우측 도형 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                        background: `linear-gradient(45deg, ${colors.secondary}11, ${colors.primary}22)`,
                        animation: 'float2 20s ease-in-out infinite',
                        '@keyframes float2': {
                            '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                            '50%': { transform: 'translate(-20px, 30px) rotate(-5deg)' },
                            '100%': { transform: 'translate(0, 0) rotate(0deg)' },
                        },
                    }}
                />

                {/* 하단 도형 */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '-100px',
                        left: '30%',
                        width: '250px',
                        height: '250px',
                        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                        background: `linear-gradient(45deg, ${colors.primary}11, ${colors.accent})`,
                        animation: 'float3 25s ease-in-out infinite',
                        '@keyframes float3': {
                            '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                            '50%': { transform: 'translate(30px, -20px) rotate(5deg)' },
                            '100%': { transform: 'translate(0, 0) rotate(0deg)' },
                        },
                    }}
                />
            </Box>

            {/* 상단 로고 부분 */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pt: { xs: 6, md: 10 },
                    pb: { xs: 4, md: 6 },
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Box
                    sx={{
                        animation: 'pulse 3s ease-in-out infinite',
                        '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                            '100%': { transform: 'scale(1)' },
                        },
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 200 200"
                        width="120"
                        height="120"
                    >
                        <circle cx="100" cy="100" r="90" fill="#f0f4ff" />
                        <path
                            d="M55 50 L55 150 L75 150 L75 90 L100 125 L125 90 L125 150 L145 150 L145 50 L125 50 L100 90 L75 50 Z"
                            fill={colors.primary}
                        />
                        <rect
                            x="50"
                            y="160"
                            width="100"
                            height="8"
                            rx="4"
                            fill={colors.secondary}
                        />
                    </svg>
                </Box>
            </Box>

            {/* 메인 콘텐츠 */}
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 2,
                        mb: 4,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                    }}
                >
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                mb: 1,
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            Manezy
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                mb: 3,
                            }}
                        >
                            매장 근무 시간 관리 솔루션
                        </Typography>
                        <Divider sx={{ mb: 4, width: '50%', mx: 'auto' }} />
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                            Manezy로 매장의 근무 스케줄을 더 효율적으로 관리하세요. 스케줄
                            작성, 변경, 대타 관리를 손쉽게 할 수 있습니다.
                        </Typography>
                        <Button
                            fullWidth
                            onClick={handleKakaoLogin}
                            sx={{
                                mt: 2,
                                px: 4,
                                py: 1.5,
                                bgcolor: '#FEE500',
                                color: '#000000',
                                border: 'none',
                                borderRadius: 2,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    bgcolor: '#E6CF00'
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: '100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    transition: '0.5s',
                                },
                                '&:hover::after': {
                                    left: '-100%',
                                },
                            }}
                        >
                            <img
                                src="/kakao-logo.png"
                                alt="Kakao"
                                style={{ width: '24px', height: '24px' }}
                            />
                            카카오로 시작하기
                        </Button>
                    </Box>

                    {/* 기능 소개 섹션 */}
                    <Box sx={{ mt: 6 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                        },
                                    }}
                                >
                                    <CalendarMonth sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        스케줄 관리
                                    </Typography>
                                    <Typography variant="body2">간편한 스케줄 작성</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                        },
                                    }}
                                >
                                    <Group sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        직원 관리
                                    </Typography>
                                    <Typography variant="body2">효율적인 인력 배치</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                        },
                                    }}
                                >
                                    <Payment sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        급여 관리
                                    </Typography>
                                    <Typography variant="body2">자동 급여 계산</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Container>

            {/* 하단 푸터 */}
            <Box
                sx={{
                    mt: 'auto',
                    textAlign: 'center',
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Typography variant="body2">
                    © {new Date().getFullYear()} Manezy. 모든 권리 보유.
                </Typography>
            </Box>
        </Box>
    );
};

export default LoginPage; 