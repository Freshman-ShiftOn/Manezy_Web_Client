# Node.js 18 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install --force

# 프로젝트 코드 복사
COPY . .

# React 빌드 (정적 파일 생성)
RUN npm run build

# `serve` 패키지 설치 및 정적 파일 제공
RUN npm install -g serve

# 컨테이너 실행 시 정적 파일 제공
CMD ["serve", "-s", "build"]

# React 앱이 사용할 포트
EXPOSE 3000