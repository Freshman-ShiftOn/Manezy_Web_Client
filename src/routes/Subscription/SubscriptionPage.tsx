import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

const subscriptionPlans = [
    {
        id: 'small',
        title: '소규모 사업장',
        price: '29,900',
        features: [
            '최대 10인 직원 관리',
            '기본 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
            '기본 리포트'
        ],
        employeeLimit: '10인 이하',
        recommended: false
    },
    {
        id: 'medium',
        title: '중규모 사업장',
        price: '49,900',
        features: [
            '최대 20인 직원 관리',
            '고급 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
            '상세 리포트',
            '대타 관리 시스템'
        ],
        employeeLimit: '10~20인',
        recommended: true
    },
    {
        id: 'large',
        title: '대규모 사업장',
        price: '89,900',
        features: [
            '20인 이상 직원 관리',
            '고급 스케줄 관리',
            '급여 자동 계산',
            '실시간 알림',
            '고급 분석 리포트',
            '대타 관리 시스템',
            '다중 지점 관리'
        ],
        employeeLimit: '20인 이상',
        recommended: false
    }
];

const SubscriptionPage = () => {
    console.log('Component rendered'); // 컴포넌트 렌더링 추적

    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<typeof subscriptionPlans[0] | null>(null);

    // 플랜 선택 처리
    const handlePlanSelect = (plan: typeof subscriptionPlans[0]) => {
        console.log('%c Plan Selection', 'background: #222; color: #bada55');
        console.log('%c Selected plan:', 'color: #2196f3', plan.id);
        console.log('%c Current selected plan:', 'color: #4caf50', selectedPlan);
        setCurrentPlan(plan);
        setConfirmDialogOpen(true);
    };

    // 구독 확인
    const handleConfirmSubscription = () => {
        console.log('%c Subscription Confirmed', 'background: #222; color: #bada55');
        console.log('%c Current plan:', 'color: #2196f3', currentPlan?.id);
        console.log('%c Previous selected plan:', 'color: #4caf50', selectedPlan);

        if (currentPlan) {
            console.log('%c Updating selected plan to:', 'color: #ff0000', currentPlan.id);
            setSelectedPlan(currentPlan.id);
        }
        setConfirmDialogOpen(false);
    };

    // 구독 취소
    const handleCancelSubscription = () => {
        console.log('%c Subscription Cancelled', 'background: #222; color: #ff0000');
        console.log('%c State before cancellation:', 'color: #ff0000', {
            selectedPlan,
            currentPlan: currentPlan?.id,
            confirmDialogOpen
        });
        setConfirmDialogOpen(false);
        setCurrentPlan(null);
    };

    // 상태 변화 감지
    useEffect(() => {
        console.log('%c State Updated', 'background: #222; color: #bada55');
        console.log({
            selectedPlan,
            currentPlan: currentPlan?.id,
            confirmDialogOpen
        });
    }, [selectedPlan, currentPlan, confirmDialogOpen]);

    // 렌더링 시 현재 상태 출력
    console.log('%c Component Rendered', 'background: #222; color: #bada55', {
        selectedPlan,
        currentPlan: currentPlan?.id,
        confirmDialogOpen
    });

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 6 }}>
                구독 플랜
            </Typography>
            {selectedPlan && (
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 4 }}
                >
                    현재 구독중인 플랜: {subscriptionPlans.find(p => p.id === selectedPlan)?.title}
                </Typography>
            )}
            <Grid container spacing={4} justifyContent="center">
                {subscriptionPlans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.title}>
                        <Card
                            onClick={() => {
                                console.log('%c Card clicked', 'background: #222; color: #bada55', plan.id);
                                handlePlanSelect(plan);
                                console.log('Card clicked:', plan.id);
                            }}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transform: plan.recommended ? 'scale(1.05)' : 'none',
                                border: selectedPlan === plan.id
                                    ? '2px solid #4caf50'
                                    : plan.recommended
                                        ? '2px solid #2196f3'
                                        : '1px solid rgba(0, 0, 0, 0.12)',
                                transition: 'all 0.3s ease',
                                backgroundColor: selectedPlan === plan.id ? 'rgba(76, 175, 80, 0.04)' : 'white',
                                '&:hover': {
                                    transform: plan.recommended ? 'scale(1.07)' : 'translateY(-8px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    border: selectedPlan === plan.id
                                        ? '2px solid #4caf50'
                                        : plan.recommended
                                            ? '2px solid #2196f3'
                                            : '1px solid rgba(0, 0, 0, 0.12)',
                                },
                                cursor: 'pointer',
                            }}
                        >
                            {plan.recommended && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 0,
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        px: 2,
                                        py: 0.5,
                                        borderTopLeftRadius: 4,
                                        borderBottomLeftRadius: 4,
                                    }}
                                >
                                    추천
                                </Box>
                            )}
                            {selectedPlan === plan.id && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 0,
                                        backgroundColor: '#4caf50',
                                        color: 'white',
                                        px: 2,
                                        py: 0.5,
                                        borderTopRightRadius: 4,
                                        borderBottomRightRadius: 4,
                                    }}
                                >
                                    현재 이용중
                                </Box>
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography gutterBottom variant="h5" component="h2" align="center">
                                    {plan.title}
                                </Typography>
                                <Typography
                                    variant="h4"
                                    component="p"
                                    align="center"
                                    sx={{
                                        my: 3,
                                        color: plan.recommended ? '#2196f3' : 'text.primary'
                                    }}
                                >
                                    ₩{plan.price}
                                    <Typography variant="subtitle1" component="span">/월</Typography>
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    color="text.secondary"
                                    align="center"
                                    sx={{ mb: 3 }}
                                >
                                    {plan.employeeLimit}
                                </Typography>
                                <List>
                                    {plan.features.map((feature) => (
                                        <ListItem key={feature} sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckIcon color={plan.recommended ? 'primary' : 'action'} />
                                            </ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0 }}>
                                <Button
                                    fullWidth
                                    variant={selectedPlan === plan.id ? "contained" : plan.recommended ? "contained" : "outlined"}
                                    color={selectedPlan === plan.id ? "success" : "primary"}
                                    size="large"
                                    onClick={(e) => {
                                        e.stopPropagation(); // 카드 클릭 이벤트와 중복 방지
                                        console.log('Button clicked:', plan.id);
                                        handlePlanSelect(plan);
                                    }}
                                >
                                    {selectedPlan === plan.id ? '변경하기' : '구독하기'}
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* 구독 확인 다이얼로그 */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelSubscription}
                aria-labelledby="subscription-dialog-title"
            >
                <DialogTitle id="subscription-dialog-title">
                    {selectedPlan ? '구독 플랜 변경' : '구독 플랜 확인'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedPlan ? (
                            <>
                                현재 구독중인 플랜을 {currentPlan?.title} 플랜으로 변경하시겠습니까?<br />
                                변경 시 월 ₩{currentPlan?.price}이 청구됩니다.
                            </>
                        ) : (
                            <>
                                {currentPlan?.title} 플랜을 선택하셨습니다.<br />
                                월 ₩{currentPlan?.price}이 청구됩니다.<br />
                                계속 진행하시겠습니까?
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelSubscription} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleConfirmSubscription} variant="contained" color="primary">
                        {selectedPlan ? '변경하기' : '구독하기'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SubscriptionPage; 