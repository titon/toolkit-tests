<?php
// Handle webhooks from GitHub.
// This looks insecure but we're actually validating based on a secret token, so it should be ok.
header('Content-Type: text/plain; charset=utf-8');

try {
    if (empty($_SERVER['HTTP_X_GITHUB_EVENT'])) {
        throw new Exception('Missing X-GitHub-Event header.', 400);
    }

    if (empty($_POST['payload'])) {
        throw new Exception('No payload detected.', 400);
    }

    if (empty($_SERVER['HTTP_X_HUB_SIGNATURE']) || !getenv('SECRET_TOKEN')) {
        throw new Exception('Missing secret token.', 400);
    }

    if ($_SERVER['HTTP_X_HUB_SIGNATURE'] !== 'sha1=' . hash_hmac('sha1', $_POST['payload'], getenv('SECRET_TOKEN'), false)) {
        throw new Exception('Failed to validate secret token.', 401);
    }

    // Update the repository
    http_response_code(200);
    echo shell_exec(sprintf('cd %s && git reset --hard HEAD && git pull', __DIR__));

} catch (Exception $e) {
    http_response_code($e->getCode());
    echo $e->getMessage();
}

exit();