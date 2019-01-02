<?php
    include_once('data_cfg.php');
    // Example contents: 
    // $host = "localhost";
    // $user = "user";
    // $pass = "pass";
    // $db = "db";

    $mysqli = new mysqli($host, $user, $pass, $db);

    function removeExpired() {
        global $mysqli;

        $time=round(time() / 100);
        $mysqli->query("DELETE FROM bibledata WHERE expires<" . $time);
    }

    if (isset($_GET['id'])) {
        $id = $mysqli->real_escape_string($_GET['id']);
        if ($result = $mysqli->query("SELECT * FROM bibledata WHERE id='" . $id . "'")) {
            if ($row = $result->fetch_assoc()) {
                $version = $row['version'];
                $days = $row['days'];
                $split_by = $row['split_by'];
                $expires_pre = $row['expires'];
                $expires = round(strtotime('+20 days') / 100);
                $passages = explode(";", $row['passages']);
                $result->close();

                $res = array('version' => $version, 'days' => $days, 'splitBy' => $split_by, 'passages' => $passages);
                header('Content-Type: application/json');
                echo json_encode($res);

                if ($expires > $expires_pre) {
                    $mysqli->query("UPDATE bibledata SET expires=" . $expires . " WHERE id='" . $id . "'");
                }
                removeExpired();
                exit();
            }
        }
    } elseif (isset($_POST['version']) && isset($_POST['days']) && isset($_POST['splitBy']) && isset($_POST['passages'])) {
        $version = $mysqli->real_escape_string($_POST['version']);
        $days = $mysqli->real_escape_string($_POST['days']);
        $split_by = $mysqli->real_escape_string($_POST['splitBy']);
        $expires = round(strtotime('+' . $days . ' days 10 days') / 100);
        $passages = $mysqli->real_escape_string($_POST['passages']);
        do {
            $id = substr(preg_replace("/[^a-zA-Z0-9]/", "", base64_encode(openssl_random_pseudo_bytes(8))), 0, 8);
        } while (($result = $mysqli->query("SELECT * FROM bibledata WHERE id='" . $id . "'")) && $result->fetch_row());
        if ($mysqli->query("INSERT INTO bibledata (id, version, days, split_by, passages, expires) VALUES ('". $id . "', '" . $version . "', " . $days . ", '" . $split_by . "', '" . $passages . "', " . $expires . ")")) {
            echo $id;
            removeExpired();
            exit();
        }
    }
    echo "Err";
    removeExpired();
    exit();
?>
