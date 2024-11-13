# PokeChat

PokeChat은 간단하고 가벼운 실시간 채팅 애플리케이션입니다. 사용자는 포켓몬 캐릭터를 프로필로 설정하여 다양한 유저들과 채팅을 나눌 수 있습니다.

![スクリーンショット 2024-11-13 103950](https://github.com/user-attachments/assets/871a04a1-1057-47b1-8582-c852fa93acec)

## 주요 기능
- **실시간 채팅**: 빠르고 안정적인 실시간 메시지 전송.
- **유저 프로필**: 각 유저는 포켓몬 캐릭터와 닉네임이 자동으로 할당됩니다.
- **다중 접속 관리**: 현재 접속 중인 유저 수를 실시간으로 확인.
- **메시지 저장**: Redis와 MongoDB를 활용하여 최근 메시지 기록을 저장하고 로드.

## 기술 스택
- **서버**: Node.js + Express
- **데이터베이스**:
  - MongoDB: 사용자 및 메시지 영구 저장
  - Redis: 실시간 데이터 관리 및 캐싱
- **배포**: AWS EC2 (Ubuntu)
- **프런트엔드**: HTML, CSS, JavaScript (정적 파일 제공)

## 실행 환경
다음 환경이 설정되어 있어야 합니다:
- **Redis** 7.x 이상 (Docker 설치 권장)
- **MongoDB** 최신 버전

## 설치 및 실행

1. **프로젝트 클론**
   ```bash
   git clone https://github.com/ottuck/poke-chat.git
   cd poke-chat
   ```
2. **필수 패키지 설치**
   ```bash
   npm install
   ```
3. **환경 변수 설정 .env 파일을 생성하고 다음과 같이 설정합니다**
   ```bash
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/pokechat_db
    REDIS_HOST=localhost
    REDIS_PORT=6379
    SESSION_SECRET=your-secret-key
   ```
4. **Redis 및 MongoDB 실행(docker 사용 예시)**
   ```bash
   docker run --name redis-container -p 6379:6379 -d redis:latest
   docker run --name mongo-container -p 27017:27017 -d mongo
   ```
5. **서버 실행**
   ```bash
   npm run dev
   ```
6. **브라우저에 접속**
   ```bash
   http://<EC2 퍼블릭 IP>:3000
   ```
