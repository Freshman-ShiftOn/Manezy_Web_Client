# Node.js 환경 (예제: React, Express)
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install --force

# 코드 복사
COPY . .

# React 빌드 (배포용)
RUN npm run build

# 포트 설정
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "start"]