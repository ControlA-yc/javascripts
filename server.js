const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 현재 폴더의 파일들을 웹에 서빙
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`서버 실행 성공: http://localhost:${PORT}`);
});