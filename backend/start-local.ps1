$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$mongoServerRoot = 'C:\Program Files\MongoDB\Server'
$mongoExecutable = $null
Get-ChildItem $mongoServerRoot -Directory -ErrorAction Stop |
    Sort-Object { [version]$_.Name } -Descending |
    ForEach-Object {
        $candidate = Join-Path $_.FullName 'bin\mongod.exe'
        if (-not $mongoExecutable -and (Test-Path $candidate)) {
            $mongoExecutable = $candidate
        }
    }

if (-not $mongoExecutable) {
    throw "MongoDB server binary was not found under $mongoServerRoot."
}

$mongoRoot = Join-Path $env:LOCALAPPDATA 'StockSenseMongo\rs0'
$dataPath = Join-Path $mongoRoot 'data'
$logPath = Join-Path $mongoRoot 'mongod.log'
New-Item -ItemType Directory -Path $dataPath -Force | Out-Null

$mongoListener = Get-NetTCPConnection -State Listen -LocalPort 27018 -ErrorAction SilentlyContinue
if (-not $mongoListener) {
    $arguments = "--dbpath `"$dataPath`" --replSet rs0 --port 27018 --bind_ip 127.0.0.1 --logpath `"$logPath`" --logappend"
    Start-Process -FilePath $mongoExecutable -ArgumentList $arguments -WindowStyle Hidden | Out-Null
}

$env:RS_URI = 'mongodb://127.0.0.1:27018/admin?directConnection=true'
$bootstrap = @'
const { MongoClient } = require("mongodb");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  let client;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = new MongoClient(process.env.RS_URI, { serverSelectionTimeoutMS: 1000 });
    try {
      await candidate.connect();
      client = candidate;
      break;
    } catch {
      await candidate.close().catch(() => {});
      await wait(1000);
    }
  }
  if (!client) throw new Error("MongoDB replica member did not start on port 27018");
  const admin = client.db("admin");
  let hello = await admin.command({ hello: 1 });
  if (hello.setName !== "rs0") {
    await admin.command({ replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27018" }] } });
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    hello = await admin.command({ hello: 1 });
    if (hello.setName === "rs0" && hello.isWritablePrimary) break;
    await wait(1000);
  }
  await client.close();
  if (hello.setName !== "rs0" || !hello.isWritablePrimary) throw new Error("MongoDB rs0 did not become primary");
  console.log("MongoDB replica set rs0 is ready.");
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
'@
$bootstrap | node -
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to initialize or connect to MongoDB replica set rs0.'
}

npm run dev
