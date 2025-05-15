# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## 백엔드 API 요청사항

### 지점 관리 API

#### 1. 지점 생성 API 개선사항

- **다중 지점 지원**: 하나의 계정으로 여러 지점을 관리할 수 있도록 개선

  - 현재: 같은 이름의 지점이 있으면 오류 발생
  - 요청: 다른 사용자가 같은 이름의 지점을 가진 경우 오류가 발생하지만, 동일 사용자의 경우 다른 이름으로 여러 지점 생성 가능하도록 수정

- **오류 메시지 개선**: 명확한 오류 메시지 제공

  - 현재: 일반적인 오류 메시지만 제공
  - 요청: 다음과 같은 상황별 명확한 오류 메시지 반환
    - 동일 이름 지점 존재: "동일한 이름의 지점이 이미 등록되어 있습니다. 다른 이름으로 시도해주세요."
    - 입력 데이터 유효성 오류: 어떤 필드가, 어떤 이유로 유효하지 않은지 명시
    - 인증 오류: "인증이 필요합니다. 다시 로그인해주세요."

- **응답 데이터 구조 통일**: 일관된 응답 형식 제공
  - 현재: 성공 시 때로는 ID만, 때로는 빈 응답 반환
  - 요청: 성공 시 항상 다음 형식으로 응답
    ```json
    {
      "id": 123, // 생성된 지점 ID
      "name": "지점명", // 지점 이름
      "message": "지점이 성공적으로 생성되었습니다."
    }
    ```

#### 2. 지점 목록 조회 API

- 현재 사용자가 관리하는 모든 지점 목록을 반환하는 API
- 지점 전환 기능 구현을 위해 필요
- 요청 URL: `GET /api/branch/user-branches`
- 응답 예시:
  ```json
  {
    "branches": [
      {
        "id": 123,
        "name": "스타벅스 신촌점",
        "address": "서울시 서대문구...",
        "created_at": "2023-05-15T12:00:00Z"
      },
      {
        "id": 124,
        "name": "스타벅스 홍대점",
        "address": "서울시 마포구...",
        "created_at": "2023-06-20T14:30:00Z"
      }
    ]
  }
  ```

#### 3. 지점 상세 정보 조회 API

- 특정 지점의 상세 정보를 반환하는 API
- 요청 URL: `GET /api/branch/{branchId}`
- 권한 확인: 해당 사용자가 접근 권한이 있는 지점인지 확인

### 기타 요청사항

- 모든 API 응답은 JSON 형식을 유지해주세요. (빈 응답도 `{}` 형태로)
- 오류 발생 시 HTTP 상태 코드와 함께 오류 메시지를 제공해주세요.
- 가능한 경우 페이지네이션을 지원해주세요 (목록 조회 API).
