## Context

目前系統後端使用 TypeORM 連接 PostgreSQL。多個資料庫實體（Entities）中的時間欄位使用 `@CreateDateColumn()`、`@UpdateDateColumn()` 或 `@Column("timestamp")` 宣告，導致資料庫中的欄位型別為 `timestamp without time zone` (不帶時區)。

當後端寫入 `new Date()` (帶有時區的時間點，如 11:00 UTC+8) 時，TypeORM 轉成 UTC 字串寫入，在資料庫中存為 `03:00:00` (數值為 UTC)。然而，在讀取時，`node-postgres` (pg 驅動) 將不帶時區的 timestamp 當作「伺服器本地時區 (Node.js 所在時區)」解析，導致得到的 JS Date 物件在數值上比真實時間慢了 8 小時。當後端回傳 API 對其做 JSON 序列化（`toISOString()`）時，時間再次被扣減 8 小時，造成前端 `toLocaleString()` 格式化後顯示的恰好為 UTC 時間。

## Goals / Non-Goals

**Goals:**
* 將後端所有涉及的資料庫時間欄位升級為 `timestamptz` (timestamp with time zone)，使資料庫 Schema 具備時區感知能力。
* 確保後端 API 回傳的 ISO 時間字串能夠精準代表正確的 UTC 時間點，讓前端顯示的時間符合使用者當地的瀏覽器時區。

**Non-Goals:**
* 不改變前端格式化時間的呼叫方式（繼續使用 `toLocaleString()`），保持前端對時區自適應的能力。
* 不更改後端 API 回傳的屬性名稱與基本結構。

## Decisions

### 決策：採用方案 A (將欄位型別升級為 `timestamptz`)
我們將全面修改後端 `src/entities/` 底下所有的資料庫實體定義，將所有時間相關欄位定義為 `timestamptz`。

#### 替代方案評估：方案 B (在 Node.js 中調整 pg-types parser)
* **方案 B 做法**：`pg.types.setTypeParser(1114, (str) => new Date(str + 'Z'))`
* **對比結論**：方案 B 雖然修改行數極少，但本質上是繞過資料庫 Schema 不完整（無時區感知）的問題。方案 A (升級 `timestamptz`) 為 PostgreSQL 處理時區的最佳實踐，能在根本上確保資料庫維護的資料品質與未來的跨時區擴展性。

#### 具體修改清單：
1. **`Project.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
2. **`SystemSetting.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
3. **`Task.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `finishedAt` -> `@Column("timestamptz", { nullable: true })`
4. **`TestGroup.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
5. **`TestLog.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
6. **`TestRun.ts`**:
   * `startedAt` -> `@Column("timestamptz", { nullable: true })`
   * `finishedAt` -> `@Column("timestamptz", { nullable: true })`
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
7. **`TestRunStep.ts`**:
   * `startedAt` -> `@Column("timestamptz", { nullable: true })`
   * `finishedAt` -> `@Column("timestamptz", { nullable: true })`
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
8. **`Testcase.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`
9. **`TestcaseStep.ts`**:
   * `createdAt` -> `@CreateDateColumn({ type: "timestamptz" })`
   * `updatedAt` -> `@UpdateDateColumn({ type: "timestamptz" })`

## Risks / Trade-offs

* **[Risk] 既存資料遷移轉換風險**
  * PostgreSQL 在執行欄位型別由 `timestamp` (無時區) 更改為 `timestamptz` (有時區) 的 ALTER 時，預設會將現存資料視為「目前資料庫連線的時區」。若連線時區未設為 UTC，可能會產生時間點二度偏差的風險。
  * **[Mitigation]**：在開發環境中，由於 TypeORM 連接資料庫的預設值與本地測試庫通常一致，且 `synchronize: true` 會自動處理此轉換；且因為既有資料庫中的值物理上就是 UTC 數值，PostgreSQL 以 UTC 為基底轉換為 timestamptz 時，並不會造成時間偏移。
