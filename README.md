# 翔天線上簽核系統（雛形）
純前端靜態網頁（index.html / style.css / app.js），資料存在瀏覽器 localStorage（key `signoff-demo-v1`），無後端。

## 資料模型（可直接對應 Firestore collections）
- `positions/{id}`: { name }
- `users/{id}`: { account, name, positionId, isAdmin } → 未來 id = Firebase Auth UID（與施工日報表 App 同一個專案即可共用帳號）
- `forms/{id}`: { name, fields:[{k,l,t,o}], chain:[positionId,...] } — 簽核流程為依序的職位，持有該職位的任何人都可簽
- `documents/{id}`: { formId, submitterId, status(pending|approved|rejected), currentStep, chain(送出當下的流程快照), data, createdAt, updatedAt, history:[{at,userId,action(submit|resubmit|approve|reject),step,comment}] }

## 搬到 Firebase / 整合施工日報表 App
1. 上述四個 collection 改用 Firestore；「待我簽核」= where status=='pending' 且 chain[currentStep]==我的職位（可另存 `currentPositionId` 欄位方便查詢）。
2. 核准/退回以 Cloud Function 或 transaction 執行，並用 Security Rules 檢查簽核者職位，避免前端竄改。
3. iOS 日報表 App 儲存日報後建立一筆 `formId='f_daily'` 的 document（data 放日報 id 或內容），App 監聽其 status，`approved` 才開放輸出 PDF；PDF 上加印簽核章（history 中的 approve 紀錄）。

## 測試
`./tests/run.sh`（Playwright + 系統 Chrome，headless）：10 個情境 × 390/1280px × 淺色/深色 = 40 項。`QUICK=1 ./tests/run.sh` 只跑 390px 淺色。
