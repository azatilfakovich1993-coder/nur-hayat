<?php
// Прокси перед Supabase (Frankfurt) и Nominatim (поиск города по тексту/GPS) —
// обходит блокировку/замедление провайдером прямого доступа к этим хостам.
// Проксирует ТОЛЬКО эти два хоста (open-proxy невозможен).

$SUPABASE_HOST  = 'qnkgvsxjxjfmjopnzmdu.supabase.co';
$NOMINATIM_HOST = 'nominatim.openstreetmap.org';

// CORS — ставим сами, не надеясь на то, что Supabase его пришлёт для
// конкретного эндпоинта (для Storage он не всегда приходит, из-за этого
// браузер блокировал загрузку фото/файлов с сообщением "Failed to fetch").
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Expose-Headers: *');

// Preflight-запрос (OPTIONS) браузер шлёт сам, до настоящего запроса —
// на него достаточно ответить заголовками выше, до Supabase не доходим
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path   = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// /nominatim/search?... -> https://nominatim.openstreetmap.org/search?...
if (strpos($path, '/nominatim/') === 0) {
    $targetHost = $NOMINATIM_HOST;
    $url = 'https://' . $targetHost . substr($path, strlen('/nominatim'));
} else {
    $targetHost = $SUPABASE_HOST;
    $url = 'https://' . $targetHost . $path;
}

$headers = [];
$hasAuth = false;
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    // accept-encoding клиента (браузер/приложение сами добавляют ", br") не
    // пропускаем — он бы перекрыл наш CURLOPT_ENCODING ниже и снова просил
    // у Supabase Brotli, который curl на этом хостинге не умеет распаковывать.
    if (in_array($lower, ['host', 'content-length', 'connection', 'accept-encoding'], true)) continue;
    if ($lower === 'authorization') $hasAuth = true;
    $headers[] = "$name: $value";
}

// Apache часто не пробрасывает Authorization в getallheaders() — без него
// Supabase считает запрос анонимным, и RLS-защищённые таблицы (messages)
// возвращают пустой результат вместо реальных данных. Добираем заголовок
// из переменных окружения, которые .htaccess сохраняет отдельно.
if (!$hasAuth) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth) $headers[] = "Authorization: $auth";
}

// Политика использования Nominatim требует идентифицировать приложение
// через User-Agent — без него (или с типовым User-Agent) они могут
// ограничивать/блокировать запросы.
if ($targetHost === $NOMINATIM_HOST) {
    $headers[] = 'User-Agent: NurHayat/1.0 (https://nurhayat.ru; azatilfakovich1993@gmail.com)';
}

// Загрузка файлов может занимать больше времени из-за нестабильного канала
// до Supabase — увеличиваем лимиты, чтобы скрипт/curl не обрывали передачу раньше времени
set_time_limit(60);
@ini_set('memory_limit', '256M');

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 55,
    CURLOPT_SSL_VERIFYPEER => true,
    // gzip/deflate — НЕ включаем br: на этом хостинге декодер Brotli в
    // PHP-curl не работает, из-за чего успешные ответы Supabase (Cloudflare
    // сжимает их Brotli'ом) обрывались с ошибкой "Failed writing received
    // data to disk/application" — curl падал именно на распаковке тела.
    CURLOPT_ENCODING       => 'gzip, deflate',
]);
if (!in_array($method, ['GET', 'HEAD'], true)) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'proxy_error', 'message' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$status     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$respBody   = substr($response, $headerSize);

http_response_code($status);
foreach (explode("\r\n", $rawHeaders) as $line) {
    $lower = strtolower($line);
    if (strpos($lower, 'transfer-encoding:') === 0) continue;
    if (strpos($lower, 'content-encoding:') === 0) continue;
    if (strpos($lower, 'connection:') === 0) continue;
    if (strpos($lower, 'content-length:') === 0) continue;
    if (strpos($lower, 'access-control-') === 0) continue; // уже поставили свои выше, не дублируем
    if (strpos($line, 'HTTP/') === 0) continue;
    if (trim($line) === '') continue;
    header($line, false);
}
echo $respBody;
