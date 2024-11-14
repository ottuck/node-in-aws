# Node.js 이미지 사용
FROM node:20

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# 환경 변수 설정
ENV PORT=3000

# 애플리케이션 실행
EXPOSE 3000
CMD ["npm", "start"]
