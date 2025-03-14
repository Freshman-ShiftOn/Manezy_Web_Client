import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

const subscriptionPlans = [
    {
        title: '소규모 사업장',
        price: '29,900',
        features: [
            '최대 10인 직원 관리',
            '기본 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
        ],
        employeeLimit: '10인 이하',
        recommended: false,
    },
    {
        title: '중규모 사업장',
        price: '49,900',
        features: [
            '최대 20인 직원 관리',
            '고급 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
            '통계 리포트',
        ],
        employeeLimit: '10~20인',
        recommended: true,
    },
    {
        title: '대규모 사업장',
        price: '89,900',
        features: [
            '20인 이상 직원 관리',
            '고급 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
            '통계 리포트',
            '다중 지점 관리',
        ],
        employeeLimit: '20인 이상',
        recommended: false,
    },
];

const SubscriptionPage: React.FC = () => {
    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                구독 플랜
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                사업장 규모에 맞는 최적의 플랜을 선택하세요
            </Typography>

            <Grid container spacing={3} justifyContent="center">
                {subscriptionPlans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.title}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transform: plan.recommended ? 'scale(1.05)' : 'none',
                                border: plan.recommended ? '2px solid #2196f3' : 'none',
                            }}
                        >
                            {plan.recommended && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        bgcolor: '#2196f3',
                                        color: 'white',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1,
                                    }}
                                >
                                    추천
                                </Box>
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {plan.title}
                                </Typography>
                                <Typography
                                    variant="h4"
                                    component="div"
                                    sx={{ mb: 2, fontWeight: 'bold' }}
                                >
                                    ₩{plan.price}
                                    <Typography
                                        component="span"
                                        variant="subtitle1"
                                        color="text.secondary"
                                    >
                                        /월
                                    </Typography>
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ mb: 2, color: 'text.secondary' }}
                                >
                                    {plan.employeeLimit}
                                </Typography>
                                <List>
                                    {plan.features.map((feature) => (
                                        <ListItem key={feature} sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                                <Button
                                    variant={plan.recommended ? 'contained' : 'outlined'}
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                >
                                    구독하기
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default SubscriptionPage; 