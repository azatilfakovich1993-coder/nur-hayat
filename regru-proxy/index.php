<?php
// Прокси перед Supabase (Frankfurt) — обходит блокировку/замедление
// провайдером прямого доступа к qnkgvsxjxjfmjopnzmdu.supabase.co.
// Проксирует ТОЛЬКО на этот хост (open-proxy невозможен).

$SUPABASE_HOST = 'qnkgvsxjxjfmjopnzmdu.supabase.co';

$path   = $_SERVER['REQUEST_URI'];
$url    = 'https://' . $SUPABASE_HOST . $path;
$method = $_SERVER['REQUEST_METHOD'];

$headers = [];
$hasAuth = false;
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length', 'connection'], true)) continue;
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

$body = file_get_contents('php://input');

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_ENCODING       => '', // принимать и распаковывать gzip/br от Supabase самим curl
]);
if (!in_array($method, ['GET', 'HEAD'], true)) {
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
    if (strpos($line, 'HTTP/') === 0) continue;
    if (trim($line) === '') continue;
    header($line, false);
}
echo $respBody;
