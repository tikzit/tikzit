<?
$dmg_ver = "0.8";
$src_ver = "0.7";
$win_ver = "0.7";
$file_root = "http://sourceforge.net/projects/tikzit/files";


$urls = array(
'src' => "$file_root/tikzit-$src_ver/tikzit-$src_ver.tar.gz/download",
'dmg' => "$file_root/tikzit-$dmg_ver/TikZiT-$dmg_ver.dmg/download",
'win' => "$file_root/tikzit-$win_ver/tikzit-setup-$win_ver.exe/download"
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
