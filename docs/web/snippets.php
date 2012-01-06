<?

$web_root = "";
$dmg_ver = "0.4";
$source_ver = "0.7";
$win_ver = "0.3";

require('snippets.local.php');

function top_menu () {
  global $web_root;?>
	<div style="text-align:center">
		<a href="<?=$web_root?>/index.php" title="Return to the TikZiT home page">
			<img src="<?=$web_root?>/images/web_logo.png" border="0" alt="TikZiT" />
		</a>
	</div>
<?}

function css() {
  global $web_root;?>
<link rel="stylesheet" type="text/css" href="<?=$web_root?>/main.css" />
<?}

function dmg_url () {
	global $dmg_ver;
	print "http://sourceforge.net/projects/tikzit/files/tikzit-$dmg_ver/TikZiT-$dmg_ver.dmg/download";
}

function win_url () {
	global $win_ver;
	print "http://sourceforge.net/projects/tikzit/files/tikzit-$win_ver/tikzit-$win_ver.zip/download";
}

function source_url () {
	global $source_ver;
	print "http://sourceforge.net/projects/tikzit/files/tikzit-$source_ver/tikzit-$source_ver.tar.gz/download";
}

?>
