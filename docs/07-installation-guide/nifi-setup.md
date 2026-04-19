# NiFi Setup - IoT Sync, Blockchain Monitor, DB Sync

Task: **[NIFI] BIC-047 - Cau hinh Apache NiFi Flows**

## 1. Scope da hoan thanh

Da cau hinh va luu 3 flow XML tai thu muc `infrastructure/nifi/flows/`:

- `iot-to-redis.xml`
- `farm-to-blockchain.xml`
- `db-sync.xml`

Da bo sung file chay rieng NiFi:

- `infrastructure/nifi/docker-compose.nifi.yml`

## 2. Chay NiFi

Cach 1 (khuyen nghi): dung stack chinh cua repo

```bash
docker compose up -d nifi kafka mysql
```

Cach 2: dung file rieng cho NiFi

```bash
docker network create bicap-network
docker compose -f infrastructure/nifi/docker-compose.nifi.yml up -d
```

Dang nhap UI:

- URL: `https://localhost:8443/nifi`
- Username: `admin`
- Password: `adminadminadmin`

## 3. Import 3 flow XML vao NiFi UI

1. Vao NiFi canvas, click chuot phai -> `Upload Template`.
2. Upload lan luot 3 file trong `infrastructure/nifi/flows/`.
3. Keo tha template ra canvas.
4. Mo tung processor, bo sung Controller Service can thiet.

## 4. Cau hinh chi tiet theo flow

### Flow 1 - `iot-to-redis.xml`

Muc tieu: poll IoT API moi 5 phut, validate du lieu, POST vao iot-service.

Chuoi processor:

- `GenerateFlowFile_5min`
- `InvokeHTTP_GetIoTData`
- `ValidateRecord_IoTSchema`
- `RouteOnAttribute_ValidInvalid`
- `InvokeHTTP_PostToIoTService`
- `LogAttribute_IoTSyncSuccess`
- `LogAttribute_IoTInvalidQueue`

Gia tri can kiem tra:

- Poll period: `5 min`
- POST URL: `http://iot-service:8087/api/iot/sensors/data`
- Invalid route: relationship `invalid`

### Flow 2 - `farm-to-blockchain.xml`

Muc tieu: nghe event `bicap.season.created`, doi 30s, verify `txHash`.

Chuoi processor:

- `ConsumeKafka_SeasonCreated`
- `EvaluateJsonPath_SeasonId`
- `Wait_30sForBlockchainWrite`
- `InvokeHTTP_VerifyTrace`
- `EvaluateJsonPath_TxHash`
- `RouteOnAttribute_SuccessAlert`
- `LogAttribute_BlockchainSuccess`
- `LogAttribute_BlockchainAlert`

Gia tri can kiem tra:

- Kafka bootstrap: `kafka:29092`
- Topic: `bicap.season.created`
- Verify URL: `http://blockchain-service:8090/api/chain/trace/${seasonId}`
- Route `SUCCESS`: `${txHash:isEmpty():not()}`
- Route `ALERT`: `${txHash:isEmpty()}`

Luu y:

- Processor `Wait` can cau hinh them DistributedMapCache service trong UI.

### Flow 3 - `db-sync.xml`

Muc tieu: 01:00 AM moi ngay dong bo du lieu hom qua tu `farm_db` sang `report_db`.

Chuoi processor:

- `GenerateFlowFile_0100AM`
- `ExecuteSQL_FarmYesterday`
- `ConvertRecord_SQLToJSON`
- `PutDatabaseRecord_ReportDB`
- `LogAttribute_DBSyncResult`

Gia tri can kiem tra:

- Cron: `0 0 1 * * ?`
- SQL mac dinh:

```sql
SELECT *
FROM farming_seasons
WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY);
```

- DBCP service can tao:
- `DBCP_FARM_DB` (farm_db)
- `DBCP_REPORT_DB` (report_db)

## 5. Acceptance checklist

- Flow 1: sau 5 phut co request POST den `/api/iot/sensors/data` va data xuat hien trong iot-service DB.
- Flow 1: payload sai schema di vao nhanh `invalid`, flow khong crash.
- Flow 2: event `season.created` duoc consume, sau verify neu co `txHash` thi log `SUCCESS`.
- Flow 2: neu `txHash` null/empty thi log `ALERT`.
- Flow 3: 01:00 trigger va du lieu ngay hom qua co mat tai report_db.
- Co du 3 file XML va upload duoc vao NiFi UI.

## 6. File da cap nhat

- `infrastructure/nifi/flows/iot-to-redis.xml`
- `infrastructure/nifi/flows/farm-to-blockchain.xml`
- `infrastructure/nifi/flows/db-sync.xml`
- `infrastructure/nifi/docker-compose.nifi.yml`
- `docs/07-installation-guide/nifi-setup.md`