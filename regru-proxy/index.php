<?php
// Прокси перед Supabase (Frankfurt), Nominatim (поиск города по тексту/GPS) и
// Aladhan (времена намаза) — обходит блокировку/замедление провайдером прямого
// доступа к этим хостам. Проксирует ТОЛЬКО эти три хоста (open-proxy невозможен).

$SUPABASE_HOST  = 'qnkgvsxjxjfmjopnzmdu.supabase.co';
$NOMINATIM_HOST = 'nominatim.openstreetmap.org';
$ALADHAN_HOST   = 'api.aladhan.com';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Expose-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path   = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// ── Обучающие видео ──────────────────────────────────────────────────────────
// Ролики переехали в отдельное хранилище (Timeweb). В Supabase они делили квоту
// на исходящий трафик с базой и авторизацией, и 17 августа она кончилась:
// Supabase отключил проект целиком, у всех разом перестал работать вход.
// Из Supabase файлы удалены — их там больше нет.
//
// Но у людей на телефонах остались версии приложения, которые по-прежнему
// просят ролики у Supabase. Обслуживаем их здесь, чтобы видео работали до
// обновления через RuStore. Приложение делает это в два шага:
//   1. POST по этому адресу — "выдай ссылку на ролик". Отвечаем сами, не ходя
//      никуда: возвращаем адрес на этом же домене.
//   2. GET по выданному адресу — перенаправляем в Timeweb.
// Если отвечать перенаправлением и на первый шаг, приложение получит вместо
// ссылки само видео, не разберёт ответ и покажет пустой экран.
$VIDEO_BASE = 'https://nurhayat-videos.s3.twcstorage.ru';
if (preg_match('#^/storage/v1/object/(?:sign|public|authenticated)/letter-videos/(.+?)(?:\?|$)#', $path, $m)) {
    $obj = rawurldecode($m[1]);
    if ($method === 'POST') {
        header('Content-Type: application/json');
        echo json_encode(['signedURL' => '/object/sign/letter-videos/' . $obj . '?token=static']);
        exit;
    }
    header('Location: ' . $VIDEO_BASE . '/' . $obj, true, 302);
    exit;
}

if (strpos($path, '/nominatim/') === 0) {
    $targetHost = $NOMINATIM_HOST;
    $url = 'https://' . $targetHost . substr($path, strlen('/nominatim'));
} elseif (strpos($path, '/aladhan/') === 0) {
    $targetHost = $ALADHAN_HOST;
    $url = 'https://' . $targetHost . substr($path, strlen('/aladhan'));
} else {
    $targetHost = $SUPABASE_HOST;
    $url = 'https://' . $targetHost . $path;
}

$headers = [];
$hasAuth = false;
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length', 'connection', 'accept-encoding'], true)) continue;
    if ($lower === 'authorization') $hasAuth = true;
    $headers[] = "$name: $value";
}

if (!$hasAuth) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth) $headers[] = "Authorization: $auth";
}

if ($targetHost === $NOMINATIM_HOST) {
    $headers[] = 'User-Agent: NurHayat/1.0 (https://nurhayat.ru; azatilfakovich1993@gmail.com)';
}

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
    if (strpos($lower, 'access-control-') === 0) continue;
    if (strpos($line, 'HTTP/') === 0) continue;
    if (trim($line) === '') continue;
    header($line, false);
}
echo $respBody;
