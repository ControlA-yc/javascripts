const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// public 폴더 안의 정적 파일들을 제공
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});