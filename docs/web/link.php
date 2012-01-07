<?
$dmg_ver = "0.4";
$src_ver = "0.7";
$win_ver = "0.3";
$file_root = "http://sourceforge.net/projects/tikzit/files";

$urls = array(
'src' => "$file_root/tikzit-$src_ver/tikzit-$src_ver.tar.gz/download",
'dmg' => "$file_root/tikzit-$dmg_ver/TikZiT-$dmg_ver.dmg/download",
'win' => "$file_root/tikzit-$win_ver/tikzit-$win_ver.zip/download"
);


$url = $urls[$_GET['to']];
if ($url == '') $url='/';
?>
<html>
<head>
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=<?=$url?>" />
</head>
<body></body>
</html>
